from django.shortcuts import render, redirect
from .models import Product
from django.contrib.auth.decorators import login_required

@login_required
def product_list(request):
    products = Product.objects.all()
    return render(request, 'products/product_list.html', {'products': products})

@login_required
def add_product(request):
    if request.method == 'POST':
        name = request.POST['name']
        description = request.POST['description']
        price = request.POST['price']
        image = request.FILES['image']
        Product.objects.create(
            seller=request.user,
            name=name,
            description=description,
            price=price,
            image=image
        )
        return redirect('product_list')
    return render(request, 'products/add_product.html')
