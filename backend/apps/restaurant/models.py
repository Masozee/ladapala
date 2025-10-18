from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
import uuid


class Restaurant(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Branch(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"

    class Meta:
        verbose_name_plural = "Branches"
        ordering = ['restaurant', 'name']


class StaffRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrator'
    MANAGER = 'MANAGER', 'Manager'
    CASHIER = 'CASHIER', 'Cashier'
    KITCHEN = 'KITCHEN', 'Kitchen Staff'
    WAREHOUSE = 'WAREHOUSE', 'Warehouse Staff'


class Staff(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='staff')
    role = models.CharField(max_length=20, choices=StaffRole.choices)
    phone = models.CharField(max_length=20, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    hire_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = f"EMP{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} - {self.role}"

    class Meta:
        verbose_name_plural = "Staff"
        ordering = ['branch', 'user__email']


class Category(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['restaurant', 'display_order', 'name']
        unique_together = ['restaurant', 'name']


class Product(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    preparation_time = models.IntegerField(default=15, help_text="Preparation time in minutes")
    sku = models.CharField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"PRD{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def profit_margin(self):
        if self.price > 0:
            return ((self.price - self.cost) / self.price) * 100
        return 0

    def __str__(self):
        return f"{self.name} - ${self.price}"

    class Meta:
        ordering = ['category', 'name']


class InventoryLocation(models.TextChoices):
    WAREHOUSE = 'WAREHOUSE', 'Gudang'
    KITCHEN = 'KITCHEN', 'Dapur'


class Inventory(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory_items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=50, help_text="e.g., kg, liter, piece")
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    min_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    supplier = models.CharField(max_length=200, blank=True)
    location = models.CharField(
        max_length=20,
        choices=InventoryLocation.choices,
        default=InventoryLocation.WAREHOUSE,
        help_text="Storage location: Warehouse for raw materials, Kitchen for ready-to-use items"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def needs_restock(self):
        return self.quantity <= self.min_quantity

    @property
    def total_value(self):
        return self.quantity * self.cost_per_unit

    def __str__(self):
        return f"{self.branch.name} - {self.name} ({self.quantity} {self.unit})"

    class Meta:
        verbose_name_plural = "Inventory"
        ordering = ['branch', 'location', 'name']
        unique_together = ['branch', 'name', 'location']


class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('IN', 'Stock In'),          # Purchase/receive to warehouse
        ('OUT', 'Stock Out'),         # Direct usage/consumption
        ('ADJUST', 'Adjustment'),     # Stock correction
        ('WASTE', 'Waste'),           # Damaged/expired items
        ('TRANSFER', 'Transfer'),     # Warehouse to kitchen transfer
    ]

    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    reference_number = models.CharField(max_length=100, blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_cost(self):
        return self.quantity * self.unit_cost

    def __str__(self):
        return f"{self.inventory.name} - {self.transaction_type} ({self.quantity})"

    class Meta:
        ordering = ['-created_at']


class StockTransfer(models.Model):
    """Records transfers from warehouse to kitchen"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock_transfers')
    item_name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    from_warehouse = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='transfers_out',
        limit_choices_to={'location': 'WAREHOUSE'}
    )
    to_kitchen = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='transfers_in',
        limit_choices_to={'location': 'KITCHEN'}
    )
    transferred_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    transfer_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.item_name} - {self.quantity} {self.unit} (Warehouse → Kitchen)"

    class Meta:
        ordering = ['-transfer_date']
        verbose_name = "Stock Transfer"
        verbose_name_plural = "Stock Transfers"


class Recipe(models.Model):
    """Bill of Materials (BOM) for menu items - defines ingredients needed per serving"""
    product = models.OneToOneField('Product', on_delete=models.CASCADE, related_name='recipe')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='recipes')
    serving_size = models.DecimalField(max_digits=10, decimal_places=2, default=1, help_text="Number of servings this recipe produces")
    preparation_time = models.IntegerField(help_text="Preparation time in minutes", null=True, blank=True)
    cooking_time = models.IntegerField(help_text="Cooking time in minutes", null=True, blank=True)
    instructions = models.TextField(blank=True, help_text="Cooking instructions")
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_cost(self):
        """Calculate total ingredient cost for this recipe"""
        return sum(ingredient.total_cost for ingredient in self.ingredients.all())

    @property
    def cost_per_serving(self):
        """Calculate cost per serving"""
        if self.serving_size > 0:
            return self.total_cost / float(self.serving_size)
        return 0

    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        cost = self.cost_per_serving
        price = float(self.product.price)
        if cost > 0 and price > 0:
            return ((price - cost) / price) * 100
        return 0

    def __str__(self):
        return f"Recipe: {self.product.name}"

    class Meta:
        ordering = ['product__name']
        verbose_name = "Recipe (BOM)"
        verbose_name_plural = "Recipes (BOM)"


class RecipeIngredient(models.Model):
    """Individual ingredients in a recipe with exact quantities"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    inventory_item = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='used_in_recipes')
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        help_text="Quantity needed per serving in base units (g, ml, pcs)"
    )
    unit = models.CharField(max_length=50, help_text="Base unit: gram, ml, piece, etc")
    notes = models.CharField(max_length=200, blank=True, help_text="e.g., 'finely chopped', 'room temperature'")

    @property
    def total_cost(self):
        """Calculate cost for this ingredient based on quantity and unit cost"""
        return float(self.quantity) * float(self.inventory_item.cost_per_unit)

    def __str__(self):
        return f"{self.recipe.product.name} - {self.inventory_item.name}: {self.quantity} {self.unit}"

    class Meta:
        ordering = ['recipe', 'inventory_item__name']
        unique_together = ['recipe', 'inventory_item']


class Table(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='tables')
    number = models.CharField(max_length=10)
    capacity = models.IntegerField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Table {self.number} ({self.branch.name})"

    class Meta:
        ordering = ['branch', 'number']
        unique_together = ['branch', 'number']


class Order(models.Model):
    ORDER_TYPES = [
        ('DINE_IN', 'Dine In'),
        ('TAKEAWAY', 'Takeaway'),
        ('DELIVERY', 'Delivery'),
    ]
    
    ORDER_STATUS = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True, blank=True)
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    order_type = models.CharField(max_length=20, choices=ORDER_TYPES)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='PENDING')
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    delivery_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('Staff', on_delete=models.SET_NULL, null=True, related_name='created_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())

    def __str__(self):
        return f"Order {self.order_number} - {self.status}"

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return (self.unit_price * self.quantity) - self.discount_amount

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    class Meta:
        ordering = ['created_at']


class Payment(models.Model):
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('CARD', 'Credit/Debit Card'),
        ('MOBILE', 'Mobile Payment'),
        ('OTHER', 'Other'),
    ]

    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    transaction_id = models.CharField(max_length=100, unique=True, blank=True)
    processed_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    cashier_session = models.ForeignKey('CashierSession', on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='payments')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = f"PAY{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.status}"

    class Meta:
        ordering = ['-created_at']


class KitchenOrder(models.Model):
    KITCHEN_STATUS = [
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('SERVED', 'Served'),
    ]
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='kitchen_order')
    status = models.CharField(max_length=20, choices=KITCHEN_STATUS, default='PENDING')
    priority = models.IntegerField(default=0)
    assigned_to = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, 
                                   limit_choices_to={'role': StaffRole.KITCHEN})
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Kitchen Order for {self.order.order_number}"

    class Meta:
        ordering = ['-priority', 'created_at']


class KitchenOrderItem(models.Model):
    ITEM_STATUS = [
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
    ]
    
    kitchen_order = models.ForeignKey(KitchenOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='PENDING')
    notes = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.product.name} x {self.quantity} - {self.status}"

    class Meta:
        ordering = ['kitchen_order', 'product']


