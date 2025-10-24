from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal


class RoomType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    base_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    max_occupancy = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    size_sqm = models.FloatField(null=True, blank=True)
    amenities = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Room Type'
        verbose_name_plural = 'Room Types'

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.base_price and self.base_price <= 0:
            raise ValidationError('Base price must be positive')
        if self.max_occupancy and self.max_occupancy <= 0:
            raise ValidationError('Max occupancy must be positive')


class Room(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('RESERVED', 'Reserved'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('OUT_OF_ORDER', 'Out of Order'),
    ]

    number = models.CharField(max_length=20, unique=True)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rooms')
    floor = models.IntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='AVAILABLE'
    )
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['number']
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'

    def __str__(self):
        return f'Room {self.number} - {self.room_type.name}'

    def clean(self):
        super().clean()
        if not self.number:
            raise ValidationError('Room number is required')

    def is_available(self):
        """Check if room is available for booking"""
        return self.status == 'AVAILABLE' and self.is_active

    def get_current_price(self):
        """Get current room price (base price for now)"""
        return self.room_type.base_price