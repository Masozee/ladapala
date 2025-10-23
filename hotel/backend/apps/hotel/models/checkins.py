from django.db import models
from django.contrib.auth.models import User
from .reservations import Reservation


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
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Check-in for {self.reservation.reservation_number}'