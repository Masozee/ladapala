# Import all ViewSets to make them available when importing from views
from .rooms import RoomTypeViewSet, RoomViewSet
from .guests import GuestViewSet
from .reservations import ReservationViewSet
from .payments import PaymentViewSet
from .complaints import ComplaintViewSet
from .checkins import CheckInViewSet
from .calendars import HolidayViewSet
from .inventory import InventoryItemViewSet
from .dashboard import hotel_dashboard
from .financial_new import FinancialViewSet, FinancialTransactionViewSet, InvoiceViewSet

# Make all ViewSets available for import
__all__ = [
    'RoomTypeViewSet', 'RoomViewSet', 'GuestViewSet', 'ReservationViewSet',
    'PaymentViewSet', 'ComplaintViewSet', 'CheckInViewSet', 'HolidayViewSet',
    'InventoryItemViewSet', 'hotel_dashboard',
    'FinancialViewSet', 'FinancialTransactionViewSet', 'InvoiceViewSet'
]