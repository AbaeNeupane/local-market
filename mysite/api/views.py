from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.conf import settings
from django.shortcuts import get_object_or_404
from decimal import Decimal, ROUND_HALF_UP
import stripe, json
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.utils.decorators import method_decorator

from users.models import Profile
from products.models import Product, Category
from orders.models import Order, OrderStatusHistory
from payments.models import Payment
from .serializers import (
    UserSerializer, RegisterSerializer, CategorySerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateSerializer,
    OrderSerializer, OrderStatusHistorySerializer, PaymentSerializer,
)

stripe.api_key = settings.STRIPE_SECRET_KEY


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Send welcome email (non-blocking)
        try:
            from notifications.emails import send_welcome_email
            send_welcome_email(user)
        except Exception:
            pass
        return Response({
            'message': 'Account created successfully.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user, context={'request': request}).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    profile = request.user.profile
    user = request.user
    for field in ['first_name', 'last_name', 'email']:
        if field in request.data:
            setattr(user, field, request.data[field])
    user.save()
    for field in ['bio', 'phone', 'address', 'city', 'country']:
        if field in request.data:
            setattr(profile, field, request.data[field])
    if 'avatar' in request.FILES:
        profile.avatar = request.FILES['avatar']
    profile.save()
    return Response(UserSerializer(user, context={'request': request}).data)


# ─── Stripe Connect Onboarding ────────────────────────────────────────────────

class StripeConnectOnboardView(APIView):
    """
    Step 1 — Create a Stripe Connect account for the seller and return
    the onboarding link URL. Frontend redirects to this URL.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=400)

        if profile.user_type != 'seller':
            return Response({'error': 'Only sellers can connect a Stripe account.'}, status=403)

        # Create Stripe Express account if not already exists
        if not profile.stripe_account_id:
            account = stripe.Account.create(
                type='express',
                country='US',  # Change to 'NP' when Stripe supports Nepal
                email=user.email,
                capabilities={
                    'card_payments': {'requested': True},
                    'transfers': {'requested': True},
                },
                business_type='individual',
                metadata={'user_id': user.id, 'username': user.username},
            )
            profile.stripe_account_id = account.id
            profile.stripe_onboard_status = 'pending'
            profile.save(update_fields=['stripe_account_id', 'stripe_onboard_status'])

        # Generate onboarding link
        account_link = stripe.AccountLink.create(
            account=profile.stripe_account_id,
            refresh_url=f"{settings.FRONTEND_URL}/seller/stripe/refresh",
            return_url=f"{settings.FRONTEND_URL}/seller/stripe/complete",
            type='account_onboarding',
        )
        return Response({'onboarding_url': account_link.url})


class StripeConnectStatusView(APIView):
    """
    Step 2 — After seller returns from Stripe, check their account status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if not profile.stripe_account_id:
            return Response({
                'status': 'not_started',
                'charges_enabled': False,
                'payouts_enabled': False,
            })

        # Fetch live status from Stripe
        account = stripe.Account.retrieve(profile.stripe_account_id)
        profile.stripe_charges_enabled = account.charges_enabled
        profile.stripe_payouts_enabled = account.payouts_enabled

        if account.charges_enabled and account.payouts_enabled:
            old_status = profile.stripe_onboard_status
            profile.stripe_onboard_status = 'complete'
            if old_status != 'complete':
                try:
                    from notifications.emails import send_stripe_onboard_complete
                    send_stripe_onboard_complete(request.user)
                except Exception:
                    pass
        elif account.requirements and account.requirements.disabled_reason:
            profile.stripe_onboard_status = 'restricted'
        else:
            profile.stripe_onboard_status = 'pending'

        profile.save(update_fields=['stripe_charges_enabled', 'stripe_payouts_enabled', 'stripe_onboard_status'])

        return Response({
            'status': profile.stripe_onboard_status,
            'charges_enabled': profile.stripe_charges_enabled,
            'payouts_enabled': profile.stripe_payouts_enabled,
            'account_id': profile.stripe_account_id,
            'requirements': list(account.requirements.currently_due) if account.requirements else [],
        })


class StripeConnectDashboardView(APIView):
    """Return a link to the seller's Stripe Express dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if not profile.stripe_account_id:
            return Response({'error': 'No Stripe account connected.'}, status=400)
        login_link = stripe.Account.create_login_link(profile.stripe_account_id)
        return Response({'dashboard_url': login_link.url})


# ─── Categories ───────────────────────────────────────────────────────────────

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# ─── Products ─────────────────────────────────────────────────────────────────

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('seller', 'category')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'seller__username']
    ordering_fields = ['price', 'created_at', 'views_count']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateSerializer
        return ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return Response(self.get_serializer(instance).data)

    def get_queryset(self):
        qs = super().get_queryset()
        for param, lookup in [('category', 'category__slug'), ('condition', 'condition'), ('seller', 'seller_id')]:
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{lookup: val})
        min_p = self.request.query_params.get('min_price')
        max_p = self.request.query_params.get('max_price')
        if min_p: qs = qs.filter(price__gte=min_p)
        if max_p: qs = qs.filter(price__lte=max_p)
        return qs

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_products(self, request):
        qs = Product.objects.filter(seller=request.user)
        return Response(ProductListSerializer(qs, many=True, context={'request': request}).data)


# ─── Orders & Tracking ────────────────────────────────────────────────────────

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().select_related('buyer', 'product')
        try:
            if user.profile.user_type == 'seller':
                return Order.objects.filter(product__seller=user).select_related('buyer', 'product')
        except Exception:
            pass
        return Order.objects.filter(buyer=user).select_related('buyer', 'product')

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        """Return full tracking timeline for an order."""
        order = self.get_object()
        history = order.history.all()
        return Response({
            'order_id': order.id,
            'current_status': order.status,
            'tracking_number': order.tracking_number,
            'carrier': order.carrier,
            'estimated_delivery': order.estimated_delivery,
            'timeline': OrderStatusHistorySerializer(history, many=True).data,
        })

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Seller or admin can update order status and add tracking info.
        Automatically sends email notification to buyer.
        """
        order = self.get_object()
        user = request.user

        # Permission: must be seller of product or admin
        if not user.is_staff and order.product.seller != user:
            return Response({'error': 'Permission denied.'}, status=403)

        new_status = request.data.get('status')
        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Choose from: {valid_statuses}'}, status=400)

        old_status = order.get_status_display()
        old_status_code = order.status

        # Update order
        order.status = new_status
        if 'tracking_number' in request.data:
            order.tracking_number = request.data['tracking_number']
        if 'carrier' in request.data:
            order.carrier = request.data['carrier']
        if 'estimated_delivery' in request.data:
            order.estimated_delivery = request.data['estimated_delivery']
        order.save()

        # Save to history
        note = request.data.get('note', '')
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            note=note,
            updated_by=user,
        )

        # Send email notification to buyer
        if new_status != old_status_code:
            try:
                from notifications.emails import send_order_status_update
                send_order_status_update(order, old_status)
            except Exception:
                pass

        return Response(OrderSerializer(order, context={'request': request}).data)


# ─── Dashboard ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    try:
        user_type = user.profile.user_type
    except Exception:
        user_type = 'buyer'

    if user_type == 'seller':
        total_products = Product.objects.filter(seller=user).count()
        total_sales = Order.objects.filter(product__seller=user, status='completed').count()
        revenue_data = Order.objects.filter(product__seller=user, status='completed').aggregate(total=Sum('seller_amount'))
        total_revenue = float(revenue_data['total'] or 0)
        recent_orders = Order.objects.filter(product__seller=user).order_by('-created_at')[:5]
        pending_orders = Order.objects.filter(product__seller=user, status='pending').count()
        try:
            profile = user.profile
            stripe_status = {
                'onboard_status': profile.stripe_onboard_status,
                'charges_enabled': profile.stripe_charges_enabled,
                'payouts_enabled': profile.stripe_payouts_enabled,
                'account_id': profile.stripe_account_id,
            }
        except Exception:
            stripe_status = {'onboard_status': 'not_started'}

        return Response({
            'user_type': 'seller',
            'total_products': total_products,
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'pending_orders': pending_orders,
            'recent_orders': OrderSerializer(recent_orders, many=True, context={'request': request}).data,
            'stripe_status': stripe_status,
        })
    else:
        total_orders = Order.objects.filter(buyer=user).count()
        spent_data = Order.objects.filter(buyer=user, status='completed').aggregate(total=Sum('amount'))
        total_spent = float(spent_data['total'] or 0)
        recent_orders = Order.objects.filter(buyer=user).order_by('-created_at')[:5]
        return Response({
            'user_type': 'buyer',
            'total_orders': total_orders,
            'total_spent': total_spent,
            'recent_orders': OrderSerializer(recent_orders, many=True, context={'request': request}).data,
        })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    return Response({
        'total_users': User.objects.count(),
        'total_sellers': Profile.objects.filter(user_type='seller').count(),
        'total_buyers': Profile.objects.filter(user_type='buyer').count(),
        'total_products': Product.objects.count(),
        'total_orders': Order.objects.count(),
        'completed_orders': Order.objects.filter(status='completed').count(),
        'pending_orders': Order.objects.filter(status='pending').count(),
        'platform_revenue': float(Order.objects.filter(status='completed').aggregate(t=Sum('platform_fee'))['t'] or 0),
        'total_gmv': float(Order.objects.filter(status='completed').aggregate(t=Sum('amount'))['t'] or 0),
    })


# ─── Payments ─────────────────────────────────────────────────────────────────

class StripeCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, is_active=True)
        quantity = int(request.data.get('quantity', 1))
        if product.stock < quantity:
            return Response({'error': 'Not enough stock.'}, status=400)

        unit_amount = (product.price * Decimal('100')).to_integral_value(rounding=ROUND_HALF_UP)
        order = Order.objects.create(
            buyer=request.user, product=product, quantity=quantity,
            amount=product.price * quantity, payment_method='stripe', status='pending'
        )
        OrderStatusHistory.objects.create(order=order, status='pending', note='Order created, awaiting payment.', updated_by=request.user)

        session_config = {
            'payment_method_types': ['card'],
            'line_items': [{'price_data': {'currency': 'usd', 'product_data': {'name': product.name}, 'unit_amount': int(unit_amount)}, 'quantity': quantity}],
            'mode': 'payment',
            'success_url': f"{settings.FRONTEND_URL}/payment/success?order_id={order.id}",
            'cancel_url': f"{settings.FRONTEND_URL}/payment/cancel?order_id={order.id}",
            'metadata': {'order_id': order.id},
        }
        try:
            seller_account_id = product.seller.profile.stripe_account_id
            if seller_account_id and product.seller.profile.stripe_charges_enabled:
                fee = (order.platform_fee * Decimal('100')).to_integral_value(rounding=ROUND_HALF_UP)
                session_config['payment_intent_data'] = {
                    'application_fee_amount': int(fee),
                    'transfer_data': {'destination': seller_account_id},
                }
        except Exception:
            pass

        session = stripe.checkout.Session.create(**session_config)
        Payment.objects.create(order=order, user=request.user, gateway='stripe', gateway_payment_id=session.id, amount=order.amount, currency='USD', status='pending')
        return Response({'checkout_url': session.url, 'session_id': session.id, 'order_id': order.id})


class EsewaInitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        import uuid, hashlib, hmac as hmac_lib, base64
        product = get_object_or_404(Product, id=product_id, is_active=True)
        quantity = int(request.data.get('quantity', 1))
        amount = product.price * quantity
        order = Order.objects.create(buyer=request.user, product=product, quantity=quantity, amount=amount, payment_method='esewa', status='pending')
        OrderStatusHistory.objects.create(order=order, status='pending', note='Order created via eSewa.', updated_by=request.user)

        transaction_uuid = f"LM-{order.id}-{uuid.uuid4().hex[:8]}"
        order.payment_id = transaction_uuid
        order.save(update_fields=['payment_id'])

        merchant_code = settings.ESEWA_MERCHANT_CODE
        secret_key = settings.ESEWA_SECRET_KEY
        total_amount = str(amount)
        message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={merchant_code}"
        signature = base64.b64encode(hmac_lib.new(secret_key.encode(), message.encode(), hashlib.sha256).digest()).decode()

        Payment.objects.create(order=order, user=request.user, gateway='esewa', gateway_order_id=transaction_uuid, amount=amount, currency='NPR', status='initiated')
        return Response({
            'esewa_url': f"{settings.ESEWA_BASE_URL}/api/epay/main/v2/form",
            'form_data': {
                'amount': str(amount), 'tax_amount': '0', 'total_amount': total_amount,
                'transaction_uuid': transaction_uuid, 'product_code': merchant_code,
                'product_service_charge': '0', 'product_delivery_charge': '0',
                'success_url': f"{settings.FRONTEND_URL}/payment/esewa-success",
                'failure_url': f"{settings.FRONTEND_URL}/payment/cancel?order_id={order.id}",
                'signed_field_names': 'total_amount,transaction_uuid,product_code',
                'signature': signature,
            },
            'order_id': order.id
        })


class EsewaVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import base64
        encoded_data = request.data.get('data', '')
        try:
            decoded = json.loads(base64.b64decode(encoded_data).decode())
            transaction_uuid = decoded.get('transaction_uuid', '')
            order = Order.objects.get(payment_id=transaction_uuid, buyer=request.user)
            if decoded.get('status') == 'COMPLETE':
                order.status = 'completed'
                order.save()
                OrderStatusHistory.objects.create(order=order, status='completed', note='eSewa payment confirmed.')
                try:
                    payment = order.payment
                    payment.status = 'completed'
                    payment.raw_response = decoded
                    payment.save()
                except Exception:
                    pass
                try:
                    from notifications.emails import send_order_confirmation, send_new_sale_notification
                    send_order_confirmation(order)
                    send_new_sale_notification(order)
                except Exception:
                    pass
                return Response({'status': 'success', 'order_id': order.id})
            else:
                order.status = 'failed'
                order.save()
                OrderStatusHistory.objects.create(order=order, status='failed', note='eSewa payment failed.')
                return Response({'status': 'failed'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret) if webhook_secret else json.loads(payload)
        except Exception:
            return HttpResponse(status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            order_id = session.get('metadata', {}).get('order_id')
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.status = 'processing'
                    order.save()
                    order.product.stock = max(0, order.product.stock - order.quantity)
                    order.product.save(update_fields=['stock'])
                    OrderStatusHistory.objects.create(order=order, status='processing', note='Stripe payment confirmed. Seller notified.')
                    try:
                        payment = order.payment
                        payment.status = 'completed'
                        payment.gateway_payment_id = session.get('payment_intent', '')
                        payment.save()
                    except Exception:
                        pass
                    try:
                        from notifications.emails import send_order_confirmation, send_new_sale_notification
                        send_order_confirmation(order)
                        send_new_sale_notification(order)
                    except Exception:
                        pass
                except Order.DoesNotExist:
                    pass
        return HttpResponse(status=200)
