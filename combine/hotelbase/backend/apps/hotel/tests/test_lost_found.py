from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta

from ..models import LostAndFound, Room, Guest, Reservation, RoomType

User = get_user_model()


class LostAndFoundModelTest(TestCase):
    """Test Lost and Found model"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create room type
        self.room_type = RoomType.objects.create(
            name='Standard Room',
            description='Standard room for testing',
            base_price=500000,
            max_occupancy=2
        )

        # Create room
        self.room = Room.objects.create(
            number='101',
            room_type=self.room_type,
            floor=1,
            status='AVAILABLE'
        )

        # Create guest
        self.guest = Guest.objects.create(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            phone='+1234567890',
            id_number='ID123456',
            address='123 Test St',
            nationality='USA'
        )

    def test_create_found_item(self):
        """Test creating a found item"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='iPhone 13 Pro',
            description='Black iPhone 13 Pro found in room',
            category='ELECTRONICS',
            location_type='ROOM',
            room=self.room,
            reported_by=self.user,
            found_date=date.today()
        )

        self.assertIsNotNone(item.item_number)
        self.assertTrue(item.item_number.startswith('LF-'))
        self.assertEqual(item.status, 'PENDING')
        self.assertTrue(item.is_valuable)  # Auto-marked valuable
        self.assertEqual(item.days_in_storage, 0)

    def test_create_lost_item(self):
        """Test creating a lost item report"""
        item = LostAndFound.objects.create(
            report_type='LOST',
            item_name='Wallet',
            description='Brown leather wallet',
            category='ACCESSORIES',
            location_type='LOBBY',
            guest=self.guest,
            reported_by=self.user
        )

        self.assertIsNotNone(item.item_number)
        self.assertEqual(item.status, 'PENDING')
        self.assertEqual(item.report_type, 'LOST')

    def test_unique_item_number(self):
        """Test that item numbers are unique"""
        item1 = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Item 1',
            description='Test item 1',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.user
        )

        item2 = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Item 2',
            description='Test item 2',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.user
        )

        self.assertNotEqual(item1.item_number, item2.item_number)

    def test_mark_in_storage(self):
        """Test moving item to storage"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Sunglasses',
            description='Ray-Ban sunglasses',
            category='ACCESSORIES',
            location_type='POOL',
            reported_by=self.user
        )

        item.mark_in_storage('Cabinet A, Shelf 2', self.user)

        self.assertEqual(item.status, 'IN_STORAGE')
        self.assertEqual(item.storage_location, 'Cabinet A, Shelf 2')
        self.assertEqual(item.handler, self.user)

    def test_mark_claimed(self):
        """Test marking item as claimed"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Watch',
            description='Gold watch',
            category='JEWELRY',
            location_type='GYM',
            reported_by=self.user
        )

        item.mark_claimed(
            claimed_by_name='Jane Smith',
            claimed_by_contact='+9876543210',
            verified_by=self.user,
            notes='ID verified'
        )

        self.assertEqual(item.status, 'CLAIMED')
        self.assertEqual(item.claimed_by_name, 'Jane Smith')
        self.assertEqual(item.claimed_by_contact, '+9876543210')
        self.assertIsNotNone(item.claimed_date)
        self.assertEqual(item.claim_verified_by, self.user)

    def test_mark_returned_to_guest(self):
        """Test returning item to guest"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Laptop',
            description='MacBook Pro',
            category='ELECTRONICS',
            location_type='ROOM',
            room=self.room,
            guest=self.guest,
            reported_by=self.user
        )

        item.mark_returned_to_guest(self.user, 'Returned to guest during checkout')

        self.assertEqual(item.status, 'RETURNED_TO_GUEST')
        self.assertEqual(item.claimed_by_name, self.guest.full_name)
        self.assertEqual(item.claimed_by_contact, self.guest.phone)
        self.assertEqual(item.claim_verified_by, self.user)

    def test_mark_disposed(self):
        """Test disposing of item"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Old Towel',
            description='Used towel',
            category='OTHER',
            location_type='ROOM',
            room=self.room,
            reported_by=self.user,
            found_date=date.today() - timedelta(days=60)
        )

        item.mark_disposed('Donated to charity', 'Unclaimed for over 60 days')

        self.assertEqual(item.status, 'DISPOSED')
        self.assertEqual(item.disposal_method, 'Donated to charity')
        self.assertIsNotNone(item.disposal_date)

    def test_days_in_storage(self):
        """Test days in storage calculation"""
        past_date = date.today() - timedelta(days=15)
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Keys',
            description='Car keys',
            category='KEYS',
            location_type='PARKING',
            reported_by=self.user,
            found_date=past_date
        )

        self.assertEqual(item.days_in_storage, 15)

    def test_is_unclaimed_long(self):
        """Test long-term unclaimed detection"""
        # Item from 35 days ago
        old_item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Old Item',
            description='Old item',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.user,
            found_date=date.today() - timedelta(days=35)
        )

        # Recent item
        new_item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='New Item',
            description='New item',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.user,
            found_date=date.today() - timedelta(days=5)
        )

        self.assertTrue(old_item.is_unclaimed_long)
        self.assertFalse(new_item.is_unclaimed_long)

    def test_auto_valuable_marking(self):
        """Test automatic marking of valuable items"""
        valuable_categories = ['ELECTRONICS', 'JEWELRY', 'MONEY', 'DOCUMENTS']

        for category in valuable_categories:
            item = LostAndFound.objects.create(
                report_type='FOUND',
                item_name=f'Test {category}',
                description='Test item',
                category=category,
                location_type='LOBBY',
                reported_by=self.user
            )
            self.assertTrue(item.is_valuable, f'{category} should be marked valuable')


