from django.db import models
from django.conf import settings
from django.utils import timezone
from .rooms import Room
from .guests import Guest
from .reservations import Reservation
import random


def get_today():
    """Return today's date for default value"""
    return timezone.now().date()


class LostAndFound(models.Model):
    """Track lost and found items in the hotel"""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_STORAGE', 'In Storage'),
        ('CLAIMED', 'Claimed'),
        ('DISPOSED', 'Disposed'),
        ('RETURNED_TO_GUEST', 'Returned to Guest'),
    ]

    REPORT_TYPE_CHOICES = [
        ('FOUND', 'Found Item'),
        ('LOST', 'Lost Item'),
    ]

    CATEGORY_CHOICES = [
        ('ELECTRONICS', 'Electronics'),
        ('JEWELRY', 'Jewelry'),
        ('CLOTHING', 'Clothing'),
        ('DOCUMENTS', 'Documents'),
        ('MONEY', 'Money'),
        ('KEYS', 'Keys'),
        ('ACCESSORIES', 'Accessories'),
        ('TOILETRIES', 'Toiletries'),
        ('BOOKS', 'Books'),
        ('OTHER', 'Other'),
    ]

    LOCATION_CHOICES = [
        ('ROOM', 'Guest Room'),
        ('LOBBY', 'Lobby'),
        ('RESTAURANT', 'Restaurant'),
        ('POOL', 'Pool Area'),
        ('GYM', 'Gym'),
        ('SPA', 'Spa'),
        ('PARKING', 'Parking'),
        ('HALLWAY', 'Hallway'),
        ('ELEVATOR', 'Elevator'),
        ('CONFERENCE', 'Conference Room'),
        ('OTHER', 'Other'),
    ]

    # Unique identifier
    item_number = models.CharField(max_length=20, unique=True, editable=False)

    # Item details
    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES)
    item_name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Location details
    location_type = models.CharField(max_length=20, choices=LOCATION_CHOICES)
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lost_found_items',
        help_text='Room where item was found/lost (if applicable)'
    )
    specific_location = models.CharField(
        max_length=200,
        blank=True,
        help_text='Specific location details (e.g., under bed, in bathroom)'
    )

    # Guest information
    guest = models.ForeignKey(
        Guest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lost_found_items',
        help_text='Guest who lost/found the item'
    )
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lost_found_items',
        help_text='Related reservation'
    )

    # Reporting details
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reported_lost_found_items',
        help_text='Staff member who reported the item'
    )
    reported_date = models.DateField(default=get_today)
    reported_time = models.TimeField(auto_now_add=True)
    found_date = models.DateField(
        null=True,
        blank=True,
        help_text='Date when item was actually found (may differ from report date)'
    )

    # Storage and handling
    storage_location = models.CharField(
        max_length=200,
        blank=True,
        help_text='Where the item is currently stored in office/storage'
    )
    handler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handled_lost_found_items',
        help_text='Office staff handling the item'
    )

    # Claim details
    claimed_by_name = models.CharField(max_length=200, blank=True)
    claimed_by_contact = models.CharField(max_length=100, blank=True)
    claimed_date = models.DateField(null=True, blank=True)
    claimed_time = models.TimeField(null=True, blank=True)
    claim_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_claims',
        help_text='Staff member who verified and released the item'
    )
    claim_notes = models.TextField(
        blank=True,
        help_text='Notes about claim verification process'
    )

    # Disposal details
    disposal_date = models.DateField(null=True, blank=True)
    disposal_method = models.CharField(
        max_length=200,
        blank=True,
        help_text='How the item was disposed (donated, discarded, etc.)'
    )
    disposal_notes = models.TextField(blank=True)

    # Additional information
    estimated_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Estimated value in IDR'
    )
    is_valuable = models.BooleanField(
        default=False,
        help_text='Mark if item is valuable (electronics, jewelry, money, documents)'
    )
    images = models.JSONField(
        default=list,
        blank=True,
        help_text='List of image URLs for the item'
    )
    notes = models.TextField(blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Lost and Found Item'
        verbose_name_plural = 'Lost and Found Items'
        indexes = [
            models.Index(fields=['status', 'report_type']),
            models.Index(fields=['reported_date']),
            models.Index(fields=['guest']),
            models.Index(fields=['room']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f'{self.item_number} - {self.item_name} ({self.get_status_display()})'

    def save(self, *args, **kwargs):
        if not self.item_number:
            self.item_number = self.generate_item_number()

        # Auto-mark valuable items
        if self.category in ['ELECTRONICS', 'JEWELRY', 'MONEY', 'DOCUMENTS']:
            self.is_valuable = True

        super().save(*args, **kwargs)

    def generate_item_number(self):
        """Generate unique item number: LF-YYYYMMDD-XXXX"""
        today = timezone.now()
        date_str = today.strftime('%Y%m%d')

        # Try up to 100 times to generate a unique number
        for _ in range(100):
            random_suffix = random.randint(1000, 9999)
            potential_number = f'LF-{date_str}-{random_suffix}'

            if not LostAndFound.objects.filter(item_number=potential_number).exists():
                return potential_number

        # Fallback: use timestamp
        return f'LF-{date_str}-{int(today.timestamp())}'

    def mark_in_storage(self, storage_location, handler=None):
        """Move item to storage"""
        self.status = 'IN_STORAGE'
        self.storage_location = storage_location
        if handler:
            self.handler = handler
        self.save()

    def mark_claimed(self, claimed_by_name, claimed_by_contact, verified_by, notes=''):
        """Mark item as claimed"""
        self.status = 'CLAIMED'
        self.claimed_by_name = claimed_by_name
        self.claimed_by_contact = claimed_by_contact
        self.claimed_date = timezone.now().date()
        self.claimed_time = timezone.now().time()
        self.claim_verified_by = verified_by
        self.claim_notes = notes
        self.save()

    def mark_returned_to_guest(self, verified_by, notes=''):
        """Mark item as returned to guest"""
        self.status = 'RETURNED_TO_GUEST'
        self.claimed_date = timezone.now().date()
        self.claimed_time = timezone.now().time()
        self.claim_verified_by = verified_by
        self.claim_notes = notes
        if self.guest:
            self.claimed_by_name = self.guest.full_name
            self.claimed_by_contact = self.guest.phone
        self.save()

    def mark_disposed(self, disposal_method, notes=''):
        """Mark item as disposed"""
        self.status = 'DISPOSED'
        self.disposal_date = timezone.now().date()
        self.disposal_method = disposal_method
        self.disposal_notes = notes
        self.save()

    @property
    def days_in_storage(self):
        """Calculate days since item was found/reported"""
        if self.found_date:
            delta = timezone.now().date() - self.found_date
        else:
            delta = timezone.now().date() - self.reported_date
        return delta.days

    @property
    def is_unclaimed_long(self):
        """Check if item has been unclaimed for more than 30 days"""
        return self.status in ['PENDING', 'IN_STORAGE'] and self.days_in_storage > 30
