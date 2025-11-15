from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import uuid
from datetime import date


class Restaurant(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    serial_number = models.CharField(max_length=50, blank=True, help_text='Restaurant serial number')
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
    CHEF = 'CHEF', 'Chef'
    KITCHEN = 'KITCHEN', 'Kitchen Staff'
    BAR = 'BAR', 'Bar Staff'
    WAITRESS = 'WAITRESS', 'Waitress'
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
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='products', default=7)
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

    # Promo & Seasonal fields
    is_seasonal = models.BooleanField(default=False, help_text="Is this a seasonal menu item?")
    is_promo = models.BooleanField(default=False, help_text="Is this item on promotion?")
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Discount percentage (0-100)")
    promo_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Promotional price (overrides discount_percentage if set)")
    promo_label = models.CharField(max_length=100, blank=True, help_text="Custom promo label (e.g. 'Buy 1 Get 1', 'Limited Time')")
    valid_from = models.DateField(null=True, blank=True, help_text="Promo valid from date")
    valid_until = models.DateField(null=True, blank=True, help_text="Promo valid until date")

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"PRD{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def profit_margin(self):
        if self.price > 0:
            return ((self.price - self.cost) / self.price) * 100
        return 0

    @property
    def effective_price(self):
        """Get the effective price considering promos"""
        from django.utils import timezone
        from decimal import Decimal

        # Check if promo is active
        if self.is_promo:
            today = timezone.now().date()

            # Check validity dates
            if self.valid_from and today < self.valid_from:
                return self.price
            if self.valid_until and today > self.valid_until:
                return self.price

            # Use promo_price if set, otherwise calculate from discount_percentage
            if self.promo_price:
                return self.promo_price
            elif self.discount_percentage:
                discount = self.price * (self.discount_percentage / Decimal('100'))
                return self.price - discount

        return self.price

    @property
    def is_promo_active(self):
        """Check if promo is currently active"""
        from django.utils import timezone

        if not self.is_promo:
            return False

        today = timezone.now().date()

        # Check validity dates
        if self.valid_from and today < self.valid_from:
            return False
        if self.valid_until and today > self.valid_until:
            return False

        return True

    def __str__(self):
        return f"{self.name} - ${self.price}"

    class Meta:
        ordering = ['category', 'name']


class InventoryLocation(models.TextChoices):
    WAREHOUSE = 'WAREHOUSE', 'Gudang'
    KITCHEN = 'KITCHEN', 'Dapur'
    BAR = 'BAR', 'Bar'


class InventoryItemType(models.TextChoices):
    CONSUMABLE = 'CONSUMABLE', 'Consumable (Food/Beverage)'
    UTILITY = 'UTILITY', 'Utility (Non-food)'
    EQUIPMENT = 'EQUIPMENT', 'Equipment (Durable)'


class InventoryCategory(models.TextChoices):
    # Food & Beverage
    FOOD = 'FOOD', 'Food Ingredient'
    BEVERAGE = 'BEVERAGE', 'Beverage'

    # Utilities
    CLEANING = 'CLEANING', 'Cleaning Supplies'
    SERVING = 'SERVING', 'Serving Items'
    PACKAGING = 'PACKAGING', 'Packaging'
    KITCHEN_TOOLS = 'KITCHEN_TOOLS', 'Kitchen Tools'
    DISPOSABLES = 'DISPOSABLES', 'Disposables'
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'
    OTHER = 'OTHER', 'Other'


