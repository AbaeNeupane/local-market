"""
Custom Django Admin Site with stats dashboard.
"""
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
import json


class LocalMarketAdminSite(AdminSite):
    site_header = '🛒 Local Market Admin'
    site_title = 'Local Market'
    index_title = 'Dashboard'
    site_url = 'http://localhost:5173'

    def index(self, request, extra_context=None):
        """Override the admin index to inject dashboard stats."""
        from django.contrib.auth.models import User
        from users.models import Profile
        from products.models import Product
        from orders.models import Order
        from payments.models import Payment

        now = timezone.now()
        last_30 = now - timedelta(days=30)
        last_7 = now - timedelta(days=7)

        # Core stats
        stats = {
            'total_users': User.objects.count(),
            'new_users_30d': User.objects.filter(date_joined__gte=last_30).count(),
            'total_sellers': Profile.objects.filter(user_type='seller').count(),
            'total_buyers': Profile.objects.filter(user_type='buyer').count(),
            'verified_sellers': Profile.objects.filter(user_type='seller', is_verified=True).count(),
            'stripe_connected': Profile.objects.filter(stripe_onboard_status='complete').count(),
            'total_products': Product.objects.count(),
            'active_products': Product.objects.filter(is_active=True).count(),
            'out_of_stock': Product.objects.filter(stock=0, is_active=True).count(),
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'processing_orders': Order.objects.filter(status='processing').count(),
            'completed_orders': Order.objects.filter(status='completed').count(),
            'orders_7d': Order.objects.filter(created_at__gte=last_7).count(),
            'platform_revenue': float(Order.objects.filter(status='completed').aggregate(t=Sum('platform_fee'))['t'] or 0),
            'platform_revenue_30d': float(Order.objects.filter(status='completed', created_at__gte=last_30).aggregate(t=Sum('platform_fee'))['t'] or 0),
            'total_gmv': float(Order.objects.filter(status='completed').aggregate(t=Sum('amount'))['t'] or 0),
        }

        # Orders by status for pie chart
        order_status_data = list(
            Order.objects.values('status').annotate(count=Count('id')).order_by('-count')
        )

        # Daily orders last 14 days
        daily_orders = []
        for i in range(13, -1, -1):
            day = now - timedelta(days=i)
            count = Order.objects.filter(created_at__date=day.date()).count()
            revenue = float(Order.objects.filter(created_at__date=day.date(), status='completed').aggregate(t=Sum('platform_fee'))['t'] or 0)
            daily_orders.append({
                'date': day.strftime('%b %d'),
                'orders': count,
                'revenue': round(revenue, 2),
            })

        # Payment method breakdown
        payment_methods = list(
            Order.objects.filter(status='completed').values('payment_method').annotate(
                count=Count('id'), total=Sum('amount')
            ).order_by('-count')
        )

        # Recent orders
        recent_orders = Order.objects.select_related('buyer', 'product').order_by('-created_at')[:8]

        # Top products
        top_products = list(
            Product.objects.annotate(
                order_count=Count('orders', filter=Count('orders__status', filter={'status': 'completed'}))
            ).order_by('-views_count')[:5]
        )

        extra_context = extra_context or {}
        extra_context.update({
            'stats': stats,
            'order_status_data': json.dumps(order_status_data),
            'daily_orders_json': json.dumps(daily_orders),
            'payment_methods': payment_methods,
            'recent_orders': recent_orders,
            'top_products': top_products,
        })
        return super().index(request, extra_context)


# Replace default admin site
local_market_admin = LocalMarketAdminSite(name='localmarket_admin')
