from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import Order

@login_required
def order_list(request):
    orders = Order.objects.filter(buyer=request.user)
    return render(request, 'orders/order_list.html', {'orders': orders})
