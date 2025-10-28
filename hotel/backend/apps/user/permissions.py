"""
Custom permissions for Role-Based Access Control (RBAC)
"""
from rest_framework import permissions
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


class IsAdmin(permissions.BasePermission):
    """
    Permission check for Admin role
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin()


class IsManager(permissions.BasePermission):
    """
    Permission check for Manager role or higher
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_manager()


class IsSupervisor(permissions.BasePermission):
    """
    Permission check for Supervisor role or higher
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_supervisor()


class CanManageBookings(permissions.BasePermission):
    """
    Permission check for users who can manage bookings
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_manage_bookings()


class CanManageHousekeeping(permissions.BasePermission):
    """
    Permission check for users who can manage housekeeping
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_manage_housekeeping()


class CanViewReports(permissions.BasePermission):
    """
    Permission check for users who can view financial reports
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_view_reports()


class CanManageInventory(permissions.BasePermission):
    """
    Permission check for users who can manage inventory
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_manage_inventory()


class HasRole(permissions.BasePermission):
    """
    Permission check for specific roles.
    Usage in view: permission_classes = [HasRole]
    Then in view set: required_roles = ['ADMIN', 'MANAGER']
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required_roles = getattr(view, 'required_roles', [])
        if not required_roles:
            return True  # No specific roles required

        return request.user.has_role(*required_roles)


# Decorator for function-based views
def role_required(*roles):
    """
    Decorator to check if user has any of the specified roles.

    Usage:
        @role_required('ADMIN', 'MANAGER')
        @api_view(['GET'])
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.has_role(*roles):
                return Response(
                    {'error': f'Access denied. Required roles: {", ".join(roles)}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def permission_required(permission_method):
    """
    Decorator to check if user has a specific permission method.

    Usage:
        @permission_required('can_manage_bookings')
        @api_view(['GET'])
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            has_permission = getattr(request.user, permission_method, lambda: False)()
            if not has_permission:
                return Response(
                    {'error': f'Access denied. Required permission: {permission_method}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
