"""
Admin-only API views powering the custom admin dashboard charts.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from users.models import Profile
from products.models import Product
from orders.models import Order


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    # ── Counts ─────────────────────────────────────────────────
    total_users    = User.objects.count()
    total_sellers  = Profile.objects.filter(user_type='seller').count()
    total_buyers   = Profile.objects.filter(user_type='buyer').count()
    total_products = Product.objects.count()
    total_orders   = Order.objects.count()

    platform_revenue = Order.objects.filter(
        status='completed'
    ).aggregate(t=Sum('platform_fee'))['t'] or 0

    # ── Orders by status ───────────────────────────────────────
    status_qs = Order.objects.values('status').annotate(count=Count('id'))
    orders_by_status = {row['status']: row['count'] for row in status_qs}

    # ── Revenue by payment method ──────────────────────────────
    payment_qs = Order.objects.filter(status='completed').values('payment_method').annotate(
        revenue=Sum('amount')
    )
    revenue_by_payment = {
        row['payment_method']: float(row['revenue'] or 0) for row in payment_qs
    }

    # ── Recent orders ──────────────────────────────────────────
    recent_orders = Order.objects.select_related(
        'buyer', 'product'
    ).order_by('-created_at')[:10]
    recent_orders_data = [{
        'id': o.id,
        'buyer_name': o.buyer.username,
        'product_name': o.product.name,
        'amount': str(o.amount),
        'payment_method': o.payment_method,
        'status': o.status,
        'created_at': o.created_at.isoformat(),
    } for o in recent_orders]

    # ── Top sellers ────────────────────────────────────────────
    top_sellers_qs = User.objects.filter(
        profile__user_type='seller'
    ).annotate(
        total_sales=Count('products__orders', filter=Q(products__orders__status='completed')),
        total_revenue=Sum('products__orders__seller_amount', filter=Q(products__orders__status='completed')),
        total_products=Count('products'),
    ).order_by('-total_revenue')[:5]

    top_sellers = [{
        'username': u.username,
        'total_sales': u.total_sales or 0,
        'total_revenue': float(u.total_revenue or 0),
        'total_products': u.total_products or 0,
    } for u in top_sellers_qs]

    return Response({
        'total_users': total_users,
        'total_sellers': total_sellers,
        'total_buyers': total_buyers,
        'total_products': total_products,
        'total_orders': total_orders,
        'platform_revenue': float(platform_revenue),
        'orders_by_status': orders_by_status,
        'revenue_by_payment': revenue_by_payment,
        'recent_orders': recent_orders_data,
        'top_sellers': top_sellers,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_analytics(request):
    """Seller analytics — sales over time + top products."""
    from django.db.models.functions import TruncDay, TruncMonth
    from django.utils import timezone
    import datetime

    user = request.user
    try:
        if user.profile.user_type != 'seller':
            return Response({'error': 'Sellers only.'}, status=403)
    except:
        return Response({'error': 'Profile not found.'}, status=400)

    period = request.query_params.get('period', '30d')
    if period == '7d':
        since = timezone.now() - datetime.timedelta(days=7)
        trunc = TruncDay
    elif period == '90d':
        since = timezone.now() - datetime.timedelta(days=90)
        trunc = TruncMonth
    elif period == '1y':
        since = timezone.now() - datetime.timedelta(days=365)
        trunc = TruncMonth
    else:  # 30d default
        since = timezone.now() - datetime.timedelta(days=30)
        trunc = TruncDay

    # Sales over time
    sales_qs = Order.objects.filter(
        product__seller=user,
        status='completed',
        created_at__gte=since
    ).annotate(period=trunc('created_at')).values('period').annotate(
        count=Count('id'),
        revenue=Sum('seller_amount')
    ).order_by('period')

    sales_over_time = [{
        'date': row['period'].strftime('%Y-%m-%d'),
        'orders': row['count'],
        'revenue': float(row['revenue'] or 0),
    } for row in sales_qs]

    # Top products
    top_products = Product.objects.filter(seller=user).annotate(
        total_sold=Count('orders', filter=Q(orders__status='completed')),
        total_revenue=Sum('orders__seller_amount', filter=Q(orders__status='completed')),
    ).order_by('-total_sold')[:5]

    top_products_data = [{
        'id': p.id,
        'name': p.name,
        'total_sold': p.total_sold or 0,
        'total_revenue': float(p.total_revenue or 0),
        'stock': p.stock,
    } for p in top_products]

    # Summary totals
    total_revenue_data = Order.objects.filter(
        product__seller=user, status='completed', created_at__gte=since
    ).aggregate(revenue=Sum('seller_amount'), orders=Count('id'))

    return Response({
        'period': period,
        'summary': {
            'orders': total_revenue_data['orders'] or 0,
            'revenue': float(total_revenue_data['revenue'] or 0),
        },
        'sales_over_time': sales_over_time,
        'top_products': top_products_data,
    })