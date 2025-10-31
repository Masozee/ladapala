from django.db import models
from django.conf import settings
from django.utils import timezone


class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('ROOM_SUPPLIES', 'Room Supplies'),
        ('CLEANING', 'Cleaning Supplies'),
        ('MAINTENANCE', 'Maintenance'),
        ('OFFICE', 'Office Supplies'),
        ('FOOD', 'Food & Beverage'),
        ('AMENITIES', 'Guest Amenities'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
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


class StockMovement(models.Model):
    MOVEMENT_TYPE_CHOICES = [
        ('PURCHASE', 'Purchase Order'),
        ('ADJUSTMENT', 'Stock Adjustment'),
        ('USAGE', 'Usage'),
        ('RETURN', 'Return'),
    ]

    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.IntegerField()  # Can be negative for usage
    balance_after = models.PositiveIntegerField()
    reference = models.CharField(max_length=50, blank=True, null=True)  # PO number, etc.
    notes = models.TextField(blank=True, null=True)
    movement_date = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-movement_date', '-created_at']

    def __str__(self):
        return f'{self.inventory_item.name} - {self.movement_type} ({self.quantity:+d})'