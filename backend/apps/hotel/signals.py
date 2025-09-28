from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Complaint, ComplaintStatusHistory


@receiver(pre_save, sender=Complaint)
def track_status_changes(sender, instance, **kwargs):
    """Track status changes for complaints"""
    if instance.pk:
        try:
            original = Complaint.objects.get(pk=instance.pk)
            if original.status != instance.status:
                # Get the user who changed the status
                changed_by = getattr(instance, '_status_changed_by', None)
                # Only set changed_by if it's an actual authenticated user
                if changed_by and hasattr(changed_by, 'is_authenticated') and not changed_by.is_authenticated:
                    changed_by = None
                
                # Create status history record
                ComplaintStatusHistory.objects.create(
                    complaint=instance,
                    from_status=original.status,
                    to_status=instance.status,
                    changed_by=changed_by,
                    reason=getattr(instance, '_status_change_reason', '')
                )
        except Complaint.DoesNotExist:
            pass


@receiver(post_save, sender=Complaint)
def handle_complaint_assignment(sender, instance, created, **kwargs):
    """Handle actions when complaint is assigned"""
    if created:
        # Create initial status history only if we have a user
        created_by = getattr(instance, '_created_by', None)
        if created_by:
            ComplaintStatusHistory.objects.create(
                complaint=instance,
                from_status='',
                to_status=instance.status,
                changed_by=created_by,
                reason='Initial complaint submission'
            )
    
    # Auto-assign based on category if not manually assigned
    if not instance.assigned_to and instance.category and instance.category.department:
        # Could implement logic to assign to available staff member
        pass