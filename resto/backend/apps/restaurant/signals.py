from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from .models import Order, KitchenOrder, KitchenOrderItem, Inventory, PurchaseOrder
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