class LostAndFoundAPITest(TestCase):
    """Test Lost and Found API endpoints"""

    def setUp(self):
        """Set up test data and API client"""
        self.client = APIClient()

        # Create users
        self.staff = User.objects.create_user(
            email='staff@example.com',
            password='staffpass123',
            first_name='Staff',
            last_name='Member'
        )

        self.frontdesk = User.objects.create_user(
            email='frontdesk@example.com',
            password='frontpass123',
            first_name='Front',
            last_name='Desk'
        )

        # Create room type
        self.room_type = RoomType.objects.create(
            name='Deluxe Room',
            description='Deluxe room',
            base_price=750000,
            max_occupancy=2
        )

        # Create room
        self.room = Room.objects.create(
            number='202',
            room_type=self.room_type,
            floor=2,
            status='OCCUPIED'
        )

        # Create guest
        self.guest = Guest.objects.create(
            first_name='Alice',
            last_name='Johnson',
            email='alice@example.com',
            phone='+1122334455',
            id_number='ID789012',
            address='456 Test Ave',
            nationality='Canada'
        )

    def test_create_found_item(self):
        """Test creating a found item via API"""
        data = {
            'report_type': 'FOUND',
            'item_name': 'Smartphone',
            'description': 'Samsung Galaxy S21 found in room during checkout cleaning',
            'category': 'ELECTRONICS',
            'location_type': 'ROOM',
            'room': self.room.id,
            'specific_location': 'Under the bed',
            'reported_by': self.staff.id,
            'found_date': str(date.today()),
            'notes': 'Found during checkout cleaning'
        }

        response = self.client.post('/api/hotel/lost-and-found/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['item_name'], 'Smartphone')
        self.assertEqual(response.data['category'], 'ELECTRONICS')

        # Verify the item was created by fetching it
        created_item = LostAndFound.objects.get(item_name='Smartphone')
        self.assertIsNotNone(created_item.item_number)
        self.assertEqual(created_item.status, 'PENDING')

    def test_list_lost_found_items(self):
        """Test listing all lost and found items"""
        # Create some items
        LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Item 1',
            description='Description 1',
            category='ELECTRONICS',
            location_type='LOBBY',
            reported_by=self.staff
        )

        LostAndFound.objects.create(
            report_type='LOST',
            item_name='Item 2',
            description='Description 2',
            category='JEWELRY',
            location_type='ROOM',
            room=self.room,
            guest=self.guest,
            reported_by=self.frontdesk
        )

        response = self.client.get('/api/hotel/lost-and-found/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 2)
        self.assertIn('status_counters', response.data)

    def test_filter_by_status(self):
        """Test filtering items by status"""
        # Create items with different statuses
        item1 = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Pending Item',
            description='Test',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.staff
        )

        item2 = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Storage Item',
            description='Test',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.staff
        )
        item2.mark_in_storage('Cabinet A', self.staff)

        response = self.client.get('/api/hotel/lost-and-found/?status=PENDING')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'PENDING')

    def test_filter_by_category(self):
        """Test filtering items by category"""
        LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Phone',
            description='Test',
            category='ELECTRONICS',
            location_type='LOBBY',
            reported_by=self.staff
        )

        LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Necklace',
            description='Test',
            category='JEWELRY',
            location_type='LOBBY',
            reported_by=self.staff
        )

        response = self.client.get('/api/hotel/lost-and-found/?category=ELECTRONICS')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['category'], 'ELECTRONICS')

    def test_get_pending_items(self):
        """Test getting pending items"""
        LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Pending Item',
            description='Test',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.staff,
            status='PENDING'
        )

        response = self.client.get('/api/hotel/lost-and-found/pending/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_valuable_items(self):
        """Test getting valuable items"""
        LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Diamond Ring',
            description='Expensive ring',
            category='JEWELRY',
            location_type='ROOM',
            room=self.room,
            reported_by=self.staff
        )

        response = self.client.get('/api/hotel/lost-and-found/valuable/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_move_to_storage(self):
        """Test moving item to storage via API"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Test Item',
            description='Test',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.staff
        )

        data = {
            'storage_location': 'Cabinet B, Shelf 3',
            'handler_id': self.frontdesk.id
        }

        response = self.client.post(
            f'/api/hotel/lost-and-found/{item.id}/move_to_storage/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'IN_STORAGE')
        self.assertEqual(response.data['storage_location'], 'Cabinet B, Shelf 3')

    def test_mark_claimed_via_api(self):
        """Test marking item as claimed via API"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Test Item',
            description='Test',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.staff,
            status='IN_STORAGE',
            storage_location='Cabinet A'
        )

        data = {
            'claimed_by_name': 'Bob Williams',
            'claimed_by_contact': '+5566778899',
            'verified_by_id': self.frontdesk.id,
            'notes': 'Verified with ID and room key'
        }

        response = self.client.post(
            f'/api/hotel/lost-and-found/{item.id}/mark_claimed/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'CLAIMED')
        self.assertEqual(response.data['claimed_by_name'], 'Bob Williams')

    def test_return_to_guest_via_api(self):
        """Test returning item to guest via API"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Guest Item',
            description='Test',
            category='OTHER',
            location_type='ROOM',
            room=self.room,
            guest=self.guest,
            reported_by=self.staff,
            status='IN_STORAGE',
            storage_location='Cabinet A'
        )

        data = {
            'verified_by_id': self.frontdesk.id,
            'notes': 'Returned during checkout'
        }

        response = self.client.post(
            f'/api/hotel/lost-and-found/{item.id}/return_to_guest/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'RETURNED_TO_GUEST')
        self.assertEqual(response.data['claimed_by_name'], self.guest.full_name)

    def test_dispose_item_via_api(self):
        """Test disposing item via API"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Old Item',
            description='Test',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.staff,
            found_date=date.today() - timedelta(days=90)
        )

        data = {
            'disposal_method': 'Donated to local charity',
            'notes': 'Unclaimed for 90 days'
        }

        response = self.client.post(
            f'/api/hotel/lost-and-found/{item.id}/dispose/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'DISPOSED')
        self.assertEqual(response.data['disposal_method'], 'Donated to local charity')

    def test_get_statistics(self):
        """Test getting statistics"""
        # Create various items
        LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Item 1',
            description='Test',
            category='ELECTRONICS',
            location_type='LOBBY',
            reported_by=self.staff
        )

        LostAndFound.objects.create(
            report_type='LOST',
            item_name='Item 2',
            description='Test',
            category='JEWELRY',
            location_type='ROOM',
            room=self.room,
            reported_by=self.staff
        )

        response = self.client.get('/api/hotel/lost-and-found/statistics/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('by_status', response.data)
        self.assertIn('by_type', response.data)
        self.assertIn('by_category', response.data)
        self.assertEqual(response.data['total'], 2)

    def test_search_items(self):
        """Test searching for items"""
        LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Red Backpack',
            description='Large red backpack with laptop compartment',
            category='ACCESSORIES',
            location_type='LOBBY',
            reported_by=self.staff
        )

        response = self.client.get('/api/hotel/lost-and-found/?search=backpack')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_update_status_with_validation(self):
        """Test updating status with proper validation"""
        item = LostAndFound.objects.create(
            report_type='FOUND',
            item_name='Test Item',
            description='Test',
            category='OTHER',
            location_type='LOBBY',
            reported_by=self.staff
        )

        # Try to mark as claimed without required fields
        data = {
            'status': 'CLAIMED'
        }

        response = self.client.patch(
            f'/api/hotel/lost-and-found/{item.id}/update_status/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('claimed_by_name', str(response.data))
