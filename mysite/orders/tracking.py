"""
Order tracking & shipping status management.
Sellers can update tracking info; buyers get live status updates.
"""
from django.db import models


class ShippingUpdate(models.Model):
    """Individual status updates in the shipping timeline."""
    STATUS_CHOICES = [
        ('order_placed',    'Order Placed'),
        ('confirmed',       'Order Confirmed'),
        ('processing',      'Processing'),
        ('packed',          'Packed'),
        ('shipped',         'Shipped'),
        ('out_for_delivery','Out for Delivery'),
        ('delivered',       'Delivered'),
        ('cancelled',       'Cancelled'),
        ('return_initiated','Return Initiated'),
        ('returned',        'Returned'),
    ]

    order = models.ForeignKey(
        'orders.Order', on_delete=models.CASCADE, related_name='tracking_updates'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    message = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    updated_by = models.ForeignKey(
        'auth.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Order #{self.order_id} → {self.get_status_display()}"


class TrackingInfo(models.Model):
    """Tracking number and courier info attached to an order."""
    COURIER_CHOICES = [
        ('dhl',      'DHL'),
        ('fedex',    'FedEx'),
        ('aramex',   'Aramex'),
        ('nepal_post','Nepal Post'),
        ('bluedart', 'BlueDart'),
        ('custom',   'Custom Courier'),
    ]

    order = models.OneToOneField(
        'orders.Order', on_delete=models.CASCADE, related_name='tracking'
    )
    courier = models.CharField(max_length=30, choices=COURIER_CHOICES, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    tracking_url = models.URLField(blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tracking for Order #{self.order_id}: {self.tracking_number}"
