"""
Bookings API endpoints for the frontend
Provides public access to reservation and room data for the hotel booking interface
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count, Prefetch
from django.core.paginator import Paginator
from datetime import date, datetime, timedelta
import json

from ..models import (
    Reservation, Room, Guest, RoomType, CheckIn, Complaint
)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def reservations_api(request):
    """
    Get reservations list with filtering, sorting, and pagination or create new reservation
    Frontend endpoint: /api/reservations/
    """
    if request.method == 'POST':
        # Handle POST requests (create reservation)
        return create_reservation_api(request)
    
    # Handle GET requests (list reservations)
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        search = request.GET.get('search', '')
        reservation_number = request.GET.get('reservation_number', '')
        status_filter = request.GET.get('status', '')
        booking_source_filter = request.GET.get('booking_source', '')
        check_in_date_filter = request.GET.get('check_in_date', '')
        check_out_date_filter = request.GET.get('check_out_date', '')
        ordering = request.GET.get('ordering', '-created_at')
        
        # Base queryset with optimized queries
        queryset = Reservation.objects.select_related(
            'guest', 'room', 'room__room_type', 'created_by'
        )
        
        # Apply filters
        if reservation_number:
            queryset = queryset.filter(reservation_number=reservation_number)
        elif search:
            queryset = queryset.filter(
                Q(reservation_number__icontains=search) |
                Q(guest__first_name__icontains=search) |
                Q(guest__last_name__icontains=search) |
                Q(guest__email__icontains=search)
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        if booking_source_filter:
            queryset = queryset.filter(booking_source=booking_source_filter)
            
        if check_in_date_filter:
            try:
                check_in_date = datetime.strptime(check_in_date_filter, '%Y-%m-%d').date()
                queryset = queryset.filter(check_in_date=check_in_date)
            except ValueError:
                pass
                
        if check_out_date_filter:
            try:
                check_out_date = datetime.strptime(check_out_date_filter, '%Y-%m-%d').date()
                queryset = queryset.filter(check_out_date=check_out_date)
            except ValueError:
                pass
        
        # Apply ordering
        if ordering.startswith('-'):
            field = ordering[1:]
            if field in ['created_at', 'check_in_date', 'check_out_date', 'total_amount']:
                queryset = queryset.order_by(ordering)
        else:
            if ordering in ['created_at', 'check_in_date', 'check_out_date', 'total_amount']:
                queryset = queryset.order_by(ordering)
        
        # Pagination
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize data
        reservations_data = []
        for reservation in page_obj:
            # Get room information
            room_data = None
            if reservation.room:
                room_data = {
                    'id': reservation.room.id,
                    'number': reservation.room.number,
                    'room_type_name': reservation.room.room_type.name,
                    'floor': reservation.room.floor,
                    'status': reservation.room.status,
                    'current_price': float(reservation.room.room_type.base_price)
                }
            
            # Get guest information
            guest_data = None
            if reservation.guest:
                guest_data = {
                    'id': reservation.guest.id,
                    'first_name': reservation.guest.first_name,
                    'last_name': reservation.guest.last_name,
                    'full_name': reservation.guest.full_name,
                    'email': reservation.guest.email,
                    'phone': reservation.guest.phone,
                    'nationality': reservation.guest.nationality,
                    'is_vip': reservation.guest.is_vip
                }
            
            # Status display mapping
            status_display_map = {
                'PENDING': 'Pending',
                'CONFIRMED': 'Confirmed',
                'CHECKED_IN': 'Checked In',
                'CHECKED_OUT': 'Checked Out',
                'CANCELLED': 'Cancelled',
                'NO_SHOW': 'No Show'
            }
            
            # Booking source display mapping
            booking_source_display_map = {
                'DIRECT': 'Direct',
                'ONLINE': 'Online',
                'PHONE': 'Phone',
                'WALK_IN': 'Walk-in',
                'TRAVEL_AGENT': 'Travel Agent',
                'EMAIL': 'Email'
            }
            
            reservation_data = {
                'id': reservation.id,
                'reservation_number': reservation.reservation_number,
                'guest': reservation.guest.id if reservation.guest else None,
                'guest_details': guest_data,
                'guest_name': reservation.guest.full_name if reservation.guest else 'Unknown Guest',
                'check_in_date': reservation.check_in_date.strftime('%Y-%m-%d'),
                'check_out_date': reservation.check_out_date.strftime('%Y-%m-%d'),
                'nights': reservation.nights,
                'adults': reservation.adults,
                'children': reservation.children,
                'status': reservation.status,
                'status_display': status_display_map.get(reservation.status, reservation.status),
                'booking_source': reservation.booking_source,
                'booking_source_display': booking_source_display_map.get(reservation.booking_source, reservation.booking_source),
                'total_rooms': 1,  # For now, single room per reservation
                'total_amount': float(reservation.total_amount),
                'created_at': reservation.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'rooms': [
                    {
                        'id': reservation.room.id if reservation.room else None,
                        'room_number': reservation.room.number if reservation.room else '',
                        'room_type_name': reservation.room.room_type.name if reservation.room else '',
                        'room_details': room_data,
                        'rate': float(reservation.room.room_type.base_price) if reservation.room else 0,
                        'total_amount': float(reservation.total_amount),
                        'nights': reservation.nights
                    }
                ] if reservation.room else [],
                'special_requests': reservation.special_requests or '',
                'notes': reservation.notes or '',
                'can_cancel': reservation.status in ['PENDING', 'CONFIRMED']
            }
            
            reservations_data.append(reservation_data)
        
        # Response with improved pagination structure
        response_data = {
            'results': reservations_data,
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'page_size': page_size,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next': f"?page={page + 1}&page_size={page_size}" if page_obj.has_next() else None,
            'previous': f"?page={page - 1}&page_size={page_size}" if page_obj.has_previous() else None,
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch reservations',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def rooms_api(request):
    """
    Get rooms list with filtering and pagination
    Frontend endpoint: /api/rooms/
    """
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        room_type_filter = request.GET.get('room_type', '')
        floor_filter = request.GET.get('floor', '')
        status_filter = request.GET.get('status', '')
        ordering = request.GET.get('ordering', 'number')
        
        # Base queryset
        queryset = Room.objects.select_related('room_type').filter(is_active=True)
        
        # Apply filters
        if room_type_filter:
            queryset = queryset.filter(room_type__name__icontains=room_type_filter)
            
        if floor_filter:
            try:
                floor = int(floor_filter)
                queryset = queryset.filter(floor=floor)
            except ValueError:
                pass
                
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply ordering
        if ordering in ['number', 'floor', 'status']:
            queryset = queryset.order_by(ordering)
        
        # Pagination
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize data
        rooms_data = []
        for room in page_obj:
            room_data = {
                'id': room.id,
                'number': room.number,
                'room_type': room.room_type.id,
                'room_type_name': room.room_type.name,
                'floor': room.floor,
                'status': room.status,
                'max_occupancy': room.room_type.max_occupancy,
                'base_price': float(room.room_type.base_price),
                'description': room.room_type.description,
                'amenities': room.room_type.amenities or [],
                'is_active': room.is_active,
                'created_at': room.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            }
            rooms_data.append(room_data)
        
        # Response with improved pagination structure
        response_data = {
            'results': rooms_data,
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'page_size': page_size,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next': f"?page={page + 1}&page_size={page_size}" if page_obj.has_next() else None,
            'previous': f"?page={page - 1}&page_size={page_size}" if page_obj.has_previous() else None,
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch rooms',
            'detail': str(e)
        }, status=500)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def guests_api(request):
    """
    Get guests list with search functionality or create new guest
    Frontend endpoint: /api/guests/
    """
    if request.method == 'POST':
        # Handle POST requests (create guest)
        return create_guest_api(request)
    
    # Handle GET requests (list guests)
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        email = request.GET.get('email', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        # Base queryset
        queryset = Guest.objects.all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
            
        if email:
            queryset = queryset.filter(email=email)
        
        queryset = queryset.order_by('-created_at')
        
        # Pagination
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize data
        guests_data = []
        for guest in page_obj:
            guest_data = {
                'id': guest.id,
                'first_name': guest.first_name,
                'last_name': guest.last_name,
                'full_name': guest.full_name,
                'email': guest.email,
                'phone': guest.phone,
                'nationality': guest.nationality,
                'date_of_birth': guest.date_of_birth.strftime('%Y-%m-%d') if guest.date_of_birth else None,
                'id_number': guest.id_number,
                'is_vip': guest.is_vip,
                'loyalty_points': guest.loyalty_points,
                'created_at': guest.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            }
            guests_data.append(guest_data)
        
        # Response with improved pagination structure
        response_data = {
            'results': guests_data,
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'page_size': page_size,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next': f"?page={page + 1}&page_size={page_size}" if page_obj.has_next() else None,
            'previous': f"?page={page - 1}&page_size={page_size}" if page_obj.has_previous() else None,
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch guests',
            'detail': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_guest_api(request):
    """
    Create a new guest
    Frontend endpoint: /api/guests/ (POST)
    """
    try:
        data = request.data
        
        # Check if guest already exists by email
        existing_guest = Guest.objects.filter(email=data.get('email')).first()
        if existing_guest:
            return Response({
                'id': existing_guest.id,
                'first_name': existing_guest.first_name,
                'last_name': existing_guest.last_name,
                'full_name': existing_guest.full_name,
                'email': existing_guest.email,
                'phone': existing_guest.phone,
                'nationality': existing_guest.nationality,
                'is_vip': existing_guest.is_vip,
            }, status=200)
        
        # Create new guest
        guest = Guest.objects.create(
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            email=data.get('email'),
            phone=data.get('phone', ''),
            nationality=data.get('nationality', 'Indonesia'),
            date_of_birth=data.get('date_of_birth') if data.get('date_of_birth') else None,
            id_number=data.get('id_number', ''),
        )
        
        return Response({
            'id': guest.id,
            'first_name': guest.first_name,
            'last_name': guest.last_name,
            'full_name': guest.full_name,
            'email': guest.email,
            'phone': guest.phone,
            'nationality': guest.nationality,
            'is_vip': guest.is_vip,
        }, status=201)
        
    except Exception as e:
        return Response({
            'error': 'Failed to create guest',
            'detail': str(e)
        }, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_reservation_api(request):
    """
    Create a new reservation
    Frontend endpoint: /api/reservations/ (POST)
    """
    try:
        data = request.data
        
        # Get or create guest
        guest_id = data.get('guest')
        if not guest_id:
            return Response({
                'error': 'Guest ID is required'
            }, status=400)
            
        guest = Guest.objects.get(id=guest_id)
        
        # Get room
        room_id = data.get('room')
        if not room_id:
            return Response({
                'error': 'Room ID is required'
            }, status=400)
            
        room = Room.objects.get(id=room_id)
        
        # Parse dates
        check_in_date = datetime.strptime(data.get('check_in_date'), '%Y-%m-%d').date()
        check_out_date = datetime.strptime(data.get('check_out_date'), '%Y-%m-%d').date()
        
        # Calculate nights
        nights = (check_out_date - check_in_date).days
        
        # Generate reservation number
        import random
        timestamp = check_in_date.strftime('%Y%m%d')
        random_num = random.randint(1000, 9999)
        reservation_number = f'RES{timestamp}{random_num}'
        
        # Ensure uniqueness
        while Reservation.objects.filter(reservation_number=reservation_number).exists():
            random_num = random.randint(1000, 9999)
            reservation_number = f'RES{timestamp}{random_num}'
        
        # Calculate total amount
        total_amount = room.room_type.base_price * nights
        
        # Create reservation
        reservation = Reservation.objects.create(
            reservation_number=reservation_number,
            guest=guest,
            room=room,
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            nights=nights,
            adults=data.get('adults', 1),
            children=data.get('children', 0),
            status='CONFIRMED',
            booking_source=data.get('booking_source', 'DIRECT'),
            total_amount=total_amount,
            special_requests=data.get('special_requests', ''),
            notes=data.get('notes', ''),
        )
        
        return Response({
            'id': reservation.id,
            'reservation_number': reservation.reservation_number,
            'guest_name': guest.full_name,
            'room_number': room.number,
            'check_in_date': check_in_date.strftime('%Y-%m-%d'),
            'check_out_date': check_out_date.strftime('%Y-%m-%d'),
            'nights': nights,
            'total_amount': float(total_amount),
            'status': 'CONFIRMED',
        }, status=201)
        
    except Guest.DoesNotExist:
        return Response({'error': 'Guest not found'}, status=404)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)
    except Exception as e:
        return Response({
            'error': 'Failed to create reservation',
            'detail': str(e)
        }, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def reservation_detail_api(request, reservation_id):
    """
    Get individual reservation details by ID
    Frontend endpoint: /api/reservations/{id}/
    """
    try:
        reservation = Reservation.objects.select_related(
            'guest', 'room', 'room__room_type', 'created_by'
        ).get(id=reservation_id)
        
        # Get room information
        room_data = None
        if reservation.room:
            room_data = {
                'id': reservation.room.id,
                'number': reservation.room.number,
                'room_type_name': reservation.room.room_type.name,
                'floor': reservation.room.floor,
                'status': reservation.room.status,
                'current_price': float(reservation.room.room_type.base_price),
                'amenities': ['WiFi', 'TV', 'AC', 'Mini Bar', 'Room Service', 'Safe']  # Default amenities
            }
        
        # Get guest information
        guest_data = None
        if reservation.guest:
            guest_data = {
                'id': reservation.guest.id,
                'first_name': reservation.guest.first_name,
                'last_name': reservation.guest.last_name,
                'full_name': reservation.guest.full_name,
                'email': reservation.guest.email,
                'phone': reservation.guest.phone,
                'nationality': reservation.guest.nationality,
                'address': f'{reservation.guest.first_name} {reservation.guest.last_name} Address',  # Mock address
                'id_number': reservation.guest.id_number or 'ID123456789',
                'id_type': reservation.guest.id_type or 'Passport',
                'date_of_birth': reservation.guest.date_of_birth.strftime('%Y-%m-%d') if reservation.guest.date_of_birth else '1990-01-01',
                'gender': 'Male',  # Mock gender
                'emergency_contact_name': 'Emergency Contact',  # Mock emergency contact
                'emergency_contact_phone': '+62-123-456-7890',  # Mock emergency phone
                'vip_status': reservation.guest.is_vip,
                'preferences': {},  # Mock preferences
                'allergies': []  # Mock allergies
            }
        
        # Status display mapping
        status_display_map = {
            'PENDING': 'Pending',
            'CONFIRMED': 'Confirmed',
            'CHECKED_IN': 'Checked In',
            'CHECKED_OUT': 'Checked Out',
            'CANCELLED': 'Cancelled',
            'NO_SHOW': 'No Show'
        }
        
        # Booking source display mapping
        booking_source_display_map = {
            'DIRECT': 'Direct',
            'ONLINE': 'Online',
            'PHONE': 'Phone',
            'WALK_IN': 'Walk-in',
            'TRAVEL_AGENT': 'Travel Agent',
            'EMAIL': 'Email'
        }
        
        # Calculate total with taxes
        subtotal = float(reservation.total_amount)
        taxes = subtotal * 0.11  # 11% VAT
        grand_total = subtotal + taxes
        
        reservation_data = {
            'id': reservation.id,
            'reservation_number': reservation.reservation_number,
            'guest_name': reservation.guest.full_name if reservation.guest else 'Unknown Guest',
            'guest_details': guest_data,
            'additional_guests': [],  # Mock additional guests
            'check_in_date': reservation.check_in_date.strftime('%Y-%m-%d'),
            'check_out_date': reservation.check_out_date.strftime('%Y-%m-%d'),
            'nights': reservation.nights,
            'adults': reservation.adults,
            'children': reservation.children,
            'status': reservation.status,
            'status_display': status_display_map.get(reservation.status, reservation.status),
            'booking_source': reservation.booking_source,
            'booking_source_display': booking_source_display_map.get(reservation.booking_source, reservation.booking_source),
            'total_rooms': 1,
            'total_amount': subtotal,
            'grand_total': grand_total,
            'taxes': taxes,
            'deposit_amount': subtotal * 0.3,  # 30% deposit
            'balance_due': grand_total - (subtotal * 0.3),
            'discount': 0,
            'created_at': reservation.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'rooms': [
                {
                    'id': reservation.room.id if reservation.room else None,
                    'room_number': reservation.room.number if reservation.room else '',
                    'room_type_name': reservation.room.room_type.name if reservation.room else '',
                    'rate': float(reservation.room.room_type.base_price) if reservation.room else 0,
                    'total_amount': float(reservation.total_amount),
                    'floor': reservation.room.floor if reservation.room else 1,
                    'amenities': ['WiFi', 'TV', 'AC', 'Mini Bar', 'Room Service', 'Safe']
                }
            ] if reservation.room else [],
            'special_requests': [
                {
                    'id': 1,
                    'type': 'Accommodation',
                    'description': reservation.special_requests or 'No special requests',
                    'status': 'pending',
                    'priority': 'medium',
                    'created_at': reservation.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'notes': reservation.notes or 'No additional notes'
                }
            ] if reservation.special_requests or reservation.notes else [],
            'payment_details': [
                {
                    'id': 1,
                    'method': 'Credit Card',
                    'amount': subtotal * 0.3,  # Deposit amount
                    'status': 'Completed',
                    'transaction_id': f'TXN{reservation.id}',
                    'paid_at': reservation.created_at.strftime('%Y-%m-%d %H:%M:%S')
                }
            ],
            'loyalty_program': {
                'program_name': 'Kapulaga Rewards',
                'member_number': f'KR{reservation.guest.id:09d}' if reservation.guest else 'KR000000000',
                'tier_level': 'Gold' if reservation.guest and reservation.guest.is_vip else 'Silver',
                'points_balance': reservation.guest.loyalty_points if reservation.guest else 0,
                'points_earned': int(subtotal / 1000),  # 1 point per 1000 IDR
                'tier_benefits': ['Free WiFi', 'Late Checkout', 'Room Upgrade (Subject to Availability)', 'Welcome Drink']
            } if reservation.guest else None,
            'transportation': [],  # Mock transportation
            'extras': [],  # Mock extras
            'can_cancel': reservation.status in ['PENDING', 'CONFIRMED'],
            'booking_notes': reservation.notes or ''
        }
        
        return Response(reservation_data)
        
    except Reservation.DoesNotExist:
        return Response({'error': 'Reservation not found'}, status=404)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch reservation details',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def room_detail_api(request, room_id):
    """
    Get individual room details by ID
    Frontend endpoint: /api/rooms/{id}/
    """
    try:
        room = Room.objects.select_related('room_type').get(id=room_id)
        
        room_data = {
            'id': room.id,
            'number': room.number,
            'room_type': room.room_type.id,
            'room_type_name': room.room_type.name,
            'floor': room.floor,
            'status': room.status,
            'max_occupancy': room.room_type.max_occupancy,
            'base_price': float(room.room_type.base_price),
            'description': room.room_type.description or f'Comfortable {room.room_type.name} with modern amenities',
            'amenities': ['WiFi', 'TV', 'AC', 'Mini Bar', 'Room Service', 'Safe', 'Balcony'],
            'is_active': room.is_active,
            'created_at': room.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'images': [
                '/hotelroom.jpeg'  # Default hotel room image
            ]
        }
        
        return Response(room_data)
        
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch room details',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def guest_detail_api(request, guest_id):
    """
    Get individual guest details by ID
    Frontend endpoint: /api/guests/{id}/
    """
    try:
        guest = Guest.objects.get(id=guest_id)
        
        guest_data = {
            'id': guest.id,
            'first_name': guest.first_name,
            'last_name': guest.last_name,
            'full_name': guest.full_name,
            'email': guest.email,
            'phone': guest.phone,
            'nationality': guest.nationality,
            'address': f'{guest.first_name} {guest.last_name} Address, Jakarta, Indonesia',
            'date_of_birth': guest.date_of_birth.strftime('%Y-%m-%d') if guest.date_of_birth else None,
            'gender': 'Male',  # Mock gender data
            'id_number': guest.id_number or f'ID{guest.id:09d}',
            'id_type': guest.id_type or 'National ID',
            'is_vip': guest.is_vip,
            'loyalty_points': guest.loyalty_points,
            'created_at': guest.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'preferences': {},
            'allergies': [],
            'emergency_contact_name': 'Emergency Contact',
            'emergency_contact_phone': '+62-123-456-7890'
        }
        
        return Response(guest_data)
        
    except Guest.DoesNotExist:
        return Response({'error': 'Guest not found'}, status=404)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch guest details',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def room_types_api(request):
    """
    Get room types list with availability information
    Frontend endpoint: /api/room-types/
    """
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        
        # Get all active room types
        room_types = RoomType.objects.filter(is_active=True).order_by('name')
        
        # Add room count and availability for each room type
        room_types_data = []
        for room_type in room_types:
            # Count total rooms and available rooms for this type
            total_rooms = Room.objects.filter(room_type=room_type, is_active=True).count()
            available_rooms = Room.objects.filter(
                room_type=room_type, 
                is_active=True,
                status='AVAILABLE'
            ).count()
            
            # Calculate occupancy percentage
            occupancy_percentage = 0
            if total_rooms > 0:
                occupied_rooms = total_rooms - available_rooms
                occupancy_percentage = (occupied_rooms / total_rooms) * 100
            
            room_type_data = {
                'id': room_type.id,
                'name': room_type.name,
                'description': room_type.description,
                'base_price': str(room_type.base_price),  # Convert Decimal to string for JSON
                'max_occupancy': room_type.max_occupancy,
                'size_sqm': room_type.size_sqm,
                'amenities': room_type.amenities,
                'is_active': room_type.is_active,
                'created_at': room_type.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': room_type.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                'occupancy_percentage': round(occupancy_percentage, 2),
                'available_rooms_count': available_rooms,
                'total_rooms_count': total_rooms
            }
            room_types_data.append(room_type_data)
        
        # Apply pagination
        paginator = Paginator(room_types_data, page_size)
        
        try:
            page_obj = paginator.page(page)
        except:
            page_obj = paginator.page(1)
        
        return Response({
            'count': paginator.count,
            'next': f'?page={page_obj.next_page_number()}&page_size={page_size}' if page_obj.has_next() else None,
            'previous': f'?page={page_obj.previous_page_number()}&page_size={page_size}' if page_obj.has_previous() else None,
            'results': list(page_obj.object_list),
            'total_pages': paginator.num_pages,
            'current_page': page,
            'page_size': page_size,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous()
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch room types',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def room_type_detail_api(request, room_type_id):
    """
    Get individual room type details by ID
    Frontend endpoint: /api/room-types/{id}/
    """
    try:
        room_type = RoomType.objects.get(id=room_type_id, is_active=True)
        
        # Count total rooms and available rooms for this type
        total_rooms = Room.objects.filter(room_type=room_type, is_active=True).count()
        available_rooms = Room.objects.filter(
            room_type=room_type, 
            is_active=True,
            status='AVAILABLE'
        ).count()
        
        # Calculate occupancy percentage
        occupancy_percentage = 0
        if total_rooms > 0:
            occupied_rooms = total_rooms - available_rooms
            occupancy_percentage = (occupied_rooms / total_rooms) * 100
        
        room_type_data = {
            'id': room_type.id,
            'name': room_type.name,
            'description': room_type.description,
            'base_price': str(room_type.base_price),  # Convert Decimal to string for JSON
            'max_occupancy': room_type.max_occupancy,
            'size_sqm': room_type.size_sqm,
            'amenities': room_type.amenities,
            'is_active': room_type.is_active,
            'created_at': room_type.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': room_type.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            'occupancy_percentage': round(occupancy_percentage, 2),
            'available_rooms_count': available_rooms,
            'total_rooms_count': total_rooms
        }
        
        return Response(room_type_data)
        
    except RoomType.DoesNotExist:
        return Response({'error': 'Room type not found'}, status=404)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch room type details',
            'detail': str(e)
        }, status=500)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def complaints_api(request):
    """
    Get complaints list with filtering and status counters
    Frontend endpoint: /api/hotel/complaints/
    """
    if request.method == 'POST':
        # Handle complaint creation
        try:
            data = request.data
            complaint = Complaint.objects.create(
                guest_id=data.get('guest_id'),
                room_id=data.get('room_id'),
                category=data.get('category', 'OTHER'),
                priority=data.get('priority', 'MEDIUM'),
                title=data.get('title'),
                description=data.get('description'),
                incident_date=data.get('incident_date')
            )
            return Response({
                'id': complaint.id,
                'complaint_number': complaint.complaint_number,
                'status': 'success'
            }, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
    # Handle GET request
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        priority_filter = request.GET.get('priority', '')
        category_filter = request.GET.get('category', '')
        
        # Base queryset
        queryset = Complaint.objects.select_related('guest', 'room')
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(complaint_number__icontains=search) |
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(guest__first_name__icontains=search) |
                Q(guest__last_name__icontains=search)
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        
        # Calculate status counters
        all_complaints = Complaint.objects.all()
        status_counters = {
            'in_progress': all_complaints.filter(status='IN_PROGRESS').count(),
            'completed': all_complaints.filter(status='RESOLVED').count(),
            'escalated': all_complaints.filter(priority='URGENT').count(),
            'urgent': all_complaints.filter(priority='URGENT').count(),
            'high_priority': all_complaints.filter(priority='HIGH').count(),
            'overdue': 0  # Would need date logic for overdue
        }
        
        # Category counters
        category_counters = []
        for category_choice in Complaint.CATEGORY_CHOICES:
            category_code = category_choice[0]
            category_name = category_choice[1]
            category_complaints = all_complaints.filter(category=category_code)
            
            category_counters.append({
                'category_id': category_code,
                'category_name': category_name,
                'total_complaints': category_complaints.count(),
                'status_counts': {
                    'open': category_complaints.filter(status='OPEN').count(),
                    'in_progress': category_complaints.filter(status='IN_PROGRESS').count(),
                    'resolved': category_complaints.filter(status='RESOLVED').count(),
                    'closed': category_complaints.filter(status='CLOSED').count()
                }
            })
        
        # Paginate
        paginator = Paginator(queryset, page_size)
        
        try:
            page_obj = paginator.page(page)
        except:
            page_obj = paginator.page(1)
        
        # Format complaint data
        results = []
        for complaint in page_obj.object_list:
            # Map Django status to frontend expected status
            status_map = {
                'OPEN': 'SUBMITTED',
                'IN_PROGRESS': 'IN_PROGRESS',
                'RESOLVED': 'RESOLVED',
                'CLOSED': 'CLOSED'
            }
            
            complaint_data = {
                'id': complaint.id,
                'complaint_number': complaint.complaint_number,
                'title': complaint.title,
                'description': complaint.description,
                'category': {
                    'id': complaint.category,
                    'name': dict(Complaint.CATEGORY_CHOICES).get(complaint.category, complaint.category),
                    'description': f'{dict(Complaint.CATEGORY_CHOICES).get(complaint.category, complaint.category)} related complaints',
                    'color': '#005357',
                    'department': None,
                    'is_active': True,
                    'created_at': complaint.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'updated_at': complaint.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                },
                'priority': complaint.priority,
                'status': status_map.get(complaint.status, complaint.status),
                'source': 'GUEST',
                'guest': {
                    'id': complaint.guest.id if complaint.guest else 0,
                    'full_name': complaint.guest.full_name if complaint.guest else 'Anonymous',
                    'email': complaint.guest.email if complaint.guest else '',
                    'phone': complaint.guest.phone if complaint.guest else '',
                    'nationality': complaint.guest.nationality if complaint.guest else '',
                    'loyalty_points': complaint.guest.loyalty_points if complaint.guest else 0,
                    'is_vip': complaint.guest.is_vip if complaint.guest else False,
                    'is_active': True,
                    'gender_display': 'Not specified',
                    'loyalty_level': 'Silver'
                } if complaint.guest else None,
                'room_number': complaint.room.number if complaint.room else None,
                'incident_date': complaint.incident_date.strftime('%Y-%m-%d %H:%M:%S') if complaint.incident_date else complaint.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'assigned_to': None,
                'assigned_department': None,
                'is_escalated': complaint.priority == 'URGENT',
                'follow_up_required': complaint.status == 'IN_PROGRESS',
                'is_overdue': False,
                'response_time': None,
                'image_count': 0,
                'response_count': 0,
                'created_at': complaint.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': complaint.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            results.append(complaint_data)
        
        return Response({
            'count': paginator.count,
            'next': f'?page={page_obj.next_page_number()}&page_size={page_size}' if page_obj.has_next() else None,
            'previous': f'?page={page_obj.previous_page_number()}&page_size={page_size}' if page_obj.has_previous() else None,
            'results': results,
            'status_counters': status_counters,
            'category_status_counters': category_counters
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch complaints',
            'detail': str(e)
        }, status=500)