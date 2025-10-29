from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
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

    # Late checkout fields
    late_checkout_requested = models.BooleanField(default=False)
    late_checkout_approved = models.BooleanField(default=False)
    requested_checkout_time = models.DateTimeField(null=True, blank=True)
    approved_checkout_time = models.DateTimeField(null=True, blank=True)
    actual_checkout_time = models.DateTimeField(null=True, blank=True)
    late_checkout_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    late_checkout_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_late_checkouts'
    )
    late_checkout_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Check-in for {self.reservation.reservation_number}'

    @property
    def is_late_checkout(self):
        """Check if this is a late checkout based on actual checkout time"""
        if self.actual_checkout_time and self.reservation:
            # Standard checkout time is usually 12:00 PM
            from django.utils import timezone
            standard_checkout = timezone.datetime.combine(
                self.reservation.check_out_date,
                timezone.datetime.min.time().replace(hour=12, minute=0)
            )
            standard_checkout = timezone.make_aware(standard_checkout)
            return self.actual_checkout_time > standard_checkout
        return False

    @property
    def checkout_delay_hours(self):
        """Calculate how many hours late the checkout was"""
        if self.is_late_checkout:
            from django.utils import timezone
            standard_checkout = timezone.datetime.combine(
                self.reservation.check_out_date,
                timezone.datetime.min.time().replace(hour=12, minute=0)
            )
            standard_checkout = timezone.make_aware(standard_checkout)
            delay = self.actual_checkout_time - standard_checkout
            return int(delay.total_seconds() / 3600)
        return 0