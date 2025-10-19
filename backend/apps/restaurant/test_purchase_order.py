from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import timedelta, date

from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole,
    Inventory, InventoryTransaction, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
)

User = get_user_model()


class PurchaseOrderModelTest(TestCase):
    """Test Purchase Order models"""

    def setUp(self):
        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            address="123 Test St"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch",
            address="456 Branch St"
        )

        # Create user and staff
        self.user = User.objects.create_user(
            email='warehouse@test.com',
            password='testpass123',
            first_name='Warehouse',
            last_name='Staff'
        )
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.WAREHOUSE
        )

        # Create inventory items
        self.inventory_item1 = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='kg',
            quantity=10,
            min_quantity=5,
            location='WAREHOUSE'
        )
        self.inventory_item2 = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='liter',
            quantity=5,
            min_quantity=3,
            location='WAREHOUSE'
        )

    def test_purchase_order_creation(self):
        """Test creating a purchase order"""
        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='PT Sumber Pangan',
            supplier_contact='John Doe',
            supplier_phone='+628123456789',
            created_by=self.staff,
            expected_delivery_date=date.today() + timedelta(days=7)
        )

        self.assertIsNotNone(po.po_number)
        self.assertTrue(po.po_number.startswith('PO-'))
        self.assertEqual(po.status, PurchaseOrderStatus.DRAFT)
        self.assertEqual(po.supplier_name, 'PT Sumber Pangan')

    def test_po_number_generation(self):
        """Test PO number auto-generation"""
        po1 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier 1',
            created_by=self.staff
        )
        po2 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier 2',
            created_by=self.staff
        )

        # Both should have unique PO numbers
        self.assertNotEqual(po1.po_number, po2.po_number)

        # Same date prefix
        date_str = timezone.now().strftime('%Y%m%d')
        self.assertIn(date_str, po1.po_number)
        self.assertIn(date_str, po2.po_number)

        # Sequential numbers
        seq1 = int(po1.po_number.split('-')[-1])
        seq2 = int(po2.po_number.split('-')[-1])
        self.assertEqual(seq2, seq1 + 1)

    def test_purchase_order_with_items(self):
        """Test creating PO with items"""
        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='PT Sumber Pangan',
            created_by=self.staff
        )

        # Add items
        item1 = PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item1,
            quantity=100,
            unit_price=15000
        )
        item2 = PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item2,
            quantity=50,
            unit_price=25000
        )

        # Test totals
        self.assertEqual(po.total_items, 2)
        expected_total = (100 * 15000) + (50 * 25000)
        self.assertEqual(po.total_amount, expected_total)

    def test_purchase_order_item_total_price(self):
        """Test PO item total price calculation"""
        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.staff
        )

        item = PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item1,
            quantity=100,
            unit_price=15000
        )

        self.assertEqual(item.total_price, 100 * 15000)

    def test_purchase_order_unique_item_constraint(self):
        """Test that same item cannot be added twice to same PO"""
        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.staff
        )

        PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item1,
            quantity=100,
            unit_price=15000
        )

        # Should raise IntegrityError for duplicate
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                inventory_item=self.inventory_item1,
                quantity=50,
                unit_price=16000
            )


