from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Order, KitchenOrder, KitchenOrderItem


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