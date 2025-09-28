from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import date, timedelta
import random
from apps.guests.models import Guest, GuestDocument


class Command(BaseCommand):
    help = 'Create seed data for guests app with Indonesian context'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for guests...')
        
        with transaction.atomic():
            # Indonesian guest data
            indonesian_guests = [
                {
                    'first_name': 'Sari',
                    'last_name': 'Dewi',
                    'email': 'sari.dewi@gmail.com',
                    'phone': '+62812-3456-7890',
                    'date_of_birth': date(1985, 3, 15),
                    'gender': 'F',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Sudirman No. 45, Menteng',
                    'city': 'Jakarta Pusat',
                    'country': 'Indonesia',
                    'postal_code': '10310',
                    'loyalty_points': 1250,
                    'preferences': {'room_type': 'Deluxe', 'floor': 'high', 'bed': 'double'},
                    'is_vip': True
                },
                {
                    'first_name': 'Budi',
                    'last_name': 'Santoso',
                    'email': 'budi.santoso@yahoo.com',
                    'phone': '+62813-2468-1357',
                    'date_of_birth': date(1978, 8, 22),
                    'gender': 'M',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Thamrin No. 78, Tanah Abang',
                    'city': 'Jakarta Pusat',
                    'country': 'Indonesia',
                    'postal_code': '10230',
                    'loyalty_points': 750,
                    'preferences': {'room_type': 'Superior', 'newspaper': 'Kompas', 'breakfast': 'early'},
                    'is_vip': False
                },
                {
                    'first_name': 'Andi',
                    'last_name': 'Wijaya',
                    'email': 'andi.wijaya@hotmail.com',
                    'phone': '+62821-9876-5432',
                    'date_of_birth': date(1990, 12, 8),
                    'gender': 'M',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Gatot Subroto No. 123, Kuningan',
                    'city': 'Jakarta Selatan',
                    'country': 'Indonesia',
                    'postal_code': '12950',
                    'loyalty_points': 450,
                    'preferences': {'wifi': 'high_speed', 'room_service': True},
                    'is_vip': False
                },
                {
                    'first_name': 'Maya',
                    'last_name': 'Sari',
                    'email': 'maya.sari@gmail.com',
                    'phone': '+62814-5678-9012',
                    'date_of_birth': date(1982, 6, 30),
                    'gender': 'F',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Kemang Raya No. 56, Kemang',
                    'city': 'Jakarta Selatan',
                    'country': 'Indonesia',
                    'postal_code': '12560',
                    'loyalty_points': 890,
                    'preferences': {'spa': True, 'gym': True, 'late_checkout': True},
                    'is_vip': True
                },
                {
                    'first_name': 'Rudi',
                    'last_name': 'Hartono',
                    'email': 'rudi.hartono@gmail.com',
                    'phone': '+62815-1234-5678',
                    'date_of_birth': date(1975, 11, 14),
                    'gender': 'M',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Senopati No. 89, Kebayoran Baru',
                    'city': 'Jakarta Selatan',
                    'country': 'Indonesia',
                    'postal_code': '12190',
                    'loyalty_points': 1450,
                    'preferences': {'business_center': True, 'meeting_room': True},
                    'is_vip': True
                },
                {
                    'first_name': 'Lina',
                    'last_name': 'Permata',
                    'email': 'lina.permata@yahoo.com',
                    'phone': '+62816-8765-4321',
                    'date_of_birth': date(1988, 4, 3),
                    'gender': 'F',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Cipete Raya No. 34, Cipete',
                    'city': 'Jakarta Selatan',
                    'country': 'Indonesia',
                    'postal_code': '12410',
                    'loyalty_points': 320,
                    'preferences': {'quiet_room': True, 'non_smoking': True},
                    'is_vip': False
                },
                {
                    'first_name': 'Agus',
                    'last_name': 'Setiawan',
                    'email': 'agus.setiawan@gmail.com',
                    'phone': '+62817-9999-1111',
                    'date_of_birth': date(1983, 9, 17),
                    'gender': 'M',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Casablanca No. 188, Tebet',
                    'city': 'Jakarta Selatan',
                    'country': 'Indonesia',
                    'postal_code': '12870',
                    'loyalty_points': 650,
                    'preferences': {'pool_view': True, 'balcony': True},
                    'is_vip': False
                },
                {
                    'first_name': 'Indira',
                    'last_name': 'Sartika',
                    'email': 'indira.sartika@hotmail.com',
                    'phone': '+62818-2222-3333',
                    'date_of_birth': date(1992, 1, 25),
                    'gender': 'F',
                    'nationality': 'Indonesia',
                    'address': 'Jl. Dharmawangsa No. 67, Kebayoran Baru',
                    'city': 'Jakarta Selatan',
                    'country': 'Indonesia',
                    'postal_code': '12160',
                    'loyalty_points': 180,
                    'preferences': {'mini_bar': True, 'room_service': True},
                    'is_vip': False
                }
            ]

            # International guests
            international_guests = [
                {
                    'first_name': 'John',
                    'last_name': 'Smith',
                    'email': 'john.smith@gmail.com',
                    'phone': '+1-555-123-4567',
                    'date_of_birth': date(1980, 5, 12),
                    'gender': 'M',
                    'nationality': 'United States',
                    'address': '123 Main Street',
                    'city': 'New York',
                    'country': 'United States',
                    'postal_code': '10001',
                    'loyalty_points': 950,
                    'preferences': {'english_newspaper': True, 'american_breakfast': True},
                    'is_vip': True
                },
                {
                    'first_name': 'Akiko',
                    'last_name': 'Tanaka',
                    'email': 'akiko.tanaka@gmail.com',
                    'phone': '+81-90-1234-5678',
                    'date_of_birth': date(1985, 10, 8),
                    'gender': 'F',
                    'nationality': 'Japan',
                    'address': '2-3-4 Shibuya, Tokyo',
                    'city': 'Tokyo',
                    'country': 'Japan',
                    'postal_code': '150-0002',
                    'loyalty_points': 1100,
                    'preferences': {'japanese_breakfast': True, 'quiet_room': True},
                    'is_vip': True
                },
                {
                    'first_name': 'Ahmad',
                    'last_name': 'Rahman',
                    'email': 'ahmad.rahman@gmail.com',
                    'phone': '+60-12-345-6789',
                    'date_of_birth': date(1987, 7, 20),
                    'gender': 'M',
                    'nationality': 'Malaysia',
                    'address': 'Jalan Bukit Bintang 88',
                    'city': 'Kuala Lumpur',
                    'country': 'Malaysia',
                    'postal_code': '50200',
                    'loyalty_points': 580,
                    'preferences': {'halal_food': True, 'prayer_direction': True},
                    'is_vip': False
                },
                {
                    'first_name': 'Maria',
                    'last_name': 'Santos',
                    'email': 'maria.santos@gmail.com',
                    'phone': '+63-917-123-4567',
                    'date_of_birth': date(1984, 2, 14),
                    'gender': 'F',
                    'nationality': 'Philippines',
                    'address': 'Makati Avenue 456',
                    'city': 'Manila',
                    'country': 'Philippines',
                    'postal_code': '1200',
                    'loyalty_points': 720,
                    'preferences': {'spa': True, 'late_checkout': True},
                    'is_vip': False
                }
            ]

            all_guests = indonesian_guests + international_guests

            # Create guests
            for guest_data in all_guests:
                guest, created = Guest.objects.get_or_create(
                    email=guest_data['email'],
                    defaults=guest_data
                )
                if created:
                    self.stdout.write(f'Created guest: {guest.full_name}')

            # Create guest documents
            guest_documents = [
                # Indonesian KTP documents
                {
                    'guest_email': 'sari.dewi@gmail.com',
                    'document_type': 'KTP',
                    'document_number': '3171014503850001',
                    'issuing_country': 'Indonesia',
                    'issue_date': date(2020, 3, 15),
                    'expiry_date': date(2030, 3, 15),
                    'is_verified': True
                },
                {
                    'guest_email': 'budi.santoso@yahoo.com',
                    'document_type': 'KTP',
                    'document_number': '3171015408780002',
                    'issuing_country': 'Indonesia',
                    'issue_date': date(2019, 8, 22),
                    'expiry_date': date(2029, 8, 22),
                    'is_verified': True
                },
                # Passports for international travel
                {
                    'guest_email': 'john.smith@gmail.com',
                    'document_type': 'PASSPORT',
                    'document_number': 'US123456789',
                    'issuing_country': 'United States',
                    'issue_date': date(2019, 1, 15),
                    'expiry_date': date(2029, 1, 15),
                    'is_verified': True
                },
                {
                    'guest_email': 'akiko.tanaka@gmail.com',
                    'document_type': 'PASSPORT',
                    'document_number': 'JP987654321',
                    'issuing_country': 'Japan',
                    'issue_date': date(2020, 5, 10),
                    'expiry_date': date(2030, 5, 10),
                    'is_verified': True
                },
                {
                    'guest_email': 'ahmad.rahman@gmail.com',
                    'document_type': 'PASSPORT',
                    'document_number': 'MY555666777',
                    'issuing_country': 'Malaysia',
                    'issue_date': date(2021, 3, 20),
                    'expiry_date': date(2031, 3, 20),
                    'is_verified': True
                },
                {
                    'guest_email': 'rudi.hartono@gmail.com',
                    'document_type': 'DRIVER_LICENSE',
                    'document_number': 'D1234567890',
                    'issuing_country': 'Indonesia',
                    'issue_date': date(2020, 11, 14),
                    'expiry_date': date(2025, 11, 14),
                    'is_verified': True
                }
            ]

            for doc_data in guest_documents:
                try:
                    guest = Guest.objects.get(email=doc_data['guest_email'])
                    doc_data.pop('guest_email')  # Remove email, replace with guest object
                    doc_data['guest'] = guest
                    
                    document, created = GuestDocument.objects.get_or_create(
                        guest=guest,
                        document_type=doc_data['document_type'],
                        defaults=doc_data
                    )
                    if created:
                        self.stdout.write(f'Created document: {document.document_type} for {guest.full_name}')
                except Guest.DoesNotExist:
                    self.stdout.write(f'Guest not found for email: {doc_data["guest_email"]}')

            total_guests = Guest.objects.count()
            total_documents = GuestDocument.objects.count()
            vip_guests = Guest.objects.filter(is_vip=True).count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {total_guests} guests ({vip_guests} VIP) and {total_documents} documents'
                )
            )