from django.db import models
from django.conf import settings
from decimal import Decimal
from .guests import Guest
from .rooms import Room


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
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
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