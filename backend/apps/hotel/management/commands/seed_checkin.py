from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from datetime import datetime, date, timedelta
import random
from apps.checkin.models import CheckIn, CheckOut, RoomKey
from apps.reservations.models import Reservation


class Command(BaseCommand):
    help = 'Create seed data for checkin app'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for check-in/check-out...')
        
        with transaction.atomic():
            # Get reservations that should have check-in data
            checked_in_reservations = Reservation.objects.filter(status='CHECKED_IN')
            checked_out_reservations = Reservation.objects.filter(status='CHECKED_OUT')
            
            # Create check-ins for checked-in and checked-out guests
            for reservation in list(checked_in_reservations) + list(checked_out_reservations):
                # Check if check-in already exists
                if hasattr(reservation, 'checkin'):
                    continue
                
                # Calculate check-in time (usually after 2 PM)
                checkin_date = reservation.check_in_date
                checkin_time = datetime.combine(
                    checkin_date, 
                    datetime.min.time().replace(
                        hour=random.randint(14, 18),  # 2 PM - 6 PM
                        minute=random.randint(0, 59)
                    )
                )
                
                # Create check-in record
                checkin = CheckIn.objects.create(
                    reservation=reservation,
                    actual_check_in_time=checkin_time,
                    adults_count=reservation.adults,
                    children_count=reservation.children,
                    identity_verified=True,
                    verified_by='Front Office Staff',
                    deposit_paid=reservation.deposit_amount,
                    number_of_keys=reservation.rooms.count(),
                    special_requests_fulfilled=reservation.special_requests or '',
                    notes=f'Check-in completed for {reservation.guest.full_name}'
                )
                
                self.stdout.write(f'Created check-in for: {reservation.guest.full_name}')
                
                # Create room keys for each room in the reservation
                for room_reservation in reservation.rooms.all():
                    room_key = RoomKey.objects.create(
                        check_in=checkin,
                        room=room_reservation.room,
                        key_code=f'KEY-{room_reservation.room.number}',
                        notes=f'Key for room {room_reservation.room.number}'
                    )
                    self.stdout.write(f'Issued key: {room_key.key_code}')
                
                # Create check-out for completed reservations
                if reservation.status == 'CHECKED_OUT':
                    checkout_date = reservation.check_out_date
                    checkout_time = datetime.combine(
                        checkout_date,
                        datetime.min.time().replace(
                            hour=random.randint(10, 12),  # 10 AM - 12 PM
                            minute=random.randint(0, 59)
                        )
                    )
                    
                    checkout = CheckOut.objects.create(
                        check_in=checkin,
                        actual_check_out_time=checkout_time,
                        room_condition='CLEAN',
                        minibar_charges=Decimal(str(random.randint(0, 100000))),
                        phone_charges=Decimal('0.00'),
                        other_charges=Decimal('0.00'),
                        processed_by='Front Office Staff',
                        notes=f'Check-out completed for {reservation.guest.full_name}'
                    )
                    
                    # Return all keys (deactivate them)
                    for room_key in checkin.keys.all():
                        room_key.deactivate()
                    
                    self.stdout.write(f'Created check-out for: {reservation.guest.full_name}')

            total_checkins = CheckIn.objects.count()
            total_checkouts = CheckOut.objects.count()
            total_keys = RoomKey.objects.count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created:\n'
                    f'- {total_checkins} check-ins\n'
                    f'- {total_checkouts} check-outs\n'
                    f'- {total_keys} room keys'
                )
            )