from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from .models import Product
from .forms import ProductForm

@login_required
def product_list(request):
    products = Product.objects.all()
    return render(request, 'products/product_list.html', {'products': products})

@login_required
def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    is_owner = product.seller == request.user
    return render(request, 'products/product_detail.html', {'product': product, 'is_owner': is_owner})

@login_required
def add_product(request):
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save(commit=False)
            product.seller = request.user
            product.save()
            return redirect('product_list')
    else:
        form = ProductForm()
    return render(request, 'products/add_product.html', {'form': form})

@login_required
def edit_product(request, id):
    product = get_object_or_404(Product, id=id)
    
    # Check if user is the seller
    if product.seller != request.user:
        return HttpResponseForbidden("You can only edit your own products.")
    
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            form.save()
            return redirect('product_detail', id=product.id)
    else:
        form = ProductForm(instance=product)
    
    return render(request, 'products/edit_product.html', {'form': form, 'product': product})

@login_required
def delete_product(request, id):
    product = get_object_or_404(Product, id=id)
    
    # Check if user is the seller
    if product.seller != request.user:
        return HttpResponseForbidden("You can only delete your own products.")
    
    if request.method == 'POST':
        product.delete()
        return redirect('product_list')
    
    return render(request, 'products/delete_product.html', {'product': product})
