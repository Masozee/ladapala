from rest_framework import serializers
from .models import (
    WarehouseCategory,
    Supplier,
    WarehouseItem,
    DepartmentBuffer,
    StockTransfer,
    PurchaseOrder,
    PurchaseOrderItem,
    StockAdjustment
)


class WarehouseCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent_category.name', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = WarehouseCategory
        fields = [
            'id', 'name', 'description', 'for_hotel', 'for_restaurant',
            'parent_category', 'parent_name', 'is_active', 'created_at',
            'updated_at', 'item_count'
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class SupplierSerializer(serializers.ModelSerializer):
    total_purchase_orders = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'address',
            'payment_terms', 'rating', 'is_active', 'notes', 'created_at',
            'updated_at', 'total_purchase_orders'
        ]

    def get_total_purchase_orders(self, obj):
        return obj.purchase_orders.count()


class WarehouseItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    stock_value = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    needs_reorder = serializers.BooleanField(read_only=True)

    class Meta:
        model = WarehouseItem
        fields = [
            'id', 'code', 'name', 'description', 'category', 'category_name',
            'item_type', 'unit', 'quantity', 'min_quantity', 'max_quantity',
            'reorder_point', 'cost_per_unit', 'supplier', 'supplier_name',
            'storage_location', 'expiry_date', 'is_active', 'notes',
            'created_at', 'updated_at', 'stock_status', 'stock_value',
            'is_low_stock', 'needs_reorder'
        ]


class WarehouseItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = WarehouseItem
        fields = [
            'id', 'code', 'name', 'category_name', 'item_type', 'unit',
            'quantity', 'min_quantity', 'reorder_point', 'cost_per_unit',
            'stock_status', 'is_active'
        ]


class DepartmentBufferSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='item.code', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    unit = serializers.CharField(source='item.unit', read_only=True)
    buffer_status = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentBuffer
        fields = [
            'id', 'item', 'item_code', 'item_name', 'unit', 'department',
            'current_stock', 'min_stock', 'max_stock', 'location',
            'last_restocked', 'notes', 'created_at', 'updated_at',
            'buffer_status'
        ]

    def get_buffer_status(self, obj):
        if obj.current_stock <= obj.min_stock:
            return 'LOW'
        elif obj.current_stock >= obj.max_stock:
            return 'FULL'
        else:
            return 'NORMAL'


class StockTransferSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='warehouse_item.code', read_only=True)
    item_name = serializers.CharField(source='warehouse_item.name', read_only=True)
    unit = serializers.CharField(source='warehouse_item.unit', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    completed_by_name = serializers.CharField(source='completed_by.get_full_name', read_only=True)
    from_department_display = serializers.CharField(source='get_from_department_display', read_only=True)
    to_department_display = serializers.CharField(source='get_to_department_display', read_only=True)
    transfer_type_display = serializers.CharField(source='get_transfer_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = StockTransfer
        fields = [
            'id', 'transfer_number', 'transfer_type', 'transfer_type_display',
            'from_warehouse', 'from_department', 'from_department_display',
            'to_department', 'to_department_display', 'warehouse_item',
            'item_code', 'item_name', 'unit', 'quantity', 'status',
            'status_display', 'requested_by', 'requested_by_name', 'approved_by',
            'approved_by_name', 'completed_by', 'completed_by_name',
            'request_date', 'approved_date', 'completed_date', 'reason',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['transfer_number', 'requested_by', 'request_date']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='warehouse_item.code', read_only=True)
    item_name = serializers.CharField(source='warehouse_item.name', read_only=True)
    unit = serializers.CharField(source='warehouse_item.unit', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'warehouse_item', 'item_code', 'item_name', 'unit',
            'quantity', 'received_quantity', 'unit_price', 'total_price',
            'notes'
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name', 'order_date',
            'expected_delivery', 'actual_delivery', 'status', 'status_display',
            'payment_terms', 'created_by', 'created_by_name', 'approved_by',
            'approved_by_name', 'subtotal', 'tax_amount', 'total_amount',
            'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['po_number', 'created_by', 'order_date']


class StockAdjustmentSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='warehouse_item.code', read_only=True)
    item_name = serializers.CharField(source='warehouse_item.name', read_only=True)
    adjusted_by_name = serializers.CharField(source='adjusted_by.get_full_name', read_only=True)
    adjustment_type_display = serializers.CharField(source='get_adjustment_type_display', read_only=True)

    class Meta:
        model = StockAdjustment
        fields = [
            'id', 'adjustment_number', 'warehouse_item', 'item_code', 'item_name',
            'department_buffer', 'adjustment_type', 'adjustment_type_display',
            'quantity', 'reason', 'adjusted_by', 'adjusted_by_name',
            'adjustment_date', 'created_at'
        ]
        read_only_fields = ['adjustment_number', 'adjusted_by', 'adjustment_date']
