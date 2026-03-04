"""
API views for order tracking — sellers update, buyers view.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import serializers, status
from django.shortcuts import get_object_or_404
from .models import Order
from .tracking import ShippingUpdate, TrackingInfo
from notifications.service import notify_order_status_change


class ShippingUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ShippingUpdate
        fields = ['id', 'status', 'status_display', 'message', 'location', 'updated_by_name', 'timestamp']


class TrackingInfoSerializer(serializers.ModelSerializer):
    courier_display = serializers.CharField(source='get_courier_display', read_only=True)

    class Meta:
        model = TrackingInfo
        fields = ['courier', 'courier_display', 'tracking_number', 'tracking_url', 'estimated_delivery', 'notes']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_tracking(request, order_id):
    """
    Get full tracking timeline for an order.
    Accessible by buyer OR seller of that order.
    """
    order = get_object_or_404(Order, id=order_id)

    # Permission: buyer or seller only
    is_buyer = order.buyer == request.user
    is_seller = order.product.seller == request.user
    if not (is_buyer or is_seller or request.user.is_staff):
        return Response({'error': 'Not authorised.'}, status=403)

    updates = ShippingUpdate.objects.filter(order=order)
    tracking_info = getattr(order, 'tracking', None)

    return Response({
        'order_id': order.id,
        'product_name': order.product.name,
        'current_status': order.status,
        'payment_method': order.payment_method,
        'amount': str(order.amount),
        'buyer': order.buyer.username,
        'seller': order.product.seller.username,
        'tracking_info': TrackingInfoSerializer(tracking_info).data if tracking_info else None,
        'timeline': ShippingUpdateSerializer(updates, many=True).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """
    Seller updates order status with an optional message and location.
    Also creates a ShippingUpdate record for the timeline.
    """
    order = get_object_or_404(Order, id=order_id)

    # Only seller or admin can update
    if order.product.seller != request.user and not request.user.is_staff:
        return Response({'error': 'Only the seller can update this order.'}, status=403)

    new_status = request.data.get('status')
    message = request.data.get('message', '')
    location = request.data.get('location', '')

    valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response({'error': f'Invalid status. Choose from: {valid_statuses}'}, status=400)

    old_status = order.status
    order.status = new_status
    order.save(update_fields=['status', 'updated_at'])

    # Create timeline entry
    ShippingUpdate.objects.create(
        order=order,
        status=new_status,
        message=message,
        location=location,
        updated_by=request.user,
    )

    # Send email notification to buyer
    try:
        notify_order_status_change(order, old_status, new_status)
    except Exception:
        pass  # Don't fail the update if email fails

    return Response({
        'message': f'Order status updated to {new_status}.',
        'order_id': order.id,
        'status': new_status,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_tracking_info(request, order_id):
    """Seller adds courier tracking number to an order."""
    order = get_object_or_404(Order, id=order_id)

    if order.product.seller != request.user and not request.user.is_staff:
        return Response({'error': 'Only the seller can add tracking info.'}, status=403)

    tracking, created = TrackingInfo.objects.update_or_create(
        order=order,
        defaults={
            'courier': request.data.get('courier', ''),
            'tracking_number': request.data.get('tracking_number', ''),
            'tracking_url': request.data.get('tracking_url', ''),
            'estimated_delivery': request.data.get('estimated_delivery') or None,
            'notes': request.data.get('notes', ''),
        }
    )

    # Auto-create a "Shipped" timeline update if tracking number added
    if tracking.tracking_number and order.status == 'processing':
        order.status = 'shipped'
        order.save(update_fields=['status'])
        ShippingUpdate.objects.create(
            order=order,
            status='shipped',
            message=f'Shipped via {tracking.get_courier_display()}. Tracking: {tracking.tracking_number}',
            updated_by=request.user,
        )
        try:
            notify_order_status_change(order, 'processing', 'shipped')
        except Exception:
            pass

    return Response(TrackingInfoSerializer(tracking).data, status=201 if created else 200)
