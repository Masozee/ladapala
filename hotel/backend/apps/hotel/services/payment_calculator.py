"""
Payment Calculator Service
Handles calculation of payments with vouchers, discounts, and loyalty points
"""
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q
from ..models.payments import Payment
from ..models.promotions import Voucher, Discount, LoyaltyProgram, GuestLoyaltyPoints, LoyaltyTransaction
from ..models.reservations import Reservation
from ..models.guests import Guest


class PaymentCalculationError(Exception):
    """Custom exception for payment calculation errors"""
    pass


class PaymentCalculator:
    """
    Service class for calculating payment amounts with promotions
    """

    def __init__(self, reservation):
        self.reservation = reservation
        self.guest = reservation.guest
        self.subtotal = reservation.get_grand_total()
        self.voucher = None
        self.voucher_discount = Decimal('0.00')
        self.auto_discount = None
        self.auto_discount_amount = Decimal('0.00')
        self.points_to_redeem = 0
        self.points_redeemed_value = Decimal('0.00')
        self.final_amount = self.subtotal
        self.points_to_earn = 0

    def apply_voucher(self, voucher_code):
        """
        Validate and apply voucher discount
        Returns: discount_amount or raises PaymentCalculationError
        """
        if not voucher_code:
            return Decimal('0.00')

        try:
            voucher = Voucher.objects.get(code=voucher_code.upper())
        except Voucher.DoesNotExist:
            raise PaymentCalculationError(f"Voucher code '{voucher_code}' not found")

        # Validate voucher
        if not voucher.is_valid():
            raise PaymentCalculationError(f"Voucher '{voucher_code}' is not valid or has expired")

        # Check min booking amount
        if self.subtotal < voucher.min_booking_amount:
            raise PaymentCalculationError(
                f"Minimum booking amount is {voucher.min_booking_amount}. Current amount: {self.subtotal}"
            )

        # Check min nights
        if self.reservation.nights < voucher.min_nights:
            raise PaymentCalculationError(
                f"Minimum {voucher.min_nights} nights required. Current: {self.reservation.nights} nights"
            )

        # Check usage limit per guest
        guest_usage_count = voucher.usages.filter(guest=self.guest).count()
        if voucher.usage_per_guest and guest_usage_count >= voucher.usage_per_guest:
            raise PaymentCalculationError(
                f"You have already used this voucher {guest_usage_count} time(s). Limit: {voucher.usage_per_guest}"
            )

        # Check room type restrictions (if applicable)
        if voucher.applicable_room_types.exists():
            if self.reservation.room and self.reservation.room.room_type not in voucher.applicable_room_types.all():
                raise PaymentCalculationError("This voucher is not applicable to your room type")

        # Calculate discount
        discount_amount = Decimal('0.00')

        if voucher.voucher_type == 'PERCENTAGE':
            discount_amount = self.subtotal * (voucher.discount_percentage / Decimal('100'))
            if voucher.max_discount_amount and discount_amount > voucher.max_discount_amount:
                discount_amount = voucher.max_discount_amount

        elif voucher.voucher_type == 'FIXED_AMOUNT':
            discount_amount = min(voucher.discount_amount, self.subtotal)

        elif voucher.voucher_type == 'FREE_NIGHT':
            # Calculate one night's room price
            if self.reservation.room:
                one_night_price = self.reservation.room.get_current_price()
                discount_amount = min(one_night_price, self.subtotal)

        elif voucher.voucher_type == 'UPGRADE':
            # For upgrades, discount is 0 but we track the voucher
            discount_amount = Decimal('0.00')

        self.voucher = voucher
        self.voucher_discount = discount_amount
        return discount_amount

    def apply_automatic_discounts(self):
        """
        Find and apply the best automatic discount based on booking conditions
        Only ONE automatic discount is applied (highest priority that matches)
        """
        now = timezone.now()
        booking_date = now.date()
        check_in_date = self.reservation.check_in_date
        nights = self.reservation.nights

        # Get all active discounts within date range
        applicable_discounts = Discount.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_until__gte=now,
            min_nights__lte=nights
        ).order_by('-priority')  # Higher priority number = applied first

        best_discount = None
        best_discount_amount = Decimal('0.00')

        for discount in applicable_discounts:
            # Check advance booking window (if applicable)
            days_before_checkin = (check_in_date - booking_date).days

            if discount.discount_type == 'EARLY_BIRD':
                if discount.min_advance_days and days_before_checkin < discount.min_advance_days:
                    continue  # Not early enough
            elif discount.discount_type == 'LAST_MINUTE':
                if discount.max_advance_days and days_before_checkin > discount.max_advance_days:
                    continue  # Not last minute enough

            # Check applicable stay period (if specified)
            if discount.applicable_from and check_in_date < discount.applicable_from:
                continue
            if discount.applicable_until and check_in_date > discount.applicable_until:
                continue

            # Check room type restrictions (if applicable)
            if discount.applicable_room_types.exists():
                if self.reservation.room and self.reservation.room.room_type not in discount.applicable_room_types.all():
                    continue

            # Calculate discount amount
            discount_amount = self.subtotal * (discount.discount_percentage / Decimal('100'))

            # Take the first matching discount (highest priority)
            if discount_amount > Decimal('0.00'):
                best_discount = discount
                best_discount_amount = discount_amount
                break  # Stop at first match (highest priority)

        self.auto_discount = best_discount
        self.auto_discount_amount = best_discount_amount
        return best_discount_amount

    def redeem_loyalty_points(self, points_to_redeem):
        """
        Redeem loyalty points for this payment
        """
        if points_to_redeem <= 0:
            return Decimal('0.00')

        try:
            loyalty_account = GuestLoyaltyPoints.objects.get(guest=self.guest)
        except GuestLoyaltyPoints.DoesNotExist:
            raise PaymentCalculationError("You don't have a loyalty account")

        # Get active loyalty program
        try:
            program = LoyaltyProgram.objects.get(is_active=True)
        except LoyaltyProgram.DoesNotExist:
            raise PaymentCalculationError("No active loyalty program found")

        # Check min redemption
        if points_to_redeem < program.min_points_to_redeem:
            raise PaymentCalculationError(
                f"Minimum {program.min_points_to_redeem} points required for redemption"
            )

        # Check available points
        available_points = self.guest.loyalty_points if hasattr(self.guest, 'loyalty_points') else 0
        if points_to_redeem > available_points:
            raise PaymentCalculationError(
                f"Insufficient points. Available: {available_points}, Requested: {points_to_redeem}"
            )

        # Calculate value
        points_value = Decimal(str(points_to_redeem)) * program.rupiah_per_point

        # Points value cannot exceed remaining payment amount
        remaining_after_discounts = self.subtotal - self.voucher_discount - self.auto_discount_amount
        points_value = min(points_value, remaining_after_discounts)

        self.points_to_redeem = points_to_redeem
        self.points_redeemed_value = points_value
        return points_value

    def calculate_points_to_earn(self, final_payment_amount):
        """
        Calculate loyalty points to be earned from this payment
        """
        if final_payment_amount <= Decimal('0.00'):
            return 0

        try:
            program = LoyaltyProgram.objects.get(is_active=True)
        except LoyaltyProgram.DoesNotExist:
            return 0

        # Calculate points based on final payment amount
        # points_per_rupiah is like "1 point per Rupiah spent"
        points_earned = int(final_payment_amount * program.points_per_rupiah)

        self.points_to_earn = points_earned
        return points_earned

    def calculate(self, voucher_code=None, redeem_points=0):
        """
        Main calculation method
        Returns dict with all calculation details
        """
        # 1. Start with subtotal
        self.final_amount = self.subtotal

        # 2. Apply voucher
        try:
            if voucher_code:
                voucher_discount = self.apply_voucher(voucher_code)
                self.final_amount -= voucher_discount
        except PaymentCalculationError as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': 'voucher'
            }

        # 3. Apply automatic discount
        auto_discount = self.apply_automatic_discounts()
        self.final_amount -= auto_discount

        # 4. Apply loyalty points
        try:
            if redeem_points > 0:
                points_value = self.redeem_loyalty_points(redeem_points)
                self.final_amount -= points_value
        except PaymentCalculationError as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': 'loyalty_points'
            }

        # Ensure final amount is not negative
        self.final_amount = max(self.final_amount, Decimal('0.00'))

        # 5. Calculate points to earn
        self.calculate_points_to_earn(self.final_amount)

        # Return calculation result
        return {
            'success': True,
            'subtotal': str(self.subtotal),
            'voucher': {
                'code': self.voucher.code if self.voucher else None,
                'name': self.voucher.name if self.voucher else None,
                'discount': str(self.voucher_discount),
            },
            'auto_discount': {
                'name': self.auto_discount.name if self.auto_discount else None,
                'type': self.auto_discount.get_discount_type_display() if self.auto_discount else None,
                'discount': str(self.auto_discount_amount),
            },
            'loyalty_points': {
                'redeemed': self.points_to_redeem,
                'value': str(self.points_redeemed_value),
                'to_earn': self.points_to_earn,
            },
            'final_amount': str(self.final_amount),
            'total_discount': str(self.voucher_discount + self.auto_discount_amount + self.points_redeemed_value),
            'breakdown': {
                'reservation_number': self.reservation.reservation_number,
                'guest_name': self.guest.full_name,
                'room': self.reservation.room.number if self.reservation.room else None,
                'check_in': str(self.reservation.check_in_date),
                'check_out': str(self.reservation.check_out_date),
                'nights': self.reservation.nights,
            }
        }

    def create_payment(self, payment_method, transaction_id=None, voucher_code=None, redeem_points=0, payment_type='FULL'):
        """
        Create a payment with all promotions applied
        Also creates voucher usage record and loyalty transactions
        payment_type: 'FULL', 'DEPOSIT', or 'BALANCE'
        """
        # Calculate first
        calculation = self.calculate(voucher_code=voucher_code, redeem_points=redeem_points)

        if not calculation['success']:
            raise PaymentCalculationError(calculation['error'])

        # Determine payment amount based on payment_type
        final_amount = Decimal(calculation['final_amount'])
        if payment_type == 'DEPOSIT':
            # 30% deposit
            final_amount = final_amount * Decimal('0.30')
        elif payment_type == 'BALANCE':
            # Calculate balance due
            total_paid = self.reservation.get_total_paid()
            final_amount = final_amount - total_paid

        # Recalculate points based on actual payment amount for partial payments
        actual_points_to_earn = self.points_to_earn
        if payment_type in ['DEPOSIT', 'BALANCE']:
            # For partial payments, recalculate points based on actual amount paid
            actual_points_to_earn = self.calculate_points_to_earn(final_amount)

        # Create payment
        payment = Payment.objects.create(
            reservation=self.reservation,
            amount=final_amount,
            subtotal=self.subtotal,
            payment_method=payment_method,
            payment_type=payment_type,
            status='COMPLETED',
            transaction_id=transaction_id,
            payment_date=timezone.now(),
            # Promotion fields
            voucher=self.voucher,
            voucher_discount=self.voucher_discount,
            discount=self.auto_discount,
            discount_amount=self.auto_discount_amount,
            loyalty_points_redeemed=self.points_to_redeem,
            loyalty_points_value=self.points_redeemed_value,
            loyalty_points_earned=actual_points_to_earn,
        )

        # Create voucher usage record
        if self.voucher:
            from ..models.payments import VoucherUsage
            VoucherUsage.objects.create(
                voucher=self.voucher,
                guest=self.guest,
                reservation=self.reservation,
                payment=payment,
                discount_amount=self.voucher_discount
            )
            # Increment voucher usage count
            self.voucher.usage_count += 1
            self.voucher.save()

        # Process loyalty points
        try:
            # Try to get or create loyalty account
            loyalty_account, created = GuestLoyaltyPoints.objects.get_or_create(
                guest=self.guest,
                defaults={'total_points': self.guest.loyalty_points, 'lifetime_points': self.guest.loyalty_points}
            )
            program = LoyaltyProgram.objects.get(is_active=True)

            # Redeem points
            if self.points_to_redeem > 0:
                loyalty_account.redeem_points(
                    points=self.points_to_redeem,
                    description=f"Redeemed for reservation {self.reservation.reservation_number}"
                )
                # Sync to Guest model
                self.guest.loyalty_points -= self.points_to_redeem
                self.guest.save(update_fields=['loyalty_points'])

            # Award points (use actual_points_to_earn which accounts for partial payments)
            if actual_points_to_earn > 0:
                loyalty_account.add_points(
                    points=actual_points_to_earn,
                    description=f"Earned from reservation {self.reservation.reservation_number}",
                    expiry_date=timezone.now() + timezone.timedelta(days=program.points_expiry_days) if program.points_expiry_days else None
                )
                # Sync to Guest model
                self.guest.loyalty_points += actual_points_to_earn
                self.guest.save(update_fields=['loyalty_points'])

        except LoyaltyProgram.DoesNotExist:
            pass  # No active loyalty program, skip

        return payment, calculation
