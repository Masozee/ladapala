from django.db import models
from django.conf import settings
from django.utils import timezone
from .rooms import Room
from .inventory import InventoryItem
import random


class HousekeepingTask(models.Model):
    STATUS_CHOICES = [
        ('DIRTY', 'Needs Cleaning'),
        ('CLEANING', 'In Progress'),
        ('INSPECTING', 'Inspection'),
        ('CLEAN', 'Ready'),
        ('OUT_OF_ORDER', 'Out of Order'),
        ('MAINTENANCE', 'Maintenance'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    TASK_TYPE_CHOICES = [
        ('CHECKOUT_CLEANING', 'Checkout Cleaning'),
        ('STAYOVER_CLEANING', 'Stayover Cleaning'),
        ('DEEP_CLEANING', 'Deep Cleaning'),
        ('TURNDOWN_SERVICE', 'Turndown Service'),
        ('MAINTENANCE', 'Maintenance'),
    ]

    task_number = models.CharField(max_length=20, unique=True, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='housekeeping_tasks')
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES, default='CHECKOUT_CLEANING')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DIRTY')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')

    # Staff assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_housekeeping_tasks'
    )
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inspected_tasks'
    )

    # Timeline
    scheduled_date = models.DateField(default=timezone.now)
    estimated_duration_minutes = models.PositiveIntegerField(default=60)
    actual_start_time = models.DateTimeField(null=True, blank=True)
    completion_time = models.DateTimeField(null=True, blank=True)
    estimated_completion = models.DateTimeField(null=True, blank=True)

    # Guest information
    guest_checkout = models.DateTimeField(null=True, blank=True)
    next_guest_checkin = models.DateTimeField(null=True, blank=True)

    # Task details
    notes = models.TextField(blank=True, null=True)
    guest_requests = models.JSONField(default=list, blank=True)
    maintenance_issues = models.JSONField(default=list, blank=True)

    # Inspection
    inspection_passed = models.BooleanField(null=True, blank=True)
    inspection_notes = models.TextField(blank=True, null=True)
    inspection_time = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_housekeeping_tasks'
    )

    class Meta:
        ordering = ['-scheduled_date', '-priority', 'room__number']
        verbose_name = 'Housekeeping Task'
        verbose_name_plural = 'Housekeeping Tasks'
        indexes = [
            models.Index(fields=['status', 'scheduled_date']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['room', 'scheduled_date']),
        ]

    def __str__(self):
        return f'{self.task_number} - Room {self.room.number} ({self.get_status_display()})'

    def save(self, *args, **kwargs):
        if not self.task_number:
            self.task_number = self.generate_task_number()
        super().save(*args, **kwargs)

    def generate_task_number(self):
        """Generate unique task number: HK-YYYYMMDD-XXXX"""
        today = timezone.now()
        date_str = today.strftime('%Y%m%d')

        # Try up to 100 times to generate a unique number
        for _ in range(100):
            random_suffix = random.randint(1000, 9999)
            potential_number = f'HK-{date_str}-{random_suffix}'

            if not HousekeepingTask.objects.filter(task_number=potential_number).exists():
                return potential_number

        # Fallback: use timestamp
        return f'HK-{date_str}-{int(today.timestamp())}'

    @property
    def duration_minutes(self):
        """Calculate actual duration if task is completed"""
        if self.actual_start_time and self.completion_time:
            duration = self.completion_time - self.actual_start_time
            return int(duration.total_seconds() / 60)
        return self.estimated_duration_minutes

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.estimated_completion and self.status not in ['CLEAN', 'OUT_OF_ORDER']:
            return timezone.now() > self.estimated_completion
        return False

    @property
    def time_until_deadline(self):
        """Calculate time until deadline in hours"""
        if self.estimated_completion:
            diff = self.estimated_completion - timezone.now()
            return int(diff.total_seconds() / 3600)
        return None

    def start_task(self, user=None):
        """Mark task as started"""
        if self.status == 'DIRTY':
            self.status = 'CLEANING'
            self.actual_start_time = timezone.now()
            if user:
                self.assigned_to = user
            self.save()

    def complete_task(self):
        """Mark task as completed and ready for inspection"""
        if self.status == 'CLEANING':
            self.status = 'INSPECTING'
            self.completion_time = timezone.now()
            self.save()

    def pass_inspection(self, inspector, notes=None):
        """Mark inspection as passed"""
        self.status = 'CLEAN'
        self.inspection_passed = True
        self.inspector = inspector
        self.inspection_notes = notes
        self.inspection_time = timezone.now()
        self.save()

    def fail_inspection(self, inspector, notes):
        """Mark inspection as failed"""
        self.status = 'CLEANING'
        self.inspection_passed = False
        self.inspector = inspector
        self.inspection_notes = notes
        self.inspection_time = timezone.now()
        self.save()


class AmenityUsage(models.Model):
    """Track amenity usage and automatic stock deduction"""

    housekeeping_task = models.ForeignKey(
        HousekeepingTask,
        on_delete=models.CASCADE,
        related_name='amenity_usages'
    )
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='usage_records'
    )
    quantity_used = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    stock_deducted = models.BooleanField(default=False)

    class Meta:
        ordering = ['-recorded_at']
        verbose_name = 'Amenity Usage'
        verbose_name_plural = 'Amenity Usages'
        indexes = [
            models.Index(fields=['housekeeping_task', 'inventory_item']),
            models.Index(fields=['recorded_at']),
        ]

    def __str__(self):
        return f'{self.inventory_item.name} x{self.quantity_used} - {self.housekeeping_task.task_number}'

    def save(self, *args, **kwargs):
        """Automatically deduct stock when amenity usage is recorded"""
        is_new = self.pk is None

        if is_new and not self.stock_deducted:
            # Deduct from inventory
            if self.inventory_item.current_stock >= self.quantity_used:
                self.inventory_item.current_stock -= self.quantity_used
                self.inventory_item.save()
                self.stock_deducted = True
            else:
                # Log warning but still save the record
                print(f'WARNING: Insufficient stock for {self.inventory_item.name}. '
                      f'Available: {self.inventory_item.current_stock}, Required: {self.quantity_used}')

        super().save(*args, **kwargs)

    @property
    def total_cost(self):
        """Calculate total cost of amenities used"""
        return self.inventory_item.unit_price * self.quantity_used
