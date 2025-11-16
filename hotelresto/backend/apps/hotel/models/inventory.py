from django.db import models
from django.conf import settings
from django.utils import timezone
from .amenities import AmenityCategory


class InventoryItem(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        AmenityCategory,
        on_delete=models.PROTECT,
        related_name='inventory_items',
        help_text='Category from Amenity Categories'
    )
    description = models.TextField(blank=True, null=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    current_stock = models.PositiveIntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=0)
    maximum_stock = models.PositiveIntegerField(null=True, blank=True)
    unit_of_measurement = models.CharField(max_length=20, default='pieces')
    supplier = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_items')
    last_restocked = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.current_stock} {self.unit_of_measurement})'

    @property
    def is_low_stock(self):
        return self.current_stock <= self.minimum_stock

    @property
    def stock_status(self):
        if self.is_low_stock:
            return 'Low Stock'
        elif self.maximum_stock and self.current_stock >= self.maximum_stock:
            return 'Overstocked'
        else:
            return 'Normal'


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    po_number = models.CharField(max_length=20, unique=True, editable=False)
    supplier = models.ForeignKey('Supplier', on_delete=models.PROTECT, related_name='purchase_orders')
    order_date = models.DateField(default=timezone.now)
    expected_delivery = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    notes = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='purchase_orders_created')
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders_received')
    received_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-order_date', '-created_at']

    def __str__(self):
        return f'{self.po_number} - {self.supplier}'

    def save(self, *args, **kwargs):
        if not self.po_number:
            # Generate PO number: PO-YYYY-NNN
            year = timezone.now().year
            last_po = PurchaseOrder.objects.filter(
                po_number__startswith=f'PO-{year}-'
            ).order_by('-po_number').first()

            if last_po:
                last_num = int(last_po.po_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1

            self.po_number = f'PO-{year}-{new_num:03d}'

        super().save(*args, **kwargs)

    def calculate_total(self):
        """Calculate total amount from items"""
        total = sum(item.subtotal for item in self.items.all())
        self.total_amount = total
        self.save(update_fields=['total_amount'])
        return total


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity_ordered = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_received = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.purchase_order.po_number} - {self.inventory_item.name}'

    @property
    def subtotal(self):
        return self.quantity_ordered * self.unit_price

    @property
    def is_fully_received(self):
        return self.quantity_received >= self.quantity_ordered

    @property
    def quantity_pending(self):
        return max(0, self.quantity_ordered - self.quantity_received)


class DepartmentInventory(models.Model):
    """Buffer stock allocated to each department"""
    DEPARTMENT_CHOICES = [
        ('HOUSEKEEPING', 'Housekeeping'),
        ('F&B', 'Food & Beverage'),
        ('MAINTENANCE', 'Maintenance'),
        ('FRONT_DESK', 'Front Desk'),
        ('ENGINEERING', 'Engineering'),
        ('LAUNDRY', 'Laundry'),
    ]

    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES)
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='department_buffers')
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Current buffer quantity')
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Minimum buffer level')
    max_stock = models.DecimalField(max_digits=10, decimal_places=2, default=100, help_text='Maximum buffer capacity')
    location = models.CharField(max_length=100, blank=True, null=True, help_text='Physical storage location in department')
    last_restocked = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['department', 'inventory_item__name']
        unique_together = ['department', 'inventory_item']
        verbose_name = 'Department Inventory'
        verbose_name_plural = 'Department Inventories'

    def __str__(self):
        return f'{self.department} - {self.inventory_item.name} ({self.current_stock})'

    @property
    def is_low_stock(self):
        """Check if department buffer is running low"""
        return self.current_stock <= self.min_stock

    @property
    def stock_status(self):
        """Get stock status for department buffer"""
        if self.is_low_stock:
            return 'Low Stock'
        elif self.current_stock >= self.max_stock:
            return 'At Capacity'
        else:
            return 'Normal'

    @property
    def suggested_restock_quantity(self):
        """Calculate suggested quantity to restock to max level"""
        return max(0, float(self.max_stock - self.current_stock))

    def can_fulfill(self, quantity):
        """Check if department has enough stock to fulfill request"""
        return self.current_stock >= quantity


