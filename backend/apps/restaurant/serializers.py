from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Inventory, InventoryTransaction,
    Order, OrderItem, Payment, Table,
    KitchenOrder, KitchenOrderItem,
    Promotion, Schedule, Report, CashierSession,
    Recipe, RecipeIngredient, PurchaseOrder, PurchaseOrderItem,
    StockTransfer, Vendor
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
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['sku', 'created_at', 'updated_at', 'profit_margin']


class InventorySerializer(serializers.ModelSerializer):
    needs_restock = serializers.BooleanField(read_only=True)
    average_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Inventory
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'needs_restock', 'average_cost', 'total_value']


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
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    payment_status = serializers.SerializerMethodField()
    total = serializers.DecimalField(source='subtotal', max_digits=10, decimal_places=2, read_only=True)
    price = serializers.DecimalField(source='unit_price', max_digits=10, decimal_places=2, read_only=True)

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
        read_only_fields = ['created_at', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payments = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(source='created_by.user.username', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'created_at', 'updated_at', 'total_amount']

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
                 'delivery_address', 'notes', 'created_by', 'items']
        extra_kwargs = {
            'table': {'required': False, 'allow_null': True},
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
    kitchen_item_id = serializers.IntegerField(required=True)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

    def validate(self, data):
        """Validate warehouse and kitchen items exist and have sufficient stock"""
        from decimal import Decimal

        try:
            warehouse_item = Inventory.objects.get(
                id=data['warehouse_item_id'],
                location='WAREHOUSE'
            )
        except Inventory.DoesNotExist:
            raise serializers.ValidationError({
                'warehouse_item_id': 'Warehouse item not found'
            })

        try:
            kitchen_item = Inventory.objects.get(
                id=data['kitchen_item_id'],
                location='KITCHEN'
            )
        except Inventory.DoesNotExist:
            raise serializers.ValidationError({
                'kitchen_item_id': 'Kitchen item not found'
            })

        # Verify same item (same name)
        if warehouse_item.name != kitchen_item.name:
            raise serializers.ValidationError({
                'kitchen_item_id': f'Kitchen item must be "{warehouse_item.name}", not "{kitchen_item.name}"'
            })

        # Verify sufficient warehouse stock
        if warehouse_item.quantity < data['quantity']:
            raise serializers.ValidationError({
                'quantity': f'Insufficient warehouse stock. Available: {warehouse_item.quantity} {warehouse_item.unit}'
            })

        # Store items for create method
        data['warehouse_item'] = warehouse_item
        data['kitchen_item'] = kitchen_item

        return data

    def create(self, validated_data):
        """Create transfer with automatic unit and price conversion"""
        from decimal import Decimal

        warehouse_item = validated_data['warehouse_item']
        kitchen_item = validated_data['kitchen_item']
        transfer_quantity = validated_data['quantity']
        notes = validated_data.get('notes', '')
        user = self.context['request'].user

        # Calculate unit conversion factor (if needed)
        warehouse_unit = warehouse_item.unit.lower()
        kitchen_unit = kitchen_item.unit.lower()

        # Conversion logic for kg→gram and liter→ml
        conversion_factor = Decimal('1')
        if warehouse_unit in ['kg', 'kilogram'] and kitchen_unit in ['gram', 'g']:
            conversion_factor = Decimal('1000')
        elif warehouse_unit in ['liter', 'l', 'litre'] and kitchen_unit in ['ml', 'milliliter']:
            conversion_factor = Decimal('1000')
        elif warehouse_unit != kitchen_unit:
            raise serializers.ValidationError({
                'unit': f'Cannot convert {warehouse_unit} to {kitchen_unit}'
            })

        # Calculate kitchen quantity (with conversion)
        kitchen_quantity = transfer_quantity * conversion_factor

        # Calculate kitchen cost per unit (with conversion)
        # If warehouse is Rp 45,000/kg and kitchen is gram, cost = 45,000 / 1000 = Rp 45/gram
        kitchen_cost_per_unit = warehouse_item.cost_per_unit / conversion_factor

        # Update kitchen inventory with moving average
        kitchen_item.update_cost_moving_average(
            new_quantity=kitchen_quantity,
            new_unit_cost=kitchen_cost_per_unit
        )
        kitchen_item.quantity += kitchen_quantity
        kitchen_item.save()

        # Deduct from warehouse
        warehouse_item.quantity -= transfer_quantity
        warehouse_item.save()

        # Create transfer record
        transfer = StockTransfer.objects.create(
            branch=warehouse_item.branch,
            item_name=warehouse_item.name,
            quantity=transfer_quantity,
            unit=warehouse_item.unit,
            from_warehouse=warehouse_item,
            to_kitchen=kitchen_item,
            transferred_by=user,
            notes=notes or f'Transferred {transfer_quantity} {warehouse_unit} = {kitchen_quantity} {kitchen_unit}'
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
            inventory=kitchen_item,
            transaction_type='TRANSFER',
            quantity=kitchen_quantity,
            unit_cost=kitchen_cost_per_unit,
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
