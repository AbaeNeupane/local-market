from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from dashboard.admin_site import local_market_admin

# Register all app admins with our custom site
from users.admin import ProfileAdmin
from users.models import Profile
from products.admin import ProductAdmin, CategoryAdmin
from products.models import Product, Category, ProductImage
from orders.admin import OrderAdmin
from orders.models import Order, OrderStatusHistory
from payments.admin import PaymentAdmin
from payments.models import Payment

local_market_admin.register(Profile, ProfileAdmin)
local_market_admin.register(Product, ProductAdmin)
local_market_admin.register(Category, CategoryAdmin)
local_market_admin.register(Order, OrderAdmin)
local_market_admin.register(Payment, PaymentAdmin)

urlpatterns = [
    path('admin/', local_market_admin.urls),
    path('', views.home, name='home'),
    path('users/', include('users.urls')),
    path('products/', include('products.urls')),
    path('orders/', include('orders.urls')),
    path('payments/', include('payments.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('api/', include('api.urls')),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='api_login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
