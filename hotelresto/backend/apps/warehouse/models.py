"""
Unified Warehouse & Inventory Management System
Supports both Hotel and Restaurant operations with department distribution
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal


class WarehouseCategory(models.Model):
    """Categories for warehouse items (shared across hotel & restaurant)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    parent_category = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategories'
    )
    # Indicate which system(s) use this category
    for_hotel = models.BooleanField(default=True)
    for_restaurant = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Warehouse Category'
        verbose_name_plural = 'Warehouse Categories'

    def __str__(self):
        return self.name


class Supplier(models.Model):
    """Unified supplier management"""
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    payment_terms = models.CharField(max_length=100, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, help_text='Supplier rating (0-5)')
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class WarehouseItem(models.Model):
    """
    Central warehouse inventory
    Master stock that feeds into hotel and restaurant departments
    """
    ITEM_TYPE_CHOICES = [
        ('CONSUMABLE', 'Consumable'),
        ('DURABLE', 'Durable Goods'),
        ('PERISHABLE', 'Perishable'),
        ('AMENITY', 'Guest Amenity'),
        ('LINEN', 'Linen & Textile'),
        ('CLEANING', 'Cleaning Supplies'),
        ('KITCHEN', 'Kitchen Supplies'),
        ('BAR', 'Bar Supplies'),
        ('MAINTENANCE', 'Maintenance Supplies'),
        ('OFFICE', 'Office Supplies'),
    ]

    UNIT_CHOICES = [
        ('PIECE', 'Piece'),
        ('KG', 'Kilogram'),
        ('LITER', 'Liter'),
        ('BOX', 'Box'),
        ('BOTTLE', 'Bottle'),
        ('PACK', 'Pack'),
        ('METER', 'Meter'),
        ('SET', 'Set'),
        ('DOZEN', 'Dozen'),
        ('GALLON', 'Gallon'),
    ]

    # Basic info
    code = models.CharField(max_length=50, unique=True, help_text='SKU/Item code')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(WarehouseCategory, on_delete=models.PROTECT, related_name='items')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)

    # Stock management
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Current warehouse stock')
    min_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Minimum stock level')
    max_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Maximum stock level')
    reorder_point = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Reorder when stock reaches this')

    # Unit & pricing
    unit_of_measure = models.CharField(max_length=20, choices=UNIT_CHOICES, default='PIECE')
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Moving average cost')

    # Supplier info
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='warehouse_items')
    lead_time_days = models.IntegerField(default=7, help_text='Supplier lead time in days')

    # Metadata
    is_active = models.BooleanField(default=True)
    last_restocked = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['category', 'item_type']),
        ]

    def __str__(self):
        return f'{self.code} - {self.name}'

    @property
    def is_low_stock(self):
        """Check if stock is below minimum"""
        return self.quantity <= self.min_quantity

    @property
    def needs_reorder(self):
        """Check if stock reached reorder point"""
        return self.quantity <= self.reorder_point

    @property
    def stock_status(self):
        """Get stock status"""
        if self.quantity <= 0:
            return 'OUT_OF_STOCK'
        elif self.needs_reorder:
            return 'REORDER_NOW'
        elif self.is_low_stock:
            return 'LOW_STOCK'
        elif self.max_quantity and self.quantity >= self.max_quantity:
            return 'OVERSTOCKED'
        return 'NORMAL'

    @property
    def stock_value(self):
        """Calculate total value of current stock"""
        return self.quantity * self.cost_per_unit


class DepartmentBuffer(models.Model):
    """
    Department-specific inventory buffers
    Items distributed from warehouse to departments (hotel & restaurant)
    """
    DEPARTMENT_CHOICES = [
        # Hotel departments
        ('HOTEL_HOUSEKEEPING', 'Hotel - Housekeeping'),
        ('HOTEL_FRONT_DESK', 'Hotel - Front Desk'),
        ('HOTEL_MAINTENANCE', 'Hotel - Maintenance'),
        ('HOTEL_LAUNDRY', 'Hotel - Laundry'),
        ('HOTEL_FB', 'Hotel - F&B'),
        ('HOTEL_ENGINEERING', 'Hotel - Engineering'),
        # Restaurant departments
        ('RESTO_KITCHEN', 'Restaurant - Kitchen'),
        ('RESTO_BAR', 'Restaurant - Bar'),
        ('RESTO_SERVICE', 'Restaurant - Service/Waitstaff'),
        ('RESTO_STORAGE', 'Restaurant - Dry Storage'),
        # Shared
        ('ADMIN', 'Administration'),
    ]

    department = models.CharField(max_length=30, choices=DEPARTMENT_CHOICES)
    warehouse_item = models.ForeignKey(WarehouseItem, on_delete=models.CASCADE, related_name='department_buffers')

    # Buffer stock levels
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Current buffer stock')
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Minimum buffer level')
    max_stock = models.DecimalField(max_digits=10, decimal_places=2, default=100, help_text='Maximum buffer capacity')

    # Location within department
    location = models.CharField(max_length=100, blank=True, null=True, help_text='Storage location in department')

    # Metadata
    is_active = models.BooleanField(default=True)
    last_restocked = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['department', 'warehouse_item__name']
        unique_together = ['department', 'warehouse_item']
        verbose_name = 'Department Buffer'
        verbose_name_plural = 'Department Buffers'
        indexes = [
            models.Index(fields=['department']),
        ]

    def __str__(self):
        return f'{self.get_department_display()} - {self.warehouse_item.name} ({self.current_stock})'

    @property
    def is_low_stock(self):
        """Check if buffer is running low"""
        return self.current_stock <= self.min_stock

    @property
    def stock_percentage(self):
        """Get stock level as percentage of max"""
        if self.max_stock > 0:
            return (self.current_stock / self.max_stock) * 100
        return 0


