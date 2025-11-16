from django.db import models
from django.conf import settings
from .guests import Guest
from .rooms import Room


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


# Future Calendar Event Models can be added here
class CalendarEvent(models.Model):
    """
    Future model for calendar events that could include:
    - Hotel maintenance schedules
    - Special events
    - Room cleaning schedules
    - Guest activities
    - Staff meetings
    """
    EVENT_TYPE_CHOICES = [
        ('MAINTENANCE', 'Maintenance'),
        ('CLEANING', 'Cleaning'),
        ('EVENT', 'Special Event'),
        ('MEETING', 'Meeting'),
        ('ACTIVITY', 'Guest Activity'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='OTHER')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    location = models.CharField(max_length=200, blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_datetime']
        verbose_name = 'Calendar Event'
        verbose_name_plural = 'Calendar Events'

    def __str__(self):
        return f'{self.title} - {self.start_datetime.strftime("%Y-%m-%d %H:%M")}'

    @property
    def duration_hours(self):
        """Calculate event duration in hours"""
        if self.start_datetime and self.end_datetime:
            duration = self.end_datetime - self.start_datetime
            return duration.total_seconds() / 3600
        return 0