from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal


class Room(models.Model):
    """Room model for hotel room inventory"""
    ROOM_TYPES = [
        ('standard', 'Standard Room'),
        ('deluxe', 'Deluxe Room'),
        ('junior_suite', 'Junior Suite'),
        ('executive_suite', 'Executive Suite'),
        ('presidential_suite', 'Presidential Suite'),
    ]

    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
    floor = models.IntegerField()
    rate_per_night = models.DecimalField(max_digits=12, decimal_places=2)
    max_occupancy = models.IntegerField(default=2)
    description = models.TextField(blank=True)
    amenities = models.JSONField(default=list)  # List of amenities
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['floor', 'room_number']

    def __str__(self):
        return f"{self.room_number} - {self.get_room_type_display()}"


class Guest(models.Model):
    """Guest information"""
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    id_number = models.CharField(max_length=50)  # Passport or ID card
    address = models.TextField()
    nationality = models.CharField(max_length=50)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Reservation(models.Model):
    """Hotel reservation/booking"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    reservation_number = models.CharField(max_length=20, unique=True)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='reservations')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reservations')
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    actual_check_in = models.DateTimeField(null=True, blank=True)
    actual_check_out = models.DateTimeField(null=True, blank=True)
    number_of_guests = models.IntegerField()
    number_of_nights = models.IntegerField()
    rate_per_night = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    special_requests = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reservations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reservation_number} - {self.guest.full_name}"

    def save(self, *args, **kwargs):
        # Auto-calculate number of nights
        if self.check_in_date and self.check_out_date:
            delta = self.check_out_date - self.check_in_date
            self.number_of_nights = delta.days

        # Auto-calculate totals
        if self.rate_per_night and self.number_of_nights:
            self.total_amount = Decimal(self.rate_per_night) * Decimal(self.number_of_nights)
            # 10% tax and 5% service charge
            self.tax_amount = self.total_amount * Decimal('0.10')
            self.service_charge = self.total_amount * Decimal('0.05')
            self.grand_total = self.total_amount + self.tax_amount + self.service_charge

        super().save(*args, **kwargs)


class FinancialTransaction(models.Model):
    """All financial transactions including revenue and expenses"""
    TRANSACTION_TYPES = [
        ('revenue', 'Revenue'),
        ('expense', 'Expense'),
    ]

    REVENUE_CATEGORIES = [
        ('room_booking', 'Room Booking'),
        ('restaurant', 'Restaurant'),
        ('spa', 'Spa Services'),
        ('laundry', 'Laundry'),
        ('minibar', 'Minibar'),
        ('other_services', 'Other Services'),
    ]

    EXPENSE_CATEGORIES = [
        ('staff_salary', 'Staff Salary'),
        ('utilities', 'Utilities'),
        ('maintenance', 'Maintenance'),
        ('supplies', 'Supplies'),
        ('marketing', 'Marketing'),
        ('insurance', 'Insurance'),
        ('taxes', 'Taxes'),
        ('other_expenses', 'Other Expenses'),
    ]

    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_payment', 'Mobile Payment'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    transaction_id = models.CharField(max_length=50, unique=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=50)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference_number = models.CharField(max_length=100, blank=True)

    # Relations
    reservation = models.ForeignKey(Reservation, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    guest = models.ForeignKey(Guest, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processed_transactions')

    # Timestamps
    transaction_date = models.DateField()
    transaction_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Additional fields
    notes = models.TextField(blank=True)
    receipt_url = models.URLField(blank=True)

    class Meta:
        ordering = ['-transaction_date', '-transaction_time']
        indexes = [
            models.Index(fields=['transaction_date', 'transaction_type']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.transaction_id} - {self.get_transaction_type_display()} - {self.amount}"

    def save(self, *args, **kwargs):
        # Auto-generate transaction ID if not provided
        if not self.transaction_id:
            date_str = timezone.now().strftime('%Y%m%d')
            last_transaction = FinancialTransaction.objects.filter(
                transaction_id__startswith=f'TRX{date_str}'
            ).order_by('-transaction_id').first()

            if last_transaction:
                last_num = int(last_transaction.transaction_id[-4:])
                new_num = last_num + 1
            else:
                new_num = 1

            self.transaction_id = f'TRX{date_str}{new_num:04d}'

        super().save(*args, **kwargs)


class Invoice(models.Model):
    """Invoice for reservations"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    invoice_number = models.CharField(max_length=20, unique=True)
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='invoices')
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='invoices')
    issue_date = models.DateField()
    due_date = models.DateField()
    payment_date = models.DateField(null=True, blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    payment_method = models.CharField(max_length=20, blank=True)

    # Additional info
    notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issue_date']

    def __str__(self):
        return f"{self.invoice_number} - {self.guest.full_name}"

    def save(self, *args, **kwargs):
        # Auto-calculate balance
        self.balance = self.total_amount - self.paid_amount

        # Auto-update status based on payment
        if self.balance <= 0:
            self.status = 'paid'
        elif self.due_date < timezone.now().date() and self.balance > 0:
            self.status = 'overdue'

        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    """Line items for invoices"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.description}"

    def save(self, *args, **kwargs):
        # Auto-calculate amount
        self.amount = Decimal(self.quantity) * self.rate
        super().save(*args, **kwargs)
