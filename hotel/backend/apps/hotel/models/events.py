from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from .guests import Guest
from .rooms import Room, RoomType


class EventPackage(models.Model):
    """Venue package with inclusions"""
    PACKAGE_TYPE_CHOICES = [
        ('BRONZE', 'Bronze Package'),
        ('SILVER', 'Silver Package'),
        ('GOLD', 'Gold Package'),
        ('PLATINUM', 'Platinum Package'),
        ('CUSTOM', 'Custom Package'),
    ]

    name = models.CharField(max_length=100)
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPE_CHOICES)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=12, decimal_places=2)

    # Inclusions
    includes_venue = models.BooleanField(default=True)
    includes_sound_system = models.BooleanField(default=False)
    includes_projector = models.BooleanField(default=False)
    includes_led_screen = models.BooleanField(default=False)
    includes_lighting = models.BooleanField(default=False)
    includes_ac = models.BooleanField(default=True)
    includes_tables_chairs = models.BooleanField(default=True)
    includes_decoration = models.BooleanField(default=False)
    includes_parking = models.BooleanField(default=False)

    # Additional details
    max_hours = models.PositiveIntegerField(default=8, help_text='Maximum hours included')
    additional_hour_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['base_price']

    def __str__(self):
        return f'{self.name} - Rp {self.base_price:,.0f}'

    def get_inclusions_list(self):
        """Return list of included items"""
        inclusions = []
        if self.includes_venue:
            inclusions.append('Venue rental')
        if self.includes_sound_system:
            inclusions.append('Sound system')
        if self.includes_projector:
            inclusions.append('Projector')
        if self.includes_led_screen:
            inclusions.append('LED screen')
        if self.includes_lighting:
            inclusions.append('Professional lighting')
        if self.includes_ac:
            inclusions.append('Air conditioning')
        if self.includes_tables_chairs:
            inclusions.append('Tables and chairs')
        if self.includes_decoration:
            inclusions.append('Basic decoration')
        if self.includes_parking:
            inclusions.append('Parking access')
        return inclusions


class FoodPackage(models.Model):
    """Food catering package"""
    CATEGORY_CHOICES = [
        ('BREAKFAST', 'Breakfast'),
        ('LUNCH', 'Lunch'),
        ('DINNER', 'Dinner'),
        ('COFFEE_BREAK', 'Coffee Break'),
        ('COCKTAIL', 'Cocktail Party'),
        ('FULL_BOARD', 'Full Board'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    price_per_pax = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_pax = models.PositiveIntegerField(default=50)

    # Menu details (stored as text, could be expanded to MenuItem relations later)
    menu_items = models.TextField(help_text='List of menu items included')

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'price_per_pax']

    def __str__(self):
        return f'{self.name} - Rp {self.price_per_pax:,.0f}/pax'


class EventBooking(models.Model):
    """Event booking for ballrooms and meeting rooms"""
    EVENT_TYPE_CHOICES = [
        ('WEDDING', 'Wedding Reception'),
        ('CONFERENCE', 'Conference/Seminar'),
        ('MEETING', 'Business Meeting'),
        ('BIRTHDAY', 'Birthday Party'),
        ('ANNIVERSARY', 'Anniversary'),
        ('CORPORATE', 'Corporate Event'),
        ('EXHIBITION', 'Exhibition/Trade Show'),
        ('WORKSHOP', 'Workshop/Training'),
        ('OTHER', 'Other Event'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('PAID', 'Paid'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    # Basic Info
    booking_number = models.CharField(max_length=20, unique=True, editable=False)
    event_name = models.CharField(max_length=200)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)

    # Contact (can be guest or external organizer)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='event_bookings')
    organizer_name = models.CharField(max_length=200, blank=True, help_text='If different from guest')
    organizer_phone = models.CharField(max_length=20, blank=True)
    organizer_email = models.EmailField(blank=True)
    organization = models.CharField(max_length=200, blank=True, help_text='Company/Organization name')

    # Venue
    venue = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='event_bookings')
    venue_package = models.ForeignKey(EventPackage, on_delete=models.PROTECT, related_name='bookings')

    # Date & Time
    event_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    setup_time = models.TimeField(null=True, blank=True, help_text='Setup start time')

    # PAX & Catering
    expected_pax = models.PositiveIntegerField(help_text='Expected number of guests')
    confirmed_pax = models.PositiveIntegerField(null=True, blank=True, help_text='Final confirmed PAX')
    food_package = models.ForeignKey(FoodPackage, on_delete=models.PROTECT, null=True, blank=True, related_name='bookings')

    # Pricing breakdown
    venue_price = models.DecimalField(max_digits=12, decimal_places=2, help_text='Base venue package price')
    food_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Food total (PAX × price_per_pax)')
    equipment_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Additional equipment')
    other_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Decoration, parking, etc.')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='11% tax')
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)

    # Payment terms
    down_payment_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=30, help_text='Percentage for down payment')
    down_payment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2)
    down_payment_paid = models.BooleanField(default=False)
    full_payment_paid = models.BooleanField(default=False)

    # Additional info
    special_requests = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    invoice_notes = models.TextField(blank=True, null=True, help_text='Additional notes for invoice')

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Audit
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='event_bookings_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-event_date', '-start_time']

    def __str__(self):
        return f'{self.booking_number} - {self.event_name} ({self.event_date})'

    def save(self, *args, **kwargs):
        if not self.booking_number:
            # Generate booking number: EVT-YYYYMMDD-NNNN
            timestamp = timezone.now().strftime('%Y%m%d')
            import random
            random_num = random.randint(1000, 9999)
            self.booking_number = f'EVT-{timestamp}-{random_num}'

        # Calculate totals
        if self.venue_price and self.food_price is not None:
            self.subtotal = self.venue_price + self.food_price + self.equipment_price + self.other_charges
            self.tax_amount = self.subtotal * Decimal('0.11')
            self.grand_total = self.subtotal + self.tax_amount

            # Calculate down payment
            self.down_payment_amount = self.grand_total * (self.down_payment_percentage / Decimal('100'))
            self.remaining_amount = self.grand_total - self.down_payment_amount

        super().save(*args, **kwargs)

    @property
    def duration_hours(self):
        """Calculate event duration in hours"""
        from datetime import datetime, timedelta
        start = datetime.combine(self.event_date, self.start_time)
        end = datetime.combine(self.event_date, self.end_time)
        if end < start:
            end += timedelta(days=1)
        duration = end - start
        return duration.total_seconds() / 3600

    @property
    def is_overdue_payment(self):
        """Check if event is coming up but not fully paid"""
        from datetime import date, timedelta
        if self.full_payment_paid:
            return False
        days_until_event = (self.event_date - date.today()).days
        return days_until_event <= 7  # Payment due 7 days before event

    def get_total_paid(self):
        """Calculate total amount paid"""
        total = self.payments.filter(status='COMPLETED').aggregate(
            total=models.Sum('amount')
        )['total']
        return total or Decimal('0.00')

    def get_payment_status(self):
        """Get current payment status"""
        total_paid = self.get_total_paid()

        if total_paid >= self.grand_total:
            return 'FULLY_PAID'
        elif total_paid >= self.down_payment_amount:
            return 'DOWN_PAYMENT_PAID'
        elif total_paid > 0:
            return 'PARTIAL'
        else:
            return 'UNPAID'


