from django.db import models
from django.conf import settings


class Supplier(models.Model):
    """Supplier/Vendor model for warehouse management"""

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    ]

    # Basic Information
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)

    # Address Information
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    province = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default='Indonesia')

    # Business Information
    tax_id = models.CharField(max_length=50, blank=True, null=True, help_text='NPWP')
    payment_terms = models.CharField(max_length=100, blank=True, null=True, help_text='e.g., NET 30, NET 60')

    # Status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')

    # Notes
    notes = models.TextField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suppliers_created'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.name