class PurchaseOrderAPITest(APITestCase):
    """Test Purchase Order API endpoints"""

    def setUp(self):
        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            address="123 Test St"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch",
            address="456 Branch St"
        )

        # Create users
        self.warehouse_user = User.objects.create_user(
            email='warehouse@test.com',
            password='testpass123',
            first_name='Warehouse',
            last_name='Staff'
        )
        self.warehouse_staff = Staff.objects.create(
            user=self.warehouse_user,
            branch=self.branch,
            role=StaffRole.WAREHOUSE
        )

        self.manager_user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='Manager',
            last_name='User'
        )
        self.manager_staff = Staff.objects.create(
            user=self.manager_user,
            branch=self.branch,
            role=StaffRole.MANAGER
        )

        # Create inventory items
        self.inventory_item1 = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='kg',
            quantity=10,
            min_quantity=5,
            location='WAREHOUSE'
        )
        self.inventory_item2 = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='liter',
            quantity=5,
            min_quantity=3,
            location='WAREHOUSE'
        )

        self.client = APIClient()

    def test_create_purchase_order(self):
        """Test creating a purchase order via API"""
        self.client.force_authenticate(user=self.warehouse_user)

        data = {
            'branch': self.branch.id,
            'supplier_name': 'PT Sumber Pangan',
            'supplier_contact': 'John Doe',
            'supplier_phone': '+628123456789',
            'supplier_email': 'supplier@example.com',
            'created_by': self.warehouse_staff.id,
            'expected_delivery_date': str(date.today() + timedelta(days=7)),
            'notes': 'Urgent order',
            'items': [
                {
                    'inventory_item': self.inventory_item1.id,
                    'quantity': '100.00',
                    'unit_price': '15000.00',
                    'notes': 'Premium quality'
                },
                {
                    'inventory_item': self.inventory_item2.id,
                    'quantity': '50.00',
                    'unit_price': '25000.00'
                }
            ]
        }

        response = self.client.post('/api/purchase-orders/', data, format='json')

        # Debug output if test fails
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('po_number', response.data)
        self.assertEqual(response.data['status'], 'DRAFT')
        self.assertEqual(len(response.data['items']), 2)

    def test_list_purchase_orders(self):
        """Test listing purchase orders"""
        self.client.force_authenticate(user=self.warehouse_user)

        # Create some POs
        PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier 1',
            created_by=self.warehouse_staff
        )
        PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier 2',
            created_by=self.warehouse_staff
        )

        response = self.client.get('/api/purchase-orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_purchase_orders_by_status(self):
        """Test filtering POs by status"""
        self.client.force_authenticate(user=self.warehouse_user)

        # Create POs with different statuses
        po1 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier 1',
            created_by=self.warehouse_staff
        )
        po2 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier 2',
            created_by=self.warehouse_staff,
            status=PurchaseOrderStatus.SUBMITTED
        )

        response = self.client.get('/api/purchase-orders/?status=DRAFT')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['po_number'], po1.po_number)

    def test_submit_purchase_order(self):
        """Test submitting a draft PO"""
        self.client.force_authenticate(user=self.warehouse_user)

        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.warehouse_staff
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item1,
            quantity=100,
            unit_price=15000
        )

        response = self.client.post(f'/api/purchase-orders/{po.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'SUBMITTED')

    def test_cannot_submit_po_without_items(self):
        """Test that PO without items cannot be submitted"""
        self.client.force_authenticate(user=self.warehouse_user)

        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.warehouse_staff
        )

        response = self.client.post(f'/api/purchase-orders/{po.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('at least one item', response.data['error'])

    def test_approve_purchase_order(self):
        """Test approving a submitted PO"""
        self.client.force_authenticate(user=self.manager_user)

        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.warehouse_staff,
            status=PurchaseOrderStatus.SUBMITTED
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item1,
            quantity=100,
            unit_price=15000
        )

        response = self.client.post(f'/api/purchase-orders/{po.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'APPROVED')
        self.assertIsNotNone(response.data['approved_by'])

    def test_receive_purchase_order(self):
        """Test receiving an approved PO and creating inventory transactions"""
        self.client.force_authenticate(user=self.warehouse_user)

        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.warehouse_staff,
            status=PurchaseOrderStatus.APPROVED
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item1,
            quantity=100,
            unit_price=15000
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item2,
            quantity=50,
            unit_price=25000
        )

        initial_qty1 = self.inventory_item1.quantity
        initial_qty2 = self.inventory_item2.quantity

        response = self.client.post(f'/api/purchase-orders/{po.id}/receive/', {
            'actual_delivery_date': str(date.today())
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'RECEIVED')
        self.assertIsNotNone(response.data['received_by'])

        # Check inventory transactions were created
        transactions = InventoryTransaction.objects.filter(reference_number=po.po_number)
        self.assertEqual(transactions.count(), 2)

        # Check inventory was updated
        self.inventory_item1.refresh_from_db()
        self.inventory_item2.refresh_from_db()
        self.assertEqual(self.inventory_item1.quantity, initial_qty1 + 100)
        self.assertEqual(self.inventory_item2.quantity, initial_qty2 + 50)

    def test_receive_purchase_order_with_partial_quantities(self):
        """Test receiving PO with different quantities than ordered"""
        self.client.force_authenticate(user=self.warehouse_user)

        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.warehouse_staff,
            status=PurchaseOrderStatus.APPROVED
        )
        po_item = PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.inventory_item1,
            quantity=100,
            unit_price=15000
        )

        initial_qty = self.inventory_item1.quantity

        # Receive only 80kg instead of 100kg
        response = self.client.post(f'/api/purchase-orders/{po.id}/receive/', {
            'actual_delivery_date': str(date.today()),
            'received_items': [
                {'item_id': po_item.id, 'quantity_received': 80}
            ]
        }, format='json')

        # Debug output
        if response.status_code != status.HTTP_200_OK:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check only 80 was added
        self.inventory_item1.refresh_from_db()
        self.assertEqual(self.inventory_item1.quantity, initial_qty + 80)

    def test_cancel_purchase_order(self):
        """Test cancelling a PO"""
        self.client.force_authenticate(user=self.warehouse_user)

        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.warehouse_staff
        )

        response = self.client.post(f'/api/purchase-orders/{po.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'CANCELLED')

    def test_cannot_cancel_received_po(self):
        """Test that received POs cannot be cancelled"""
        self.client.force_authenticate(user=self.warehouse_user)

        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='Supplier',
            created_by=self.warehouse_staff,
            status=PurchaseOrderStatus.RECEIVED
        )

        response = self.client.post(f'/api/purchase-orders/{po.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot cancel', response.data['error'])

    def test_search_purchase_orders(self):
        """Test searching POs by supplier name or PO number"""
        self.client.force_authenticate(user=self.warehouse_user)

        po1 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='PT Sumber Pangan',
            created_by=self.warehouse_staff
        )
        po2 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name='CV Mitra Jaya',
            created_by=self.warehouse_staff
        )

        # Search by supplier name
        response = self.client.get('/api/purchase-orders/?search=Sumber')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['supplier_name'], 'PT Sumber Pangan')

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access PO API"""
        response = self.client.get('/api/purchase-orders/')
        # DRF returns 403 for unauthenticated when IsAuthenticated permission is used
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
