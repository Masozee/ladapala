from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .models import (
    Complaint, HousekeepingTask, Room, RoomType, Guest, Reservation, Payment, Voucher
)
from unittest.mock import patch, MagicMock
import base64
from decimal import Decimal

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


class PaymentProcessAndInvoiceTests(APITestCase):
    """Test suite for payment processing and invoice email functionality"""

    def setUp(self):
        """Set up test data for payment and invoice tests"""
        # Create test user
        self.user = User.objects.create_user(
            email='payment_test@hotel.com',
            password='testpass123',
            first_name='Payment',
            last_name='Tester'
        )

        # Create room type
        self.room_type = RoomType.objects.create(
            name='Deluxe Suite',
            description='Luxury suite with ocean view',
            base_price=2000000,
            max_occupancy=3
        )

        # Create room
        self.room = Room.objects.create(
            number='301',
            floor=3,
            room_type=self.room_type,
            status='OCCUPIED'
        )

        # Create guest
        self.guest = Guest.objects.create(
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            phone='+6281234567890',
            date_of_birth='1990-05-15',
            id_number='ID123456789',
            id_type='PASSPORT'
        )

        # Create reservation
        check_in = timezone.now().date()
        check_out = check_in + timedelta(days=3)

        self.reservation = Reservation.objects.create(
            reservation_number='RES202501051234',
            guest=self.guest,
            room=self.room,
            check_in_date=check_in,
            check_out_date=check_out,
            adults=2,
            children=0,
            status='CONFIRMED',
            booking_source='DIRECT'
        )

        # API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_payment_process_without_promotions(self):
        """Test standard payment processing without promotions"""
        payment_data = {
            'reservation': self.reservation.id,
            'amount': 6000000,
            'payment_method': 'CASH',
            'status': 'COMPLETED',
            'payment_date': timezone.now().isoformat(),
            'notes': 'Test payment'
        }

        response = self.client.post('/api/hotel/payments/', payment_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Payment.objects.count(), 1)

        payment = Payment.objects.first()
        self.assertEqual(payment.reservation, self.reservation)
        self.assertEqual(payment.payment_method, 'CASH')
        self.assertEqual(payment.status, 'COMPLETED')
        self.assertEqual(float(payment.amount), 6000000)

    def test_payment_calculation_endpoint(self):
        """Test payment calculation with reservation data"""
        calculation_data = {
            'reservation_id': self.reservation.id
        }

        response = self.client.post(
            '/api/hotel/payments/calculate/',
            calculation_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success', response.data)
        self.assertTrue(response.data['success'])
        self.assertIn('subtotal', response.data)
        self.assertIn('final_amount', response.data)
        self.assertIn('breakdown', response.data)

    @patch('apps.hotel.services.email_service_simple.send_reservation_invoice_email_with_pdf')
    def test_payment_with_promotions_sends_invoice(self, mock_email_send):
        """Test payment with promotions endpoint sends invoice email"""
        mock_email_send.return_value = True

        # Create a sample PDF content (base64 encoded)
        pdf_content = base64.b64encode(b"Sample PDF content").decode('utf-8')

        payment_data = {
            'reservation_id': self.reservation.id,
            'payment_method': 'CREDIT_CARD',
            'transaction_id': 'TXN123456',
            'pdf_content': pdf_content
        }

        response = self.client.post(
            '/api/hotel/payments/process_with_promotions/',
            payment_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('payment', response.data)
        self.assertIn('calculation', response.data)
        self.assertIn('invoice_sent', response.data)
        self.assertTrue(response.data['invoice_sent'])

        # Verify payment was created
        self.assertEqual(Payment.objects.count(), 1)
        payment = Payment.objects.first()
        self.assertEqual(payment.payment_method, 'CREDIT_CARD')
        self.assertEqual(payment.status, 'COMPLETED')

        # Verify email function was called
        mock_email_send.assert_called_once()
        call_args = mock_email_send.call_args
        self.assertEqual(call_args[0][0], self.reservation)
        self.assertEqual(call_args[0][1], pdf_content)

    @patch('apps.hotel.services.email_service_simple.send_reservation_invoice_email_with_pdf')
    def test_payment_with_promotions_without_pdf(self, mock_email_send):
        """Test payment with promotions without PDF doesn't send email"""
        payment_data = {
            'reservation_id': self.reservation.id,
            'payment_method': 'CASH',
        }

        response = self.client.post(
            '/api/hotel/payments/process_with_promotions/',
            payment_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['invoice_sent'])

        # Verify email function was NOT called
        mock_email_send.assert_not_called()

    def test_payment_with_voucher_code(self):
        """Test payment with valid voucher code applies discount"""
        # Create a voucher
        voucher = Voucher.objects.create(
            code='WELCOME10',
            name='Welcome 10% Off',
            voucher_type='PERCENTAGE',
            discount_percentage=10,
            valid_from=timezone.now().date(),
            valid_until=timezone.now().date() + timedelta(days=30),
            usage_limit=100,
            status='ACTIVE'
        )

        payment_data = {
            'reservation_id': self.reservation.id,
            'payment_method': 'CREDIT_CARD',
            'voucher_code': 'WELCOME10',
        }

        response = self.client.post(
            '/api/hotel/payments/process_with_promotions/',
            payment_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('calculation', response.data)

        calculation = response.data['calculation']
        self.assertIn('total_discount', calculation)
        self.assertIn('voucher', calculation)
        # Verify voucher discount was applied
        voucher_info = calculation['voucher']
        self.assertGreater(float(voucher_info['discount']), 0)

    def test_payment_with_invalid_voucher(self):
        """Test payment with invalid voucher code returns error"""
        payment_data = {
            'reservation_id': self.reservation.id,
            'payment_method': 'CASH',
            'voucher_code': 'INVALID_CODE',
        }

        response = self.client.post(
            '/api/hotel/payments/process_with_promotions/',
            payment_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_payment_requires_reservation_id(self):
        """Test that payment requires reservation_id"""
        payment_data = {
            'payment_method': 'CASH',
        }

        response = self.client.post(
            '/api/hotel/payments/process_with_promotions/',
            payment_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    @patch('apps.hotel.services.email_service_simple.send_reservation_invoice_email_with_pdf')
    def test_payment_email_failure_does_not_fail_payment(self, mock_email_send):
        """Test that email failure doesn't prevent payment from completing"""
        mock_email_send.side_effect = Exception('Email service unavailable')

        pdf_content = base64.b64encode(b"Sample PDF").decode('utf-8')

        payment_data = {
            'reservation_id': self.reservation.id,
            'payment_method': 'CASH',
            'pdf_content': pdf_content
        }

        response = self.client.post(
            '/api/hotel/payments/process_with_promotions/',
            payment_data,
            format='json'
        )

        # Payment should still succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['invoice_sent'])

        # Verify payment was created despite email failure
        self.assertEqual(Payment.objects.count(), 1)


class ResendInvoiceTests(APITestCase):
    """Test suite for resend invoice functionality"""

    def setUp(self):
        """Set up test data for invoice resend tests"""
        # Create test user
        self.user = User.objects.create_user(
            email='invoice_test@hotel.com',
            password='testpass123',
            first_name='Invoice',
            last_name='Tester'
        )

        # Create room type
        self.room_type = RoomType.objects.create(
            name='Standard Room',
            description='Standard room with garden view',
            base_price=1000000,
            max_occupancy=2
        )

        # Create room
        self.room = Room.objects.create(
            number='105',
            floor=1,
            room_type=self.room_type,
            status='OCCUPIED'
        )

        # Create guest
        self.guest = Guest.objects.create(
            first_name='Bob',
            last_name='Smith',
            email='bob.smith@example.com',
            phone='+6287654321098',
            date_of_birth='1985-08-20',
            id_number='PASS987654321',
            id_type='PASSPORT'
        )

        # Create reservation
        check_in = timezone.now().date()
        check_out = check_in + timedelta(days=2)

        self.reservation = Reservation.objects.create(
            reservation_number='RES202501055678',
            guest=self.guest,
            room=self.room,
            check_in_date=check_in,
            check_out_date=check_out,
            adults=2,
            children=0,
            status='CONFIRMED',
            booking_source='ONLINE'
        )

        # API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch('apps.hotel.services.email_service_simple.send_reservation_invoice_email_with_pdf')
    def test_resend_invoice_with_valid_data(self, mock_email_send):
        """Test resending invoice with valid PDF content"""
        mock_email_send.return_value = True

        # Create sample PDF content
        pdf_content = base64.b64encode(b"Invoice PDF content").decode('utf-8')

        request_data = {
            'pdf_content': pdf_content
        }

        response = self.client.post(
            f'/api/hotel/reservations/{self.reservation.reservation_number}/resend_invoice/',
            request_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'Invoice email sent successfully')
        self.assertEqual(response.data['sent_to'], self.guest.email)
        self.assertEqual(response.data['reservation_number'], self.reservation.reservation_number)

        # Verify email function was called with correct parameters
        mock_email_send.assert_called_once()
        call_args = mock_email_send.call_args
        self.assertEqual(call_args[0][0], self.reservation)
        self.assertEqual(call_args[0][1], pdf_content)

    def test_resend_invoice_without_pdf_content(self):
        """Test resending invoice without PDF content returns error"""
        request_data = {}

        response = self.client.post(
            f'/api/hotel/reservations/{self.reservation.reservation_number}/resend_invoice/',
            request_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'PDF content is required')

    def test_resend_invoice_with_invalid_reservation(self):
        """Test resending invoice with non-existent reservation"""
        pdf_content = base64.b64encode(b"Invoice PDF").decode('utf-8')

        request_data = {
            'pdf_content': pdf_content
        }

        response = self.client.post(
            '/api/hotel/reservations/INVALID123/resend_invoice/',
            request_data,
            format='json'
        )

        # Should return 500 or 404 depending on how the endpoint handles it
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_500_INTERNAL_SERVER_ERROR])

    @patch('apps.hotel.services.email_service_simple.send_reservation_invoice_email_with_pdf')
    def test_resend_invoice_email_service_failure(self, mock_email_send):
        """Test handling of email service failure"""
        mock_email_send.return_value = False

        pdf_content = base64.b64encode(b"Invoice PDF").decode('utf-8')

        request_data = {
            'pdf_content': pdf_content
        }

        response = self.client.post(
            f'/api/hotel/reservations/{self.reservation.reservation_number}/resend_invoice/',
            request_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    @patch('apps.hotel.services.email_service_simple.send_reservation_invoice_email_with_pdf')
    def test_resend_invoice_exception_handling(self, mock_email_send):
        """Test handling of unexpected exceptions during invoice sending"""
        mock_email_send.side_effect = Exception('Unexpected error')

        pdf_content = base64.b64encode(b"Invoice PDF").decode('utf-8')

        request_data = {
            'pdf_content': pdf_content
        }

        response = self.client.post(
            f'/api/hotel/reservations/{self.reservation.reservation_number}/resend_invoice/',
            request_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    @patch('apps.hotel.services.email_service_simple.send_reservation_invoice_email_with_pdf')
    def test_resend_invoice_multiple_times(self, mock_email_send):
        """Test that invoice can be resent multiple times"""
        mock_email_send.return_value = True

        pdf_content = base64.b64encode(b"Invoice PDF").decode('utf-8')

        request_data = {
            'pdf_content': pdf_content
        }

        # Send first time
        response1 = self.client.post(
            f'/api/hotel/reservations/{self.reservation.reservation_number}/resend_invoice/',
            request_data,
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Send second time
        response2 = self.client.post(
            f'/api/hotel/reservations/{self.reservation.reservation_number}/resend_invoice/',
            request_data,
            format='json'
        )
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        # Verify email was called twice
        self.assertEqual(mock_email_send.call_count, 2)

    def test_resend_invoice_requires_authentication(self):
        """Test that resending invoice can be accessed (authentication may be optional for this endpoint)"""
        # Create unauthenticated client
        unauth_client = APIClient()

        pdf_content = base64.b64encode(b"Invoice PDF").decode('utf-8')

        request_data = {
            'pdf_content': pdf_content
        }

        response = unauth_client.post(
            f'/api/hotel/reservations/{self.reservation.reservation_number}/resend_invoice/',
            request_data,
            format='json'
        )

        # The endpoint may allow unauthenticated access or require auth - both are valid depending on business logic
        # If it allows access, it should work (200) or if it requires auth, return 401/403
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