class Inventory(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory_items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=50, help_text="e.g., kg, liter, piece")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_per_unit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Moving average cost per unit, updated when PO items are received"
    )
    location = models.CharField(
        max_length=20,
        choices=InventoryLocation.choices,
        default=InventoryLocation.WAREHOUSE,
        help_text="Storage location: Warehouse for raw materials, Kitchen for ready-to-use items"
    )

    # Item type and category
    item_type = models.CharField(
        max_length=20,
        choices=InventoryItemType.choices,
        default=InventoryItemType.CONSUMABLE,
        help_text="Type of inventory item",
        db_index=True
    )
    category = models.CharField(
        max_length=20,
        choices=InventoryCategory.choices,
        default=InventoryCategory.FOOD,
        help_text="Category of inventory item",
        db_index=True
    )

    # Utility-specific fields
    is_durable = models.BooleanField(
        default=False,
        help_text="Is this a durable item (e.g., plates, cutlery)?"
    )
    par_stock_level = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optimal stock level to maintain (for utilities)"
    )
    lifespan_days = models.IntegerField(
        null=True,
        blank=True,
        help_text="Expected lifespan in days (for durable items)"
    )
    breakage_count = models.IntegerField(
        default=0,
        help_text="Total count of breakage/loss (for durable utilities)"
    )
    last_restock_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date of last stock replenishment"
    )

    # Expiry tracking fields (for consumables only)
    earliest_expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Earliest expiry date among all active batches for this item"
    )
    has_expiring_items = models.BooleanField(
        default=False,
        help_text="Flag indicating if any batches are expiring within 30 days"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def needs_restock(self):
        """Check if item needs restocking (for consumables uses min_quantity, for utilities uses par_stock_level)"""
        if self.item_type == InventoryItemType.UTILITY and self.par_stock_level:
            return self.quantity <= self.par_stock_level
        return self.quantity <= self.min_quantity

    @property
    def below_par_stock(self):
        """Check if utility item is below par stock level"""
        if self.item_type == InventoryItemType.UTILITY and self.par_stock_level:
            return self.quantity < self.par_stock_level
        return False

    @property
    def breakage_rate(self):
        """Calculate breakage rate as percentage of total handled"""
        if self.item_type != InventoryItemType.UTILITY or not self.is_durable:
            return 0
        # Calculate based on transactions
        total_received = self.transactions.filter(transaction_type='IN').aggregate(
            total=models.Sum('quantity')
        )['total'] or 0
        if total_received == 0:
            return 0
        return (self.breakage_count / float(total_received)) * 100

    @property
    def average_cost(self):
        """Calculate weighted average cost from recent transactions"""
        recent_receipts = self.transactions.filter(
            transaction_type='IN'
        ).order_by('-created_at')[:10]

        if not recent_receipts.exists():
            return 0

        total_cost = sum(t.unit_cost * t.quantity for t in recent_receipts)
        total_qty = sum(t.quantity for t in recent_receipts)

        return total_cost / total_qty if total_qty > 0 else 0

    @property
    def total_value(self):
        """Estimated value based on cost per unit"""
        return self.quantity * self.cost_per_unit

    def update_cost_moving_average(self, new_quantity, new_unit_cost):
        """
        Update cost_per_unit using moving average formula.
        Formula: (Old Qty × Old Cost + New Qty × New Cost) / (Old Qty + New Qty)

        Args:
            new_quantity: Decimal - Quantity being added
            new_unit_cost: Decimal - Unit cost of new quantity
        """
        old_qty = self.quantity
        old_cost = self.cost_per_unit

        # If current stock is zero or cost is zero, use new cost directly
        if old_qty == 0 or old_cost == 0:
            self.cost_per_unit = new_unit_cost
        else:
            # Moving average calculation
            total_cost = (old_qty * old_cost) + (new_quantity * new_unit_cost)
            total_qty = old_qty + new_quantity
            self.cost_per_unit = total_cost / total_qty if total_qty > 0 else new_unit_cost

        self.save()

    def __str__(self):
        return f"{self.branch.name} - {self.name} ({self.quantity} {self.unit})"

    class Meta:
        verbose_name_plural = "Inventory (Legacy)"
        ordering = ['branch', 'location', 'name']
        unique_together = ['branch', 'name', 'location']


class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('IN', 'Stock In'),          # Purchase/receive to warehouse
        ('OUT', 'Stock Out'),         # Direct usage/consumption
        ('ADJUST', 'Adjustment'),     # Stock correction
        ('WASTE', 'Waste'),           # Damaged/expired items
        ('TRANSFER', 'Transfer'),     # Warehouse to kitchen transfer
        ('BREAKAGE', 'Breakage'),     # Breakage/loss for durable utilities
    ]

    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    reference_number = models.CharField(max_length=100, blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)

    # Batch tracking fields
    batch_number = models.CharField(max_length=100, blank=True, db_index=True)
    expiry_date = models.DateField(null=True, blank=True)
    manufacturing_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_cost(self):
        return self.quantity * self.unit_cost

    def __str__(self):
        return f"{self.inventory.name} - {self.transaction_type} ({self.quantity})"

    class Meta:
        ordering = ['-created_at']


class BatchStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    EXPIRING = 'EXPIRING', 'Expiring Soon'
    EXPIRED = 'EXPIRED', 'Expired'
    DISPOSED = 'DISPOSED', 'Disposed'


class InventoryBatch(models.Model):
    """
    Tracks individual batches of inventory items with expiry dates.
    Each batch represents a specific quantity received from a purchase order.
    Supports FIFO (First In First Out) inventory management.
    """
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100, unique=True, db_index=True)

    # Quantity tracking
    quantity_remaining = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Current quantity available in this batch"
    )
    original_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Original quantity when batch was received"
    )

    # Expiry information
    expiry_date = models.DateField(db_index=True, help_text="Date when this batch expires")
    manufacturing_date = models.DateField(null=True, blank=True)

    # Purchase information
    purchase_order = models.ForeignKey(
        'PurchaseOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='batches'
    )
    received_date = models.DateField(auto_now_add=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=BatchStatus.choices,
        default=BatchStatus.ACTIVE,
        db_index=True
    )
    disposed_at = models.DateTimeField(null=True, blank=True)
    disposed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disposed_batches'
    )
    disposal_method = models.CharField(
        max_length=50,
        blank=True,
        help_text="Method of disposal: WASTE, DONATED, RETURNED"
    )
    disposal_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_active(self):
        """Check if batch is still active (not expired or disposed)"""
        return self.status == BatchStatus.ACTIVE and self.quantity_remaining > 0

    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        if not self.expiry_date:
            return None
        delta = self.expiry_date - date.today()
        return delta.days

    @property
    def is_expiring_soon(self):
        """Check if batch is expiring within 30 days"""
        days = self.days_until_expiry
        return days is not None and 0 < days <= 30

    @property
    def is_expired(self):
        """Check if batch has expired"""
        days = self.days_until_expiry
        return days is not None and days < 0

    @property
    def usage_percentage(self):
        """Calculate how much of the batch has been used"""
        if self.original_quantity == 0:
            return 0
        return float((self.original_quantity - self.quantity_remaining) / self.original_quantity * 100)

    def update_status(self):
        """Auto-update status based on expiry date and quantity"""
        if self.quantity_remaining <= 0:
            self.status = BatchStatus.DISPOSED
        elif self.is_expired:
            self.status = BatchStatus.EXPIRED
        elif self.is_expiring_soon:
            self.status = BatchStatus.EXPIRING
        else:
            self.status = BatchStatus.ACTIVE
        self.save()

    def __str__(self):
        return f"{self.batch_number} - {self.inventory.name} (Exp: {self.expiry_date})"

    class Meta:
        ordering = ['expiry_date', 'created_at']  # FIFO ordering
        verbose_name = "Inventory Batch"
        verbose_name_plural = "Inventory Batches"


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
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='CONFIRMED')

    # Customer info (for non-members or legacy orders)
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)

    # Link to member (optional - only if customer wants loyalty benefits)
    customer = models.ForeignKey('Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')

    delivery_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('Staff', on_delete=models.SET_NULL, null=True, related_name='created_orders')

    # Staff tracking - who handled this order at each stage
    order_taken_by = models.ForeignKey(
        'Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders_taken',
        help_text='Waitress who took the order'
    )
    prepared_by = models.ForeignKey(
        'Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders_prepared',
        help_text='Chef/Bar staff who prepared the order'
    )
    served_by = models.ForeignKey(
        'Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders_served',
        help_text='Waitress who served the order'
    )

    # Session tracking
    waitress_session = models.ForeignKey(
        'StaffSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders_taken_in_session',
        help_text='Waitress session when order was taken'
    )

    # Timestamps for order lifecycle
    taken_at = models.DateTimeField(null=True, blank=True, help_text='When order was taken')
    preparation_started_at = models.DateTimeField(null=True, blank=True, help_text='When chef/bar claimed it')
    preparation_completed_at = models.DateTimeField(null=True, blank=True, help_text='When marked READY')
    served_at = models.DateTimeField(null=True, blank=True, help_text='When marked COMPLETED')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())

    def deduct_inventory(self):
        """
        Deduct inventory based on recipes when order is confirmed/preparing.
        Returns (success: bool, message: str)
        """
        from decimal import Decimal

        if self.status not in ['CONFIRMED', 'PREPARING']:
            return False, "Order must be CONFIRMED or PREPARING to deduct inventory"

        deductions = []
        errors = []

        for order_item in self.items.all():
            try:
                # Get recipe for this product
                recipe = Recipe.objects.filter(product=order_item.product, is_active=True).first()

                if not recipe:
                    errors.append(f"No active recipe found for {order_item.product.name}")
                    continue

                # Deduct each ingredient
                for ingredient in recipe.ingredients.all():
                    required_qty = Decimal(str(ingredient.quantity)) * order_item.quantity
                    inventory_item = ingredient.inventory_item

                    # Check sufficient stock
                    if inventory_item.quantity < required_qty:
                        errors.append(
                            f"Insufficient stock for {inventory_item.name} in {inventory_item.location}: "
                            f"need {required_qty} {inventory_item.unit}, have {inventory_item.quantity}"
                        )
                        continue

                    # Deduct inventory
                    inventory_item.quantity -= required_qty
                    inventory_item.save()

                    # Create transaction record
                    InventoryTransaction.objects.create(
                        inventory=inventory_item,
                        transaction_type='USAGE',
                        quantity=-required_qty,
                        unit_cost=inventory_item.cost_per_unit,
                        reference_number=self.order_number,
                        performed_by=self.created_by.user if self.created_by else None,
                        notes=f"Used for Order {self.order_number} - {order_item.product.name} x{order_item.quantity}"
                    )

                    deductions.append(
                        f"{inventory_item.name} ({inventory_item.location}): -{required_qty} {inventory_item.unit}"
                    )

            except Exception as e:
                errors.append(f"Error processing {order_item.product.name}: {str(e)}")

        if errors:
            return False, "; ".join(errors)

        return True, f"Deducted {len(deductions)} ingredients"

    def __str__(self):
        return f"Order {self.order_number} - {self.status}"

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    ITEM_STATUS = [
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('PARTIALLY_SERVED', 'Partially Served'),
        ('SERVED', 'Served'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    quantity_served = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='PENDING')

    # Per-item staff tracking
    prepared_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prepared_items',
        help_text='Chef/Bar staff who prepared this specific item'
    )

    # Per-item timestamps
    preparation_started_at = models.DateTimeField(null=True, blank=True)
    preparation_completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return (self.unit_price * self.quantity) - self.discount_amount

    @property
    def quantity_remaining(self):
        return self.quantity - self.quantity_served

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    class Meta:
        ordering = ['created_at']


