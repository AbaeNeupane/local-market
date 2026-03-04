from django.urls import path
from . import views

urlpatterns = [
    path('', views.product_list, name='product_list'),
    path('<int:id>/', views.product_detail, name='product_detail'),
    path('<int:id>/edit/', views.edit_product, name='edit_product'),
    path('<int:id>/delete/', views.delete_product, name='delete_product'),
    path('add/', views.add_product, name='add_product'),
]
