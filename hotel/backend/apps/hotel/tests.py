from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .models import (
    Complaint, HousekeepingTask, Room, RoomType, Guest
)

User = get_user_model()


class ComplaintToHousekeepingIntegrationTest(APITestCase):
    """Test suite for complaint to housekeeping task integration"""

    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            email='test@hotel.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        # Create room type
        self.room_type = RoomType.objects.create(
            name='Deluxe Room',
            description='Deluxe room with city view',
            base_price=1000000,
            max_occupancy=2
        )

        # Create room
        self.room = Room.objects.create(
            number='101',
            floor=1,
            room_type=self.room_type,
            status='OCCUPIED'
        )

        # Create guest
        self.guest = Guest.objects.create(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            phone='+6281234567890'
        )

        # API client
        self.client = APIClient()

    def test_create_complaint_without_team_assignment(self):
        """Test creating a complaint without team assignment does not create housekeeping task"""
        complaint_data = {
            'category': 'CLEANLINESS',
            'priority': 'HIGH',
            'status': 'OPEN',
            'title': 'Dirty bathroom',
            'description': 'The bathroom needs cleaning',
            'room': self.room.id,
            'guest': self.guest.id
        }

        response = self.client.post('/api/hotel/complaints/', complaint_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify no housekeeping task was created
        self.assertEqual(HousekeepingTask.objects.count(), 0)

    def test_assign_complaint_to_housekeeping_team_creates_task(self):
        """Test assigning complaint to HOUSEKEEPING team creates housekeeping task"""
        # Create complaint
        complaint = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='OPEN',
            title='Dirty bathroom',
            description='The bathroom needs cleaning',
            room=self.room,
            guest=self.guest
        )

        # Assign to housekeeping team
        response = self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['assigned_team'], 'HOUSEKEEPING')

        # Verify housekeeping task was created
        self.assertEqual(HousekeepingTask.objects.count(), 1)

        task = HousekeepingTask.objects.first()
        self.assertEqual(task.complaint, complaint)
        self.assertEqual(task.room, self.room)
        self.assertEqual(task.task_type, 'COMPLAINT')
        self.assertEqual(task.priority, complaint.priority)
        self.assertIn(complaint.complaint_number, task.notes)
        self.assertIn(complaint.title, task.notes)

    def test_assign_complaint_to_engineering_team_does_not_create_housekeeping_task(self):
        """Test assigning complaint to ENGINEERING team does not create housekeeping task"""
        # Create complaint
        complaint = Complaint.objects.create(
            category='ROOM',
            priority='URGENT',
            status='OPEN',
            title='AC not working',
            description='Air conditioning is broken',
            room=self.room,
            guest=self.guest
        )

        # Assign to engineering team
        response = self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'ENGINEERING'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['assigned_team'], 'ENGINEERING')

        # Verify no housekeeping task was created
        self.assertEqual(HousekeepingTask.objects.count(), 0)

    def test_complaint_without_room_does_not_create_housekeeping_task(self):
        """Test complaint without room assignment does not create housekeeping task"""
        # Create complaint without room
        complaint = Complaint.objects.create(
            category='SERVICE',
            priority='MEDIUM',
            status='OPEN',
            title='Front desk issue',
            description='Slow check-in process',
            guest=self.guest
        )

        # Assign to housekeeping team
        response = self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify no housekeeping task was created (no room)
        self.assertEqual(HousekeepingTask.objects.count(), 0)

    def test_reassigning_to_housekeeping_does_not_duplicate_task(self):
        """Test reassigning complaint to housekeeping doesn't create duplicate tasks"""
        # Create complaint
        complaint = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='OPEN',
            title='Dirty bathroom',
            description='The bathroom needs cleaning',
            room=self.room,
            guest=self.guest
        )

        # First assignment to housekeeping
        self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )
        self.assertEqual(HousekeepingTask.objects.count(), 1)

        # Assign to different team
        self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'FRONT_DESK'},
            format='json'
        )
        self.assertEqual(HousekeepingTask.objects.count(), 1)

        # Reassign back to housekeeping
        self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        # Should still have only 1 task (no duplicate)
        self.assertEqual(HousekeepingTask.objects.count(), 1)

    def test_housekeeping_task_status_mapping_from_complaint(self):
        """Test that complaint status correctly maps to housekeeping task status"""
        # Test OPEN complaint -> DIRTY status
        complaint = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='OPEN',
            title='Needs cleaning',
            description='Room needs cleaning',
            room=self.room,
            guest=self.guest
        )

        self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        task = HousekeepingTask.objects.first()
        self.assertEqual(task.status, 'DIRTY')

        # Clean up
        HousekeepingTask.objects.all().delete()

        # Test IN_PROGRESS complaint -> CLEANING status
        complaint2 = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='IN_PROGRESS',
            title='Being cleaned',
            description='Room is being cleaned',
            room=self.room,
            guest=self.guest
        )

        self.client.patch(
            f'/api/hotel/complaints/{complaint2.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        task2 = HousekeepingTask.objects.first()
        self.assertEqual(task2.status, 'CLEANING')

        # Clean up
        HousekeepingTask.objects.all().delete()

        # Test RESOLVED complaint -> CLEAN status
        complaint3 = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='RESOLVED',
            title='Cleaned',
            description='Room has been cleaned',
            room=self.room,
            guest=self.guest
        )

        self.client.patch(
            f'/api/hotel/complaints/{complaint3.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        task3 = HousekeepingTask.objects.first()
        self.assertEqual(task3.status, 'CLEAN')

    def test_housekeeping_task_inherits_complaint_priority(self):
        """Test that housekeeping task inherits priority from complaint"""
        priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

        for priority in priorities:
            # Create complaint with specific priority
            complaint = Complaint.objects.create(
                category='CLEANLINESS',
                priority=priority,
                status='OPEN',
                title=f'{priority} priority issue',
                description='Test priority inheritance',
                room=self.room,
                guest=self.guest
            )

            # Assign to housekeeping
            self.client.patch(
                f'/api/hotel/complaints/{complaint.id}/',
                {'assigned_team': 'HOUSEKEEPING'},
                format='json'
            )

            # Verify task has same priority
            task = HousekeepingTask.objects.filter(complaint=complaint).first()
            self.assertIsNotNone(task)
            self.assertEqual(task.priority, priority)

            # Clean up for next iteration
            HousekeepingTask.objects.all().delete()
            complaint.delete()

    def test_housekeeping_task_notes_include_complaint_details(self):
        """Test that housekeeping task notes include complaint information"""
        complaint = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='OPEN',
            title='Spilled drink in room',
            description='Guest spilled coffee on the carpet',
            room=self.room,
            guest=self.guest
        )

        self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        task = HousekeepingTask.objects.first()
        self.assertIsNotNone(task.notes)
        self.assertIn(complaint.complaint_number, task.notes)
        self.assertIn(complaint.title, task.notes)
        self.assertIn(complaint.description, task.notes)

    def test_multiple_complaints_create_multiple_tasks(self):
        """Test that multiple complaints create separate housekeeping tasks"""
        # Create second room
        room2 = Room.objects.create(
            number='102',
            floor=1,
            room_type=self.room_type,
            status='OCCUPIED'
        )

        # Create two complaints for different rooms
        complaint1 = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='OPEN',
            title='Room 101 needs cleaning',
            description='Bathroom is dirty',
            room=self.room,
            guest=self.guest
        )

        complaint2 = Complaint.objects.create(
            category='CLEANLINESS',
            priority='MEDIUM',
            status='OPEN',
            title='Room 102 needs cleaning',
            description='Carpet needs vacuuming',
            room=room2,
            guest=self.guest
        )

        # Assign both to housekeeping
        self.client.patch(
            f'/api/hotel/complaints/{complaint1.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        self.client.patch(
            f'/api/hotel/complaints/{complaint2.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        # Verify two separate tasks were created
        self.assertEqual(HousekeepingTask.objects.count(), 2)

        task1 = HousekeepingTask.objects.filter(complaint=complaint1).first()
        task2 = HousekeepingTask.objects.filter(complaint=complaint2).first()

        self.assertIsNotNone(task1)
        self.assertIsNotNone(task2)
        self.assertEqual(task1.room, self.room)
        self.assertEqual(task2.room, room2)

    def test_housekeeping_task_serializer_includes_complaint_info(self):
        """Test that housekeeping task API response includes complaint information"""
        # Create and assign complaint
        complaint = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='OPEN',
            title='Needs deep cleaning',
            description='Room requires deep cleaning',
            room=self.room,
            guest=self.guest
        )

        self.client.patch(
            f'/api/hotel/complaints/{complaint.id}/',
            {'assigned_team': 'HOUSEKEEPING'},
            format='json'
        )

        # Authenticate user for housekeeping tasks endpoint
        self.client.force_authenticate(user=self.user)

        # Fetch housekeeping tasks
        response = self.client.get('/api/hotel/housekeeping-tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify response includes complaint info
        tasks = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(tasks), 1)

        task_data = tasks[0]
        self.assertEqual(task_data['complaint'], complaint.id)
        self.assertEqual(task_data['complaint_number'], complaint.complaint_number)
        self.assertEqual(task_data['complaint_title'], complaint.title)
        self.assertEqual(task_data['task_type'], 'COMPLAINT')
        self.assertEqual(task_data['task_type_display'], 'Guest Complaint')


