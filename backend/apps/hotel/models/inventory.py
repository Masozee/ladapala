from django.db import models


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
    supplier = models.CharField(max_length=100, blank=True, null=True)
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