"""
PayPal REST API payment integration.
Uses PayPal Orders API v2.
"""
import requests
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from products.models import Product
from orders.models import Order
from payments.models import Payment


def get_paypal_token():
    """Get PayPal OAuth2 access token."""
    url = 'https://api-m.sandbox.paypal.com/v1/oauth2/token' if settings.PAYPAL_MODE == 'sandbox' \
        else 'https://api-m.paypal.com/v1/oauth2/token'
    resp = requests.post(
        url,
        auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
        data={'grant_type': 'client_credentials'},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()['access_token']


def paypal_api_url(path):
    base = 'https://api-m.sandbox.paypal.com' if settings.PAYPAL_MODE == 'sandbox' \
        else 'https://api-m.paypal.com'
    return f"{base}{path}"


class PayPalCreateOrderView(APIView):
    """Create a PayPal order and return approval URL."""
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, is_active=True)
        quantity = int(request.data.get('quantity', 1))

        if product.stock < quantity:
            return Response({'error': 'Not enough stock.'}, status=400)

        amount = product.price * quantity

        # Create local order first
        order = Order.objects.create(
            buyer=request.user,
            product=product,
            quantity=quantity,
            amount=amount,
            payment_method='paypal',
            status='pending',
        )

        try:
            token = get_paypal_token()
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}',
            }
            payload = {
                'intent': 'CAPTURE',
                'purchase_units': [{
                    'reference_id': str(order.id),
                    'description': product.name,
                    'amount': {
                        'currency_code': 'USD',
                        'value': str(amount),
                        'breakdown': {
                            'item_total': {
                                'currency_code': 'USD',
                                'value': str(amount),
                            }
                        }
                    },
                    'items': [{
                        'name': product.name,
                        'quantity': str(quantity),
                        'unit_amount': {
                            'currency_code': 'USD',
                            'value': str(product.price),
                        }
                    }]
                }],
                'application_context': {
                    'return_url': f"{settings.FRONTEND_URL}/payment/paypal-success?order_id={order.id}",
                    'cancel_url': f"{settings.FRONTEND_URL}/payment/cancel?order_id={order.id}",
                    'brand_name': 'Local Market',
                    'user_action': 'PAY_NOW',
                }
            }

            resp = requests.post(
                paypal_api_url('/v2/checkout/orders'),
                headers=headers,
                json=payload,
                timeout=10,
            )
            resp.raise_for_status()
            paypal_order = resp.json()

            # Save PayPal order ID
            Payment.objects.create(
                order=order,
                user=request.user,
                gateway='paypal',
                gateway_order_id=paypal_order['id'],
                amount=amount,
                currency='USD',
                status='initiated',
            )

            # Get approval URL
            approval_url = next(
                link['href'] for link in paypal_order['links']
                if link['rel'] == 'approve'
            )

            return Response({
                'approval_url': approval_url,
                'paypal_order_id': paypal_order['id'],
                'order_id': order.id,
            })

        except Exception as e:
            order.status = 'failed'
            order.save(update_fields=['status'])
            return Response({'error': f'PayPal error: {str(e)}'}, status=400)


class PayPalCaptureOrderView(APIView):
    """Capture payment after buyer approves on PayPal."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        paypal_order_id = request.data.get('paypal_order_id')
        order_id = request.data.get('order_id')

        if not paypal_order_id or not order_id:
            return Response({'error': 'Missing paypal_order_id or order_id.'}, status=400)

        try:
            order = Order.objects.get(id=order_id, buyer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=404)

        try:
            token = get_paypal_token()
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}',
            }
            resp = requests.post(
                paypal_api_url(f'/v2/checkout/orders/{paypal_order_id}/capture'),
                headers=headers,
                timeout=10,
            )
            resp.raise_for_status()
            capture_data = resp.json()

            if capture_data['status'] == 'COMPLETED':
                order.status = 'completed'
                order.save(update_fields=['status'])

                # Reduce stock
                order.product.stock = max(0, order.product.stock - order.quantity)
                order.product.save(update_fields=['stock'])

                # Update payment record
                try:
                    payment = order.payment
                    payment.status = 'completed'
                    payment.gateway_payment_id = paypal_order_id
                    payment.raw_response = capture_data
                    payment.save()
                except Exception:
                    pass

                try:
                    from notifications.service import notify_order_placed
                    notify_order_placed(order)
                except Exception:
                    pass

                return Response({'status': 'success', 'order_id': order.id})
            else:
                order.status = 'failed'
                order.save(update_fields=['status'])
                return Response({'error': 'Payment not completed.'}, status=400)

        except Exception as e:
            return Response({'error': f'Capture failed: {str(e)}'}, status=400)