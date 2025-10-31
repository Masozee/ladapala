from django.db import models
from django.conf import settings
from django.utils import timezone
from .rooms import Room
from .guests import Guest
import random


class AmenityCategory(models.Model):
    """Categories for amenity items"""
    CATEGORY_CHOICES = [
        ('FOOD_BEVERAGE', 'Food & Beverage'),
        ('TOILETRIES', 'Toiletries & Bath'),
        ('BEVERAGE', 'Beverages'),
        ('LAUNDRY', 'Laundry & Cleaning'),
        ('TECHNOLOGY', 'Technology'),
        ('FLOWERS', 'Flowers & Decor'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_name']
        verbose_name = 'Amenity Category'
        verbose_name_plural = 'Amenity Categories'

    def __str__(self):
        return self.display_name


class AmenityRequest(models.Model):
    """Guest amenity and service requests"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    # Request identification
    request_number = models.CharField(max_length=20, unique=True, editable=False)

    # Guest and room information
    guest = models.ForeignKey(
        Guest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amenity_requests'
    )
    guest_name = models.CharField(max_length=200)
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amenity_requests'
    )
    room_number = models.CharField(max_length=10)

    # Request details
    category = models.ForeignKey(
        AmenityCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='requests'
    )
    inventory_item = models.ForeignKey(
        'InventoryItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amenity_requests',
        help_text='Link to warehouse inventory item for automatic stock deduction'
    )
    item = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)

    # Status and priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')

    # Timing
    requested_at = models.DateTimeField(default=timezone.now)
    delivery_time = models.CharField(max_length=50, blank=True, null=True)  # "ASAP", "15:00", etc.
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_amenity_requests'
    )
    assigned_to_department = models.CharField(max_length=100, blank=True, null=True)

    # Additional information
    special_instructions = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Completion feedback
    guest_rating = models.PositiveIntegerField(null=True, blank=True)  # 1-5 stars
    guest_feedback = models.TextField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_amenity_requests'
    )
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_amenity_requests'
    )

    class Meta:
        ordering = ['-requested_at']
        verbose_name = 'Amenity Request'
        verbose_name_plural = 'Amenity Requests'
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['room', 'status']),
            models.Index(fields=['requested_at']),
        ]

    def __str__(self):
        return f'{self.request_number} - {self.guest_name} (Room {self.room_number})'

    def save(self, *args, **kwargs):
        if not self.request_number:
            self.request_number = self.generate_request_number()
        super().save(*args, **kwargs)

    def generate_request_number(self):
        """Generate unique request number: AMN-YYYYMMDD-XXXX"""
        today = timezone.now()
        date_str = today.strftime('%Y%m%d')

        # Try up to 100 times to generate a unique number
        for _ in range(100):
            random_suffix = random.randint(1000, 9999)
            potential_number = f'AMN-{date_str}-{random_suffix}'

            if not AmenityRequest.objects.filter(request_number=potential_number).exists():
                return potential_number

        # Fallback: use timestamp
        return f'AMN-{date_str}-{int(today.timestamp())}'

    @property
    def is_urgent(self):
        """Check if request is urgent"""
        return self.priority == 'URGENT'

    @property
    def is_overdue(self):
        """Check if request is overdue based on delivery time"""
        if self.status in ['COMPLETED', 'CANCELLED']:
            return False

        if self.delivery_time and self.delivery_time != 'ASAP':
            try:
                # Parse time like "15:00"
                from datetime import datetime, time
                delivery_time = datetime.strptime(self.delivery_time, '%H:%M').time()
                delivery_datetime = timezone.make_aware(
                    datetime.combine(self.requested_at.date(), delivery_time)
                )
                return timezone.now() > delivery_datetime
            except:
                pass

        return False

    def mark_in_progress(self, user=None):
        """Mark request as in progress"""
        self.status = 'IN_PROGRESS'
        if user:
            self.assigned_to = user
        self.save()

    def mark_completed(self, user=None):
        """Mark request as completed and deduct stock if linked to inventory"""
        from .inventory import StockMovement

        self.status = 'COMPLETED'
        self.delivered_at = timezone.now()
        if user:
            self.completed_by = user
        self.save()

        # Auto-deduct stock if linked to inventory item
        if self.inventory_item:
            inventory_item = self.inventory_item

            # Check if sufficient stock
            if inventory_item.current_stock >= self.quantity:
                # Deduct stock
                inventory_item.current_stock -= self.quantity
                inventory_item.save(update_fields=['current_stock', 'updated_at'])

                # Create stock movement record
                StockMovement.objects.create(
                    inventory_item=inventory_item,
                    movement_type='USAGE',
                    quantity=-self.quantity,  # Negative for deduction
                    balance_after=inventory_item.current_stock,
                    reference=self.request_number,
                    notes=f'Amenity request delivered: {self.item} to Room {self.room_number}',
                    movement_date=timezone.now(),
                    created_by=user
                )

    def mark_cancelled(self):
        """Mark request as cancelled"""
        self.status = 'CANCELLED'
        self.save()