class HousekeepingTaskModelTest(TestCase):
    """Test suite for HousekeepingTask model"""

    def setUp(self):
        """Set up test data"""
        self.room_type = RoomType.objects.create(
            name='Standard Room',
            description='Standard room',
            base_price=500000,
            max_occupancy=2
        )

        self.room = Room.objects.create(
            number='201',
            floor=2,
            room_type=self.room_type,
            status='AVAILABLE'
        )

        self.guest = Guest.objects.create(
            first_name='Jane',
            last_name='Smith',
            email='jane.smith@example.com',
            phone='+6289876543210'
        )

    def test_housekeeping_task_complaint_relationship(self):
        """Test that housekeeping task can be linked to a complaint"""
        complaint = Complaint.objects.create(
            category='CLEANLINESS',
            priority='MEDIUM',
            status='OPEN',
            title='Dusty room',
            description='Room needs dusting',
            room=self.room,
            guest=self.guest
        )

        task = HousekeepingTask.objects.create(
            room=self.room,
            complaint=complaint,
            task_type='COMPLAINT',
            status='DIRTY',
            priority='MEDIUM'
        )

        self.assertEqual(task.complaint, complaint)
        self.assertEqual(task.task_type, 'COMPLAINT')
        self.assertTrue(complaint.housekeeping_tasks.filter(id=task.id).exists())

    def test_housekeeping_task_without_complaint(self):
        """Test that housekeeping task can exist without a complaint"""
        task = HousekeepingTask.objects.create(
            room=self.room,
            task_type='CHECKOUT_CLEANING',
            status='DIRTY',
            priority='MEDIUM'
        )

        self.assertIsNone(task.complaint)
        self.assertEqual(task.task_type, 'CHECKOUT_CLEANING')

    def test_deleting_complaint_deletes_housekeeping_task(self):
        """Test that deleting a complaint also deletes linked housekeeping task"""
        complaint = Complaint.objects.create(
            category='CLEANLINESS',
            priority='HIGH',
            status='OPEN',
            title='Needs cleaning',
            description='Room needs cleaning',
            room=self.room,
            guest=self.guest
        )

        task = HousekeepingTask.objects.create(
            room=self.room,
            complaint=complaint,
            task_type='COMPLAINT',
            status='DIRTY',
            priority='HIGH'
        )

        task_id = task.id
        self.assertTrue(HousekeepingTask.objects.filter(id=task_id).exists())

        # Delete complaint
        complaint.delete()

        # Verify task is also deleted (CASCADE)
        self.assertFalse(HousekeepingTask.objects.filter(id=task_id).exists())
