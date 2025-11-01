from django.db import models


class HotelSettings(models.Model):
    """
    Singleton model for global hotel settings.
    Only one instance should exist in the database.
    """

    # General Settings
    hotel_name = models.CharField(max_length=200, default='Kapulaga Hotel')
    hotel_description = models.TextField(default='Premium hospitality experience in the heart of the city')
    address = models.TextField(default='')
    phone = models.CharField(max_length=50, default='')
    email = models.EmailField(default='')
    website = models.URLField(blank=True, default='')
    timezone = models.CharField(max_length=50, default='Asia/Jakarta')
    currency = models.CharField(max_length=3, default='IDR')
    language = models.CharField(max_length=5, default='en')
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY')
    time_format = models.CharField(max_length=2, default='24')

    # User Management Settings
    allow_self_registration = models.BooleanField(default=False)
    require_email_verification = models.BooleanField(default=True)
    password_min_length = models.IntegerField(default=8)
    session_timeout = models.IntegerField(default=120, help_text='Minutes')
    max_login_attempts = models.IntegerField(default=5)
    two_factor_auth = models.BooleanField(default=False)
    password_expiry = models.IntegerField(default=90, help_text='Days')
    enforce_strong_password = models.BooleanField(default=True)

    # Notification Settings
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    booking_notifications = models.BooleanField(default=True)
    maintenance_alerts = models.BooleanField(default=True)
    payment_alerts = models.BooleanField(default=True)
    guest_request_alerts = models.BooleanField(default=True)
    system_alerts = models.BooleanField(default=True)
    notification_sound = models.BooleanField(default=True)

    # Security Settings
    enable_ssl = models.BooleanField(default=True)
    enable_firewall = models.BooleanField(default=True)
    enable_rate_limiting = models.BooleanField(default=True)
    audit_logging = models.BooleanField(default=True)
    data_encryption = models.BooleanField(default=True)
    backup_encryption = models.BooleanField(default=True)
    ip_whitelist = models.TextField(blank=True, default='')
    session_security = models.CharField(max_length=20, default='high')
    api_key_rotation = models.IntegerField(default=30, help_text='Days')

    # Payment Settings
    default_gateway = models.CharField(max_length=50, default='stripe')
    accept_credit_cards = models.BooleanField(default=True)
    accept_debit_cards = models.BooleanField(default=True)
    accept_bank_transfer = models.BooleanField(default=True)
    accept_cash = models.BooleanField(default=True)
    auto_charge = models.BooleanField(default=False)
    invoice_prefix = models.CharField(max_length=10, default='INV')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=11.00)
    late_fee = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    refund_policy = models.CharField(max_length=50, default='flexible')

    # Room Management Settings
    auto_assign_rooms = models.BooleanField(default=True)
    allow_overbooking = models.BooleanField(default=False)
    overbooking_limit = models.IntegerField(default=5)
    default_check_in_time = models.TimeField(default='14:00')
    default_check_out_time = models.TimeField(default='12:00')
    grace_period_minutes = models.IntegerField(default=30)
    auto_room_status = models.BooleanField(default=True)
    room_maintenance_alerts = models.BooleanField(default=True)
    housekeeping_notifications = models.BooleanField(default=True)

    # Booking Settings
    advance_booking_days = models.IntegerField(default=365)
    minimum_booking_days = models.IntegerField(default=1)
    cancellation_period = models.IntegerField(default=24, help_text='Hours')
    confirmation_required = models.BooleanField(default=True)
    auto_confirmation = models.BooleanField(default=False)
    waiting_list_enabled = models.BooleanField(default=True)
    group_booking_minimum = models.IntegerField(default=10)
    seasonal_pricing = models.BooleanField(default=True)
    dynamic_pricing = models.BooleanField(default=False)

    # Integrations Settings
    pms_enabled = models.BooleanField(default=True)
    channel_manager = models.BooleanField(default=True)
    key_card_system = models.BooleanField(default=True)
    phone_system = models.BooleanField(default=False)
    accounting_software = models.BooleanField(default=True)
    crm_system = models.BooleanField(default=False)
    email_marketing = models.BooleanField(default=True)
    analytics_tracking = models.BooleanField(default=True)
    social_media_integration = models.BooleanField(default=False)

    # Appearance Settings
    theme = models.CharField(max_length=20, default='light')
    primary_color = models.CharField(max_length=7, default='#005357')
    secondary_color = models.CharField(max_length=7, default='#2baf6a')
    font_family = models.CharField(max_length=50, default='Inter')
    logo_url = models.CharField(max_length=200, default='/logo.png')
    favicon_url = models.CharField(max_length=200, default='/favicon.ico')
    custom_css = models.TextField(blank=True, default='')
    enable_animations = models.BooleanField(default=True)
    compact_layout = models.BooleanField(default=False)

    # Backup & Maintenance Settings
    auto_backup = models.BooleanField(default=True)
    backup_frequency = models.CharField(max_length=20, default='daily')
    backup_retention = models.IntegerField(default=30, help_text='Days')
    backup_location = models.CharField(max_length=50, default='cloud')
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(default='System under maintenance. Please try again later.')
    debug_mode = models.BooleanField(default=False)
    performance_mode = models.CharField(max_length=20, default='balanced')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Hotel Settings'
        verbose_name_plural = 'Hotel Settings'

    def __str__(self):
        return f'{self.hotel_name} Settings'

    def save(self, *args, **kwargs):
        """Ensure only one instance exists (singleton pattern)"""
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Load the singleton instance, create if doesn't exist"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
