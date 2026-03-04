from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderStatusHistory


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ('status', 'note', 'updated_by', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'product', 'quantity', 'amount', 'platform_fee', 'seller_amount', 'payment_method', 'colored_status', 'tracking_number', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('buyer__username', 'product__name', 'payment_id', 'tracking_number')
    readonly_fields = ('platform_fee', 'seller_amount', 'created_at', 'updated_at')
    inlines = [OrderStatusHistoryInline]
    date_hierarchy = 'created_at'
    list_per_page = 25
    fieldsets = (
        ('Order Info', {'fields': ('buyer', 'product', 'quantity', 'amount', 'platform_fee', 'seller_amount', 'status', 'payment_method', 'payment_id')}),
        ('Shipping & Tracking', {'fields': ('shipping_address', 'tracking_number', 'carrier', 'estimated_delivery', 'notes')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def colored_status(self, obj):
        colors = {'pending': '#f59e0b', 'processing': '#3b82f6', 'shipped': '#8b5cf6', 'out_for_delivery': '#06b6d4', 'delivered': '#10b981', 'completed': '#10b981', 'cancelled': '#6b7280', 'refunded': '#8b5cf6', 'failed': '#ef4444'}
        color = colors.get(obj.status, '#6b7280')
        return format_html('<span style="background:{};color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">{}</span>', color, obj.get_status_display())
    colored_status.short_description = 'Status'

    def save_model(self, request, obj, form, change):
        if change:
            old = Order.objects.get(pk=obj.pk)
            old_status = old.status
            super().save_model(request, obj, form, change)
            if old_status != obj.status:
                OrderStatusHistory.objects.create(order=obj, status=obj.status, note=f'Status updated by admin: {request.user.username}', updated_by=request.user)
                try:
                    from notifications.emails import send_order_status_update
                    send_order_status_update(obj, old.get_status_display())
                except Exception:
                    pass
        else:
            super().save_model(request, obj, form, change)
