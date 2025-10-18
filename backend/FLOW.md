# Inventory Management Flow - Ladapala POS System

This document describes the complete inventory management flow in the Ladapala POS system, including warehouse-kitchen stock separation, Bill of Materials (BOM), stock transfers, and automatic ingredient deduction.

## Table of Contents

1. [Overview](#overview)
2. [Two-Location Inventory System](#two-location-inventory-system)
3. [Bill of Materials (BOM)](#bill-of-materials-bom)
4. [Stock Transfer Flow](#stock-transfer-flow)
5. [Order Creation & Stock Validation](#order-creation--stock-validation)
6. [Payment & Stock Deduction](#payment--stock-deduction)
7. [Menu Availability Check](#menu-availability-check)
8. [API Endpoints](#api-endpoints)
9. [Database Models](#database-models)

---

## Overview

The Ladapala POS system implements a sophisticated inventory management system with:

- **Two-location tracking**: Separate warehouse and kitchen inventory
- **Unit conversion**: Bulk units (kg/liter) in warehouse → Precision units (gram/ml) in kitchen
- **Bill of Materials**: Recipe-based ingredient tracking with exact measurements
- **Automatic stock deduction**: Kitchen stock reduces when orders are paid
- **Double validation**: Stock checked at order creation AND payment
- **Audit trail**: All stock movements logged in InventoryTransaction

---

## Two-Location Inventory System

### Warehouse (WAREHOUSE)
- **Purpose**: Store raw materials in bulk quantities
- **Units**: kg, liter (large units for purchasing)
- **Example**: 100 kg beras @ Rp 10,000/kg

### Kitchen (KITCHEN)
- **Purpose**: Store ready-to-use ingredients for cooking
- **Units**: gram, ml (precise units for recipes)
- **Example**: 50,000 gram beras @ Rp 10/gram

### Unit Conversion Rules

| Warehouse Unit | Kitchen Unit | Conversion |
|---------------|-------------|------------|
| 1 kg          | 1,000 gram  | × 1000     |
| 1 liter       | 1,000 ml    | × 1000     |

**Example:**
```
Warehouse: 10 kg beras @ Rp 10,000/kg
↓ Stock Transfer (unit conversion)
Kitchen: 10,000 gram beras @ Rp 10/gram
```

---

## Bill of Materials (BOM)

Each product (menu item) has a **Recipe** that defines the exact ingredients needed.

### Recipe Model
```python
class Recipe(models.Model):
    product = models.OneToOneField(Product)
    name = models.CharField(max_length=200)
    serving_size = models.IntegerField()  # Number of servings this recipe produces
    preparation_time = models.IntegerField()  # Minutes
```

### Recipe Ingredients
```python
class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe)
    inventory_item = models.ForeignKey(Inventory)  # MUST be KITCHEN location
    quantity = models.DecimalField()  # Per serving
    unit = models.CharField()  # gram, ml, pcs, etc.
```

### Example: Nasi Goreng Recipe
```
Product: Nasi Goreng (Rp 25,000)
Recipe: Nasi Goreng
Serving Size: 1 portion
Preparation Time: 15 minutes

Ingredients (per serving):
- Beras (Kitchen): 250 gram
- Minyak Goreng (Kitchen): 30 ml
- Bawang Merah (Kitchen): 50 gram
- Telur (Kitchen): 1 pcs

Total Cost: Rp 7,500 per serving
Profit Margin: Rp 17,500 (70%)
```

---

## Stock Transfer Flow

### Step 1: Create Stock Transfer Record
```python
StockTransfer.objects.create(
    from_location='WAREHOUSE',
    to_location='KITCHEN',
    inventory_item=warehouse_inventory,
    quantity_transferred=10.00,  # 10 kg
    transferred_by=staff,
    notes="Transfer untuk operasional dapur"
)
```

### Step 2: Deduct from Warehouse
```python
# Warehouse: 100 kg → 90 kg
warehouse_inventory.quantity -= 10.00
warehouse_inventory.save()

InventoryTransaction.objects.create(
    inventory=warehouse_inventory,
    transaction_type='OUT',
    quantity=-10.00,
    unit='kg',
    notes="Transfer ke Kitchen"
)
```

### Step 3: Add to Kitchen (with unit conversion)
```python
# Kitchen: 50,000 gram → 60,000 gram
kitchen_inventory.quantity += 10000.00  # 10 kg = 10,000 gram
kitchen_inventory.save()

InventoryTransaction.objects.create(
    inventory=kitchen_inventory,
    transaction_type='IN',
    quantity=10000.00,
    unit='gram',
    notes="Transfer dari Warehouse (10.00 kg)"
)
```

### Conversion Formula
```python
if warehouse_unit == 'kg' and kitchen_unit == 'gram':
    kitchen_quantity = warehouse_quantity * 1000

if warehouse_unit == 'liter' and kitchen_unit == 'ml':
    kitchen_quantity = warehouse_quantity * 1000

# Cost per unit also converts
warehouse_cost_per_kg = 10000  # Rp 10,000/kg
kitchen_cost_per_gram = 10     # Rp 10/gram (10000 / 1000)
```

---

## Order Creation & Stock Validation

**CHECKPOINT 1: Stock validation happens BEFORE order is created**

### Flow Diagram
```
User creates order
    ↓
OrderCreateSerializer.create()
    ↓
Check each product's recipe
    ↓
Calculate total ingredients needed
    ↓
Check kitchen stock availability
    ↓
[Insufficient?] → Reject order with error message
    ↓
[Sufficient?] → Create order (stock NOT deducted yet)
```

### Implementation (OrderCreateSerializer)
```python
def create(self, validated_data):
    items_data = validated_data.pop('items')

    # VALIDATE STOCK AVAILABILITY BEFORE CREATING ORDER
    insufficient_items = []

    for item_data in items_data:
        product = item_data.get('product')
        quantity = item_data.get('quantity')

        try:
            recipe = product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = float(recipe_ingredient.quantity) * quantity

                if inventory_item.quantity < total_quantity_needed:
                    insufficient_items.append({
                        'product': product.name,
                        'ingredient': inventory_item.name,
                        'needed': total_quantity_needed,
                        'available': float(inventory_item.quantity),
                        'unit': inventory_item.unit
                    })
        except Recipe.DoesNotExist:
            pass  # Products without recipes can proceed

    # REJECT if insufficient stock
    if insufficient_items:
        raise serializers.ValidationError({
            'error': 'Stok bahan tidak mencukupi untuk membuat pesanan',
            'details': error_messages
        })

    # Stock is sufficient, create order
    order = Order.objects.create(**validated_data)

    # Create order items
    for item_data in items_data:
        OrderItem.objects.create(order=order, **item_data)

    return order
```

### Example Validation Error
```json
{
  "error": "Stok bahan tidak mencukupi untuk membuat pesanan",
  "details": [
    "Nasi Goreng memerlukan Beras: 250.00 gram (tersedia: 100.00 gram)",
    "Nasi Goreng memerlukan Minyak Goreng: 30.00 ml (tersedia: 10.00 ml)"
  ]
}
```

---

## Payment & Stock Deduction

**CHECKPOINT 2: Stock validation + deduction happens when payment is processed**

### Flow Diagram
```
User processes payment
    ↓
PaymentViewSet.perform_create()
    ↓
Re-validate stock availability (safety check)
    ↓
[Insufficient?] → Reject payment with error
    ↓
[Sufficient?] → Deduct ingredients from kitchen stock
    ↓
Create InventoryTransaction records (audit trail)
    ↓
Create Payment record
    ↓
Update Order status to PAID
```

### Implementation (PaymentViewSet)
```python
def perform_create(self, serializer):
    order = serializer.validated_data.get('order')

    # RE-VALIDATE stock availability (safety check)
    insufficient_items = []

    for order_item in order.items.all():
        quantity_ordered = order_item.quantity

        try:
            recipe = order_item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = float(recipe_ingredient.quantity) * quantity_ordered

                if inventory_item.quantity < total_quantity_needed:
                    insufficient_items.append(...)
        except Recipe.DoesNotExist:
            pass

    # REJECT payment if stock insufficient
    if insufficient_items:
        raise ValidationError({
            'error': 'Stok tidak mencukupi',
            'details': insufficient_items
        })

    # DEDUCT ingredients from kitchen stock
    for order_item in order.items.all():
        quantity_ordered = order_item.quantity

        try:
            recipe = order_item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = float(recipe_ingredient.quantity) * quantity_ordered

                # Deduct from kitchen inventory
                inventory_item.quantity -= Decimal(str(total_quantity_needed))
                inventory_item.save()

                # Create audit trail
                InventoryTransaction.objects.create(
                    inventory=inventory_item,
                    transaction_type='OUT',
                    quantity=-Decimal(str(total_quantity_needed)),
                    unit=inventory_item.unit,
                    reference_type='ORDER',
                    reference_id=order.id,
                    notes=f"Used for {order_item.product.name} (Order #{order.id})"
                )
        except Recipe.DoesNotExist:
            pass

    # Create payment
    serializer.save()
```

### Example: Order Payment Deduction

**Order:**
- 2x Nasi Goreng

**Kitchen Stock Before:**
- Beras: 5,000 gram
- Minyak: 500 ml
- Bawang: 1,000 gram

**Deduction Calculation:**
```
Nasi Goreng recipe (per serving):
- Beras: 250 gram
- Minyak: 30 ml
- Bawang: 50 gram

2 servings ordered:
- Beras: 250 × 2 = 500 gram
- Minyak: 30 × 2 = 60 ml
- Bawang: 50 × 2 = 100 gram
```

**Kitchen Stock After:**
- Beras: 5,000 - 500 = 4,500 gram
- Minyak: 500 - 60 = 440 ml
- Bawang: 1,000 - 100 = 900 gram

**InventoryTransaction Records Created:**
```
1. Beras: -500 gram (OUT) - "Used for Nasi Goreng (Order #123)"
2. Minyak: -60 ml (OUT) - "Used for Nasi Goreng (Order #123)"
3. Bawang: -100 gram (OUT) - "Used for Nasi Goreng (Order #123)"
```

---

## Menu Availability Check

Frontend can check which menu items can be made based on current kitchen stock.

### API Endpoint
```
GET /api/products/check_stock_availability/
```

### Implementation
```python
@action(detail=False, methods=['get'])
def check_stock_availability(self, request):
    products = self.get_queryset().filter(is_available=True)
    product_availability = []

    for product in products:
        availability_info = {
            'id': product.id,
            'name': product.name,
            'price': str(product.price),
            'category': product.category.name if product.category else None,
            'image': product.image.url if product.image else None,
            'can_be_made': True,
            'insufficient_ingredients': []
        }

        try:
            recipe = product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                quantity_needed = float(recipe_ingredient.quantity)

                if inventory_item.quantity < quantity_needed:
                    availability_info['can_be_made'] = False
                    availability_info['insufficient_ingredients'].append({
                        'name': inventory_item.name,
                        'needed': quantity_needed,
                        'available': float(inventory_item.quantity),
                        'unit': inventory_item.unit
                    })
        except Recipe.DoesNotExist:
            availability_info['can_be_made'] = True

        product_availability.append(availability_info)

    return Response(product_availability)
```

### Response Example
```json
[
  {
    "id": 1,
    "name": "Nasi Goreng",
    "price": "25000.00",
    "category": "Main Course",
    "image": "/media/products/nasi-goreng.jpg",
    "can_be_made": true,
    "insufficient_ingredients": []
  },
  {
    "id": 2,
    "name": "Mie Goreng",
    "price": "22000.00",
    "category": "Main Course",
    "image": "/media/products/mie-goreng.jpg",
    "can_be_made": false,
    "insufficient_ingredients": [
      {
        "name": "Mie",
        "needed": 200.0,
        "available": 50.0,
        "unit": "gram"
      }
    ]
  }
]
```

### Frontend Usage
```typescript
// Fetch availability
const availability = await api.checkProductStockAvailability();

// Disable unavailable items
availability.forEach(item => {
  if (!item.can_be_made) {
    // Show as unavailable in menu
    // Display insufficient ingredients
  }
});
```

---

## API Endpoints

### Inventory Management
```
GET    /api/inventory/                    # List all inventory
GET    /api/inventory/{id}/               # Get inventory detail
POST   /api/inventory/                    # Create inventory item
PUT    /api/inventory/{id}/               # Update inventory item
DELETE /api/inventory/{id}/               # Delete inventory item
GET    /api/inventory/low-stock/          # Get low stock items
```

### Stock Transfers
```
GET    /api/inventory-transactions/       # List all transactions
POST   /api/inventory-transactions/       # Create transaction (manual)
GET    /api/inventory-transactions/{id}/  # Get transaction detail
```

### Recipes
```
GET    /api/recipes/                      # List all recipes
GET    /api/recipes/{id}/                 # Get recipe detail
POST   /api/recipes/                      # Create recipe
PUT    /api/recipes/{id}/                 # Update recipe
DELETE /api/recipes/{id}/                 # Delete recipe
```

### Recipe Ingredients
```
GET    /api/recipe-ingredients/           # List all recipe ingredients
POST   /api/recipe-ingredients/           # Add ingredient to recipe
PUT    /api/recipe-ingredients/{id}/      # Update ingredient
DELETE /api/recipe-ingredients/{id}/      # Remove ingredient
```

### Product Availability
```
GET    /api/products/check_stock_availability/  # Check which products can be made
```

### Orders
```
POST   /api/orders/                       # Create order (validates stock)
GET    /api/orders/                       # List orders
GET    /api/orders/{id}/                  # Get order detail
```

### Payments
```
POST   /api/payments/                     # Create payment (deducts stock)
GET    /api/payments/                     # List payments
```

---

## Database Models

### Inventory
```python
class Inventory(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(
        max_length=20,
        choices=InventoryLocation.choices,  # WAREHOUSE or KITCHEN
        default=InventoryLocation.WAREHOUSE
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)  # kg, gram, liter, ml, pcs
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    min_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    branch = models.ForeignKey(Branch)

    @property
    def needs_restock(self):
        return self.quantity <= self.min_quantity

    @property
    def total_value(self):
        return self.quantity * self.cost_per_unit
```

### StockTransfer
```python
class StockTransfer(models.Model):
    from_location = models.CharField(max_length=20)
    to_location = models.CharField(max_length=20)
    inventory_item = models.ForeignKey(Inventory)
    quantity_transferred = models.DecimalField(max_digits=10, decimal_places=2)
    transferred_by = models.ForeignKey(Staff)
    transfer_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
```

### InventoryTransaction
```python
class InventoryTransaction(models.Model):
    inventory = models.ForeignKey(Inventory)
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices  # IN, OUT, ADJUST, WASTE, TRANSFER
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    reference_type = models.CharField(max_length=50, blank=True)  # ORDER, TRANSFER, etc.
    reference_id = models.IntegerField(blank=True, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(Staff, null=True, blank=True)
```

### Recipe
```python
class Recipe(models.Model):
    product = models.OneToOneField(Product, related_name='recipe')
    name = models.CharField(max_length=200)
    serving_size = models.IntegerField()
    preparation_time = models.IntegerField()
    instructions = models.TextField(blank=True)

    @property
    def total_cost(self):
        return sum(
            ingredient.total_cost
            for ingredient in self.ingredients.all()
        )

    @property
    def cost_per_serving(self):
        if self.serving_size > 0:
            return self.total_cost / float(self.serving_size)
        return 0

    @property
    def profit_margin(self):
        cost = self.cost_per_serving
        price = float(self.product.price)
        if cost > 0:
            return ((price - cost) / price) * 100
        return 0
```

### RecipeIngredient
```python
class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, related_name='ingredients')
    inventory_item = models.ForeignKey(
        Inventory,
        limit_choices_to={'location': 'KITCHEN'}  # Must be kitchen inventory
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    notes = models.TextField(blank=True)

    @property
    def total_cost(self):
        return float(self.quantity) * float(self.inventory_item.cost_per_unit)
```

---

## Complete Flow Example

### Scenario: Customer orders 2x Nasi Goreng

**Initial State:**
```
Kitchen Inventory:
- Beras: 10,000 gram @ Rp 10/gram
- Minyak: 2,000 ml @ Rp 15/ml
- Bawang: 3,000 gram @ Rp 20/gram
- Telur: 50 pcs @ Rp 2,000/pcs

Nasi Goreng Recipe (per serving):
- Beras: 250 gram
- Minyak: 30 ml
- Bawang: 50 gram
- Telur: 1 pcs
```

### Step 1: Customer Creates Order
```
POST /api/orders/
{
  "table": 5,
  "items": [
    {
      "product": 1,  // Nasi Goreng
      "quantity": 2
    }
  ]
}
```

### Step 2: Order Validation (CHECKPOINT 1)
```python
# Calculate total ingredients needed for 2 servings:
- Beras: 250 × 2 = 500 gram
- Minyak: 30 × 2 = 60 ml
- Bawang: 50 × 2 = 100 gram
- Telur: 1 × 2 = 2 pcs

# Check availability:
✓ Beras: 500 needed, 10,000 available
✓ Minyak: 60 needed, 2,000 available
✓ Bawang: 100 needed, 3,000 available
✓ Telur: 2 needed, 50 available

# Result: Order created successfully (stock NOT deducted yet)
```

### Step 3: Order Status Updates
```
Order #123: CONFIRMED → PREPARING → READY → COMPLETED
```

### Step 4: Customer Pays
```
POST /api/payments/
{
  "order": 123,
  "amount": 50000,
  "payment_method": "CASH"
}
```

### Step 5: Payment Validation + Deduction (CHECKPOINT 2)
```python
# Re-validate stock (safety check)
✓ All ingredients still available

# Deduct ingredients:
inventory.get(name='Beras', location='KITCHEN').quantity -= 500
inventory.get(name='Minyak', location='KITCHEN').quantity -= 60
inventory.get(name='Bawang', location='KITCHEN').quantity -= 100
inventory.get(name='Telur', location='KITCHEN').quantity -= 2

# Create audit trail (4 InventoryTransaction records)
InventoryTransaction.create(
    inventory=Beras,
    transaction_type='OUT',
    quantity=-500,
    reference_type='ORDER',
    reference_id=123,
    notes="Used for Nasi Goreng (Order #123)"
)
# ... (repeat for other ingredients)

# Create payment
Payment.create(order=123, amount=50000, method='CASH')
```

### Final State:
```
Kitchen Inventory (after deduction):
- Beras: 9,500 gram (was 10,000)
- Minyak: 1,940 ml (was 2,000)
- Bawang: 2,900 gram (was 3,000)
- Telur: 48 pcs (was 50)

Order #123: PAID
Payment #456: Rp 50,000 (CASH)

Audit Trail:
- 4 InventoryTransaction records created
- Complete traceability of all ingredient usage
```

---

## Summary

The Ladapala inventory management system provides:

1. ✅ **Two-location tracking** - Warehouse (bulk) + Kitchen (precise)
2. ✅ **Unit conversion** - Automatic kg→gram, liter→ml conversion
3. ✅ **Bill of Materials** - Recipe-based ingredient tracking
4. ✅ **Double validation** - Check stock at order creation AND payment
5. ✅ **Automatic deduction** - Kitchen stock reduces when orders are paid
6. ✅ **Menu availability** - Frontend can check and disable unavailable items
7. ✅ **Complete audit trail** - All stock movements logged
8. ✅ **Cost tracking** - Recipe cost, profit margin calculation

This ensures accurate inventory control, prevents overselling, and maintains complete traceability of all stock movements.
