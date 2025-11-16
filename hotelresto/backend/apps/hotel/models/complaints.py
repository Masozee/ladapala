from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .guests import Guest
from .reservations import Reservation
from .rooms import Room


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

    TEAM_CHOICES = [
        ('ENGINEERING', 'Engineering/Maintenance'),
        ('HOUSEKEEPING', 'Cleaning/Housekeeping'),
        ('FRONT_DESK', 'Front Desk'),
        ('FOOD_BEVERAGE', 'Food & Beverage'),
        ('MANAGEMENT', 'Management'),
    ]

    complaint_number = models.CharField(max_length=20, unique=True)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, null=True, blank=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    title = models.CharField(max_length=200)
    description = models.TextField()
    incident_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    assigned_team = models.CharField(max_length=20, choices=TEAM_CHOICES, null=True, blank=True)
    resolution = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Complaint {self.complaint_number} - {self.title}'

    @property
    def is_escalated(self):
        """Check if complaint is escalated (HIGH or URGENT priority and not resolved)"""
        return self.priority in ['HIGH', 'URGENT'] and self.status not in ['RESOLVED', 'CLOSED']

    @property
    def is_overdue(self):
        """
        Check if complaint is overdue based on SLA:
        - URGENT: 4 hours
        - HIGH: 24 hours
        - MEDIUM: 48 hours
        - LOW: 72 hours
        """
        if self.status in ['RESOLVED', 'CLOSED']:
            return False

        sla_hours = {
            'URGENT': 4,
            'HIGH': 24,
            'MEDIUM': 48,
            'LOW': 72
        }

        hours = sla_hours.get(self.priority, 48)
        deadline = self.created_at + timedelta(hours=hours)
        return timezone.now() > deadline

    @property
    def follow_up_required(self):
        """Check if follow-up is required (complaint is IN_PROGRESS for more than 24 hours)"""
        if self.status != 'IN_PROGRESS':
            return False

        follow_up_threshold = self.created_at + timedelta(hours=24)
        return timezone.now() > follow_up_threshold

    @property
    def response_time(self):
        """Calculate response time in minutes (time from creation to first status change)"""
        if self.status == 'OPEN':
            return None

        # This is a simplified version - in production you'd track status changes
        if self.resolved_at:
            delta = self.resolved_at - self.created_at
            return int(delta.total_seconds() / 60)

        return None

    def save(self, *args, **kwargs):
        if not self.complaint_number:
            from django.utils import timezone
            import random
            timestamp = timezone.now().strftime('%Y%m%d')
            random_num = random.randint(100, 999)
            self.complaint_number = f'CMP{timestamp}{random_num}'
        super().save(*args, **kwargs)


class ComplaintImage(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='complaints/%Y/%m/%d/')
    caption = models.CharField(max_length=200, null=True, blank=True)
    is_evidence = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Image for {self.complaint.complaint_number}'