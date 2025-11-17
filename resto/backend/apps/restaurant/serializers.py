from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Inventory, InventoryTransaction, InventoryBatch,
    Order, OrderItem, Payment, Table,
    KitchenOrder, KitchenOrderItem,
    Promotion, Schedule, Report, CashierSession, StaffSession,
    Recipe, RecipeIngredient, PurchaseOrder, PurchaseOrderItem,
    StockTransfer, Vendor,
    Customer, LoyaltyTransaction, Reward, CustomerFeedback, MembershipTierBenefit,
    RestaurantSettings, ServingHistory
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
    restaurant_id = serializers.IntegerField(source='branch.restaurant.id', read_only=True)

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
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_promo_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['sku', 'created_at', 'updated_at', 'profit_margin', 'effective_price', 'is_promo_active']


class InventorySerializer(serializers.ModelSerializer):
    needs_restock = serializers.BooleanField(read_only=True)
    average_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    below_par_stock = serializers.BooleanField(read_only=True)
    breakage_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Inventory
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'needs_restock', 'average_cost', 'total_value', 'below_par_stock', 'breakage_rate']


class InventoryTransactionSerializer(serializers.ModelSerializer):
    inventory_name = serializers.CharField(source='inventory.name', read_only=True)
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['created_at', 'total_cost']


