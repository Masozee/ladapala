"""
Public API URLs for hotel frontend
These endpoints provide public access without authentication for the frontend interface
"""

from django.urls import path
from .views.bookings_api import (
    reservations_api,
    rooms_api, 
    guests_api,
    create_guest_api,
    create_reservation_api,
    reservation_detail_api,
    room_detail_api,
    guest_detail_api,
    room_types_api,
    room_type_detail_api,
    complaints_api
)

urlpatterns = [
    # Public API endpoints for frontend
    path('reservations/', reservations_api, name='public-reservations-list'),
    path('rooms/', rooms_api, name='public-rooms-list'),
    path('room-types/', room_types_api, name='public-room-types-list'),
    path('guests/', guests_api, name='public-guests-list'),
    
    # Detail endpoints for individual records
    path('reservations/<int:reservation_id>/', reservation_detail_api, name='public-reservation-detail'),
    path('rooms/<int:room_id>/', room_detail_api, name='public-room-detail'),
    path('room-types/<int:room_type_id>/', room_type_detail_api, name='public-room-type-detail'),
    path('guests/<int:guest_id>/', guest_detail_api, name='public-guest-detail'),
    
    # For handling POST requests to the same endpoints
    path('reservations/create/', create_reservation_api, name='public-reservations-create'),
    path('guests/create/', create_guest_api, name='public-guests-create'),
]