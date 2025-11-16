from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from .rooms import Room
from .guests import Guest


class MaintenanceRequest(models.Model):
    CATEGORY_CHOICES = [
        ('HVAC', 'HVAC'),
        ('Electrical', 'Electrical'),
        ('Plumbing', 'Plumbing'),
        ('Elevator', 'Elevator'),
        ('IT/Network', 'IT/Network'),
        ('General', 'General'),
        ('Security', 'Security'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('SUBMITTED', 'Submitted'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    SOURCE_CHOICES = [
        ('GUEST_REQUEST', 'Guest Request'),
        ('STAFF_REPORT', 'Staff Report'),
        ('PREVENTIVE', 'Preventive Maintenance'),
        ('INSPECTION', 'Inspection'),
        ('EMERGENCY', 'Emergency'),
    ]

    request_number = models.CharField(max_length=20, unique=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True)
    guest = models.ForeignKey(Guest, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='STAFF_REPORT')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Technician details
    assigned_technician = models.CharField(max_length=100, null=True, blank=True)
    technician_notes = models.TextField(null=True, blank=True)
    
    # Timing
    requested_date = models.DateTimeField(default=timezone.now)
    acknowledged_date = models.DateTimeField(null=True, blank=True)
    started_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    # Cost tracking
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Parts tracking
    parts_needed = models.JSONField(default=list, blank=True, help_text="List of parts needed with source info")

    # Performance metrics
    customer_satisfaction = models.FloatField(null=True, blank=True)  # 1-5 rating

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Maintenance {self.request_number} - {self.title}'

    @property
    def resolution_time_hours(self):
        """Calculate resolution time in hours"""
        if self.completed_date and self.requested_date:
            delta = self.completed_date - self.requested_date
            return round(delta.total_seconds() / 3600, 1)
        return None

    @property
    def efficiency_score(self):
        """Calculate efficiency score based on resolution time and satisfaction"""
        if not self.resolution_time_hours or not self.customer_satisfaction:
            return None
        
        # Target resolution times by category (hours)
        target_times = {
            'URGENT': 2,
            'HIGH': 8,
            'MEDIUM': 24,
            'LOW': 72
        }
        
        target = target_times.get(self.priority, 24)
        time_efficiency = min(100, (target / max(self.resolution_time_hours, 0.1)) * 100)
        satisfaction_score = (self.customer_satisfaction / 5) * 100
        
        return round((time_efficiency * 0.6 + satisfaction_score * 0.4), 1)

    def save(self, *args, **kwargs):
        if not self.request_number:
            import random
            while True:
                timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
                random_num = random.randint(100, 999)
                potential_number = f'MNT{timestamp}{random_num}'
                if not MaintenanceRequest.objects.filter(request_number=potential_number).exists():
                    self.request_number = potential_number
                    break
        super().save(*args, **kwargs)


class MaintenanceTechnician(models.Model):
    name = models.CharField(max_length=100)
    specializations = models.JSONField(default=list)  # List of categories they handle
    contact_number = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def total_requests_completed(self):
        """Get total completed requests for this technician"""
        return MaintenanceRequest.objects.filter(
            assigned_technician=self.name,
            status='COMPLETED'
        ).count()

    @property
    def average_resolution_time(self):
        """Get average resolution time for completed requests"""
        completed_requests = MaintenanceRequest.objects.filter(
            assigned_technician=self.name,
            status='COMPLETED',
            completed_date__isnull=False
        )
        
        if not completed_requests.exists():
            return None
            
        total_hours = 0
        count = 0
        
        for request in completed_requests:
            if request.resolution_time_hours:
                total_hours += request.resolution_time_hours
                count += 1
        
        return round(total_hours / count, 1) if count > 0 else None

    @property
    def average_efficiency_score(self):
        """Get average efficiency score"""
        completed_requests = MaintenanceRequest.objects.filter(
            assigned_technician=self.name,
            status='COMPLETED'
        )
        
        scores = [req.efficiency_score for req in completed_requests if req.efficiency_score]
        return round(sum(scores) / len(scores), 1) if scores else None

    @property
    def average_customer_satisfaction(self):
        """Get average customer satisfaction rating"""
        completed_requests = MaintenanceRequest.objects.filter(
            assigned_technician=self.name,
            status='COMPLETED',
            customer_satisfaction__isnull=False
        )

        if not completed_requests.exists():
            return None

        total_rating = sum(req.customer_satisfaction for req in completed_requests)
        return round(total_rating / completed_requests.count(), 1)


class WarehouseItem(models.Model):
    """Inventory items available in warehouse for maintenance"""
    UNIT_CHOICES = [
        ('PCS', 'Pieces'),
        ('SET', 'Sets'),
        ('BOX', 'Boxes'),
        ('ROLL', 'Rolls'),
        ('METER', 'Meters'),
        ('LITER', 'Liters'),
        ('KG', 'Kilograms'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=50, null=True, blank=True)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='PCS')
    quantity = models.IntegerField(default=0)
    minimum_stock = models.IntegerField(default=5, help_text="Minimum stock level before reorder")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    location = models.CharField(max_length=100, null=True, blank=True, help_text="Warehouse location/shelf")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Warehouse Item'
        verbose_name_plural = 'Warehouse Items'

    def __str__(self):
        return f"{self.name} ({self.code}) - Stock: {self.quantity}"

    @property
    def is_low_stock(self):
        """Check if item is below minimum stock level"""
        return self.quantity <= self.minimum_stock

    def deduct_stock(self, quantity):
        """Deduct stock and validate"""
        if quantity > self.quantity:
            raise ValidationError(f"Insufficient stock. Available: {self.quantity}, Requested: {quantity}")
        self.quantity -= quantity
        self.save(update_fields=['quantity', 'updated_at'])

    def add_stock(self, quantity):
        """Add stock"""
        self.quantity += quantity
        self.save(update_fields=['quantity', 'updated_at'])


class MaintenancePartUsed(models.Model):
    """Track parts used in maintenance requests"""
    SOURCE_CHOICES = [
        ('WAREHOUSE', 'Warehouse Stock'),
        ('VENDOR', 'External Vendor'),
    ]

    maintenance_request = models.ForeignKey(
        MaintenanceRequest,
        on_delete=models.CASCADE,
        related_name='parts_used'
    )
    warehouse_item = models.ForeignKey(
        WarehouseItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Link to warehouse item if from stock"
    )

    part_name = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='WAREHOUSE')
    vendor_name = models.CharField(max_length=200, null=True, blank=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    used_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-used_at']
        verbose_name = 'Maintenance Part Used'
        verbose_name_plural = 'Maintenance Parts Used'

    def __str__(self):
        return f"{self.part_name} x{self.quantity} - {self.maintenance_request.request_number}"

    def save(self, *args, **kwargs):
        """Calculate total cost and deduct from warehouse if applicable"""
        self.total_cost = self.unit_cost * self.quantity

        # If this is a new record and source is warehouse, deduct stock
        if not self.pk and self.source == 'WAREHOUSE' and self.warehouse_item:
            self.warehouse_item.deduct_stock(self.quantity)

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Return stock to warehouse if deleted"""
        if self.source == 'WAREHOUSE' and self.warehouse_item:
            self.warehouse_item.add_stock(self.quantity)
        super().delete(*args, **kwargs)