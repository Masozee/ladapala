from rest_framework import serializers
from apps.hotel.models import StockOpname, StockOpnameItem, InventoryItem


class StockOpnameItemSerializer(serializers.ModelSerializer):
    """Serializer for individual stock opname items"""
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_category = serializers.CharField(source='inventory_item.category.name', read_only=True)
    unit_of_measurement = serializers.CharField(source='inventory_item.unit_of_measurement', read_only=True)
    unit_price = serializers.DecimalField(source='inventory_item.unit_price', max_digits=10, decimal_places=2, read_only=True)
    counted_by_name = serializers.CharField(source='counted_by.get_full_name', read_only=True, allow_null=True)

    # Calculated fields
    has_discrepancy = serializers.BooleanField(read_only=True)
    discrepancy_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discrepancy_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = StockOpnameItem
        fields = [
            'id', 'stock_opname', 'inventory_item', 'inventory_item_name', 'inventory_item_category',
            'unit_of_measurement', 'unit_price', 'system_stock', 'counted_stock', 'difference',
            'reason', 'counted_by', 'counted_by_name', 'counted_at',
            'has_discrepancy', 'discrepancy_value', 'discrepancy_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'system_stock', 'difference', 'counted_at', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        """Custom update to set counted_by from request user"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and 'counted_stock' in validated_data:
            instance.counted_by = request.user
        return super().update(instance, validated_data)


class StockOpnameListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing stock opnames"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    completed_by_name = serializers.CharField(source='completed_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_discrepancy_value = serializers.SerializerMethodField()

    class Meta:
        model = StockOpname
        fields = [
            'id', 'opname_number', 'opname_date', 'status', 'status_display', 'location',
            'total_items_counted', 'total_discrepancies', 'total_discrepancy_value',
            'created_by_name', 'completed_by_name', 'created_at', 'completed_at'
        ]

    def get_total_discrepancy_value(self, obj):
        return obj.get_total_discrepancy_value()


class StockOpnameDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for stock opname with all items"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    completed_by_name = serializers.CharField(source='completed_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = StockOpnameItemSerializer(many=True, read_only=True)
    total_discrepancy_value = serializers.SerializerMethodField()

    class Meta:
        model = StockOpname
        fields = [
            'id', 'opname_number', 'opname_date', 'status', 'status_display', 'location', 'notes',
            'total_items_counted', 'total_discrepancies', 'total_discrepancy_value',
            'created_by', 'created_by_name', 'completed_by', 'completed_by_name',
            'created_at', 'updated_at', 'started_at', 'completed_at', 'items'
        ]
        read_only_fields = [
            'id', 'opname_number', 'total_items_counted', 'total_discrepancies',
            'created_by', 'completed_by', 'created_at', 'updated_at', 'started_at', 'completed_at'
        ]

    def get_total_discrepancy_value(self, obj):
        return obj.get_total_discrepancy_value()


class StockOpnameCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new stock opname"""
    auto_populate_items = serializers.BooleanField(write_only=True, default=True, help_text='Automatically add all active inventory items')

    class Meta:
        model = StockOpname
        fields = ['opname_date', 'location', 'notes', 'auto_populate_items']

    def create(self, validated_data):
        """Create stock opname and optionally populate with items"""
        auto_populate = validated_data.pop('auto_populate_items', True)
        request = self.context.get('request')

        # Set created_by from request user
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        opname = StockOpname.objects.create(**validated_data)

        # Auto-populate items if requested
        if auto_populate:
            active_items = InventoryItem.objects.filter(is_active=True)
            opname_items = [
                StockOpnameItem(
                    stock_opname=opname,
                    inventory_item=item,
                    system_stock=item.current_stock
                )
                for item in active_items
            ]
            StockOpnameItem.objects.bulk_create(opname_items)

        return opname
