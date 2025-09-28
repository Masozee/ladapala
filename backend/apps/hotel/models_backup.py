from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from decimal import Decimal


# Room Models
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
    ROOM_STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('RESERVED', 'Reserved'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('OUT_OF_ORDER', 'Out of Order'),
    ]

    number = models.CharField(max_length=20, unique=True)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE)
    floor = models.IntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=ROOM_STATUS_CHOICES,
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


# Guest Models
class Guest(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    ID_TYPE_CHOICES = [
        ('passport', 'Passport'),
        ('national_id', 'National ID'),
        ('driving_license', 'Driving License'),
    ]

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    nationality = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    id_type = models.CharField(max_length=20, choices=ID_TYPE_CHOICES, default='passport')
    id_number = models.CharField(max_length=50, null=True, blank=True)
    is_vip = models.BooleanField(default=False)
    loyalty_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'


# Reservation Models
class Reservation(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    ]

    BOOKING_SOURCE_CHOICES = [
        ('DIRECT', 'Direct Booking'),
        ('ONLINE', 'Online'),
        ('PHONE', 'Phone'),
        ('EMAIL', 'Email'),
        ('WALK_IN', 'Walk-in'),
        ('TRAVEL_AGENT', 'Travel Agent'),
    ]

    reservation_number = models.CharField(max_length=20, unique=True)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True)
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    adults = models.PositiveIntegerField(default=1)
    children = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    booking_source = models.CharField(max_length=20, choices=BOOKING_SOURCE_CHOICES, default='DIRECT')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    special_requests = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Reservation {self.reservation_number} - {self.guest.full_name}'

    def save(self, *args, **kwargs):
        if not self.reservation_number:
            from django.utils import timezone
            import random
            timestamp = timezone.now().strftime('%Y%m%d')
            random_num = random.randint(1000, 9999)
            self.reservation_number = f'RES{timestamp}{random_num}'
        super().save(*args, **kwargs)

    @property
    def nights(self):
        """Calculate number of nights"""
        return (self.check_out_date - self.check_in_date).days

    def calculate_total_amount(self):
        """Calculate total amount based on room price and nights"""
        if self.room:
            return self.room.get_current_price() * self.nights
        return Decimal('0.00')


# Payment Models
class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('CREDIT_CARD', 'Credit Card'),
        ('DEBIT_CARD', 'Debit Card'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('DIGITAL_WALLET', 'Digital Wallet'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f'Payment {self.id} - {self.reservation.reservation_number}'


# Complaint Models
class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('SERVICE', 'Service'),
        ('ROOM', 'Room'),
        ('FACILITY', 'Facility'),
        ('BILLING', 'Billing'),
        ('FOOD', 'Food & Beverage'),
        ('CLEANLINESS', 'Cleanliness'),
        ('NOISE', 'Noise'),
        ('OTHER', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    complaint_number = models.CharField(max_length=20, unique=True)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, null=True, blank=True)
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    title = models.CharField(max_length=200)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Complaint {self.complaint_number} - {self.title}'

    def save(self, *args, **kwargs):
        if not self.complaint_number:
            from django.utils import timezone
            import random
            timestamp = timezone.now().strftime('%Y%m%d')
            random_num = random.randint(100, 999)
            self.complaint_number = f'CMP{timestamp}{random_num}'
        super().save(*args, **kwargs)


# Check-in Models
class CheckIn(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CHECKED_IN', 'Checked In'),
        ('CANCELLED', 'Cancelled'),
    ]

    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE)
    actual_check_in_time = models.DateTimeField(null=True, blank=True)
    early_check_in = models.BooleanField(default=False)
    late_check_in = models.BooleanField(default=False)
    additional_guests = models.PositiveIntegerField(default=0)
    special_requests_fulfilled = models.TextField(blank=True, null=True)
    room_key_issued = models.BooleanField(default=False)
    deposit_collected = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Check-in for {self.reservation.reservation_number}'


# Calendar/Holiday Models
class Holiday(models.Model):
    HOLIDAY_TYPE_CHOICES = [
        ('NATIONAL', 'National Holiday'),
        ('RELIGIOUS', 'Religious Holiday'),
        ('REGIONAL', 'Regional Holiday'),
        ('OBSERVANCE', 'Observance'),
    ]

    name = models.CharField(max_length=200)
    name_id = models.CharField(max_length=200, help_text="Indonesian name")
    date = models.DateField()
    holiday_type = models.CharField(max_length=20, choices=HOLIDAY_TYPE_CHOICES, default='NATIONAL')
    description = models.TextField(blank=True, null=True)
    is_work_day = models.BooleanField(default=False, help_text="If True, this is a working day replacement")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']
        verbose_name = 'Holiday'
        verbose_name_plural = 'Holidays'
        unique_together = ['date', 'name']

    def __str__(self):
        return f"{self.name} - {self.date.strftime('%Y-%m-%d')}"

    @property
    def is_today(self):
        """Check if holiday is today"""
        from django.utils import timezone
        return self.date == timezone.now().date()

    @property
    def is_this_month(self):
        """Check if holiday is in current month"""
        from django.utils import timezone
        now = timezone.now().date()
        return self.date.year == now.year and self.date.month == now.month


# Inventory Models
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