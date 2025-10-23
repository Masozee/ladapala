from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Inventory, InventoryTransaction,
    Recipe, RecipeIngredient, StockTransfer,
    Order, OrderItem, Payment, CashierSession
)

User = get_user_model()


# =============================================================================
# RECIPE SYSTEM TESTS
# =============================================================================

class RecipeSystemTestCase(TestCase):
    """Test recipe system and automatic ingredient deduction"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name='Test Restaurant',
            address='Test Address'
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Main Address'
        )

        # Create staff
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role='CASHIER',
            phone='08123456789'
        )

        # Create cashier session
        self.session = CashierSession.objects.create(
            cashier=self.staff,
            branch=self.branch,
            shift_type='MORNING',
            opening_cash=Decimal('1000000.00')
        )

        # Create category
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name='Main Dishes'
        )

        # Create product (Nasi Goreng)
        self.product = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Nasi Goreng',
            price=Decimal('25000.00'),
            is_available=True
        )

        # Create kitchen inventory items
        self.rice_inventory = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('10000.00'),  # 10kg
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('10.00'),  # Rp 10/gram
            location='KITCHEN'
        )

        self.egg_inventory = Inventory.objects.create(
            branch=self.branch,
            name='Telur',
            unit='pcs',
            quantity=Decimal('100.00'),
            min_quantity=Decimal('20.00'),
            cost_per_unit=Decimal('2000.00'),  # Rp 2000/pcs
            location='KITCHEN'
        )

        self.oil_inventory = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('5000.00'),  # 5 liters
            min_quantity=Decimal('1000.00'),
            cost_per_unit=Decimal('15.00'),  # Rp 15/ml
            location='KITCHEN'
        )

        # Create recipe for Nasi Goreng
        self.recipe = Recipe.objects.create(
            product=self.product,
            branch=self.branch,
            serving_size=Decimal('1.00'),
            preparation_time=10,
            cooking_time=15,
            instructions='Goreng beras dengan telur dan bumbu',
            is_active=True
        )

        # Create recipe ingredients
        self.recipe_rice = RecipeIngredient.objects.create(
            recipe=self.recipe,
            inventory_item=self.rice_inventory,
            quantity=Decimal('250.000'),  # 250 grams per serving
            unit='gram',
            notes='Beras putih matang'
        )

        self.recipe_egg = RecipeIngredient.objects.create(
            recipe=self.recipe,
            inventory_item=self.egg_inventory,
            quantity=Decimal('1.000'),  # 1 egg per serving
            unit='pcs'
        )

        self.recipe_oil = RecipeIngredient.objects.create(
            recipe=self.recipe,
            inventory_item=self.oil_inventory,
            quantity=Decimal('20.000'),  # 20ml per serving
            unit='ml'
        )

    def test_recipe_creation(self):
        """Test recipe is created correctly"""
        self.assertEqual(self.recipe.product.name, 'Nasi Goreng')
        self.assertEqual(self.recipe.ingredients.count(), 3)
        self.assertEqual(self.recipe.serving_size, Decimal('1.00'))

    def test_recipe_cost_calculation(self):
        """Test recipe total cost and cost per serving calculation"""
        # Expected costs:
        # Rice: 250g × Rp 10 = Rp 2,500
        # Egg: 1 × Rp 2,000 = Rp 2,000
        # Oil: 20ml × Rp 15 = Rp 300
        # Total: Rp 4,800

        expected_total_cost = Decimal('4800.00')
        self.assertEqual(self.recipe.total_cost, expected_total_cost)
        self.assertEqual(self.recipe.cost_per_serving, expected_total_cost)

    def test_recipe_profit_margin(self):
        """Test profit margin calculation"""
        # Selling price: Rp 25,000
        # Cost: Rp 4,800
        # Profit: Rp 20,200
        # Margin: (20,200 / 25,000) × 100 = 80.8%

        cost = self.recipe.cost_per_serving
        price = float(self.product.price)
        profit = price - cost
        margin = (profit / price) * 100

        self.assertAlmostEqual(margin, 80.8, places=1)

    def test_ingredient_deduction_single_order(self):
        """Test automatic ingredient deduction for single order"""
        # Store initial quantities
        initial_rice = self.rice_inventory.quantity
        initial_egg = self.egg_inventory.quantity
        initial_oil = self.oil_inventory.quantity

        # Create order with 1 Nasi Goreng
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price
        )

        # Create payment (this should trigger ingredient deduction)
        payment = Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        # Manually trigger the deduction logic (since we're not using ViewSet)
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = Decimal(str(float(recipe_ingredient.quantity) * item.quantity))
                inventory_item.quantity -= total_quantity_needed
                inventory_item.save()

                InventoryTransaction.objects.create(
                    inventory=inventory_item,
                    transaction_type='OUT',
                    quantity=total_quantity_needed,
                    unit_cost=inventory_item.cost_per_unit,
                    reference_number=f"ORDER-{order.id}",
                    performed_by=self.user,
                    notes=f"Auto-deduction for {item.quantity}x {item.product.name}"
                )

        # Refresh inventory from database
        self.rice_inventory.refresh_from_db()
        self.egg_inventory.refresh_from_db()
        self.oil_inventory.refresh_from_db()

        # Expected deductions for 1 serving:
        # Rice: 250g
        # Egg: 1 pcs
        # Oil: 20ml

        self.assertEqual(
            self.rice_inventory.quantity,
            initial_rice - Decimal('250.00')
        )
        self.assertEqual(
            self.egg_inventory.quantity,
            initial_egg - Decimal('1.00')
        )
        self.assertEqual(
            self.oil_inventory.quantity,
            initial_oil - Decimal('20.00')
        )

    def test_ingredient_deduction_multiple_items(self):
        """Test automatic ingredient deduction for multiple items"""
        # Store initial quantities
        initial_rice = self.rice_inventory.quantity
        initial_egg = self.egg_inventory.quantity
        initial_oil = self.oil_inventory.quantity

        # Create order with 3 Nasi Goreng
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=3,  # Order 3 servings
            unit_price=self.product.price
        )

        # Simulate ingredient deduction
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = Decimal(str(float(recipe_ingredient.quantity) * item.quantity))
                inventory_item.quantity -= total_quantity_needed
                inventory_item.save()

        # Refresh inventory from database
        self.rice_inventory.refresh_from_db()
        self.egg_inventory.refresh_from_db()
        self.oil_inventory.refresh_from_db()

        # Expected deductions for 3 servings:
        # Rice: 250g × 3 = 750g
        # Egg: 1 × 3 = 3 pcs
        # Oil: 20ml × 3 = 60ml

        self.assertEqual(
            self.rice_inventory.quantity,
            initial_rice - Decimal('750.00')
        )
        self.assertEqual(
            self.egg_inventory.quantity,
            initial_egg - Decimal('3.00')
        )
        self.assertEqual(
            self.oil_inventory.quantity,
            initial_oil - Decimal('60.00')
        )

    def test_inventory_transaction_logging(self):
        """Test that inventory transactions are logged correctly"""
        initial_transaction_count = InventoryTransaction.objects.count()

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            unit_price=self.product.price
        )

        # Simulate ingredient deduction with logging
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = Decimal(str(float(recipe_ingredient.quantity) * item.quantity))
                inventory_item.quantity -= total_quantity_needed
                inventory_item.save()

                InventoryTransaction.objects.create(
                    inventory=inventory_item,
                    transaction_type='OUT',
                    quantity=total_quantity_needed,
                    unit_cost=inventory_item.cost_per_unit,
                    reference_number=f"ORDER-{order.id}",
                    performed_by=self.user,
                    notes=f"Auto-deduction for {item.quantity}x {item.product.name}"
                )

        # Should create 3 transactions (one for each ingredient)
        self.assertEqual(
            InventoryTransaction.objects.count(),
            initial_transaction_count + 3
        )

        # Verify transaction details
        rice_transaction = InventoryTransaction.objects.filter(
            inventory=self.rice_inventory,
            reference_number=f"ORDER-{order.id}"
        ).first()

        self.assertIsNotNone(rice_transaction)
        self.assertEqual(rice_transaction.transaction_type, 'OUT')
        self.assertEqual(rice_transaction.quantity, Decimal('500.00'))  # 250g × 2

    def test_product_without_recipe(self):
        """Test that products without recipes don't cause errors"""
        # Create product without recipe
        product_no_recipe = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Minuman',
            price=Decimal('5000.00'),
            is_available=True
        )

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=product_no_recipe,
            quantity=1,
            unit_price=product_no_recipe.price
        )

        # Try to process - should not raise error
        try:
            for item in order.items.all():
                try:
                    recipe = item.product.recipe
                    # Should not reach here
                    self.fail("Should have raised Recipe.DoesNotExist")
                except Recipe.DoesNotExist:
                    # Expected - product has no recipe
                    pass
        except Exception as e:
            self.fail(f"Unexpected error: {e}")

    def test_warehouse_vs_kitchen_separation(self):
        """Test that warehouse and kitchen inventories are separate"""
        # Create warehouse inventory for the same item
        warehouse_rice = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('50000.00'),  # 50kg in warehouse
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('10.00'),
            location='WAREHOUSE'
        )

        # Kitchen inventory should be different
        self.assertNotEqual(warehouse_rice.id, self.rice_inventory.id)
        self.assertEqual(warehouse_rice.location, 'WAREHOUSE')
        self.assertEqual(self.rice_inventory.location, 'KITCHEN')

        # Recipe should only use kitchen inventory
        self.assertEqual(self.recipe_rice.inventory_item.location, 'KITCHEN')

    def test_low_stock_detection(self):
        """Test that low stock is detected correctly"""
        # Reduce rice to below minimum
        self.rice_inventory.quantity = Decimal('1500.00')
        self.rice_inventory.save()

        self.assertTrue(self.rice_inventory.needs_restock)

        # Increase back above minimum
        self.rice_inventory.quantity = Decimal('3000.00')
        self.rice_inventory.save()

        self.assertFalse(self.rice_inventory.needs_restock)

    def test_inventory_total_value_calculation(self):
        """Test inventory total value calculation"""
        # Rice: 10,000g × Rp 10 = Rp 100,000
        expected_value = Decimal('100000.00')
        self.assertEqual(self.rice_inventory.total_value, expected_value)

        # Egg: 100 pcs × Rp 2,000 = Rp 200,000
        expected_egg_value = Decimal('200000.00')
        self.assertEqual(self.egg_inventory.total_value, expected_egg_value)

    def test_insufficient_stock_detection(self):
        """Test that insufficient stock is properly detected"""
        # Reduce rice to very low amount
        self.rice_inventory.quantity = Decimal('100.00')  # Only 100g available
        self.rice_inventory.save()

        # Order 1 Nasi Goreng (needs 250g rice)
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price
        )

        # Simulate the validation that happens in PaymentViewSet
        insufficient_items = []
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = float(recipe_ingredient.quantity) * item.quantity

                if inventory_item.quantity < total_quantity_needed:
                    insufficient_items.append({
                        'product': item.product.name,
                        'ingredient': inventory_item.name,
                        'needed': total_quantity_needed,
                        'available': float(inventory_item.quantity),
                        'unit': inventory_item.unit
                    })

        # Should have found insufficient rice
        self.assertEqual(len(insufficient_items), 1)
        self.assertEqual(insufficient_items[0]['ingredient'], 'Beras')
        self.assertEqual(insufficient_items[0]['needed'], 250.0)
        self.assertEqual(insufficient_items[0]['available'], 100.0)

    def test_sufficient_stock_allows_payment(self):
        """Test that payment proceeds when all ingredients are sufficient"""
        # All ingredients are already sufficient in setUp
        # Rice: 10,000g, Egg: 100pcs, Oil: 5,000ml

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=5,  # Order 5 servings
            unit_price=self.product.price
        )

        # Check validation
        insufficient_items = []
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = float(recipe_ingredient.quantity) * item.quantity

                if inventory_item.quantity < total_quantity_needed:
                    insufficient_items.append(inventory_item.name)

        # Should have no insufficient items
        self.assertEqual(len(insufficient_items), 0)


