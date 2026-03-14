from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from products.models import Product
from orders.models import Order
from .models import Review
from .serializers import ReviewSerializer


class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return Review.objects.filter(product_id=product_id).select_related('reviewer', 'reviewer__profile')

    def perform_create(self, serializer):
        product = get_object_or_404(Product, id=self.kwargs['product_id'])
        user = self.request.user

        # Check already reviewed
        if Review.objects.filter(product=product, reviewer=user).exists():
            raise PermissionDenied('You have already reviewed this product.')

        # Check if buyer has purchased this product
        has_purchased = Order.objects.filter(
            buyer=user, product=product, status='completed'
        ).exists()
        if not has_purchased:
            raise PermissionDenied('You can only review products you have purchased.')

        serializer.save(reviewer=user, product=product)


class ReviewDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(reviewer=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_rating_summary(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    reviews = Review.objects.filter(product=product)
    summary = reviews.aggregate(avg=Avg('rating'), count=Count('id'))
    breakdown = {}
    for i in range(1, 6):
        breakdown[str(i)] = reviews.filter(rating=i).count()
    return Response({
        'average': round(summary['avg'] or 0, 1),
        'total': summary['count'] or 0,
        'breakdown': breakdown,
        'can_review': request.user.is_authenticated and Order.objects.filter(
            buyer=request.user, product=product, status='completed'
        ).exists() and not Review.objects.filter(product=product, reviewer=request.user).exists()
    })