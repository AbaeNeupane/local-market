from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from users.stripe_connect import (
    create_connect_account, create_onboarding_link,
    connect_status, disconnect_account, create_login_link
)
from orders.tracking_views import order_tracking, update_order_status, add_tracking_info
from dashboard.admin_views import admin_stats
from notifications.service import notify_welcome

router = DefaultRouter()
router.register('products', views.ProductViewSet, basename='product')
router.register('categories', views.CategoryViewSet, basename='category')
router.register('orders', views.OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),

    # ── Auth ────────────────────────────────────────────────────
    path('auth/register/',        views.RegisterView.as_view(),  name='api_register'),
    path('auth/me/',              views.me,                      name='api_me'),
    path('auth/profile/',         views.update_profile,          name='api_update_profile'),

    # ── Dashboard ───────────────────────────────────────────────
    path('dashboard/stats/',      views.dashboard_stats,         name='api_dashboard_stats'),

    # ── Admin ───────────────────────────────────────────────────
    path('admin/stats/',          admin_stats,                   name='api_admin_stats'),

    # ── Payments ────────────────────────────────────────────────
    path('payments/stripe/checkout/<int:product_id>/', views.StripeCheckoutView.as_view()),
    path('payments/stripe/webhook/',                   views.StripeWebhookView.as_view()),
    path('payments/esewa/init/<int:product_id>/',      views.EsewaInitView.as_view()),
    path('payments/esewa/verify/',                     views.EsewaVerifyView.as_view()),

    # ── Stripe Connect (Seller onboarding) ──────────────────────
    path('stripe/connect/create/',        create_connect_account,  name='stripe_connect_create'),
    path('stripe/connect/onboarding/',    create_onboarding_link,  name='stripe_connect_onboard'),
    path('stripe/connect/status/',        connect_status,          name='stripe_connect_status'),
    path('stripe/connect/disconnect/',    disconnect_account,      name='stripe_connect_disconnect'),
    path('stripe/connect/dashboard/',     create_login_link,       name='stripe_connect_dashboard'),

    # ── Order Tracking ──────────────────────────────────────────
    path('orders/<int:order_id>/tracking/',         order_tracking,       name='order_tracking'),
    path('orders/<int:order_id>/update-status/',    update_order_status,  name='order_update_status'),
    path('orders/<int:order_id>/tracking-info/',    add_tracking_info,    name='order_tracking_info'),
]
