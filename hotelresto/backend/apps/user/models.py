from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from datetime import datetime, timedelta
from decimal import Decimal


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        # Hotel roles
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Manager'),
        ('SUPERVISOR', 'Supervisor'),
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping'),
        ('MAINTENANCE', 'Maintenance'),
        # Restaurant roles
        ('CASHIER', 'Cashier'),
        ('CHEF', 'Chef'),
        ('WAITRESS', 'Waitress'),
        ('BAR', 'Bar Staff'),
        # Generic
        ('STAFF', 'Staff'),
    ]

    SYSTEM_ACCESS_CHOICES = [
        ('HOTEL', 'Hotel System'),
        ('RESTAURANT', 'Restaurant System'),
        ('BOTH', 'Both Systems'),
    ]

    # Authentication fields
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    # Profile fields (merged from UserProfile)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')
    system_access = models.CharField(max_length=20, choices=SYSTEM_ACCESS_CHOICES, default='HOTEL')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.first_name or self.email

    # RBAC Helper Methods
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'ADMIN' or self.is_superuser

    def is_manager(self):
        """Check if user is manager or higher"""
        return self.role in ['ADMIN', 'MANAGER'] or self.is_superuser

    def is_supervisor(self):
        """Check if user is supervisor or higher"""
        return self.role in ['ADMIN', 'MANAGER', 'SUPERVISOR'] or self.is_superuser

    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.is_admin()

    def can_manage_bookings(self):
        """Check if user can manage bookings"""
        return self.role in ['ADMIN', 'MANAGER', 'RECEPTIONIST'] or self.is_superuser

    def can_manage_housekeeping(self):
        """Check if user can manage housekeeping tasks"""
        return self.role in ['ADMIN', 'MANAGER', 'SUPERVISOR', 'HOUSEKEEPING'] or self.is_superuser

    def can_view_reports(self):
        """Check if user can view financial reports"""
        return self.role in ['ADMIN', 'MANAGER'] or self.is_superuser

    def can_manage_inventory(self):
        """Check if user can manage inventory"""
        return self.role in ['ADMIN', 'MANAGER', 'MAINTENANCE'] or self.is_superuser

    def has_role(self, *roles):
        """Check if user has any of the specified roles"""
        return self.role in roles or self.is_superuser

    # Restaurant-specific helper methods
    def can_access_restaurant(self):
        """Check if user can access restaurant system"""
        return self.system_access in ['RESTAURANT', 'BOTH'] or self.is_superuser

    def can_access_hotel(self):
        """Check if user can access hotel system"""
        return self.system_access in ['HOTEL', 'BOTH'] or self.is_superuser

    def is_cashier(self):
        """Check if user is a cashier"""
        return self.role == 'CASHIER' or self.is_superuser

    def is_chef(self):
        """Check if user is a chef"""
        return self.role == 'CHEF' or self.is_superuser

    def is_waitress(self):
        """Check if user is a waitress"""
        return self.role == 'WAITRESS' or self.is_superuser

    def is_bar_staff(self):
        """Check if user is bar staff"""
        return self.role == 'BAR' or self.is_superuser

    def can_manage_restaurant_pos(self):
        """Check if user can manage POS"""
        return self.role in ['ADMIN', 'MANAGER', 'CASHIER'] or self.is_superuser

    def can_view_kitchen_orders(self):
        """Check if user can view kitchen orders"""
        return self.role in ['ADMIN', 'MANAGER', 'CHEF', 'CASHIER'] or self.is_superuser

    def can_view_bar_orders(self):
        """Check if user can view bar orders"""
        return self.role in ['ADMIN', 'MANAGER', 'BAR', 'CASHIER'] or self.is_superuser


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    manager = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return self.name


class Employee(models.Model):
    EMPLOYMENT_STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('TERMINATED', 'Terminated'),
        ('RESIGNED', 'Resigned'),
    ]

    # Every employee has a user account - unified authentication and employee data
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee')

    # Employee identification
    employee_id = models.CharField(max_length=20, unique=True)

    # Employment details
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    position = models.CharField(max_length=100, blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    hire_date = models.DateField(null=True, blank=True)
    termination_date = models.DateField(null=True, blank=True)

    # Emergency contact (separate from user's contact info)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_relationship = models.CharField(max_length=50, blank=True, null=True)

    # Status
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS_CHOICES, default='ACTIVE')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['employee_id']
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def __str__(self):
        return f"{self.employee_id} - {self.user.full_name}"

    @property
    def full_name(self):
        """Get employee full name from user"""
        return self.user.full_name

    @property
    def email(self):
        """Get employee email from user"""
        return self.user.email

    @property
    def phone(self):
        """Get employee phone from user"""
        return self.user.phone

    @property
    def address(self):
        """Get employee address from user"""
        return self.user.address

    @property
    def first_name(self):
        """Get employee first name from user"""
        return self.user.first_name

    @property
    def last_name(self):
        """Get employee last name from user"""
        return self.user.last_name

    @property
    def role(self):
        """Get employee role from user"""
        return self.user.role

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = self.generate_employee_id()
        super().save(*args, **kwargs)

    def generate_employee_id(self):
        """Generate employee ID automatically"""
        prefix = 'EMP'
        count = Employee.objects.count() + 1
        return f"{prefix}{count:03d}"