class ServingHistory(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='serving_history')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='serving_history')
    quantity_served = models.IntegerField()
    served_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='served_orders')
    served_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.order_item.product.name} x{self.quantity_served}"

    class Meta:
        ordering = ['-served_at']
        verbose_name_plural = 'Serving Histories'


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

    # Void transaction fields
    void_reason = models.TextField(blank=True)
    voided_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='voided_payments')
    voided_at = models.DateTimeField(null=True, blank=True)

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


class StaffSession(models.Model):
    """
    Session tracking for WAITRESS, BAR, CHEF, and KITCHEN staff.
    Tracks when staff start/end their shift and performance metrics.
    """
    SESSION_STATUS = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]

    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='staff_sessions',
        help_text='Staff member (WAITRESS, BAR, CHEF, or KITCHEN)'
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='staff_sessions')
    schedule = models.ForeignKey(
        Schedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_sessions',
        help_text='Link to schedule for this session'
    )
    shift_type = models.CharField(max_length=20, choices=Schedule.SHIFT_TYPES)

    # Session tracking
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='OPEN')

    # Override tracking (for staff without schedule)
    override_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_session_overrides',
        help_text='Manager who authorized session without schedule'
    )
    override_reason = models.TextField(blank=True, help_text='Reason for override')

    # Performance tracking
    orders_taken_count = models.IntegerField(default=0, help_text='For waitress - orders taken')
    orders_prepared_count = models.IntegerField(default=0, help_text='For kitchen/bar - orders prepared')
    orders_served_count = models.IntegerField(default=0, help_text='For waitress - orders served')
    items_prepared_count = models.IntegerField(default=0, help_text='For kitchen/bar - individual items prepared')

    # Session notes
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        # Validate only one open session per staff
        if self.status == 'OPEN' and not self.pk:
            existing_open = StaffSession.objects.filter(
                staff=self.staff,
                status='OPEN'
            ).exists()
            if existing_open:
                raise ValidationError(f"{self.staff} already has an open session")

        # Validate schedule exists for today if no override
        if not self.override_by and not self.schedule:
            from datetime import date
            today = date.today()
            schedule = Schedule.objects.filter(
                staff=self.staff,
                date=today,
                is_confirmed=True
            ).first()
            if not schedule:
                raise ValidationError(
                    f"{self.staff} does not have a confirmed schedule for today. "
                    "Manager override is required."
                )

    def close_session(self):
        """Close this session and calculate final metrics"""
        if self.status == 'CLOSED':
            raise ValidationError("Session is already closed")

        self.status = 'CLOSED'
        self.closed_at = timezone.now()
        self.save()

    @property
    def duration(self):
        """Calculate session duration in hours"""
        if not self.closed_at:
            end_time = timezone.now()
        else:
            end_time = self.closed_at

        duration = end_time - self.opened_at
        return duration.total_seconds() / 3600  # Convert to hours

    @property
    def average_prep_time(self):
        """Calculate average preparation time for orders (kitchen/bar staff)"""
        if self.orders_prepared_count == 0:
            return 0

        from django.db.models import Avg, F
        from datetime import timedelta

        avg = Order.objects.filter(
            prepared_by=self.staff,
            preparation_started_at__isnull=False,
            preparation_completed_at__isnull=False,
            preparation_started_at__gte=self.opened_at
        ).annotate(
            prep_duration=F('preparation_completed_at') - F('preparation_started_at')
        ).aggregate(avg_duration=Avg('prep_duration'))

        if avg['avg_duration']:
            return avg['avg_duration'].total_seconds() / 60  # Return in minutes
        return 0

    def __str__(self):
        return f"{self.staff.user.get_full_name()} - {self.shift_type} - {self.opened_at.date()} ({self.status})"

    class Meta:
        ordering = ['-opened_at']
        verbose_name = "Staff Session"
        verbose_name_plural = "Staff Sessions"
        indexes = [
            models.Index(fields=['staff', 'status']),
            models.Index(fields=['branch', 'opened_at']),
        ]


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
        ('PAYMENT_VOIDED', 'Payment Voided'),
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


class PurchaseOrderStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    APPROVED = 'APPROVED', 'Approved'
    RECEIVED = 'RECEIVED', 'Received'
    CANCELLED = 'CANCELLED', 'Cancelled'


class PurchaseOrder(models.Model):
    """Purchase Order for ordering inventory items from suppliers"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='purchase_orders')
    po_number = models.CharField(max_length=50, unique=True, db_index=True)
    supplier_name = models.CharField(max_length=200)
    supplier_contact = models.CharField(max_length=100, blank=True)
    supplier_email = models.EmailField(blank=True)
    supplier_phone = models.CharField(max_length=20, blank=True)
    supplier_address = models.TextField(blank=True)
    payment_terms_days = models.IntegerField(default=30, help_text='Number of days for payment (e.g., 30 for Net 30)')
    tax_id = models.CharField(max_length=50, blank=True, help_text='NPWP or Tax ID')

    status = models.CharField(
        max_length=20,
        choices=PurchaseOrderStatus.choices,
        default=PurchaseOrderStatus.DRAFT
    )

    order_date = models.DateField(default=date.today)
    expected_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)

    created_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='created_purchase_orders')
    approved_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_purchase_orders')
    received_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_purchase_orders')

    notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_amount(self):
        """Calculate total amount from all items"""
        return sum(item.total_price for item in self.items.all())

    @property
    def total_items(self):
        """Count total number of items"""
        return self.items.count()

    def generate_po_number(self):
        """Generate unique PO number: PO-YYYYMMDD-XXXX"""
        from datetime import datetime
        date_str = datetime.now().strftime('%Y%m%d')
        last_po = PurchaseOrder.objects.filter(
            po_number__startswith=f'PO-{date_str}'
        ).order_by('-po_number').first()

        if last_po:
            last_sequence = int(last_po.po_number.split('-')[-1])
            new_sequence = last_sequence + 1
        else:
            new_sequence = 1

        return f'PO-{date_str}-{new_sequence:04d}'

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = self.generate_po_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.po_number} - {self.supplier_name} ({self.status})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Purchase Order"
        verbose_name_plural = "Purchase Orders"


class PurchaseOrderItem(models.Model):
    """Individual items in a purchase order"""
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    inventory_item = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='purchase_order_items')

    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    notes = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_price(self):
        """Calculate total price for this item"""
        return float(self.quantity) * float(self.unit_price)

    def __str__(self):
        return f"{self.purchase_order.po_number} - {self.inventory_item.name}: {self.quantity}"

    class Meta:
        ordering = ['purchase_order', 'inventory_item__name']
        unique_together = ['purchase_order', 'inventory_item']


class Vendor(models.Model):
    """Vendor/Supplier master data"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='vendors')
    name = models.CharField(max_length=200, db_index=True)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    payment_terms_days = models.IntegerField(default=30, help_text='Number of days for payment')
    tax_id = models.CharField(max_length=50, blank=True, help_text='NPWP or Tax ID')

    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.branch.name}"

    class Meta:
        ordering = ['name']
        unique_together = ['branch', 'name']
        verbose_name = "Vendor"
        verbose_name_plural = "Vendors"


