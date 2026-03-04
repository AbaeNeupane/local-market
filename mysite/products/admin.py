from django.contrib import admin
from django.utils.html import format_html
from .models import Product, Category, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'is_primary')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'product_count')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = '# Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'name', 'seller', 'category', 'price', 'stock', 'condition', 'is_active', 'views_count', 'created_at')
    list_filter = ('is_active', 'condition', 'category', 'created_at')
    list_editable = ('is_active', 'price', 'stock')
    search_fields = ('name', 'seller__username', 'description')
    readonly_fields = ('views_count', 'created_at', 'updated_at')
    inlines = [ProductImageInline]
    date_hierarchy = 'created_at'

    def thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit:cover;border-radius:4px"/>', obj.image.url)
        return '—'
    thumbnail.short_description = 'Image'
