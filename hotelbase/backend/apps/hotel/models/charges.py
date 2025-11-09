from django.db import models
from django.conf import settings
from .reservations import Reservation


class AdditionalCharge(models.Model):
    """
    Track additional charges beyond room rate (early check-in, room service, etc.)
    """
    CHARGE_TYPE_CHOICES = [
        ('EARLY_CHECKIN', 'Early Check-in'),
        ('LATE_CHECKOUT', 'Late Check-out'),
        ('MINIBAR', 'Minibar'),
        ('LAUNDRY', 'Laundry'),
        ('ROOM_SERVICE', 'Room Service'),
        ('PARKING', 'Parking'),
        ('EXTRA_BED', 'Extra Bed'),
        ('BREAKFAST', 'Breakfast'),
        ('DAMAGE', 'Damage Charge'),
        ('PHONE', 'Phone Calls'),
        ('INTERNET', 'Internet/WiFi'),
        ('SPA', 'Spa Services'),
        ('AIRPORT_TRANSFER', 'Airport Transfer'),
        ('OTHER', 'Other'),
    ]

    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='additional_charges'
    )
    charge_type = models.CharField(max_length=30, choices=CHARGE_TYPE_CHOICES)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    is_paid = models.BooleanField(default=False)
    charged_at = models.DateTimeField(auto_now_add=True)
    charged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-charged_at']
        verbose_name = 'Additional Charge'
        verbose_name_plural = 'Additional Charges'

    def __str__(self):
        return f'{self.get_charge_type_display()} - {self.reservation.reservation_number} - {self.total_amount}'

    @property
    def total_amount(self):
        """Calculate total amount (quantity * amount)"""
        return self.amount * self.quantity
