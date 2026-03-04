from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'order', 'gateway', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('gateway', 'status', 'currency', 'created_at')
    search_fields = ('user__username', 'gateway_payment_id', 'gateway_order_id')
    readonly_fields = ('created_at', 'updated_at', 'raw_response')
    date_hierarchy = 'created_at'