class StockMovement(models.Model):
    MOVEMENT_TYPE_CHOICES = [
        ('PURCHASE', 'Purchase Order'),
        ('ADJUSTMENT', 'Stock Adjustment'),
        ('USAGE', 'Usage'),
        ('RETURN', 'Return'),
        ('WAREHOUSE_TO_DEPARTMENT', 'Warehouse to Department'),
        ('DEPARTMENT_TO_GUEST', 'Department to Guest'),
        ('DEPARTMENT_TO_WAREHOUSE', 'Department to Warehouse'),
        ('DEPARTMENT_TO_DEPARTMENT', 'Department to Department'),
    ]

    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=30, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.IntegerField()  # Can be negative for usage
    balance_after = models.PositiveIntegerField()

    # Department-related fields
    from_department = models.CharField(max_length=20, blank=True, null=True, help_text='Source department (if applicable)')
    to_department = models.CharField(max_length=20, blank=True, null=True, help_text='Destination department (if applicable)')
    department_inventory = models.ForeignKey(
        DepartmentInventory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movements',
        help_text='Related department inventory record'
    )

    reference = models.CharField(max_length=50, blank=True, null=True)  # PO number, reservation number, etc.
    notes = models.TextField(blank=True, null=True)
    movement_date = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-movement_date', '-created_at']

    def __str__(self):
        dept_info = ''
        if self.from_department and self.to_department:
            dept_info = f' ({self.from_department} → {self.to_department})'
        elif self.to_department:
            dept_info = f' (→ {self.to_department})'
        elif self.from_department:
            dept_info = f' ({self.from_department} →)'

        return f'{self.inventory_item.name} - {self.movement_type}{dept_info} ({self.quantity:+d})'


class StockOpname(models.Model):
    """Stock Opname (Physical Inventory Count) Session"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    opname_number = models.CharField(max_length=20, unique=True, editable=False)
    opname_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    location = models.CharField(max_length=100, default='Main Warehouse')
    notes = models.TextField(blank=True, null=True)

    # Tracking
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='opnames_created')
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='opnames_completed')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Summary fields (calculated)
    total_items_counted = models.PositiveIntegerField(default=0)
    total_discrepancies = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-opname_date', '-created_at']
        verbose_name = 'Stock Opname'
        verbose_name_plural = 'Stock Opnames'

    def __str__(self):
        return f'{self.opname_number} - {self.opname_date} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.opname_number:
            # Generate opname number: OPN-YYYY-NNNN
            year = timezone.now().year
            last_opname = StockOpname.objects.filter(
                opname_number__startswith=f'OPN-{year}-'
            ).order_by('-opname_number').first()

            if last_opname:
                last_num = int(last_opname.opname_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1

            self.opname_number = f'OPN-{year}-{new_num:04d}'

        super().save(*args, **kwargs)

    def calculate_summary(self):
        """Calculate summary statistics"""
        from django.db.models import Q
        items = self.items.all()
        self.total_items_counted = items.filter(counted_stock__isnull=False).count()
        self.total_discrepancies = items.filter(~Q(difference=0)).count()
        self.save(update_fields=['total_items_counted', 'total_discrepancies'])

    def get_total_discrepancy_value(self):
        """Calculate total value of discrepancies"""
        total = 0
        for item in self.items.all():
            if item.difference:
                total += abs(item.difference * item.inventory_item.unit_price)
        return total


class StockOpnameItem(models.Model):
    """Individual item in a Stock Opname session"""
    stock_opname = models.ForeignKey(StockOpname, on_delete=models.CASCADE, related_name='items')
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)

    # Stock levels
    system_stock = models.PositiveIntegerField(help_text='Stock in system at start of opname')
    counted_stock = models.PositiveIntegerField(null=True, blank=True, help_text='Physical count')
    difference = models.IntegerField(default=0, help_text='Counted - System')

    # Details
    reason = models.TextField(blank=True, null=True, help_text='Reason for discrepancy')
    counted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='opname_items_counted')
    counted_at = models.DateTimeField(null=True, blank=True)

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['inventory_item__name']
        unique_together = ['stock_opname', 'inventory_item']

    def __str__(self):
        return f'{self.stock_opname.opname_number} - {self.inventory_item.name}'

    def save(self, *args, **kwargs):
        # Calculate difference when counted_stock is set
        if self.counted_stock is not None:
            self.difference = self.counted_stock - self.system_stock
            if not self.counted_at:
                self.counted_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def has_discrepancy(self):
        """Check if there's a discrepancy"""
        return self.difference != 0

    @property
    def discrepancy_value(self):
        """Calculate value of discrepancy"""
        if self.difference:
            return abs(self.difference * self.inventory_item.unit_price)
        return 0

    @property
    def discrepancy_percentage(self):
        """Calculate percentage discrepancy"""
        if self.system_stock > 0:
            return (self.difference / self.system_stock) * 100
        return 0