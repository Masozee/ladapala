# Import all ViewSets to make them available when importing from views
from .rooms import RoomTypeViewSet, RoomViewSet
from .guests import GuestViewSet
from .reservations import ReservationViewSet
from .payments import PaymentViewSet
from .complaints import ComplaintViewSet
from .checkins import CheckInViewSet
from .calendars import HolidayViewSet
from .inventory import InventoryItemViewSet
from .suppliers import SupplierViewSet
from .dashboard import hotel_dashboard
from .financial_new import FinancialViewSet, FinancialTransactionViewSet, InvoiceViewSet
from .system_monitoring import system_resources, system_stats, process_list
from .amenities import AmenityRequestViewSet, AmenityCategoryViewSet
from .events import EventPackageViewSet, FoodPackageViewSet, EventBookingViewSet, EventPaymentViewSet, EventAddOnViewSet

# Make all ViewSets available for import
__all__ = [
    'RoomTypeViewSet', 'RoomViewSet', 'GuestViewSet', 'ReservationViewSet',
    'PaymentViewSet', 'ComplaintViewSet', 'CheckInViewSet', 'HolidayViewSet',
    'InventoryItemViewSet', 'SupplierViewSet', 'hotel_dashboard',
    'FinancialViewSet', 'FinancialTransactionViewSet', 'InvoiceViewSet',
    'system_resources', 'system_stats', 'process_list',
    'AmenityRequestViewSet', 'AmenityCategoryViewSet',
    'EventPackageViewSet', 'FoodPackageViewSet', 'EventBookingViewSet', 'EventPaymentViewSet', 'EventAddOnViewSet'
]