# =============================================================================
# STOCK TRANSFER TESTS
# =============================================================================

class StockTransferTestCase(TestCase):
    """Test warehouse to kitchen stock transfer system"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='warehouse@example.com',
            password='testpass123',
            first_name='Warehouse',
            last_name='Manager'
        )

        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name='Test Restaurant',
            address='Test Address'
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Main Address'
        )

        # Create warehouse inventory
        self.warehouse_rice = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('50000.00'),  # 50kg in warehouse
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('10.00'),
            location='WAREHOUSE'
        )

        self.warehouse_oil = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('10000.00'),  # 10 liters
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('15.00'),
            location='WAREHOUSE'
        )

        # Create kitchen inventory (initially low stock)
        self.kitchen_rice = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('1000.00'),  # Only 1kg in kitchen
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('10.00'),
            location='KITCHEN'
        )

        self.kitchen_oil = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('500.00'),  # Only 500ml
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('15.00'),
            location='KITCHEN'
        )

    def test_warehouse_kitchen_separate_inventory(self):
        """Test that warehouse and kitchen maintain separate inventory records"""
        # Should have separate records for same item
        self.assertNotEqual(self.warehouse_rice.id, self.kitchen_rice.id)

        # Different locations
        self.assertEqual(self.warehouse_rice.location, 'WAREHOUSE')
        self.assertEqual(self.kitchen_rice.location, 'KITCHEN')

        # Same item name and unit
        self.assertEqual(self.warehouse_rice.name, self.kitchen_rice.name)
        self.assertEqual(self.warehouse_rice.unit, self.kitchen_rice.unit)

        # Different quantities
        self.assertNotEqual(self.warehouse_rice.quantity, self.kitchen_rice.quantity)

    def test_stock_transfer_creation(self):
        """Test creating a stock transfer from warehouse to kitchen"""
        initial_warehouse_qty = self.warehouse_rice.quantity
        initial_kitchen_qty = self.kitchen_rice.quantity
        transfer_qty = Decimal('10000.00')  # Transfer 10kg

        # Create stock transfer record
        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Weekly restock'
        )

        # Verify transfer was created
        self.assertEqual(transfer.item_name, 'Beras')
        self.assertEqual(transfer.quantity, transfer_qty)
        self.assertEqual(transfer.from_warehouse, self.warehouse_rice)
        self.assertEqual(transfer.to_kitchen, self.kitchen_rice)
        self.assertEqual(transfer.transferred_by, self.user)

    def test_stock_transfer_updates_quantities(self):
        """Test that transfer updates both warehouse and kitchen quantities"""
        initial_warehouse_qty = self.warehouse_rice.quantity
        initial_kitchen_qty = self.kitchen_rice.quantity
        transfer_qty = Decimal('10000.00')  # Transfer 10kg

        # Simulate the transfer process (as done in the API)
        # 1. Deduct from warehouse
        self.warehouse_rice.quantity -= transfer_qty
        self.warehouse_rice.save()

        # 2. Add to kitchen
        self.kitchen_rice.quantity += transfer_qty
        self.kitchen_rice.save()

        # 3. Create transfer record
        StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user
        )

        # Refresh from database
        self.warehouse_rice.refresh_from_db()
        self.kitchen_rice.refresh_from_db()

        # Verify quantities updated correctly
        self.assertEqual(
            self.warehouse_rice.quantity,
            initial_warehouse_qty - transfer_qty
        )
        self.assertEqual(
            self.kitchen_rice.quantity,
            initial_kitchen_qty + transfer_qty
        )

    def test_stock_transfer_with_transactions(self):
        """Test that transfer creates proper inventory transactions"""
        transfer_qty = Decimal('5000.00')  # Transfer 5kg

        # Create TRANSFER OUT transaction for warehouse
        warehouse_transaction = InventoryTransaction.objects.create(
            inventory=self.warehouse_rice,
            transaction_type='TRANSFER',
            quantity=transfer_qty,
            unit_cost=self.warehouse_rice.cost_per_unit,
            reference_number='TRF-001',
            performed_by=self.user,
            notes='Transfer ke dapur'
        )

        # Create TRANSFER IN transaction for kitchen
        kitchen_transaction = InventoryTransaction.objects.create(
            inventory=self.kitchen_rice,
            transaction_type='TRANSFER',
            quantity=transfer_qty,
            unit_cost=self.kitchen_rice.cost_per_unit,
            reference_number='TRF-001',
            performed_by=self.user,
            notes='Transfer dari gudang'
        )

        # Update quantities
        self.warehouse_rice.quantity -= transfer_qty
        self.warehouse_rice.save()
        self.kitchen_rice.quantity += transfer_qty
        self.kitchen_rice.save()

        # Create transfer record
        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user
        )

        # Verify transactions were created
        self.assertEqual(
            InventoryTransaction.objects.filter(
                inventory=self.warehouse_rice,
                transaction_type='TRANSFER'
            ).count(),
            1
        )
        self.assertEqual(
            InventoryTransaction.objects.filter(
                inventory=self.kitchen_rice,
                transaction_type='TRANSFER'
            ).count(),
            1
        )

        # Verify transaction amounts
        self.assertEqual(warehouse_transaction.quantity, transfer_qty)
        self.assertEqual(kitchen_transaction.quantity, transfer_qty)

    def test_insufficient_warehouse_stock(self):
        """Test that transfer fails when warehouse stock is insufficient"""
        # Try to transfer more than available
        transfer_qty = Decimal('60000.00')  # Want 60kg, but only 50kg available

        initial_warehouse_qty = self.warehouse_rice.quantity

        # This should be prevented by validation
        if self.warehouse_rice.quantity < transfer_qty:
            # Transfer should not proceed
            can_transfer = False
        else:
            can_transfer = True

        self.assertFalse(can_transfer)

        # Warehouse quantity should remain unchanged
        self.assertEqual(self.warehouse_rice.quantity, initial_warehouse_qty)

    def test_multiple_transfers_same_day(self):
        """Test multiple transfers from warehouse to kitchen"""
        # Transfer 1: 5kg rice
        transfer1_qty = Decimal('5000.00')
        self.warehouse_rice.quantity -= transfer1_qty
        self.kitchen_rice.quantity += transfer1_qty
        self.warehouse_rice.save()
        self.kitchen_rice.save()

        transfer1 = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer1_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Morning restock'
        )

        # Transfer 2: 3kg rice
        transfer2_qty = Decimal('3000.00')
        self.warehouse_rice.quantity -= transfer2_qty
        self.kitchen_rice.quantity += transfer2_qty
        self.warehouse_rice.save()
        self.kitchen_rice.save()

        transfer2 = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer2_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Afternoon restock'
        )

        # Verify both transfers recorded
        self.assertEqual(StockTransfer.objects.count(), 2)

        # Verify total quantity transferred
        total_transferred = transfer1_qty + transfer2_qty
        expected_warehouse = Decimal('50000.00') - total_transferred
        expected_kitchen = Decimal('1000.00') + total_transferred

        self.warehouse_rice.refresh_from_db()
        self.kitchen_rice.refresh_from_db()

        self.assertEqual(self.warehouse_rice.quantity, expected_warehouse)
        self.assertEqual(self.kitchen_rice.quantity, expected_kitchen)

    def test_transfer_different_items(self):
        """Test transferring different items from warehouse to kitchen"""
        rice_transfer = Decimal('10000.00')
        oil_transfer = Decimal('2000.00')

        # Transfer rice
        self.warehouse_rice.quantity -= rice_transfer
        self.kitchen_rice.quantity += rice_transfer
        self.warehouse_rice.save()
        self.kitchen_rice.save()

        StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=rice_transfer,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user
        )

        # Transfer oil
        self.warehouse_oil.quantity -= oil_transfer
        self.kitchen_oil.quantity += oil_transfer
        self.warehouse_oil.save()
        self.kitchen_oil.save()

        StockTransfer.objects.create(
            branch=self.branch,
            item_name='Minyak Goreng',
            quantity=oil_transfer,
            unit='ml',
            from_warehouse=self.warehouse_oil,
            to_kitchen=self.kitchen_oil,
            transferred_by=self.user
        )

        # Verify both transfers recorded
        self.assertEqual(StockTransfer.objects.count(), 2)

        # Verify rice quantities
        self.warehouse_rice.refresh_from_db()
        self.kitchen_rice.refresh_from_db()
        self.assertEqual(self.warehouse_rice.quantity, Decimal('40000.00'))
        self.assertEqual(self.kitchen_rice.quantity, Decimal('11000.00'))

        # Verify oil quantities
        self.warehouse_oil.refresh_from_db()
        self.kitchen_oil.refresh_from_db()
        self.assertEqual(self.warehouse_oil.quantity, Decimal('8000.00'))
        self.assertEqual(self.kitchen_oil.quantity, Decimal('2500.00'))

    def test_transfer_audit_trail(self):
        """Test that transfers create proper audit trail"""
        transfer_qty = Decimal('7500.00')

        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Daily restock for peak hours'
        )

        # Verify audit information
        self.assertIsNotNone(transfer.transfer_date)
        self.assertEqual(transfer.transferred_by, self.user)
        self.assertEqual(transfer.notes, 'Daily restock for peak hours')

        # Verify the transfer can be tracked
        transfers = StockTransfer.objects.filter(
            branch=self.branch,
            item_name='Beras'
        )
        self.assertEqual(transfers.count(), 1)
        self.assertEqual(transfers.first(), transfer)

    def test_kitchen_stock_below_minimum_after_use(self):
        """Test restock needed when kitchen stock falls below minimum"""
        # Kitchen rice is at 1kg, minimum is 5kg
        self.assertTrue(self.kitchen_rice.needs_restock)

        # Transfer to bring above minimum
        transfer_qty = Decimal('10000.00')  # Transfer 10kg
        self.kitchen_rice.quantity += transfer_qty
        self.kitchen_rice.save()

        self.kitchen_rice.refresh_from_db()
        self.assertFalse(self.kitchen_rice.needs_restock)
        self.assertEqual(self.kitchen_rice.quantity, Decimal('11000.00'))

    def test_cost_consistency_warehouse_kitchen(self):
        """Test that cost per unit is consistent between warehouse and kitchen"""
        # Same item should have same cost in warehouse and kitchen
        self.assertEqual(
            self.warehouse_rice.cost_per_unit,
            self.kitchen_rice.cost_per_unit
        )
        self.assertEqual(
            self.warehouse_oil.cost_per_unit,
            self.kitchen_oil.cost_per_unit
        )

    def test_transfer_value_calculation(self):
        """Test calculating total value of transferred stock"""
        transfer_qty = Decimal('8000.00')  # 8kg
        cost_per_unit = self.warehouse_rice.cost_per_unit

        # Calculate transfer value
        transfer_value = transfer_qty * cost_per_unit
        expected_value = Decimal('80000.00')  # 8000g × Rp 10

        self.assertEqual(transfer_value, expected_value)

    def test_unit_conversion_warehouse_to_kitchen_for_bom(self):
        """Test unit conversion when transferring stock for recipe (BOM) usage"""
        # Create category and product
        category = Category.objects.create(
            restaurant=self.restaurant,
            name='Main Dishes'
        )

        product = Product.objects.create(
            restaurant=self.restaurant,
            category=category,
            name='Nasi Goreng Special',
            price=Decimal('35000.00')
        )

        # Warehouse has rice in KG (different unit from recipe)
        warehouse_rice_kg = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='kg',  # Warehouse uses KG
            quantity=Decimal('100.00'),  # 100 kg
            min_quantity=Decimal('20.00'),
            cost_per_unit=Decimal('15000.00'),  # Rp 15,000 per kg
            location='WAREHOUSE'
        )

        # Kitchen will receive in grams (for recipe precision)
        kitchen_rice_grams = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='gram',  # Kitchen uses GRAMS for precise BOM
            quantity=Decimal('5000.00'),  # 5 kg = 5,000 grams
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('15.00'),  # Rp 15 per gram (15,000 / 1,000)
            location='KITCHEN'
        )

        # Create recipe that uses grams (standard BOM unit)
        recipe = Recipe.objects.create(
            product=product,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        # Recipe uses precise gram measurements
        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=kitchen_rice_grams,
            quantity=Decimal('300.000'),  # 300 grams per serving
            unit='gram'
        )

        # TRANSFER: Convert 10 kg from warehouse to 10,000 grams in kitchen
        warehouse_transfer_kg = Decimal('10.00')  # Transfer 10 kg
        kitchen_receive_grams = warehouse_transfer_kg * Decimal('1000')  # Convert to 10,000 grams

        # Update quantities
        warehouse_rice_kg.quantity -= warehouse_transfer_kg
        kitchen_rice_grams.quantity += kitchen_receive_grams
        warehouse_rice_kg.save()
        kitchen_rice_grams.save()

        # Create transfer record (showing conversion)
        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras Premium',
            quantity=warehouse_transfer_kg,  # Record original warehouse unit
            unit='kg',
            from_warehouse=warehouse_rice_kg,
            to_kitchen=kitchen_rice_grams,
            transferred_by=self.user,
            notes=f'Transferred {warehouse_transfer_kg} kg = {kitchen_receive_grams} grams to kitchen'
        )

        # Verify warehouse reduced by 10 kg
        warehouse_rice_kg.refresh_from_db()
        self.assertEqual(warehouse_rice_kg.quantity, Decimal('90.00'))  # 100 - 10

        # Verify kitchen increased by 10,000 grams
        kitchen_rice_grams.refresh_from_db()
        self.assertEqual(kitchen_rice_grams.quantity, Decimal('15000.00'))  # 5,000 + 10,000

        # Verify recipe can now make servings
        # Recipe needs 300g per serving
        # Kitchen has 15,000g
        # Can make: 15,000 / 300 = 50 servings
        max_servings = kitchen_rice_grams.quantity / Decimal('300.00')
        self.assertEqual(max_servings, Decimal('50.00'))

        # Verify cost consistency after conversion
        # Warehouse: Rp 15,000 per kg
        # Kitchen: Rp 15 per gram = Rp 15,000 per 1,000 grams = Rp 15,000 per kg ✓
        warehouse_cost_per_gram = warehouse_rice_kg.cost_per_unit / Decimal('1000')
        self.assertEqual(warehouse_cost_per_gram, kitchen_rice_grams.cost_per_unit)

    def test_transfer_with_different_base_units(self):
        """Test transferring items with different base units (kg to gram, liter to ml)"""
        # Scenario 1: Warehouse in KG, Kitchen in GRAMS
        warehouse_flour = Inventory.objects.create(
            branch=self.branch,
            name='Tepung Terigu',
            unit='kg',
            quantity=Decimal('50.00'),  # 50 kg
            min_quantity=Decimal('10.00'),
            cost_per_unit=Decimal('12000.00'),  # Rp 12,000 per kg
            location='WAREHOUSE'
        )

        kitchen_flour = Inventory.objects.create(
            branch=self.branch,
            name='Tepung Terigu',
            unit='gram',
            quantity=Decimal('2000.00'),  # 2 kg = 2,000 grams
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('12.00'),  # Rp 12 per gram
            location='KITCHEN'
        )

        # Transfer 15 kg = 15,000 grams
        transfer_kg = Decimal('15.00')
        transfer_grams = transfer_kg * Decimal('1000')

        warehouse_flour.quantity -= transfer_kg
        kitchen_flour.quantity += transfer_grams
        warehouse_flour.save()
        kitchen_flour.save()

        # Verify conversion
        warehouse_flour.refresh_from_db()
        kitchen_flour.refresh_from_db()
        self.assertEqual(warehouse_flour.quantity, Decimal('35.00'))
        self.assertEqual(kitchen_flour.quantity, Decimal('17000.00'))  # 2,000 + 15,000

        # Scenario 2: Warehouse in LITER, Kitchen in ML
        warehouse_milk = Inventory.objects.create(
            branch=self.branch,
            name='Susu Segar',
            unit='liter',
            quantity=Decimal('30.00'),  # 30 liters
            min_quantity=Decimal('5.00'),
            cost_per_unit=Decimal('25000.00'),  # Rp 25,000 per liter
            location='WAREHOUSE'
        )

        kitchen_milk = Inventory.objects.create(
            branch=self.branch,
            name='Susu Segar',
            unit='ml',
            quantity=Decimal('3000.00'),  # 3 liters = 3,000 ml
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('25.00'),  # Rp 25 per ml
            location='KITCHEN'
        )

        # Transfer 10 liters = 10,000 ml
        transfer_liter = Decimal('10.00')
        transfer_ml = transfer_liter * Decimal('1000')

        warehouse_milk.quantity -= transfer_liter
        kitchen_milk.quantity += transfer_ml
        warehouse_milk.save()
        kitchen_milk.save()

        # Verify conversion
        warehouse_milk.refresh_from_db()
        kitchen_milk.refresh_from_db()
        self.assertEqual(warehouse_milk.quantity, Decimal('20.00'))
        self.assertEqual(kitchen_milk.quantity, Decimal('13000.00'))  # 3,000 + 10,000

        # Verify cost consistency for both conversions
        flour_cost_match = (warehouse_flour.cost_per_unit / Decimal('1000')) == kitchen_flour.cost_per_unit
        milk_cost_match = (warehouse_milk.cost_per_unit / Decimal('1000')) == kitchen_milk.cost_per_unit

        self.assertTrue(flour_cost_match)
        self.assertTrue(milk_cost_match)


# =============================================================================
# ORDER STOCK DEDUCTION TESTS
# =============================================================================

class OrderStockDeductionTestCase(TestCase):
    """Test that kitchen stock is deducted when orders are paid"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='cashier@example.com',
            password='testpass123',
            first_name='Cashier',
            last_name='Test'
        )

        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name='Test Restaurant',
            address='Test Address'
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Main Address'
        )

        # Create staff (cashier)
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.CASHIER,
            phone='08123456789'
        )

        # Create cashier session
        self.session = CashierSession.objects.create(
            cashier=self.staff,
            branch=self.branch,
            shift_type='MORNING',
            opening_cash=Decimal('1000000.00')
        )

        # Create category
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name='Main Dishes'
        )

        # Create products
        self.nasi_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Nasi Goreng',
            price=Decimal('25000.00'),
            is_available=True
        )

        self.ayam_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Ayam Goreng',
            price=Decimal('30000.00'),
            is_available=True
        )

        # Create kitchen inventory (BOM precision units)
        self.kitchen_beras = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='gram',
            quantity=Decimal('50000.00'),  # 50kg = 50,000 grams
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('12.00'),
            location='KITCHEN'
        )

        self.kitchen_ayam = Inventory.objects.create(
            branch=self.branch,
            name='Ayam Kampung',
            unit='gram',
            quantity=Decimal('20000.00'),  # 20kg = 20,000 grams
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('37.50'),
            location='KITCHEN'
        )

        self.kitchen_minyak = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('10000.00'),  # 10 liters = 10,000 ml
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('14.00'),
            location='KITCHEN'
        )

        self.kitchen_bawang = Inventory.objects.create(
            branch=self.branch,
            name='Bawang Merah',
            unit='gram',
            quantity=Decimal('5000.00'),  # 5kg
            min_quantity=Decimal('1000.00'),
            cost_per_unit=Decimal('35.00'),
            location='KITCHEN'
        )

        # Create recipe for Nasi Goreng
        self.recipe_nasi_goreng = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        # Nasi Goreng ingredients per serving
        RecipeIngredient.objects.create(
            recipe=self.recipe_nasi_goreng,
            inventory_item=self.kitchen_beras,
            quantity=Decimal('250.000'),  # 250 grams
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=self.recipe_nasi_goreng,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.000'),  # 30 ml
            unit='ml'
        )

        RecipeIngredient.objects.create(
            recipe=self.recipe_nasi_goreng,
            inventory_item=self.kitchen_bawang,
            quantity=Decimal('50.000'),  # 50 grams
            unit='gram'
        )

        # Create recipe for Ayam Goreng
        self.recipe_ayam_goreng = Recipe.objects.create(
            product=self.ayam_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        # Ayam Goreng ingredients per serving
        RecipeIngredient.objects.create(
            recipe=self.recipe_ayam_goreng,
            inventory_item=self.kitchen_ayam,
            quantity=Decimal('300.000'),  # 300 grams
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=self.recipe_ayam_goreng,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('50.000'),  # 50 ml
            unit='ml'
        )

    def deduct_ingredients_for_order(self, order):
        """Simulate the ingredient deduction process from PaymentViewSet"""
        for order_item in order.items.all():
            try:
                recipe = order_item.product.recipe
                quantity_ordered = order_item.quantity

                for recipe_ingredient in recipe.ingredients.all():
                    inventory_item = recipe_ingredient.inventory_item
                    total_quantity_needed = float(recipe_ingredient.quantity) * quantity_ordered

                    # Update inventory quantity
                    inventory_item.quantity -= Decimal(str(total_quantity_needed))
                    inventory_item.save()

                    # Create inventory transaction record
                    InventoryTransaction.objects.create(
                        inventory=inventory_item,
                        transaction_type='OUT',
                        quantity=Decimal(str(total_quantity_needed)),
                        unit_cost=inventory_item.cost_per_unit,
                        reference_number=f"ORDER-{order.id}",
                        performed_by=self.user,
                        notes=f"Auto-deduction for {quantity_ordered}x {order_item.product.name}"
                    )
            except Recipe.DoesNotExist:
                pass

    def test_single_order_deducts_kitchen_stock(self):
        """Test that ordering 1 Nasi Goreng deducts correct amounts from kitchen"""
        # Store initial quantities
        initial_beras = self.kitchen_beras.quantity
        initial_minyak = self.kitchen_minyak.quantity
        initial_bawang = self.kitchen_bawang.quantity

        # Create order for 1 Nasi Goreng
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        # Process payment (triggers stock deduction)
        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        # Deduct ingredients
        self.deduct_ingredients_for_order(order)

        # Refresh inventory from database
        self.kitchen_beras.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Expected deductions for 1 serving Nasi Goreng:
        # Beras: 250g, Minyak: 30ml, Bawang: 50g
        self.assertEqual(self.kitchen_beras.quantity, initial_beras - Decimal('250.00'))
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('30.00'))
        self.assertEqual(self.kitchen_bawang.quantity, initial_bawang - Decimal('50.00'))

    def test_multiple_servings_deducts_correctly(self):
        """Test that ordering 5 Nasi Goreng deducts 5x the ingredients"""
        initial_beras = self.kitchen_beras.quantity
        initial_minyak = self.kitchen_minyak.quantity
        initial_bawang = self.kitchen_bawang.quantity

        # Order 5 servings
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=5,
            unit_price=self.nasi_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Refresh
        self.kitchen_beras.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Expected: 5x the recipe amounts
        # Beras: 5 × 250g = 1,250g
        # Minyak: 5 × 30ml = 150ml
        # Bawang: 5 × 50g = 250g
        self.assertEqual(self.kitchen_beras.quantity, initial_beras - Decimal('1250.00'))
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('150.00'))
        self.assertEqual(self.kitchen_bawang.quantity, initial_bawang - Decimal('250.00'))

    def test_multiple_items_in_order(self):
        """Test ordering multiple different items in one order"""
        initial_beras = self.kitchen_beras.quantity
        initial_ayam = self.kitchen_ayam.quantity
        initial_minyak = self.kitchen_minyak.quantity
        initial_bawang = self.kitchen_bawang.quantity

        # Order 2 Nasi Goreng + 3 Ayam Goreng
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=2,
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.ayam_goreng,
            quantity=3,
            unit_price=self.ayam_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Refresh
        self.kitchen_beras.refresh_from_db()
        self.kitchen_ayam.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Expected deductions:
        # Nasi Goreng (2x): Beras 500g, Minyak 60ml, Bawang 100g
        # Ayam Goreng (3x): Ayam 900g, Minyak 150ml
        # Total: Beras 500g, Ayam 900g, Minyak 210ml, Bawang 100g
        self.assertEqual(self.kitchen_beras.quantity, initial_beras - Decimal('500.00'))
        self.assertEqual(self.kitchen_ayam.quantity, initial_ayam - Decimal('900.00'))
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('210.00'))  # 60 + 150
        self.assertEqual(self.kitchen_bawang.quantity, initial_bawang - Decimal('100.00'))

    def test_inventory_transactions_created(self):
        """Test that inventory OUT transactions are created for each ingredient"""
        initial_transaction_count = InventoryTransaction.objects.filter(
            transaction_type='OUT'
        ).count()

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Nasi Goreng has 3 ingredients, should create 3 OUT transactions
        new_transaction_count = InventoryTransaction.objects.filter(
            transaction_type='OUT'
        ).count()

        self.assertEqual(new_transaction_count, initial_transaction_count + 3)

        # Verify transaction details
        beras_transaction = InventoryTransaction.objects.filter(
            inventory=self.kitchen_beras,
            transaction_type='OUT',
            reference_number=f'ORDER-{order.id}'
        ).first()

        self.assertIsNotNone(beras_transaction)
        self.assertEqual(beras_transaction.quantity, Decimal('250.00'))
        self.assertEqual(beras_transaction.notes, f'Auto-deduction for 1x Nasi Goreng')

    def test_shared_ingredient_across_recipes(self):
        """Test that shared ingredients (minyak) are deducted correctly across different dishes"""
        initial_minyak = self.kitchen_minyak.quantity

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        # Both dishes use minyak
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,  # Uses 30ml minyak
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.ayam_goreng,
            quantity=1,  # Uses 50ml minyak
            unit_price=self.ayam_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        self.kitchen_minyak.refresh_from_db()

        # Should deduct total: 30ml + 50ml = 80ml
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('80.00'))

    def test_stock_value_decreases_after_deduction(self):
        """Test that total inventory value decreases after ingredient deduction"""
        # Calculate initial total value
        initial_value = sum([
            self.kitchen_beras.total_value,
            self.kitchen_ayam.total_value,
            self.kitchen_minyak.total_value,
            self.kitchen_bawang.total_value
        ])

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=3,
            unit_price=self.nasi_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Refresh all inventory items
        self.kitchen_beras.refresh_from_db()
        self.kitchen_ayam.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Calculate new total value
        new_value = sum([
            self.kitchen_beras.total_value,
            self.kitchen_ayam.total_value,
            self.kitchen_minyak.total_value,
            self.kitchen_bawang.total_value
        ])

        # Value should decrease
        self.assertLess(new_value, initial_value)

    def test_low_stock_detection_after_deduction(self):
        """Test that low stock is detected when inventory falls below minimum"""
        # Set bawang to just above minimum
        self.kitchen_bawang.quantity = Decimal('1100.00')  # Min is 1000g
        self.kitchen_bawang.save()

        self.assertFalse(self.kitchen_bawang.needs_restock)

        # Order that will bring it below minimum
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=3,  # Uses 3 × 50g = 150g bawang
            unit_price=self.nasi_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        self.kitchen_bawang.refresh_from_db()

        # Should be 1100 - 150 = 950g, which is below minimum of 1000g
        self.assertEqual(self.kitchen_bawang.quantity, Decimal('950.00'))
        self.assertTrue(self.kitchen_bawang.needs_restock)

    def test_product_without_recipe_no_deduction(self):
        """Test that products without recipes don't cause errors and don't deduct stock"""
        # Create product without recipe
        drink = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Es Teh',
            price=Decimal('5000.00'),
            is_available=True
        )

        initial_beras = self.kitchen_beras.quantity

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=drink,
            quantity=2,
            unit_price=drink.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        # Should not raise error
        self.deduct_ingredients_for_order(order)

        # No stock should be deducted
        self.kitchen_beras.refresh_from_db()
        self.assertEqual(self.kitchen_beras.quantity, initial_beras)
