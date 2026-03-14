from django.db import models
from django.contrib.auth.models import User
from orders.models import Order

class Payment(models.Model):
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    GATEWAY_CHOICES = [
        ('stripe', 'Stripe'),
        ('esewa', 'eSewa'),
        ('paypal', 'PayPal'),
        ('khalti', 'Khalti'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    gateway_payment_id = models.CharField(max_length=255, blank=True)
    gateway_order_id = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='NPR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} via {self.gateway} - {self.status}"