class Promotion(models.Model):
    DISCOUNT_TYPES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    ]
    
    PROMO_TYPES = [
        ('PRODUCT', 'Product Specific'),
        ('CATEGORY', 'Category Specific'),
        ('ORDER', 'Order Total'),
    ]
    
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='promotions')
    name = models.CharField(max_length=200)
    description = models.TextField()
    promo_code = models.CharField(max_length=50, unique=True, blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_type = models.CharField(max_length=20, choices=PROMO_TYPES, default='ORDER')
    products = models.ManyToManyField(Product, blank=True, related_name='promotions')
    categories = models.ManyToManyField(Category, blank=True, related_name='promotions')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    usage_limit = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.promo_code:
            self.promo_code = f"PROMO{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_date > now or self.end_date < now:
            return False
        if self.usage_limit and self.used_count >= self.usage_limit:
            return False
        return True

    def __str__(self):
        return f"{self.name} ({self.promo_code})"

    class Meta:
        ordering = ['-created_at']


class Schedule(models.Model):
    SHIFT_TYPES = [
        ('MORNING', 'Morning'),
        ('AFTERNOON', 'Afternoon'),
        ('EVENING', 'Evening'),
        ('NIGHT', 'Night'),
    ]
    
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField()
    shift_type = models.CharField(max_length=20, choices=SHIFT_TYPES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_confirmed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        overlapping = Schedule.objects.filter(
            staff=self.staff,
            date=self.date
        ).exclude(pk=self.pk)
        
        for schedule in overlapping:
            if (self.start_time < schedule.end_time and 
                self.end_time > schedule.start_time):
                raise ValidationError("Schedule conflicts with existing schedule")

    def __str__(self):
        return f"{self.staff} - {self.date} {self.shift_type}"

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['staff', 'date', 'shift_type']


class CashierSession(models.Model):
    SESSION_STATUS = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]

    cashier = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='cashier_sessions',
                               limit_choices_to={'role': StaffRole.CASHIER})
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='cashier_sessions')
    shift_type = models.CharField(max_length=20, choices=Schedule.SHIFT_TYPES)

    # Session tracking
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='OPEN')

    # Opening balance
    opening_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Closing data (calculated at settlement)
    expected_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cash_difference = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Summary data (JSON for flexibility)
    settlement_data = models.JSONField(null=True, blank=True)

    # Settlement metadata
    closed_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='closed_sessions')
    notes = models.TextField(blank=True)

    # Override tracking (for manager overrides)
    override_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='session_overrides',
                                   help_text='Manager who authorized session without schedule')
    override_reason = models.TextField(blank=True, help_text='Reason for override')

    def clean(self):
        # Validate only one open session per cashier
        if self.status == 'OPEN' and not self.pk:
            existing_open = CashierSession.objects.filter(
                cashier=self.cashier,
                status='OPEN'
            ).exists()
            if existing_open:
                raise ValidationError(f"{self.cashier} already has an open session")

    def calculate_settlement(self):
        """Calculate settlement data for this session"""
        from django.db.models import Sum, Count, Q

        # Get all payments in this session
        payments = self.payments.filter(status='COMPLETED')

        # Calculate by payment method
        cash_total = payments.filter(payment_method='CASH').aggregate(
            total=Sum('amount'), count=Count('id')
        )
        card_total = payments.filter(payment_method='CARD').aggregate(
            total=Sum('amount'), count=Count('id')
        )
        mobile_total = payments.filter(payment_method='MOBILE').aggregate(
            total=Sum('amount'), count=Count('id')
        )

        # Get orders related to this session
        order_ids = payments.values_list('order_id', flat=True)
        orders = Order.objects.filter(id__in=order_ids)

        completed_count = orders.filter(status='COMPLETED').count()
        cancelled_count = orders.filter(status='CANCELLED').count()

        # Calculate expected cash
        cash_sales = cash_total['total'] or Decimal('0')
        expected_cash = self.opening_cash + cash_sales

        settlement_data = {
            'total_transactions': orders.count(),
            'completed_transactions': completed_count,
            'cancelled_transactions': cancelled_count,
            'cash_payments': {
                'total': float(cash_total['total'] or 0),
                'count': cash_total['count'] or 0
            },
            'card_payments': {
                'total': float(card_total['total'] or 0),
                'count': card_total['count'] or 0
            },
            'mobile_payments': {
                'total': float(mobile_total['total'] or 0),
                'count': mobile_total['count'] or 0
            },
            'total_revenue': float(
                (cash_total['total'] or 0) +
                (card_total['total'] or 0) +
                (mobile_total['total'] or 0)
            )
        }

        return expected_cash, settlement_data

    def __str__(self):
        return f"{self.cashier} - {self.shift_type} - {self.opened_at.date()} ({self.status})"

    class Meta:
        ordering = ['-opened_at']


class SessionAuditLog(models.Model):
    """Audit log for cashier session events"""
    EVENT_TYPES = [
        ('SESSION_OPENED', 'Session Opened'),
        ('SESSION_CLOSED', 'Session Closed'),
        ('OVERRIDE_APPLIED', 'Manager Override Applied'),
        ('SCHEDULE_WARNING', 'Schedule Warning'),
        ('CASH_DISCREPANCY', 'Cash Discrepancy Detected'),
    ]

    session = models.ForeignKey(CashierSession, on_delete=models.CASCADE, related_name='audit_logs')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    performed_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)
    event_data = models.JSONField(null=True, blank=True, help_text='Additional event details')
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} - {self.session} - {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']


class Report(models.Model):
    REPORT_TYPES = [
        ('DAILY', 'Daily Report'),
        ('WEEKLY', 'Weekly Report'),
        ('MONTHLY', 'Monthly Report'),
        ('INVENTORY', 'Inventory Report'),
        ('SALES', 'Sales Report'),
    ]

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    data = models.JSONField()
    generated_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.report_type} - {self.branch.name} ({self.start_date} to {self.end_date})"

    class Meta:
        ordering = ['-created_at']
