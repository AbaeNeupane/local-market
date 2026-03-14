from django.urls import path
from . import views

urlpatterns = [
    path('checkout/<int:product_id>/', views.create_checkout_session, name='checkout'),
    path('success/', views.success, name='payment_success'),
    path('cancel/', views.cancel, name='payment_cancel'),
    path('webhook/', views.stripe_webhook, name='stripe_webhook'),
]