class EventPayment(models.Model):
    """Payment tracking for event bookings"""
    PAYMENT_TYPE_CHOICES = [
        ('DOWN_PAYMENT', 'Down Payment'),
        ('FULL_PAYMENT', 'Full Payment'),
        ('ADDITIONAL', 'Additional Charges'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('TRANSFER', 'Bank Transfer'),
        ('CARD', 'Credit/Debit Card'),
        ('EDC', 'EDC'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    event_booking = models.ForeignKey(EventBooking, on_delete=models.CASCADE, related_name='payments')
    payment_number = models.CharField(max_length=20, unique=True, editable=False)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    reference_number = models.CharField(max_length=100, blank=True, help_text='Bank transfer reference, card approval code, etc.')
    notes = models.TextField(blank=True, null=True)

    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f'{self.payment_number} - Rp {self.amount:,.0f}'

    def save(self, *args, **kwargs):
        if not self.payment_number:
            # Generate payment number: PAY-EVT-YYYYMMDD-NNNN
            timestamp = timezone.now().strftime('%Y%m%d')
            import random
            random_num = random.randint(1000, 9999)
            self.payment_number = f'PAY-EVT-{timestamp}-{random_num}'

        # Track if this is the payment that completes the booking
        was_not_fully_paid = not self.event_booking.full_payment_paid if self.pk else True

        super().save(*args, **kwargs)

        # Update event booking payment status
        if self.status == 'COMPLETED':
            total_paid = self.event_booking.get_total_paid()
            if total_paid >= self.event_booking.down_payment_amount:
                self.event_booking.down_payment_paid = True

            # Check if this payment completes the booking
            if total_paid >= self.event_booking.grand_total:
                self.event_booking.full_payment_paid = True
                self.event_booking.status = 'PAID'

                # Send invoice email only if this is the payment that completes it
                if was_not_fully_paid:
                    try:
                        from apps.hotel.services.email_service import send_event_invoice_email
                        send_event_invoice_email(self.event_booking)
                    except Exception as e:
                        print(f"Failed to send invoice email: {str(e)}")
                        # Don't fail the payment if email fails
                        pass

            self.event_booking.save(update_fields=['down_payment_paid', 'full_payment_paid', 'status'])


class EventAddOn(models.Model):
    """Additional items/services for events"""
    ADDON_TYPE_CHOICES = [
        ('EQUIPMENT', 'Equipment'),
        ('DECORATION', 'Decoration'),
        ('STAFF', 'Additional Staff'),
        ('SERVICE', 'Service'),
        ('OTHER', 'Other'),
    ]

    event_booking = models.ForeignKey(EventBooking, on_delete=models.CASCADE, related_name='addons')
    addon_type = models.CharField(max_length=20, choices=ADDON_TYPE_CHOICES)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name} - Rp {self.total_price:,.0f}'

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
