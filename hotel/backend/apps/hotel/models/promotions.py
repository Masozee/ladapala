"""
Promotions models: Vouchers, Discounts, and Loyalty Points
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import random
import string


class Voucher(models.Model):
    """Hotel vouchers for discounts"""

    VOUCHER_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage Discount'),
        ('FIXED_AMOUNT', 'Fixed Amount Discount'),
        ('FREE_NIGHT', 'Free Night Stay'),
        ('UPGRADE', 'Room Upgrade'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('EXPIRED', 'Expired'),
        ('USED_UP', 'Used Up'),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    voucher_type = models.CharField(max_length=20, choices=VOUCHER_TYPE_CHOICES)

    # Discount values
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)]
    )
    max_discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Maximum discount amount for percentage vouchers"
    )

    # Usage limits
    usage_limit = models.IntegerField(
        null=True, blank=True,
        help_text="Total number of times this voucher can be used"
    )
    usage_count = models.IntegerField(default=0)
    usage_per_guest = models.IntegerField(
        default=1,
        help_text="Number of times a single guest can use this voucher"
    )

    # Validity period
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    # Minimum requirements
    min_booking_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Minimum booking amount to use this voucher"
    )
    min_nights = models.IntegerField(
        default=1,
        help_text="Minimum number of nights required"
    )

    # Room type restrictions
    applicable_room_types = models.ManyToManyField(
        'RoomType', blank=True,
        help_text="Leave empty for all room types"
    )

    # Status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_public = models.BooleanField(
        default=True,
        help_text="Public vouchers can be viewed by anyone"
    )
    terms_and_conditions = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'user.User', on_delete=models.SET_NULL,
        null=True, related_name='created_vouchers'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code', 'status']),
            models.Index(fields=['valid_from', 'valid_until']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def is_valid(self):
        """Check if voucher is currently valid"""
        now = timezone.now()
        if self.status != 'ACTIVE':
            return False
        if now < self.valid_from or now > self.valid_until:
            return False
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False
        return True

    def calculate_discount(self, booking_amount):
        """Calculate discount amount based on voucher type"""
        if self.voucher_type == 'PERCENTAGE' and self.discount_percentage:
            discount = booking_amount * (self.discount_percentage / 100)
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            return discount
        elif self.voucher_type == 'FIXED_AMOUNT' and self.discount_amount:
            return min(self.discount_amount, booking_amount)
        return Decimal('0')

    def can_be_used_by_guest(self, guest):
        """Check if guest can use this voucher"""
        from .payments import VoucherUsage
        usage_count = VoucherUsage.objects.filter(
            voucher=self, guest=guest
        ).count()
        return usage_count < self.usage_per_guest

    @staticmethod
    def generate_code(prefix='HOTEL', length=8):
        """Generate unique voucher code"""
        chars = string.ascii_uppercase + string.digits
        while True:
            random_part = ''.join(random.choices(chars, k=length))
            code = f"{prefix}{random_part}"
            if not Voucher.objects.filter(code=code).exists():
                return code


class Discount(models.Model):
    """Automatic discounts based on conditions"""

    DISCOUNT_TYPE_CHOICES = [
        ('EARLY_BIRD', 'Early Bird Discount'),
        ('LAST_MINUTE', 'Last Minute Deal'),
        ('LONG_STAY', 'Long Stay Discount'),
        ('SEASONAL', 'Seasonal Discount'),
        ('MEMBERSHIP', 'Membership Discount'),
        ('PACKAGE', 'Package Deal'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)

    # Discount value
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Conditions
    min_nights = models.IntegerField(default=1)
    min_advance_days = models.IntegerField(
        default=0,
        help_text="Minimum days in advance for early bird"
    )
    max_advance_days = models.IntegerField(
        null=True, blank=True,
        help_text="Maximum days in advance for last minute"
    )

    # Date range
    valid_from = models.DateField()
    valid_until = models.DateField()

    # Applicable dates (for stay dates, not booking dates)
    applicable_from = models.DateField(
        null=True, blank=True,
        help_text="Start date for applicable stay period"
    )
    applicable_until = models.DateField(
        null=True, blank=True,
        help_text="End date for applicable stay period"
    )

    # Room type restrictions
    applicable_room_types = models.ManyToManyField(
        'RoomType', blank=True
    )

    # Status
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(
        default=0,
        help_text="Higher priority discounts are applied first"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.name} ({self.discount_percentage}%)"

    def is_applicable(self, check_in_date, check_out_date, room_type=None):
        """Check if discount is applicable for given booking"""
        from datetime import date

        if not self.is_active:
            return False

        today = date.today()
        if today < self.valid_from or today > self.valid_until:
            return False

        # Check stay period
        if self.applicable_from and check_in_date < self.applicable_from:
            return False
        if self.applicable_until and check_in_date > self.applicable_until:
            return False

        # Check advance booking days
        advance_days = (check_in_date - today).days
        if self.discount_type == 'EARLY_BIRD' and advance_days < self.min_advance_days:
            return False
        if self.discount_type == 'LAST_MINUTE' and self.max_advance_days:
            if advance_days > self.max_advance_days:
                return False

        # Check minimum nights
        nights = (check_out_date - check_in_date).days
        if nights < self.min_nights:
            return False

        # Check room type
        if room_type and self.applicable_room_types.exists():
            if not self.applicable_room_types.filter(id=room_type.id).exists():
                return False

        return True


class LoyaltyProgram(models.Model):
    """Loyalty program configuration"""

    name = models.CharField(max_length=200, default="Hotel Rewards")
    description = models.TextField(blank=True)

    # Points earning rates
    points_per_rupiah = models.DecimalField(
        max_digits=10, decimal_places=2, default=1,
        help_text="Points earned per Rupiah spent"
    )

    # Points redemption rates
    rupiah_per_point = models.DecimalField(
        max_digits=10, decimal_places=2, default=100,
        help_text="Rupiah value per point when redeeming"
    )

    # Minimum points
    min_points_to_redeem = models.IntegerField(
        default=100,
        help_text="Minimum points required to redeem"
    )

    # Expiration
    points_expiry_months = models.IntegerField(
        default=12,
        help_text="Months until points expire (0 = never expire)"
    )

    # Status
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Loyalty Programs"

    def __str__(self):
        return self.name


class GuestLoyaltyPoints(models.Model):
    """Guest loyalty points balance"""

    guest = models.OneToOneField(
        'Guest', on_delete=models.CASCADE,
        related_name='loyalty_account'
    )
    total_points = models.IntegerField(default=0)
    lifetime_points = models.IntegerField(
        default=0,
        help_text="Total points earned over lifetime"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Guest Loyalty Points"

    def __str__(self):
        return f"{self.guest.name} - {self.total_points} points"

    def add_points(self, points, description, reference_type=None, reference_id=None):
        """Add points to guest balance"""
        self.total_points += points
        self.lifetime_points += points
        self.save()

        # Create transaction record
        LoyaltyTransaction.objects.create(
            guest=self.guest,
            transaction_type='EARN',
            points=points,
            balance_after=self.total_points,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id
        )

    def redeem_points(self, points, description, reference_type=None, reference_id=None):
        """Redeem points from guest balance"""
        if points > self.total_points:
            raise ValueError("Insufficient points")

        self.total_points -= points
        self.save()

        # Create transaction record
        LoyaltyTransaction.objects.create(
            guest=self.guest,
            transaction_type='REDEEM',
            points=points,
            balance_after=self.total_points,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id
        )


class LoyaltyTransaction(models.Model):
    """Loyalty points transaction history"""

    TRANSACTION_TYPE_CHOICES = [
        ('EARN', 'Earn Points'),
        ('REDEEM', 'Redeem Points'),
        ('EXPIRE', 'Points Expired'),
        ('ADJUST', 'Manual Adjustment'),
        ('REFUND', 'Refund Points'),
    ]

    guest = models.ForeignKey(
        'Guest', on_delete=models.CASCADE,
        related_name='loyalty_transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    points = models.IntegerField()
    balance_after = models.IntegerField()
    description = models.TextField()

    # Reference to related object (payment, reservation, etc)
    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.guest.name} - {self.transaction_type} - {self.points} points"