# ===========================
# Customer Relationship Management Models
# ===========================

class Customer(models.Model):
    """
    Customer master data for membership and loyalty program
    """
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('OTHER', 'Other'),
    ]

    TIER_CHOICES = [
        ('BRONZE', 'Bronze'),
        ('SILVER', 'Silver'),
        ('GOLD', 'Gold'),
        ('PLATINUM', 'Platinum'),
    ]

    # Basic Info
    phone_number = models.CharField(max_length=15, unique=True, db_index=True, help_text='Primary identifier')
    name = models.CharField(max_length=100)
    email = models.EmailField(null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)

    # Membership
    membership_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='BRONZE', db_index=True)
    membership_number = models.CharField(max_length=50, unique=True, db_index=True)  # Auto-generated: MBR-{year}{month}-{seq}
    join_date = models.DateTimeField(auto_now_add=True)

    # Loyalty Points
    points_balance = models.IntegerField(default=0, help_text='Current available points')
    lifetime_points = models.IntegerField(default=0, help_text='Total points earned ever')

    # Stats
    total_visits = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    last_visit = models.DateTimeField(null=True, blank=True)

    # Preferences
    favorite_products = models.ManyToManyField('Product', blank=True, related_name='favorited_by')
    notes = models.TextField(blank=True, help_text='Staff notes about customer')

    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.membership_number})"

    def save(self, *args, **kwargs):
        # Auto-generate membership number if not set
        if not self.membership_number:
            from datetime import datetime
            now = datetime.now()
            # Find latest member number for this month
            prefix = f"MBR-{now.year}{now.month:02d}"
            latest = Customer.objects.filter(membership_number__startswith=prefix).order_by('-membership_number').first()
            if latest:
                # Extract sequence number and increment
                try:
                    seq = int(latest.membership_number.split('-')[-1]) + 1
                except:
                    seq = 1
            else:
                seq = 1
            self.membership_number = f"{prefix}-{seq:04d}"
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Customer"
        verbose_name_plural = "Customers"


