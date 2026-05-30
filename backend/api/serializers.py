from rest_framework import serializers
from .models import User, Product, Order, OrderItem, Favorite


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'picture', 'role', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category',
                  'emoji', 'allergens', 'stock', 'available']


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'category',
                  'emoji', 'allergens', 'stock', 'available']

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio debe ser mayor que 0.')
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_id', 'name', 'emoji', 'quantity', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user_id', 'user_name', 'status', 'total',
                  'pickup_slot', 'pickup_code', 'notes', 'created_at',
                  'updated_at', 'items']


class OrderCreateSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(), min_length=1,
        error_messages={'min_length': 'El pedido debe tener al menos un producto.'}
    )
    pickup_slot = serializers.CharField(max_length=10)
    notes = serializers.CharField(required=False, default='', allow_blank=True)

    def validate_items(self, value):
        for item in value:
            if 'product_id' not in item:
                raise serializers.ValidationError('Cada item debe tener product_id.')
            if 'quantity' not in item or int(item.get('quantity', 0)) < 1:
                raise serializers.ValidationError('La cantidad mínima es 1.')
        return value


class OrderStatusSerializer(serializers.Serializer):
    VALID = ['paid', 'ready', 'delivered', 'cancelled']
    status = serializers.ChoiceField(choices=VALID)
