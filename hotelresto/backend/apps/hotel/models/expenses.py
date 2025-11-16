from django.db import models


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('SALARY', 'Gaji Karyawan'),
        ('UTILITIES', 'Utilitas'),
        ('MAINTENANCE', 'Maintenance'),
        ('MARKETING', 'Marketing'),
        ('SUPPLIES', 'Supplies'),
        ('OTHER', 'Lainnya'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('CREDIT_CARD', 'Credit Card'),
        ('DEBIT_CARD', 'Debit Card'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('DIGITAL_WALLET', 'Digital Wallet'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    ]

    description = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    expense_date = models.DateTimeField()
    reference = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-expense_date']

    def __str__(self):
        return f'{self.get_category_display()} - {self.description}'
