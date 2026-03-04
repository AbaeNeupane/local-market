from django.shortcuts import render
from products.models import Product
from orders.models import Order

def home(request):
    if request.user.is_authenticated:
        # Dashboard for authenticated users
        user_products = Product.objects.filter(seller=request.user).count()
        user_orders = Order.objects.filter(buyer=request.user).count()
        total_products = Product.objects.count()
        recent_products = Product.objects.all()[:6]
        
        context = {
            'user_products': user_products,
            'user_orders': user_orders,
            'total_products': total_products,
            'recent_products': recent_products,
        }
        return render(request, 'home_dashboard.html', context)
    else:
        # Landing page for visitors
        total_products = Product.objects.count()
        total_sellers = Product.objects.values('seller').distinct().count()
        featured_products = Product.objects.all()[:6]
        
        context = {
            'total_products': total_products,
            'total_sellers': total_sellers,
            'featured_products': featured_products,
        }
        return render(request, 'home_landing.html', context)
