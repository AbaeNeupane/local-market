from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    USER_TYPES = (
        ('buyer', 'Buyer'),
        ('seller', 'Seller'),
    )
    STRIPE_ONBOARD_STATUS = (
        ('not_started', 'Not Started'),
        ('pending', 'Pending'),
        ('complete', 'Complete'),
        ('restricted', 'Restricted'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    stripe_account_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_onboard_status = models.CharField(max_length=20, choices=STRIPE_ONBOARD_STATUS, default='not_started')
    stripe_charges_enabled = models.BooleanField(default=False)
    stripe_payouts_enabled = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True, default='Nepal')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.user_type})"

    @property
    def total_sales(self):
        if self.user_type == 'seller':
            from orders.models import Order
            return Order.objects.filter(product__seller=self.user, status='completed').count()
        return 0

    @property
    def total_revenue(self):
        if self.user_type == 'seller':
            from orders.models import Order
            from django.db.models import Sum
            result = Order.objects.filter(
                product__seller=self.user, status='completed'
            ).aggregate(total=Sum('seller_amount'))
            return result['total'] or 0
        return 0
