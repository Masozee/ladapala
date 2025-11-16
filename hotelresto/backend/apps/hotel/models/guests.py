from django.db import models


class Guest(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    ID_TYPE_CHOICES = [
        ('passport', 'Passport'),
        ('national_id', 'National ID'),
        ('ktp', 'KTP (Indonesian ID)'),
        ('kitas', 'KITAS'),
        ('driving_license', 'Driving License'),
        ('other', 'Other'),
    ]

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    nationality = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    id_type = models.CharField(max_length=20, choices=ID_TYPE_CHOICES, default='passport')
    id_number = models.CharField(max_length=50, null=True, blank=True)

    # Guest preferences and requirements
    preferences = models.TextField(null=True, blank=True, help_text='Room preferences, bed type, floor, etc.')
    allergies = models.TextField(null=True, blank=True, help_text='Food allergies, medical conditions')

    # Emergency contact
    emergency_contact_name = models.CharField(max_length=100, null=True, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, null=True, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, null=True, blank=True)

    # VIP and loyalty
    is_vip = models.BooleanField(default=False)
    loyalty_points = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'