class InventoryBatchSerializer(serializers.ModelSerializer):
    inventory_name = serializers.CharField(source='inventory.name', read_only=True)
    inventory_unit = serializers.CharField(source='inventory.unit', read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True, allow_null=True)
    disposed_by_name = serializers.SerializerMethodField()

    # Computed fields
    days_until_expiry = serializers.IntegerField(read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    usage_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = InventoryBatch
        fields = '__all__'
        read_only_fields = [
            'batch_number', 'created_at', 'updated_at',
            'days_until_expiry', 'is_expiring_soon', 'is_expired',
            'is_active', 'usage_percentage'
        ]

    def get_disposed_by_name(self, obj):
        if obj.disposed_by:
            user = obj.disposed_by
            if user.first_name and user.last_name:
                return f"{user.first_name} {user.last_name}"
            return user.email
        return None


class TableSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = Table
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_category_name = serializers.CharField(source='product.category.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    payment_status = serializers.SerializerMethodField()
    total = serializers.DecimalField(source='subtotal', max_digits=10, decimal_places=2, read_only=True)
    price = serializers.DecimalField(source='unit_price', max_digits=10, decimal_places=2, read_only=True)
    quantity_remaining = serializers.ReadOnlyField()

    def get_payment_status(self, obj):
        """Get payment status from order's payments"""
        if hasattr(obj, 'order') and obj.order:
            payments = obj.order.payments.filter(status='COMPLETED')
            if payments.exists():
                return 'PAID'
        return 'UNPAID'

    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ['created_at', 'subtotal', 'quantity_remaining']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payments = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(source='created_by.user.username', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    customer_info = serializers.SerializerMethodField()

    # Staff tracking info
    order_taken_by_name = serializers.SerializerMethodField()
    prepared_by_name = serializers.SerializerMethodField()
    served_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'created_at', 'updated_at', 'total_amount']

    def get_order_taken_by_name(self, obj):
        if obj.order_taken_by:
            return obj.order_taken_by.user.get_full_name()
        return None

    def get_prepared_by_name(self, obj):
        if obj.prepared_by:
            return obj.prepared_by.user.get_full_name()
        return None

    def get_served_by_name(self, obj):
        if obj.served_by:
            return obj.served_by.user.get_full_name()
        return None

    def get_customer_info(self, obj):
        """Return customer membership info if linked"""
        if obj.customer:
            return {
                'id': obj.customer.id,
                'name': obj.customer.name,
                'phone_number': obj.customer.phone_number,
                'membership_tier': obj.customer.membership_tier,
                'points_balance': obj.customer.points_balance,
                'membership_number': obj.customer.membership_number
            }
        return None

    def get_payments(self, obj):
        from .models import Payment
        payments = Payment.objects.filter(order=obj)
        return [{
            'id': p.id,
            'status': p.status,
            'amount': str(p.amount),
            'payment_method': p.payment_method,
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in payments]


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
                 'customer', 'delivery_address', 'notes', 'created_by', 'items']
        extra_kwargs = {
            'table': {'required': False, 'allow_null': True},
            'customer': {'required': False, 'allow_null': True},
            'delivery_address': {'required': False, 'allow_blank': True},
            'notes': {'required': False, 'allow_blank': True},
            'created_by': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        from .models import KitchenOrder, KitchenOrderItem, Recipe

        items_data = validated_data.pop('items')

        # VALIDATE STOCK AVAILABILITY BEFORE CREATING ORDER
        insufficient_items = []
        for item_data in items_data:
            product = item_data.get('product')
            quantity = item_data.get('quantity')

            try:
                recipe = product.recipe
                # Check each ingredient availability
                for recipe_ingredient in recipe.ingredients.all():
                    inventory_item = recipe_ingredient.inventory_item
                    total_quantity_needed = float(recipe_ingredient.quantity) * quantity

                    if inventory_item.quantity < total_quantity_needed:
                        insufficient_items.append({
                            'product': product.name,
                            'ingredient': inventory_item.name,
                            'needed': total_quantity_needed,
                            'available': float(inventory_item.quantity),
                            'unit': inventory_item.unit
                        })
            except Recipe.DoesNotExist:
                # Product doesn't have a recipe, skip validation
                pass

        # If any ingredient is insufficient, reject the order
        if insufficient_items:
            error_messages = []
            for item in insufficient_items:
                error_messages.append(
                    f"{item['product']}: Stok {item['ingredient']} tidak cukup. "
                    f"Dibutuhkan {item['needed']}{item['unit']}, tersedia {item['available']}{item['unit']}"
                )
            raise serializers.ValidationError({
                'error': 'Stok bahan tidak mencukupi untuk membuat pesanan',
                'details': error_messages
            })

        # All ingredients available, proceed with order creation
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

            kitchen_items = []
            bar_items = []

            # Categorize items - beverages go to bar, everything else to kitchen
            for order_item in order.items.all():
                # Check if product category is beverage/drink
                if order_item.product.category and 'minuman' in order_item.product.category.name.lower():
                    bar_items.append(order_item)
                else:
                    kitchen_items.append(order_item)

            # Create kitchen order if there are kitchen items
            if kitchen_items:
                kitchen_order = KitchenOrder.objects.create(
                    order=order,
                    priority=priority_map.get(order.order_type, 0),
                    status='PENDING'
                )

                for order_item in kitchen_items:
                    KitchenOrderItem.objects.create(
                        kitchen_order=kitchen_order,
                        product=order_item.product,
                        quantity=order_item.quantity,
                        notes=order_item.notes,
                        status='PENDING'
                    )

            # Create bar order if there are bar items
            # Using KitchenOrder model with [BAR] prefix for now
            if bar_items:
                bar_order = KitchenOrder.objects.create(
                    order=order,
                    priority=priority_map.get(order.order_type, 0),
                    status='PENDING',
                )

                for order_item in bar_items:
                    KitchenOrderItem.objects.create(
                        kitchen_order=bar_order,
                        product=order_item.product,
                        quantity=order_item.quantity,
                        notes=f"[BAR] {order_item.notes}" if order_item.notes else "[BAR]",
                        status='PENDING'
                    )

        return order


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    processed_by_name = serializers.SerializerMethodField()
    cashier_session = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['transaction_id', 'created_at']

    def get_processed_by_name(self, obj):
        if obj.processed_by and obj.processed_by.user:
            user = obj.processed_by.user
            if user.first_name and user.last_name:
                return f"{user.first_name} {user.last_name}"
            return user.email
        return None

    def get_cashier_session(self, obj):
        if obj.cashier_session:
            cashier_name = None
            if obj.cashier_session.cashier and obj.cashier_session.cashier.user:
                user = obj.cashier_session.cashier.user
                if user.first_name and user.last_name:
                    cashier_name = f"{user.first_name} {user.last_name}"
                else:
                    cashier_name = user.email

            return {
                'id': obj.cashier_session.id,
                'shift_type': obj.cashier_session.shift_type,
                'cashier_name': cashier_name
            }
        return None


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
    # Map Schedule model fields to match frontend Shift interface
    employee = serializers.IntegerField(source='staff.id', read_only=True)
    employee_name = serializers.CharField(source='staff.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='staff.employee_id', read_only=True)
    shift_date = serializers.DateField(source='date', read_only=True)
    shift_type_display = serializers.CharField(source='get_shift_type_display', read_only=True)
    break_duration = serializers.SerializerMethodField()  # Not stored in model, default to 0
    hours_scheduled = serializers.SerializerMethodField()
    has_attendance = serializers.BooleanField(source='is_confirmed', read_only=True)

    def get_break_duration(self, obj):
        """Default break duration"""
        return 0

    # Keep original fields for write operations
    staff = serializers.PrimaryKeyRelatedField(queryset=Staff.objects.all(), write_only=True)
    date = serializers.DateField(write_only=True)

    def validate_date(self, value):
        """Ensure date is parsed correctly without timezone conversion"""
        from datetime import date as date_type
        if isinstance(value, date_type):
            return value
        # If it's a string, parse it as-is
        from datetime import datetime
        return datetime.strptime(str(value), '%Y-%m-%d').date()

    class Meta:
        model = Schedule
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display',
            'shift_date', 'start_time', 'end_time', 'shift_type', 'shift_type_display',
            'break_duration', 'hours_scheduled', 'has_attendance', 'notes',
            'created_at', 'updated_at',
            'staff', 'date', 'is_confirmed'  # Write-only fields
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_hours_scheduled(self, obj):
        """Calculate hours between start and end time"""
        from datetime import datetime, timedelta
        start = datetime.combine(obj.date, obj.start_time)
        end = datetime.combine(obj.date, obj.end_time)
        if obj.end_time < obj.start_time:  # Overnight shift
            end += timedelta(days=1)
        return round((end - start).total_seconds() / 3600, 1)

    def validate(self, data):
        # Convert write-only fields to model fields for validation
        if 'staff' in data:
            instance_data = {
                'staff': data.get('staff'),
                'date': data.get('date'),
                'shift_type': data.get('shift_type'),
                'start_time': data.get('start_time'),
                'end_time': data.get('end_time'),
            }
            instance = Schedule(**instance_data)
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
    settlement_data = serializers.SerializerMethodField()

    class Meta:
        model = CashierSession
        fields = '__all__'
        read_only_fields = ['opened_at', 'closed_at', 'expected_cash', 'cash_difference']

    def get_duration_hours(self, obj):
        if obj.closed_at:
            duration = obj.closed_at - obj.opened_at
            return round(duration.total_seconds() / 3600, 2)
        return None

    def get_settlement_data(self, obj):
        """Calculate settlement data on the fly for open sessions, or return stored data for closed sessions"""
        if obj.status == 'CLOSED' and obj.settlement_data:
            return obj.settlement_data

        # Calculate settlement data for open sessions
        _, settlement_data = obj.calculate_settlement()
        return settlement_data


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


class RecipeIngredientSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source="inventory_item.name", read_only=True)
    inventory_item_unit = serializers.CharField(source="inventory_item.unit", read_only=True)
    inventory_item_location = serializers.CharField(source="inventory_item.location", read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = [
            "id", "recipe", "inventory_item", "inventory_item_name", 
            "inventory_item_unit", "inventory_item_location",
            "quantity", "unit", "notes", "total_cost"
        ]


class RecipeSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cost_per_serving = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_margin = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            "id", "product", "product_name", "product_price", "branch", "branch_name",
            "serving_size", "preparation_time", "cooking_time", "instructions", "notes",
            "is_active", "ingredients", "total_cost", "cost_per_serving", "profit_margin",
            "created_at", "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_profit_margin(self, obj):
        """Calculate profit margin percentage"""
        if obj.cost_per_serving > 0 and obj.product.price > 0:
            profit = float(obj.product.price) - obj.cost_per_serving
            margin = (profit / float(obj.product.price)) * 100
            return round(margin, 2)
        return 0


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_unit = serializers.CharField(source='inventory_item.unit', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'purchase_order', 'inventory_item', 'inventory_item_name',
            'inventory_item_unit', 'quantity', 'unit_price', 'total_price',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.user.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.user.full_name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.user.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'branch', 'branch_name', 'po_number', 'supplier_name',
            'supplier_contact', 'supplier_email', 'supplier_phone',
            'status', 'order_date', 'expected_delivery_date', 'actual_delivery_date',
            'created_by', 'created_by_name', 'approved_by', 'approved_by_name',
            'received_by', 'received_by_name', 'notes', 'terms_and_conditions',
            'items', 'total_amount', 'total_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['po_number', 'created_at', 'updated_at']


class PurchaseOrderItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating PO items (without purchase_order field)"""
    class Meta:
        model = PurchaseOrderItem
        fields = ['inventory_item', 'quantity', 'unit_price', 'notes']


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating purchase orders with items"""
    items = PurchaseOrderItemCreateSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'branch', 'supplier_name', 'supplier_contact', 'supplier_email',
            'supplier_phone', 'order_date', 'expected_delivery_date',
            'created_by', 'notes', 'terms_and_conditions', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        purchase_order = PurchaseOrder.objects.create(**validated_data)

        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                **item_data
            )

        return purchase_order

    def to_representation(self, instance):
        """Use PurchaseOrderSerializer for output"""
        return PurchaseOrderSerializer(instance, context=self.context).data


class StockTransferSerializer(serializers.ModelSerializer):
    """Serializer for viewing stock transfer records"""
    from_warehouse_name = serializers.CharField(source='from_warehouse.name', read_only=True)
    to_kitchen_name = serializers.CharField(source='to_kitchen.name', read_only=True)
    transferred_by_name = serializers.CharField(source='transferred_by.full_name', read_only=True)

    class Meta:
        model = StockTransfer
        fields = [
            'id', 'branch', 'item_name', 'quantity', 'unit',
            'from_warehouse', 'from_warehouse_name',
            'to_kitchen', 'to_kitchen_name',
            'transferred_by', 'transferred_by_name',
            'transfer_date', 'notes'
        ]
        read_only_fields = ['id', 'transfer_date']


class StockTransferCreateSerializer(serializers.Serializer):
    """Serializer for creating stock transfers with automatic unit/price conversion"""
    warehouse_item_id = serializers.IntegerField(required=True)
    kitchen_item_id = serializers.IntegerField(required=False, allow_null=True)
    bar_item_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

    def validate(self, data):
        """Validate warehouse and destination items exist and have sufficient stock"""
        from decimal import Decimal

        # Validate that either kitchen_item_id or bar_item_id is provided
        if not data.get('kitchen_item_id') and not data.get('bar_item_id'):
            raise serializers.ValidationError({
                'kitchen_item_id': 'Either kitchen_item_id or bar_item_id must be provided'
            })

        if data.get('kitchen_item_id') and data.get('bar_item_id'):
            raise serializers.ValidationError({
                'kitchen_item_id': 'Only one destination (kitchen or bar) can be specified'
            })

        try:
            warehouse_item = Inventory.objects.get(
                id=data['warehouse_item_id'],
                location='WAREHOUSE'
            )
        except Inventory.DoesNotExist:
            raise serializers.ValidationError({
                'warehouse_item_id': 'Warehouse item not found'
            })

        # Determine destination (kitchen or bar)
        if data.get('kitchen_item_id'):
            destination_location = 'KITCHEN'
            destination_item_id = data['kitchen_item_id']
            destination_field = 'kitchen_item_id'
        else:
            destination_location = 'BAR'
            destination_item_id = data['bar_item_id']
            destination_field = 'bar_item_id'

        try:
            destination_item = Inventory.objects.get(
                id=destination_item_id,
                location=destination_location
            )
        except Inventory.DoesNotExist:
            raise serializers.ValidationError({
                destination_field: f'{destination_location.capitalize()} item not found'
            })

        # Verify same item (same name)
        if warehouse_item.name != destination_item.name:
            raise serializers.ValidationError({
                destination_field: f'{destination_location.capitalize()} item must be "{warehouse_item.name}", not "{destination_item.name}"'
            })

        # Verify sufficient warehouse stock
        if warehouse_item.quantity < data['quantity']:
            raise serializers.ValidationError({
                'quantity': f'Insufficient warehouse stock. Available: {warehouse_item.quantity} {warehouse_item.unit}'
            })

        # Store items for create method
        data['warehouse_item'] = warehouse_item
        data['destination_item'] = destination_item
        data['destination_location'] = destination_location

        return data

    def create(self, validated_data):
        """Create transfer with automatic unit and price conversion"""
        from decimal import Decimal

        warehouse_item = validated_data['warehouse_item']
        destination_item = validated_data['destination_item']
        destination_location = validated_data['destination_location']
        transfer_quantity = validated_data['quantity']
        notes = validated_data.get('notes', '')
        user = self.context['request'].user

        # Calculate unit conversion factor (if needed)
        warehouse_unit = warehouse_item.unit.lower()
        destination_unit = destination_item.unit.lower()

        # Conversion logic for kg→gram and liter→ml
        conversion_factor = Decimal('1')
        if warehouse_unit in ['kg', 'kilogram'] and destination_unit in ['gram', 'g']:
            conversion_factor = Decimal('1000')
        elif warehouse_unit in ['liter', 'l', 'litre'] and destination_unit in ['ml', 'milliliter']:
            conversion_factor = Decimal('1000')
        elif warehouse_unit != destination_unit:
            raise serializers.ValidationError({
                'unit': f'Cannot convert {warehouse_unit} to {destination_unit}'
            })

        # Calculate destination quantity (with conversion)
        destination_quantity = transfer_quantity * conversion_factor

        # Calculate destination cost per unit (with conversion)
        # If warehouse is Rp 45,000/kg and destination is gram, cost = 45,000 / 1000 = Rp 45/gram
        destination_cost_per_unit = warehouse_item.cost_per_unit / conversion_factor

        # Update destination inventory with moving average
        destination_item.update_cost_moving_average(
            new_quantity=destination_quantity,
            new_unit_cost=destination_cost_per_unit
        )
        destination_item.quantity += destination_quantity
        destination_item.save()

        # Deduct from warehouse
        warehouse_item.quantity -= transfer_quantity
        warehouse_item.save()

        # Create transfer record (maintain backward compatibility with to_kitchen field)
        transfer = StockTransfer.objects.create(
            branch=warehouse_item.branch,
            item_name=warehouse_item.name,
            quantity=transfer_quantity,
            unit=warehouse_item.unit,
            from_warehouse=warehouse_item,
            to_kitchen=destination_item,  # Store in to_kitchen regardless of destination for now
            transferred_by=user,
            notes=notes or f'Transferred {transfer_quantity} {warehouse_unit} to {destination_location}: {destination_quantity} {destination_unit}'
        )

        # Create inventory transactions for audit trail
        InventoryTransaction.objects.create(
            inventory=warehouse_item,
            transaction_type='TRANSFER',
            quantity=transfer_quantity,
            unit_cost=warehouse_item.cost_per_unit,
            reference_number=f'TRF-{transfer.id}',
            performed_by=user,
            notes=f'Transfer ke dapur: {transfer.notes}'
        )

        InventoryTransaction.objects.create(
            inventory=destination_item,
            transaction_type='TRANSFER',
            quantity=destination_quantity,
            unit_cost=destination_cost_per_unit,
            reference_number=f'TRF-{transfer.id}',
            performed_by=user,
            notes=f'Transfer dari gudang: {transfer.notes}'
        )

        return transfer

    def to_representation(self, instance):
        """Use StockTransferSerializer for output"""
        return StockTransferSerializer(instance, context=self.context).data


class VendorSerializer(serializers.Serializer):
    """Serializer for vendor data aggregated from Purchase Orders"""
    id = serializers.CharField()
    name = serializers.CharField()
    contact = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    address = serializers.CharField()
    payment_terms_days = serializers.IntegerField()
    tax_id = serializers.CharField()
    total_purchase_orders = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    last_order_date = serializers.DateField()
    branch_id = serializers.IntegerField()


class VendorDetailSerializer(serializers.Serializer):
    """Detailed vendor information with purchase order history"""
    id = serializers.CharField()
    name = serializers.CharField()
    contact = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    address = serializers.CharField()
    payment_terms_days = serializers.IntegerField()
    tax_id = serializers.CharField()
    total_purchase_orders = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    last_order_date = serializers.DateField()
    branch_id = serializers.IntegerField()
    purchase_orders = PurchaseOrderSerializer(many=True)


class VendorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new vendors"""
    class Meta:
        model = Vendor
        fields = [
            'name', 'contact_person', 'email', 'phone',
            'address', 'payment_terms_days', 'tax_id', 'notes'
        ]

    def create(self, validated_data):
        # Branch will be set in the viewset
        return super().create(validated_data)


# ===========================
# Customer Relationship Management Serializers
# ===========================

class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    favorite_products_details = ProductSerializer(source='favorite_products', many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'phone_number', 'name', 'email', 'date_of_birth', 'gender',
            'membership_tier', 'membership_number', 'join_date',
            'points_balance', 'lifetime_points',
            'total_visits', 'total_spent', 'last_visit',
            'favorite_products', 'favorite_products_details', 'notes',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['membership_number', 'join_date', 'points_balance', 'lifetime_points',
                           'total_visits', 'total_spent', 'last_visit', 'created_at', 'updated_at']


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new customers"""
    class Meta:
        model = Customer
        fields = ['phone_number', 'name', 'email', 'date_of_birth', 'gender', 'notes']


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    """Serializer for Loyalty Transaction model"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    reward_name = serializers.CharField(source='reward.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        if obj.created_by and hasattr(obj.created_by, 'user'):
            return obj.created_by.user.get_full_name() or obj.created_by.user.username
        return None

    class Meta:
        model = LoyaltyTransaction
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'transaction_type', 'points', 'balance_after',
            'order', 'order_number', 'reward', 'reward_name',
            'description', 'expiry_date',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['balance_after', 'created_at']


class RewardSerializer(serializers.ModelSerializer):
    """Serializer for Reward model"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    redemptions_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Reward
        fields = [
            'id', 'name', 'description', 'points_required',
            'reward_type', 'discount_type', 'discount_value',
            'product', 'product_name', 'voucher_code', 'voucher_value',
            'is_active', 'stock_quantity', 'valid_from', 'valid_until',
            'min_purchase', 'max_redemptions_per_customer',
            'image', 'sort_order', 'redemptions_count',
            'created_at', 'updated_at'
        ]


class CustomerFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for Customer Feedback model"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    responded_by_name = serializers.SerializerMethodField()

    def get_responded_by_name(self, obj):
        if obj.responded_by and hasattr(obj.responded_by, 'user'):
            return obj.responded_by.user.get_full_name() or obj.responded_by.user.username
        return None

    class Meta:
        model = CustomerFeedback
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'order', 'order_number',
            'food_rating', 'service_rating', 'ambiance_rating', 'value_rating', 'overall_rating',
            'comment', 'liked', 'disliked', 'suggestions',
            'would_recommend',
            'contact_name', 'contact_phone', 'contact_email',
            'staff_response', 'responded_by', 'responded_by_name', 'responded_at',
            'status', 'is_public', 'created_at'
        ]
        read_only_fields = ['overall_rating', 'created_at']


class MembershipTierBenefitSerializer(serializers.ModelSerializer):
    """Serializer for Membership Tier Benefit model"""
    complimentary_items_details = ProductSerializer(source='complimentary_items', many=True, read_only=True)

    class Meta:
        model = MembershipTierBenefit
        fields = [
            'id', 'tier',
            'min_total_spent', 'min_visits',
            'points_multiplier', 'birthday_bonus_points', 'discount_percentage',
            'priority_reservation', 'complimentary_items', 'complimentary_items_details',
            'description', 'color_code',
            'created_at', 'updated_at'
        ]


class RestaurantSettingsSerializer(serializers.ModelSerializer):
    """Serializer for Restaurant Settings"""
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_address = serializers.CharField(source='restaurant.address', read_only=True)
    restaurant_phone = serializers.CharField(source='restaurant.phone', read_only=True)
    restaurant_email = serializers.EmailField(source='restaurant.email', read_only=True)

    class Meta:
        model = RestaurantSettings
        fields = [
            'id', 'restaurant', 'restaurant_name', 'restaurant_address',
            'restaurant_phone', 'restaurant_email',
            # Restaurant Information
            'tax_rate', 'currency', 'timezone',
            # Notification Settings
            'low_stock_alerts', 'new_order_alerts', 'email_notifications',
            'sms_notifications', 'daily_reports', 'weekly_reports',
            # System Settings
            'auto_backup', 'backup_frequency', 'data_retention_days',
            'enable_audit_log', 'session_timeout_minutes',
            # Printer Settings
            'kitchen_printer_ip', 'bar_printer_ip', 'receipt_printer_ip', 'enable_auto_print',
            'print_receipts', 'print_kitchen_orders',
            # Security Settings
            'min_password_length', 'password_expiry_days', 'require_special_chars',
            'require_numbers', 'enable_two_factor', 'enable_ip_restriction',
            'max_login_attempts', 'enable_data_encryption', 'anonymize_logs',
            # Timestamps
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'restaurant', 'created_at', 'updated_at']


class ServingHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='order_item.product.name', read_only=True)
    served_by_name = serializers.SerializerMethodField()
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = ServingHistory
        fields = ['id', 'order', 'order_number', 'order_item', 'product_name',
                  'quantity_served', 'served_by', 'served_by_name', 'served_at', 'notes']
        read_only_fields = ['id', 'served_at']

    def get_served_by_name(self, obj):
        if obj.served_by and obj.served_by.user:
            return obj.served_by.user.get_full_name() or obj.served_by.user.email
        return 'Unknown'


class StaffSessionSerializer(serializers.ModelSerializer):
    """Serializer for StaffSession model"""
    staff_name = serializers.SerializerMethodField()
    staff_role = serializers.CharField(source='staff.role', read_only=True)
    staff_email = serializers.CharField(source='staff.user.email', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    schedule_info = serializers.SerializerMethodField()
    duration = serializers.FloatField(read_only=True)
    average_prep_time = serializers.FloatField(read_only=True)

    class Meta:
        model = StaffSession
        fields = [
            'id', 'staff', 'staff_name', 'staff_role', 'staff_email',
            'branch', 'branch_name', 'schedule', 'schedule_info',
            'shift_type', 'opened_at', 'closed_at', 'status',
            'override_by', 'override_reason',
            'orders_taken_count', 'orders_prepared_count',
            'orders_served_count', 'items_prepared_count',
            'notes', 'duration', 'average_prep_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'opened_at', 'created_at', 'updated_at',
            'staff_name', 'staff_role', 'staff_email',
            'branch_name', 'schedule_info', 'duration', 'average_prep_time'
        ]

    def get_staff_name(self, obj):
        return obj.staff.user.get_full_name() or obj.staff.user.email

    def get_schedule_info(self, obj):
        if obj.schedule:
            return {
                'id': obj.schedule.id,
                'date': obj.schedule.date,
                'shift_type': obj.schedule.shift_type,
                'start_time': obj.schedule.start_time,
                'end_time': obj.schedule.end_time
            }
        return None


class StaffSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new staff session"""

    class Meta:
        model = StaffSession
        fields = ['staff', 'branch', 'shift_type', 'override_by', 'override_reason', 'notes']

    def validate(self, data):
        """Validate session creation"""
        from datetime import date
        from django.core.exceptions import ValidationError as DjangoValidationError

        staff = data.get('staff')
        override_by = data.get('override_by')
        shift_type = data.get('shift_type')

        # Check if staff already has an open session
        existing_open = StaffSession.objects.filter(
            staff=staff,
            status='OPEN'
        ).exists()

        if existing_open:
            raise serializers.ValidationError(
                f"{staff.user.get_full_name()} already has an open session. Please close it first."
            )

        # Check if staff has a schedule for today
        today = date.today()
        schedule = Schedule.objects.filter(
            staff=staff,
            date=today,
            is_confirmed=True
        ).first()

        if schedule:
            # Auto-assign the schedule if it exists
            data['schedule'] = schedule
        elif not shift_type:
            # If no schedule and no shift_type provided, error
            raise serializers.ValidationError(
                f"{staff.user.get_full_name()} does not have a confirmed schedule for today. "
                "Please provide a shift_type or manager override is required."
            )
        # If shift_type is provided but no schedule, allow it (no override needed)

        return data


class ActiveStaffSerializer(serializers.Serializer):
    """Serializer for active staff list view"""
    id = serializers.IntegerField()
    staff_id = serializers.IntegerField()
    staff_name = serializers.CharField()
    staff_role = serializers.CharField()
    shift_type = serializers.CharField()
    orders_prepared_count = serializers.IntegerField()
    items_prepared_count = serializers.IntegerField()
    opened_at = serializers.DateTimeField()
    duration = serializers.FloatField()
