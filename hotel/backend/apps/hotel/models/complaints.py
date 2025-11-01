from django.db import models
from django.conf import settings
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