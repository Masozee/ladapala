from django.db import models
from django.conf import settings
from django.utils import timezone
from .rooms import Room
from .inventory import InventoryItem
from .complaints import Complaint
import random


def get_today():
    """Return today's date for default value"""
    return timezone.now().date()


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
        ('COMPLAINT', 'Guest Complaint'),
    ]

    task_number = models.CharField(max_length=20, unique=True, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='housekeeping_tasks')
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES, default='CHECKOUT_CLEANING')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DIRTY')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')

    # Link to complaint if task is created from complaint
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, null=True, blank=True, related_name='housekeeping_tasks')

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
    scheduled_date = models.DateField(default=get_today)
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
        ordering = ['-created_at']  # Latest tasks first
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
        """Automatically deduct stock when amenity usage is recorded

        Priority:
        1. Try to deduct from HOUSEKEEPING department buffer stock
        2. If insufficient buffer stock, deduct from warehouse (main inventory)
        """
        from .inventory import DepartmentInventory, StockMovement

        is_new = self.pk is None

        if is_new and not self.stock_deducted:
            # Try to get HOUSEKEEPING department buffer stock first
            try:
                dept_stock = DepartmentInventory.objects.get(
                    department='HOUSEKEEPING',
                    inventory_item=self.inventory_item,
                    is_active=True
                )

                # Check if department buffer has enough stock
                if dept_stock.current_stock >= self.quantity_used:
                    # Deduct from department buffer stock
                    dept_stock.current_stock -= self.quantity_used
                    dept_stock.save()
                    self.stock_deducted = True

                    # Create stock movement record for tracking
                    StockMovement.objects.create(
                        inventory_item=self.inventory_item,
                        movement_type='USAGE',
                        quantity=-self.quantity_used,
                        balance_after=self.inventory_item.current_stock,  # Warehouse balance unchanged
                        reference=f'DEPT-HOUSEKEEPING-{self.housekeeping_task.task_number}',
                        notes=f'Used by housekeeping from department buffer. Task: {self.housekeeping_task.task_number}',
                        created_by=self.recorded_by
                    )
                else:
                    # Insufficient department buffer, fall back to warehouse
                    print(f'WARNING: Insufficient HOUSEKEEPING buffer stock for {self.inventory_item.name}. '
                          f'Buffer: {dept_stock.current_stock}, Required: {self.quantity_used}. '
                          f'Deducting from warehouse instead.')

                    if self.inventory_item.current_stock >= self.quantity_used:
                        self.inventory_item.current_stock -= self.quantity_used
                        self.inventory_item.save()
                        self.stock_deducted = True

                        # Create stock movement record
                        StockMovement.objects.create(
                            inventory_item=self.inventory_item,
                            movement_type='USAGE',
                            quantity=-self.quantity_used,
                            balance_after=self.inventory_item.current_stock,
                            reference=f'WAREHOUSE-{self.housekeeping_task.task_number}',
                            notes=f'Used by housekeeping from warehouse (buffer empty). Task: {self.housekeeping_task.task_number}',
                            created_by=self.recorded_by
                        )
                    else:
                        print(f'ERROR: Insufficient stock everywhere for {self.inventory_item.name}. '
                              f'Warehouse: {self.inventory_item.current_stock}, Required: {self.quantity_used}')

            except DepartmentInventory.DoesNotExist:
                # No department buffer configured, deduct from warehouse directly
                if self.inventory_item.current_stock >= self.quantity_used:
                    self.inventory_item.current_stock -= self.quantity_used
                    self.inventory_item.save()
                    self.stock_deducted = True

                    # Create stock movement record
                    StockMovement.objects.create(
                        inventory_item=self.inventory_item,
                        movement_type='USAGE',
                        quantity=-self.quantity_used,
                        balance_after=self.inventory_item.current_stock,
                        reference=f'WAREHOUSE-{self.housekeeping_task.task_number}',
                        notes=f'Used by housekeeping from warehouse (no buffer configured). Task: {self.housekeeping_task.task_number}',
                        created_by=self.recorded_by
                    )
                else:
                    print(f'ERROR: Insufficient warehouse stock for {self.inventory_item.name}. '
                          f'Available: {self.inventory_item.current_stock}, Required: {self.quantity_used}')

        super().save(*args, **kwargs)

    @property
    def total_cost(self):
        """Calculate total cost of amenities used"""
        return self.inventory_item.unit_price * self.quantity_used


class CleaningTemplate(models.Model):
    """Template defining standard items needed for different cleaning task types"""

    name = models.CharField(max_length=100, help_text='Template name (e.g., Standard Checkout Cleaning)')
    task_type = models.CharField(
        max_length=30,
        choices=HousekeepingTask.TASK_TYPE_CHOICES,
        help_text='Task type this template applies to'
    )
    room_type = models.ForeignKey(
        'RoomType',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text='Specific room type (optional - leave blank for all room types)'
    )
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['task_type', 'room_type']
        verbose_name = 'Cleaning Template'
        verbose_name_plural = 'Cleaning Templates'
        indexes = [
            models.Index(fields=['task_type', 'is_active']),
        ]

    def __str__(self):
        room_info = f" - {self.room_type.name}" if self.room_type else ""
        return f"{self.name} ({self.get_task_type_display()}{room_info})"


class CleaningTemplateItem(models.Model):
    """Individual items in a cleaning template"""

    template = models.ForeignKey(
        CleaningTemplate,
        on_delete=models.CASCADE,
        related_name='items'
    )
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        help_text='The exact inventory item needed'
    )
    quantity = models.PositiveIntegerField(default=1, help_text='Standard quantity needed')
    is_optional = models.BooleanField(default=False, help_text='Whether this item is optional')
    notes = models.TextField(blank=True, null=True, help_text='Special instructions for this item')
    sort_order = models.PositiveIntegerField(default=0, help_text='Display order')

    class Meta:
        ordering = ['sort_order', 'inventory_item__name']
        verbose_name = 'Template Item'
        verbose_name_plural = 'Template Items'
        unique_together = ['template', 'inventory_item']

    def __str__(self):
        optional = " (Optional)" if self.is_optional else ""
        return f"{self.inventory_item.name} x{self.quantity}{optional}"