class Shift(models.Model):
    SHIFT_TYPE_CHOICES = [
        ('MORNING', 'Morning Shift'),
        ('AFTERNOON', 'Afternoon Shift'),
        ('EVENING', 'Evening Shift'),
        ('NIGHT', 'Night Shift'),
        ('OVERTIME', 'Overtime'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shifts')
    shift_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    shift_type = models.CharField(max_length=20, choices=SHIFT_TYPE_CHOICES, default='MORNING')
    break_duration = models.PositiveIntegerField(default=60, help_text='Break duration in minutes')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-shift_date', 'start_time']
        unique_together = ['employee', 'shift_date', 'start_time']
        verbose_name = 'Shift'
        verbose_name_plural = 'Shifts'

    def __str__(self):
        return f"{self.employee.full_name} - {self.shift_date} ({self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')})"

    @property
    def hours_scheduled(self):
        """Calculate scheduled hours for the shift"""
        # Return 0 if required fields are not set
        if not self.shift_date or not self.start_time or not self.end_time:
            return 0

        start_datetime = datetime.combine(self.shift_date, self.start_time)
        end_datetime = datetime.combine(self.shift_date, self.end_time)

        # Handle overnight shifts
        if self.end_time < self.start_time:
            end_datetime += timedelta(days=1)

        duration = end_datetime - start_datetime
        hours = duration.total_seconds() / 3600

        # Subtract break duration
        break_hours = self.break_duration / 60
        return max(0, hours - break_hours)


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('LATE', 'Late'),
        ('ABSENT', 'Absent'),
        ('SICK', 'Sick Leave'),
        ('VACATION', 'Vacation'),
        ('OVERTIME', 'Overtime'),
    ]

    shift = models.OneToOneField(Shift, on_delete=models.CASCADE, related_name='attendance')
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    late_minutes = models.PositiveIntegerField(default=0)
    overtime_minutes = models.PositiveIntegerField(default=0)
    break_start = models.DateTimeField(null=True, blank=True)
    break_end = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-shift__shift_date']
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        return f"{self.shift.employee.full_name} - {self.shift.shift_date} - {self.status}"

    @property
    def hours_worked(self):
        """Calculate actual hours worked"""
        if not self.clock_in or not self.clock_out:
            return 0

        duration = self.clock_out - self.clock_in
        hours = duration.total_seconds() / 3600

        # Subtract break time if recorded
        if self.break_start and self.break_end:
            break_duration = self.break_end - self.break_start
            break_hours = break_duration.total_seconds() / 3600
            hours -= break_hours

        return max(0, hours)

    def is_late(self):
        """Check if employee was late"""
        if not self.clock_in:
            return False

        from django.utils import timezone as tz
        scheduled_start = datetime.combine(
            self.shift.shift_date,
            self.shift.start_time
        )
        # Make scheduled_start timezone-aware if clock_in is timezone-aware
        if tz.is_aware(self.clock_in) and tz.is_naive(scheduled_start):
            scheduled_start = tz.make_aware(scheduled_start)
        elif tz.is_naive(self.clock_in) and tz.is_aware(scheduled_start):
            scheduled_start = tz.make_naive(scheduled_start)

        return self.clock_in > scheduled_start

    def is_early_departure(self):
        """Check if employee left early"""
        if not self.clock_out:
            return False

        scheduled_end = datetime.combine(
            self.shift.shift_date,
            self.shift.end_time
        )

        # Handle overnight shifts
        if self.shift.end_time < self.shift.start_time:
            scheduled_end += timedelta(days=1)

        return self.clock_out < scheduled_end

    def save(self, *args, **kwargs):
        # Calculate late minutes if clocked in late
        if self.clock_in and self.is_late():
            from django.utils import timezone as tz
            scheduled_start = datetime.combine(
                self.shift.shift_date,
                self.shift.start_time
            )
            # Make scheduled_start timezone-aware if clock_in is timezone-aware
            if tz.is_aware(self.clock_in) and tz.is_naive(scheduled_start):
                scheduled_start = tz.make_aware(scheduled_start)
            elif tz.is_naive(self.clock_in) and tz.is_aware(scheduled_start):
                scheduled_start = tz.make_naive(scheduled_start)

            late_duration = self.clock_in - scheduled_start
            self.late_minutes = int(late_duration.total_seconds() / 60)

        super().save(*args, **kwargs)
