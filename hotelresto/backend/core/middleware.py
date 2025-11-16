"""
Custom authentication middleware for Ladapala Resto Backend
Ensures API requests are authenticated for protected endpoints
"""
from django.http import JsonResponse
from django.urls import resolve


class AuthenticationMiddleware:
    """
    Middleware to enforce authentication on protected API endpoints.

    Public endpoints (no auth required):
    - /api/user/login/
    - /api/user/check-session/ (for session validation)
    - /admin/ (Django admin)
    - /media/ (static media files)
    - /static/ (static files)

    All other /api/ endpoints require authenticated session.
    """

    # Endpoints that don't require authentication
    PUBLIC_PATHS = [
        '/api/user/login/',
        '/api/user/check-session/',
    ]

    # Path prefixes that are always public
    PUBLIC_PREFIXES = [
        '/admin/',
        '/media/',
        '/static/',
        '/api/feedback/',  # Allow public feedback submission
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the request path
        path = request.path

        # Allow public prefixes (admin, media, static)
        if any(path.startswith(prefix) for prefix in self.PUBLIC_PREFIXES):
            return self.get_response(request)

        # Allow specific public paths
        if path in self.PUBLIC_PATHS:
            return self.get_response(request)

        # For all other /api/ endpoints, require authentication
        if path.startswith('/api/'):
            if not request.user.is_authenticated:
                return JsonResponse({
                    'error': 'Authentication required',
                    'detail': 'You must be logged in to access this endpoint'
                }, status=401)

        # Continue processing the request
        response = self.get_response(request)
        return response


class StaffRequiredMiddleware:
    """
    Middleware to enforce staff relationship for staff-specific endpoints.

    Checks if authenticated user has a Staff record for endpoints that require it.
    """

    # Endpoints that require staff relationship
    STAFF_REQUIRED_PATHS = [
        '/api/cashier-sessions/',
        '/api/orders/',
        '/api/payments/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Check if this endpoint requires staff
        requires_staff = any(path.startswith(staff_path) for staff_path in self.STAFF_REQUIRED_PATHS)

        if requires_staff and request.user.is_authenticated:
            # Check if user has staff relationship
            if not hasattr(request.user, 'staff'):
                return JsonResponse({
                    'error': 'Staff access required',
                    'detail': 'This endpoint requires a staff account'
                }, status=403)

            # Check if staff is active
            if not request.user.staff.is_active:
                return JsonResponse({
                    'error': 'Inactive staff account',
                    'detail': 'Your staff account is not active'
                }, status=403)

        # Continue processing the request
        response = self.get_response(request)
        return response
