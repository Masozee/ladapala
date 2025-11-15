"""
Wake Up Call Model
Manage wake up call requests for guests
"""
from django.db import models
from django.utils import timezone
from .reservations import Reservation
from .rooms import Room


class WakeUpCall(models.Model):
    """Wake up call requests from guests"""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('MISSED', 'Missed'),
        ('CANCELLED', 'Cancelled'),
    ]

    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='wake_up_calls',
        null=True,
        blank=True,
        help_text='Associated reservation'
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='wake_up_calls',
        help_text='Room number for the wake up call'
    )
    guest_name = models.CharField(
        max_length=200,
        help_text='Guest name'
    )
    call_date = models.DateField(
        help_text='Date of the wake up call'
    )
    call_time = models.TimeField(
        help_text='Time for the wake up call'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    notes = models.TextField(
        blank=True,
        help_text='Special instructions or notes'
    )
    requested_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='wake_up_calls_requested',
        help_text='Staff who created the request'
    )
    completed_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wake_up_calls_completed',
        help_text='Staff who completed the call'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the call was completed'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['call_date', 'call_time']
        indexes = [
            models.Index(fields=['call_date', 'call_time']),
            models.Index(fields=['status', 'call_date']),
            models.Index(fields=['room', 'call_date']),
        ]

    def __str__(self):
        return f"Wake up call - Room {self.room.number} at {self.call_time.strftime('%H:%M')} on {self.call_date}"

    @property
    def is_today(self):
        """Check if wake up call is scheduled for today"""
        return self.call_date == timezone.now().date()

    @property
    def is_upcoming(self):
        """Check if wake up call is in the future"""
        now = timezone.now()
        call_datetime = timezone.make_aware(
            timezone.datetime.combine(self.call_date, self.call_time)
        )
        return call_datetime > now and self.status == 'PENDING'

    @property
    def is_overdue(self):
        """Check if wake up call time has passed but not completed"""
        now = timezone.now()
        call_datetime = timezone.make_aware(
            timezone.datetime.combine(self.call_date, self.call_time)
        )
        return call_datetime < now and self.status == 'PENDING'

    def mark_completed(self, user):
        """Mark wake up call as completed"""
        self.status = 'COMPLETED'
        self.completed_by = user
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_by', 'completed_at'])

    def mark_missed(self):
        """Mark wake up call as missed"""
        self.status = 'MISSED'
        self.save(update_fields=['status'])

    def mark_cancelled(self):
        """Mark wake up call as cancelled"""
        self.status = 'CANCELLED'
        self.save(update_fields=['status'])