class LoyaltyTransaction(models.Model):
    """
    Track all loyalty points transactions (earn, redeem, expire, adjust)
    """
    TRANSACTION_TYPES = [
        ('EARN', 'Earn Points'),
        ('REDEEM', 'Redeem Points'),
        ('EXPIRE', 'Expire Points'),
        ('ADJUST', 'Manual Adjustment'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='loyalty_transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, db_index=True)
    points = models.IntegerField(help_text='Positive for earn, negative for redeem')
    balance_after = models.IntegerField(help_text='Points balance after this transaction')

    # Related entities
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='loyalty_transactions')
    reward = models.ForeignKey('Reward', on_delete=models.SET_NULL, null=True, blank=True)

    # Details
    description = models.CharField(max_length=255)
    expiry_date = models.DateField(null=True, blank=True, help_text='For earned points')

    # Audit
    created_by = models.ForeignKey('Staff', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.name} - {self.transaction_type} - {self.points} points"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Loyalty Transaction"
        verbose_name_plural = "Loyalty Transactions"


class Reward(models.Model):
    """
    Loyalty rewards catalog - items customers can redeem with points
    """
    REWARD_TYPES = [
        ('DISCOUNT', 'Discount'),
        ('FREE_ITEM', 'Free Item'),
        ('VOUCHER', 'Voucher'),
    ]

    DISCOUNT_TYPES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    points_required = models.IntegerField(help_text='Points needed to redeem this reward')

    # Reward Type
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPES)

    # For DISCOUNT type
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, null=True, blank=True)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # For FREE_ITEM type
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)

    # For VOUCHER type
    voucher_code = models.CharField(max_length=20, null=True, blank=True)
    voucher_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Availability
    is_active = models.BooleanField(default=True, db_index=True)
    stock_quantity = models.IntegerField(null=True, blank=True, help_text='null = unlimited')
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)

    # Restrictions
    min_purchase = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Minimum purchase amount to use reward')
    max_redemptions_per_customer = models.IntegerField(null=True, blank=True)

    # Display
    image = models.ImageField(upload_to='rewards/', null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.points_required} points)"

    class Meta:
        ordering = ['sort_order', 'points_required']
        verbose_name = "Reward"
        verbose_name_plural = "Rewards"