class StockTransfer(models.Model):
    """
    Track stock movements from warehouse to departments or between departments
    """
    TRANSFER_TYPE_CHOICES = [
        ('WAREHOUSE_TO_DEPT', 'Warehouse to Department'),
        ('DEPT_TO_DEPT', 'Department to Department'),
        ('DEPT_TO_WAREHOUSE', 'Department Return to Warehouse'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_TRANSIT', 'In Transit'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    transfer_number = models.CharField(max_length=50, unique=True, editable=False)
    transfer_type = models.CharField(max_length=20, choices=TRANSFER_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Source & destination
    from_warehouse = models.BooleanField(default=True, help_text='Transfer from main warehouse')
    from_department = models.CharField(max_length=30, choices=DepartmentBuffer.DEPARTMENT_CHOICES, null=True, blank=True)
    to_department = models.CharField(max_length=30, choices=DepartmentBuffer.DEPARTMENT_CHOICES)

    # Item & quantity
    warehouse_item = models.ForeignKey(WarehouseItem, on_delete=models.PROTECT, related_name='transfers')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    # Personnel
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='requested_transfers')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_transfers')
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='completed_transfers')

    # Dates
    request_date = models.DateTimeField(default=timezone.now)
    approved_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)

    # Additional info
    reason = models.TextField(blank=True, null=True, help_text='Reason for transfer')
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['to_department']),
        ]

    def __str__(self):
        return f'{self.transfer_number} - {self.warehouse_item.name} to {self.get_to_department_display()}'

    def save(self, *args, **kwargs):
        if not self.transfer_number:
            # Generate transfer number
            from datetime import datetime
            prefix = 'TRF'
            date_str = datetime.now().strftime('%Y%m%d')
            count = StockTransfer.objects.filter(transfer_number__startswith=f'{prefix}{date_str}').count() + 1
            self.transfer_number = f'{prefix}{date_str}{count:04d}'
        super().save(*args, **kwargs)


class PurchaseOrder(models.Model):
    """Unified purchase orders for warehouse restocking"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('ORDERED', 'Ordered'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    po_number = models.CharField(max_length=50, unique=True, editable=False)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    # Dates
    order_date = models.DateField(default=timezone.now)
    expected_delivery = models.DateField(null=True, blank=True)
    actual_delivery = models.DateField(null=True, blank=True)

    # Personnel
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_pos')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_pos')

    # Financial
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Additional info
    payment_terms = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.po_number} - {self.supplier.name}'

    def save(self, *args, **kwargs):
        if not self.po_number:
            # Generate PO number
            from datetime import datetime
            prefix = 'PO'
            date_str = datetime.now().strftime('%Y%m%d')
            count = PurchaseOrder.objects.filter(po_number__startswith=f'{prefix}{date_str}').count() + 1
            self.po_number = f'{prefix}{date_str}{count:04d}'
        super().save(*args, **kwargs)


class PurchaseOrderItem(models.Model):
    """Line items for purchase orders"""
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    warehouse_item = models.ForeignKey(WarehouseItem, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    received_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['warehouse_item__name']

    def __str__(self):
        return f'{self.warehouse_item.name} x {self.quantity}'

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class StockAdjustment(models.Model):
    """Record stock adjustments (damage, loss, found, correction)"""
    ADJUSTMENT_TYPE_CHOICES = [
        ('DAMAGE', 'Damaged'),
        ('LOSS', 'Lost/Stolen'),
        ('FOUND', 'Found/Surplus'),
        ('CORRECTION', 'Stock Count Correction'),
        ('EXPIRED', 'Expired'),
        ('RETURN', 'Return to Supplier'),
    ]

    adjustment_number = models.CharField(max_length=50, unique=True, editable=False)
    warehouse_item = models.ForeignKey(WarehouseItem, on_delete=models.PROTECT, related_name='adjustments')
    department_buffer = models.ForeignKey(DepartmentBuffer, on_delete=models.SET_NULL, null=True, blank=True, related_name='adjustments')

    adjustment_type = models.CharField(max_length=20, choices=ADJUSTMENT_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text='Positive for increase, negative for decrease')

    reason = models.TextField(help_text='Reason for adjustment')
    adjusted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    adjustment_date = models.DateTimeField(default=timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-adjustment_date']

    def __str__(self):
        return f'{self.adjustment_number} - {self.warehouse_item.name}'

    def save(self, *args, **kwargs):
        if not self.adjustment_number:
            # Generate adjustment number
            from datetime import datetime
            prefix = 'ADJ'
            date_str = datetime.now().strftime('%Y%m%d')
            count = StockAdjustment.objects.filter(adjustment_number__startswith=f'{prefix}{date_str}').count() + 1
            self.adjustment_number = f'{prefix}{date_str}{count:04d}'
        super().save(*args, **kwargs)
