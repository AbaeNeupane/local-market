from django.urls import path
from . import views

urlpatterns = [
    path('products/<int:product_id>/reviews/', views.ProductReviewListCreateView.as_view(), name='product_reviews'),
    path('reviews/<int:pk>/', views.ReviewDeleteView.as_view(), name='review_delete'),
    path('products/<int:product_id>/rating/', views.product_rating_summary, name='product_rating'),
]