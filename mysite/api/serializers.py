from rest_framework import serializers
from django.contrib.auth.models import User
from users.models import Profile
from products.models import Product, Category, ProductImage
from orders.models import Order, OrderStatusHistory
from payments.models import Payment


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['user_type', 'avatar', 'bio', 'phone', 'address', 'city', 'country', 'is_verified',
                  'stripe_onboard_status', 'stripe_charges_enabled', 'stripe_payouts_enabled']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    total_sales = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'profile', 'total_sales', 'total_revenue']

    def get_total_sales(self, obj):
        try: return obj.profile.total_sales
        except: return 0

    def get_total_revenue(self, obj):
        try: return float(obj.profile.total_revenue)
        except: return 0.0


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=Profile.USER_TYPES)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'user_type', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        user_type = validated_data.pop('user_type')
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        Profile.objects.create(user=user, user_type=user_type)
        return user


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'product_count']
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock', 'condition', 'image_url', 'seller_name', 'category_name', 'views_count', 'created_at', 'is_active']
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = '__all__'
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
    def get_total_orders(self, obj):
        return obj.orders.filter(status='completed').count()


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'stock', 'condition', 'image', 'category']
    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'status_display', 'note', 'updated_by_name', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    seller_name = serializers.CharField(source='product.seller.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    history = OrderStatusHistorySerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['buyer', 'platform_fee', 'seller_amount', 'created_at', 'updated_at']
    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product.image and request:
            return request.build_absolute_uri(obj.product.image.url)
        return None


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
