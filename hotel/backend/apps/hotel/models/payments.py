from django.db import models
from decimal import Decimal
from .reservations import Reservation


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('CREDIT_CARD', 'Credit Card'),
        ('DEBIT_CARD', 'Debit Card'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('DIGITAL_WALLET', 'Digital Wallet'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]

    PAYMENT_TYPE_CHOICES = [
        ('DEPOSIT', 'Deposit'),
        ('PARTIAL', 'Partial Payment'),
        ('FULL', 'Full Payment'),
        ('BALANCE', 'Balance Payment'),
    ]

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPE_CHOICES,
        default='FULL',
        help_text="Type of payment: deposit, partial, or full payment"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    payment_date = models.DateTimeField()  # Removed auto_now_add to allow manual date setting
    notes = models.TextField(blank=True, null=True)

    # Promotion-related fields
    voucher = models.ForeignKey(
        'Voucher', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payments'
    )
    voucher_discount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        help_text="Amount discounted by voucher"
    )

    discount = models.ForeignKey(
        'Discount', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payments'
    )
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        help_text="Amount discounted by automatic discount"
    )

    loyalty_points_redeemed = models.IntegerField(
        default=0,
        help_text="Number of loyalty points redeemed"
    )
    loyalty_points_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        help_text="Cash value of redeemed points"
    )
    loyalty_points_earned = models.IntegerField(
        default=0,
        help_text="Points earned from this payment"
    )

    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Original amount before discounts"
    )

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f'Payment {self.id} - {self.reservation.reservation_number}'

    @property
    def total_discount(self):
        """Calculate total discount applied"""
        return self.voucher_discount + self.discount_amount + self.loyalty_points_value

class VoucherUsage(models.Model):
    """Track voucher usage by guests"""
    
    voucher = models.ForeignKey(
        'Voucher', on_delete=models.CASCADE,
        related_name='usages'
    )
    guest = models.ForeignKey(
        'Guest', on_delete=models.CASCADE,
        related_name='voucher_usages'
    )
    reservation = models.ForeignKey(
        'Reservation', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='voucher_usages'
    )
    payment = models.ForeignKey(
        'Payment', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='voucher_usage'
    )
    
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Actual discount amount applied"
    )
    
    used_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-used_at']
        indexes = [
            models.Index(fields=['voucher', 'guest']),
        ]
    
    def __str__(self):
        return f"{self.voucher.code} used by {self.guest.full_name}"
