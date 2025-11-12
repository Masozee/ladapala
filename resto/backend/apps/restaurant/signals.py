from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from .models import Order, KitchenOrder, KitchenOrderItem, Inventory, PurchaseOrder, Payment, Customer, LoyaltyTransaction, MembershipTierBenefit
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


# Kitchen order creation is now handled in OrderCreateSerializer.create()
# to ensure proper ordering of operations and avoid timing issues with OrderItems
#
# @receiver(post_save, sender=Order)
# def create_kitchen_order(sender, instance, created, **kwargs):
#     """
#     Automatically create a KitchenOrder when a new Order is created.
#     Also creates KitchenOrderItems for each OrderItem.
#     """
#     pass


@receiver(post_save, sender=Inventory)
def ensure_matching_inventory_locations(sender, instance, created, **kwargs):
    """
    Ensure that when an inventory item is created or updated,
    matching items exist for both WAREHOUSE and KITCHEN locations.
    This ensures items in kitchen can only come from warehouse via transfer.
    """
    if created:
        # When a new item is created, ensure the opposite location also exists
        opposite_location = 'KITCHEN' if instance.location == 'WAREHOUSE' else 'WAREHOUSE'

        # Check if opposite location already exists
        existing = Inventory.objects.filter(
            branch=instance.branch,
            name=instance.name,
            location=opposite_location
        ).first()

        if not existing:
            # Create matching item in opposite location with 0 quantity
            Inventory.objects.create(
                branch=instance.branch,
                name=instance.name,
                description=instance.description,
                unit=instance.unit,
                quantity=0,  # Start with 0, will be filled via transfer
                min_quantity=0,
                location=opposite_location
            )


@receiver(pre_save, sender=PurchaseOrder)
def update_inventory_costs_on_po_received(sender, instance, **kwargs):
    """
    When a Purchase Order status changes to RECEIVED:
    1. Update inventory quantities
    2. Update inventory costs using moving average
    """
    # Only proceed if the PO is being marked as RECEIVED
    if instance.pk:  # Check if this is an update (not a new creation)
        try:
            old_instance = PurchaseOrder.objects.get(pk=instance.pk)
            # Only proceed if status is changing TO RECEIVED
            if old_instance.status != 'RECEIVED' and instance.status == 'RECEIVED':
                # Process each item in the PO
                for po_item in instance.items.all():
                    inventory_item = po_item.inventory_item

                    # Update cost using moving average BEFORE updating quantity
                    inventory_item.update_cost_moving_average(
                        new_quantity=po_item.quantity,
                        new_unit_cost=po_item.unit_price
                    )

                    # Update quantity
                    inventory_item.quantity += po_item.quantity
                    inventory_item.save()

        except PurchaseOrder.DoesNotExist:
            pass  # New instance, do nothing


@receiver(pre_save, sender=Order)
def deduct_inventory_on_status_change(sender, instance, **kwargs):
    """
    Automatically deduct inventory when order status changes to PREPARING.
    This happens once per order to avoid double deduction.
    """
    # Only process if order already exists (not a new order)
    if instance.pk is None:
        return

    try:
        # Get the old status from database
        old_order = Order.objects.get(pk=instance.pk)
        old_status = old_order.status
        new_status = instance.status

        # Trigger inventory deduction when transitioning to PREPARING
        # (and only if it hasn't been done before)
        if old_status in ['PENDING', 'CONFIRMED'] and new_status == 'PREPARING':
            logger.info(f"Order {instance.order_number}: Status changed {old_status} → {new_status}, deducting inventory...")

            success, message = instance.deduct_inventory()

            if success:
                logger.info(f"Order {instance.order_number}: Inventory deducted successfully - {message}")
            else:
                logger.error(f"Order {instance.order_number}: Inventory deduction failed - {message}")
                # Note: We don't prevent the save, but log the error
                # You could raise an exception here if you want to prevent the status change

    except Order.DoesNotExist:
        # This shouldn't happen, but just in case
        pass
    except Exception as e:
        logger.error(f"Error in inventory deduction signal for order {instance.order_number}: {str(e)}")


@receiver(post_save, sender=Payment)
def award_loyalty_points_on_payment(sender, instance, created, **kwargs):
    """
    Automatically award loyalty points when a payment is completed.
    Also update customer statistics and tier if applicable.
    """
    # Only process completed payments
    if instance.status != 'COMPLETED':
        return

    # Get the order and check if it has a linked customer
    order = instance.order
    if not order.customer:
        return  # No customer linked, skip loyalty processing

    customer = order.customer

    # Check if points already awarded for this payment (avoid duplicates)
    if LoyaltyTransaction.objects.filter(order=order, transaction_type='EARN').exists():
        logger.info(f"Points already awarded for order {order.order_number}, skipping")
        return

    try:
        # Get customer's tier benefit for multiplier
        tier_benefit = MembershipTierBenefit.objects.filter(tier=customer.membership_tier).first()
        points_multiplier = tier_benefit.points_multiplier if tier_benefit else 1.0

        # Calculate points: 1 point per 1000 rupiah spent, with tier multiplier
        # Example: Rp 50,000 * 1.5 (GOLD) / 1000 = 75 points
        points_earned = int((float(instance.amount) * points_multiplier) / 1000)

        if points_earned > 0:
            # Create loyalty transaction
            LoyaltyTransaction.objects.create(
                customer=customer,
                transaction_type='EARN',
                points=points_earned,
                balance_after=customer.points_balance + points_earned,
                order=order,
                description=f"Points earned from order {order.order_number}",
                expiry_date=timezone.now().date() + timedelta(days=365),  # Points expire in 1 year
                created_by=instance.processed_by
            )

            # Update customer points and stats
            customer.points_balance += points_earned
            customer.lifetime_points += points_earned
            customer.total_spent += instance.amount
            customer.total_visits += 1
            customer.last_visit = timezone.now()

            # Check for tier upgrade based on total_spent
            old_tier = customer.membership_tier
            if customer.total_spent >= 15000000 and customer.membership_tier != 'PLATINUM':
                customer.membership_tier = 'PLATINUM'
            elif customer.total_spent >= 5000000 and customer.membership_tier not in ['GOLD', 'PLATINUM']:
                customer.membership_tier = 'GOLD'
            elif customer.total_spent >= 2000000 and customer.membership_tier not in ['SILVER', 'GOLD', 'PLATINUM']:
                customer.membership_tier = 'SILVER'

            customer.save()

            if old_tier != customer.membership_tier:
                logger.info(f"Customer {customer.name} upgraded from {old_tier} to {customer.membership_tier}")

            logger.info(f"Awarded {points_earned} points to {customer.name} for order {order.order_number}")

    except Exception as e:
        logger.error(f"Error awarding loyalty points for payment {instance.transaction_id}: {str(e)}")