class CustomerFeedback(models.Model):
    """
    Customer feedback and ratings for orders
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('REVIEWED', 'Reviewed'),
        ('RESOLVED', 'Resolved'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')

    # Ratings (1-5 stars)
    food_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    service_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    ambiance_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    value_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    overall_rating = models.FloatField(help_text='Calculated average of all ratings')

    # Feedback
    comment = models.TextField(blank=True)
    liked = models.TextField(blank=True, help_text='What they liked')
    disliked = models.TextField(blank=True, help_text="What they didn't like")
    suggestions = models.TextField(blank=True)

    # Would recommend?
    would_recommend = models.BooleanField(null=True, blank=True)

    # Contact for follow-up (optional for anonymous feedback)
    contact_name = models.CharField(max_length=100, blank=True)
    contact_phone = models.CharField(max_length=15, blank=True)
    contact_email = models.EmailField(blank=True)

    # Response
    staff_response = models.TextField(blank=True)
    responded_by = models.ForeignKey('Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='feedback_responses')
    responded_at = models.DateTimeField(null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    is_public = models.BooleanField(default=False, help_text='Display on website/app')

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Calculate overall rating as average
        self.overall_rating = (
            self.food_rating + self.service_rating +
            self.ambiance_rating + self.value_rating
        ) / 4.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Feedback from {self.customer.name if self.customer else 'Anonymous'} - {self.overall_rating}★"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Customer Feedback"
        verbose_name_plural = "Customer Feedbacks"


class MembershipTierBenefit(models.Model):
    """
    Configuration for membership tier requirements and benefits
    """
    TIER_CHOICES = [
        ('BRONZE', 'Bronze'),
        ('SILVER', 'Silver'),
        ('GOLD', 'Gold'),
        ('PLATINUM', 'Platinum'),
    ]

    tier = models.CharField(max_length=20, choices=TIER_CHOICES, unique=True)

    # Requirements
    min_total_spent = models.DecimalField(max_digits=12, decimal_places=2, help_text='Minimum lifetime spending to reach this tier')
    min_visits = models.IntegerField(default=0, help_text='Minimum number of visits')

    # Benefits
    points_multiplier = models.FloatField(default=1.0, help_text='Points earning multiplier (e.g., 1.5 = 50% bonus)')
    birthday_bonus_points = models.IntegerField(default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Auto discount on all purchases')

    # Perks
    priority_reservation = models.BooleanField(default=False)
    complimentary_items = models.ManyToManyField(Product, blank=True, related_name='complimentary_for_tiers')

    # Display
    description = models.TextField()
    color_code = models.CharField(max_length=7, default='#CD7F32', help_text='Hex color code for tier')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tier} Tier"

    class Meta:
        ordering = ['min_total_spent']
        verbose_name = "Membership Tier Benefit"
        verbose_name_plural = "Membership Tier Benefits"


class RestaurantSettings(models.Model):
    """Restaurant-wide settings and configurations"""
    restaurant = models.OneToOneField(Restaurant, on_delete=models.CASCADE, related_name='settings')

    # Restaurant Information
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=11.00, help_text='Tax percentage (e.g., 11.00 for 11%)')
    currency = models.CharField(max_length=3, default='IDR', help_text='Currency code (e.g., IDR, USD)')
    timezone = models.CharField(max_length=50, default='Asia/Jakarta', help_text='Timezone for the restaurant')

    # Notification Settings
    low_stock_alerts = models.BooleanField(default=True)
    new_order_alerts = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    daily_reports = models.BooleanField(default=True)
    weekly_reports = models.BooleanField(default=True)

    # System Settings
    auto_backup = models.BooleanField(default=True)
    backup_frequency = models.CharField(
        max_length=20,
        default='daily',
        choices=[
            ('hourly', 'Hourly'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly')
        ]
    )
    data_retention_days = models.IntegerField(default=365, help_text='Number of days to retain data')
    enable_audit_log = models.BooleanField(default=True)
    session_timeout_minutes = models.IntegerField(default=30, help_text='Session timeout in minutes')

    # Printer Settings
    kitchen_printer_ip = models.CharField(max_length=15, blank=True, help_text='IP address of kitchen printer')
    bar_printer_ip = models.CharField(max_length=15, blank=True, help_text='IP address of bar printer')
    receipt_printer_ip = models.CharField(max_length=15, blank=True, help_text='IP address of receipt printer')
    enable_auto_print = models.BooleanField(default=True)
    print_receipts = models.BooleanField(default=True)
    print_kitchen_orders = models.BooleanField(default=True)

    # Security Settings
    min_password_length = models.IntegerField(default=8)
    password_expiry_days = models.IntegerField(default=90)
    require_special_chars = models.BooleanField(default=True)
    require_numbers = models.BooleanField(default=True)
    enable_two_factor = models.BooleanField(default=False)
    enable_ip_restriction = models.BooleanField(default=False)
    max_login_attempts = models.IntegerField(default=3)
    enable_data_encryption = models.BooleanField(default=True)
    anonymize_logs = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.restaurant.name}"

    class Meta:
        verbose_name = "Restaurant Settings"
        verbose_name_plural = "Restaurant Settings"
