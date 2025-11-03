from django.db import models
from django.conf import settings
from django.utils import timezone


class WarehouseAuditLog(models.Model):
    """Comprehensive audit trail for warehouse operations"""
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('APPROVE', 'Approved'),
        ('CANCEL', 'Cancelled'),
        ('COMPLETE', 'Completed'),
        ('ADJUST', 'Adjusted'),
        ('COUNT', 'Counted'),
        ('RECEIVE', 'Received'),
    ]

    # Action details
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, help_text='Model that was affected')
    object_id = models.PositiveIntegerField(help_text='ID of the affected object')
    object_repr = models.CharField(max_length=200, help_text='String representation of object')

    # Changes
    changes = models.JSONField(
        null=True,
        blank=True,
        help_text='Dictionary of changes: {"field": {"old": value, "new": value}}'
    )

    # User and context
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='warehouse_audit_logs'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)

    # Additional info
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action_type']),
        ]
        verbose_name = 'Warehouse Audit Log'
        verbose_name_plural = 'Warehouse Audit Logs'

    def __str__(self):
        return f'{self.user} - {self.action_type} {self.model_name} #{self.object_id} at {self.timestamp}'

    @classmethod
    def log_action(cls, action_type, model_name, object_id, object_repr, user, changes=None, notes=None, ip_address=None):
        """
        Convenience method to create audit log entry

        Args:
            action_type: Type of action (CREATE, UPDATE, etc.)
            model_name: Name of the model
            object_id: ID of the object
            object_repr: String representation
            user: User who performed action
            changes: Dictionary of changes
            notes: Additional notes
            ip_address: IP address of user

        Returns:
            WarehouseAuditLog instance
        """
        return cls.objects.create(
            action_type=action_type,
            model_name=model_name,
            object_id=object_id,
            object_repr=object_repr,
            user=user,
            changes=changes,
            notes=notes,
            ip_address=ip_address
        )

    def get_changes_display(self):
        """Return formatted changes for display"""
        if not self.changes:
            return "No changes recorded"

        lines = []
        for field, change in self.changes.items():
            old = change.get('old', 'N/A')
            new = change.get('new', 'N/A')
            lines.append(f"{field}: {old} → {new}")

        return "\n".join(lines)
