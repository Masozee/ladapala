from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal


class RoomType(models.Model):
    ROOM_CATEGORY_CHOICES = [
        ('GUEST_ROOM', 'Guest Room'),
        ('EVENT_SPACE', 'Event Space (Ballroom/Meeting Room)'),
    ]

    BED_CONFIGURATION_CHOICES = [
        ('1_KING', '1 King Bed'),
        ('2_TWIN', '2 Twin Beds'),
        ('1_KING_SOFA', '1 King Bed + Sofa Bed'),
        ('1_KING_2_TWIN', '1 King Bed + 2 Twin Beds'),
        ('2_QUEEN', '2 Queen Beds'),
        ('1_QUEEN', '1 Queen Bed'),
        ('1_QUEEN_SOFA', '1 Queen Bed + Sofa Bed'),
        ('N/A', 'N/A (Event Space)'),
    ]

    SEATING_ARRANGEMENT_CHOICES = [
        ('THEATER', 'Theater Style'),
        ('CLASSROOM', 'Classroom Style'),
        ('BANQUET', 'Banquet/Round Tables'),
        ('U_SHAPE', 'U-Shape'),
        ('BOARDROOM', 'Boardroom'),
        ('COCKTAIL', 'Cocktail/Standing'),
        ('MIXED', 'Mixed Arrangement'),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    room_category = models.CharField(
        max_length=20,
        choices=ROOM_CATEGORY_CHOICES,
        default='GUEST_ROOM',
        help_text='Type of room: Guest Room or Event Space'
    )
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    max_occupancy = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Max guests for guest rooms, or max capacity for event spaces'
    )
    size_sqm = models.FloatField(null=True, blank=True)
    amenities = models.TextField(blank=True, null=True)

    # For Guest Rooms
    bed_configuration = models.CharField(
        max_length=20,
        choices=BED_CONFIGURATION_CHOICES,
        default='1_KING',
        blank=True,
        null=True,
        help_text='Bed type (only for Guest Rooms)'
    )

    # For Event Spaces (Ballrooms)
    seating_arrangement = models.CharField(
        max_length=20,
        choices=SEATING_ARRANGEMENT_CHOICES,
        blank=True,
        null=True,
        help_text='Seating arrangement (only for Event Spaces)'
    )

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


class RoomTypeImage(models.Model):
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='room_images')
    image = models.ImageField(upload_to='room_types/')
    caption = models.CharField(max_length=200, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'created_at']
        verbose_name = 'Room Type Image'
        verbose_name_plural = 'Room Type Images'

    def __str__(self):
        return f'{self.room_type.name} - Image {self.id}'


class Room(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('RESERVED', 'Reserved'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('CLEANING', 'Cleaning'),
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