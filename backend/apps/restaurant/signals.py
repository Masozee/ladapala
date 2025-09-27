from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order, KitchenOrder, KitchenOrderItem


@receiver(post_save, sender=Order)
def create_kitchen_order(sender, instance, created, **kwargs):
    """
    Automatically create a KitchenOrder when a new Order is created.
    Also creates KitchenOrderItems for each OrderItem.
    """
    if created and instance.order_type in ['DINE_IN', 'TAKEAWAY', 'DELIVERY']:
        # Create kitchen order with priority based on order type
        priority_map = {
            'DINE_IN': 5,  # Higher priority for dine-in
            'TAKEAWAY': 3,  # Medium priority
            'DELIVERY': 1   # Lower priority (more time available)
        }
        
        kitchen_order = KitchenOrder.objects.create(
            order=instance,
            priority=priority_map.get(instance.order_type, 0),
            status='PENDING'
        )
        
        # Create kitchen order items
        for order_item in instance.items.all():
            KitchenOrderItem.objects.create(
                kitchen_order=kitchen_order,
                product=order_item.product,
                quantity=order_item.quantity,
                notes=order_item.notes,
                status='PENDING'
            )