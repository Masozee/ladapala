from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Inventory, InventoryTransaction,
    Order, OrderItem, Payment, Table,
    KitchenOrder, KitchenOrderItem,
    Promotion, Schedule, Report, CashierSession
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'is_active']
        read_only_fields = ['id', 'full_name']


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BranchSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    
    class Meta:
        model = Branch
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class StaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = Staff
        fields = '__all__'
        read_only_fields = ['employee_id', 'hire_date', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['sku', 'created_at', 'updated_at', 'profit_margin']


class InventorySerializer(serializers.ModelSerializer):
    needs_restock = serializers.BooleanField(read_only=True)
    total_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Inventory
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'needs_restock', 'total_value']


class InventoryTransactionSerializer(serializers.ModelSerializer):
    inventory_name = serializers.CharField(source='inventory.name', read_only=True)
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['created_at', 'total_cost']


class TableSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = Table
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ['created_at', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(source='created_by.user.username', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'created_at', 'updated_at', 'total_amount']


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price', 'discount_amount', 'notes']
        extra_kwargs = {
            'discount_amount': {'required': False, 'default': 0},
            'notes': {'required': False, 'allow_blank': True}
        }


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)

    class Meta:
        model = Order
        fields = ['branch', 'table', 'order_type', 'customer_name', 'customer_phone',
                 'delivery_address', 'notes', 'created_by', 'items']
        extra_kwargs = {
            'table': {'required': False, 'allow_null': True},
            'delivery_address': {'required': False, 'allow_blank': True},
            'notes': {'required': False, 'allow_blank': True},
            'created_by': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        from .models import KitchenOrder, KitchenOrderItem

        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)

        # Create order items first
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        # Create kitchen order with items after all order items are saved
        if order.order_type in ['DINE_IN', 'TAKEAWAY', 'DELIVERY']:
            priority_map = {
                'DINE_IN': 5,
                'TAKEAWAY': 3,
                'DELIVERY': 1
            }

            kitchen_order = KitchenOrder.objects.create(
                order=order,
                priority=priority_map.get(order.order_type, 0),
                status='PENDING'
            )

            # Create kitchen order items
            for order_item in order.items.all():
                KitchenOrderItem.objects.create(
                    kitchen_order=kitchen_order,
                    product=order_item.product,
                    quantity=order_item.quantity,
                    notes=order_item.notes,
                    status='PENDING'
                )

        return order


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.user.username', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['transaction_id', 'created_at']


class KitchenOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = KitchenOrderItem
        fields = '__all__'


class KitchenOrderSerializer(serializers.ModelSerializer):
    items = KitchenOrderItemSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_type = serializers.CharField(source='order.order_type', read_only=True)
    table_number = serializers.CharField(source='order.table.number', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.user.username', read_only=True)
    
    class Meta:
        model = KitchenOrder
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PromotionSerializer(serializers.ModelSerializer):
    is_valid = serializers.SerializerMethodField()
    
    def get_is_valid(self, obj):
        return obj.is_valid()
    
    class Meta:
        model = Promotion
        fields = '__all__'
        read_only_fields = ['promo_code', 'used_count', 'created_at', 'updated_at']


class ScheduleSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.user.get_full_name', read_only=True)
    staff_role = serializers.CharField(source='staff.role', read_only=True)
    
    class Meta:
        model = Schedule
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        instance = Schedule(**data)
        instance.clean()
        return data


class ReportSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.user.username', read_only=True)
    
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ['created_at']


class DashboardSerializer(serializers.Serializer):
    total_orders_today = serializers.IntegerField()
    total_revenue_today = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_orders = serializers.IntegerField()
    low_stock_items = serializers.IntegerField()
    active_tables = serializers.IntegerField()
    staff_on_duty = serializers.IntegerField()


class CashierSessionSerializer(serializers.ModelSerializer):
    cashier_name = serializers.CharField(source='cashier.user.get_full_name', read_only=True)
    cashier_id = serializers.CharField(source='cashier.employee_id', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.user.get_full_name', read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = CashierSession
        fields = '__all__'
        read_only_fields = ['opened_at', 'closed_at', 'expected_cash', 'cash_difference', 'settlement_data']

    def get_duration_hours(self, obj):
        if obj.closed_at:
            duration = obj.closed_at - obj.opened_at
            return round(duration.total_seconds() / 3600, 2)
        return None


class CashierSessionOpenSerializer(serializers.ModelSerializer):
    """Serializer for opening a new cashier session"""
    override_by = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    override_reason = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = CashierSession
        fields = ['cashier', 'branch', 'shift_type', 'opening_cash', 'notes', 'override_by', 'override_reason']

    def validate(self, data):
        # Check if cashier already has an open session
        existing_open = CashierSession.objects.filter(
            cashier=data['cashier'],
            status='OPEN'
        ).exists()
        if existing_open:
            raise serializers.ValidationError("Cashier already has an open session")

        # If override is provided, validate the override_by staff is a manager
        if 'override_by' in data and data['override_by']:
            try:
                from .models import Staff, StaffRole
                override_staff = Staff.objects.get(id=data['override_by'])
                if override_staff.role not in [StaffRole.MANAGER, StaffRole.ADMIN]:
                    raise serializers.ValidationError("Only managers or admins can override schedule requirements")
            except Staff.DoesNotExist:
                raise serializers.ValidationError("Override staff not found")

        return data


class CashierSessionCloseSerializer(serializers.Serializer):
    """Serializer for closing a cashier session"""
    actual_cash = serializers.DecimalField(max_digits=10, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True)
    closed_by = serializers.IntegerField(required=False)