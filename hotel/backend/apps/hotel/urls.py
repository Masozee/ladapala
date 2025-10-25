from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomTypeViewSet, RoomViewSet, GuestViewSet, ReservationViewSet,
    PaymentViewSet, ComplaintViewSet, CheckInViewSet, HolidayViewSet,
    InventoryItemViewSet, hotel_dashboard
)
from .views.complaints import ComplaintImageViewSet
from .views.reports import daily_reports, daily_reports_range, monthly_reports

router = DefaultRouter()
router.register(r'room-types', RoomTypeViewSet, basename='hotel-room-types')
router.register(r'rooms', RoomViewSet, basename='hotel-rooms')
router.register(r'guests', GuestViewSet, basename='hotel-guests')
router.register(r'reservations', ReservationViewSet, basename='hotel-reservations')
router.register(r'payments', PaymentViewSet, basename='hotel-payments')
router.register(r'complaints', ComplaintViewSet, basename='hotel-complaints')
router.register(r'complaint-images', ComplaintImageViewSet, basename='hotel-complaint-images')
router.register(r'checkins', CheckInViewSet, basename='hotel-checkins')
router.register(r'holidays', HolidayViewSet, basename='hotel-holidays')
router.register(r'inventory', InventoryItemViewSet, basename='hotel-inventory')

urlpatterns = [
    path('', include(router.urls)),
    path('main/', hotel_dashboard, name='hotel-dashboard'),
    path('reports/daily/', daily_reports, name='daily-reports'),
    path('reports/daily-range/', daily_reports_range, name='daily-reports-range'),
    path('reports/monthly/', monthly_reports, name='monthly-reports'),
]