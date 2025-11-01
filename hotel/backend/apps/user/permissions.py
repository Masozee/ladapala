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


# ============================================================================
# Department-Based Access Control (RBAC)
# ============================================================================
"""
Access levels by department:
- Management: Access to /office (admin/management pages)
- Front Office: Access to main pages (reservations, check-in/out, guest management)
- Housekeeping: Access to /support (housekeeping tasks)
- Maintenance: Access to /support (maintenance tasks)
- Food & Beverage: Access to /support (restaurant/F&B operations)
"""


def get_user_access_level(user):
    """
    Get user's access level based on their department
    Returns dict with access permissions
    """
    # Default: no access
    access = {
        'can_access_office': False,  # Management/Admin pages
        'can_access_main': False,    # Front desk/reception pages
        'can_access_support': False, # Support staff pages (housekeeping, maintenance, F&B)
        'department': None,
        'department_id': None,
    }

    # Superuser has full access
    if user.is_superuser:
        access['can_access_office'] = True
        access['can_access_main'] = True
        access['can_access_support'] = True
        return access

    # Check if user has employee record
    if not hasattr(user, 'employee'):
        return access

    employee = user.employee
    if not employee.department:
        return access

    department_name = employee.department.name.lower()
    access['department'] = employee.department.name
    access['department_id'] = employee.department.id

    # Management department: Access to office (admin pages)
    if 'management' in department_name or 'admin' in department_name:
        access['can_access_office'] = True
        access['can_access_main'] = True  # Management can also access main pages
        access['can_access_support'] = True  # Management can also access support pages

    # Front Office: Access to main pages (front desk, reservations, guests)
    elif 'front' in department_name or 'reception' in department_name or 'desk' in department_name:
        access['can_access_main'] = True

    # Housekeeping: Access to support pages
    elif 'housekeeping' in department_name or 'house keeping' in department_name:
        access['can_access_support'] = True

    # Maintenance: Access to support pages
    elif 'maintenance' in department_name or 'engineering' in department_name:
        access['can_access_support'] = True

    # Food & Beverage: Access to support pages
    elif 'food' in department_name or 'beverage' in department_name or 'f&b' in department_name or 'restaurant' in department_name:
        access['can_access_support'] = True

    return access


def can_access_office(user):
    """Check if user can access office (management/admin) pages"""
    access = get_user_access_level(user)
    return access['can_access_office']


def can_access_main(user):
    """Check if user can access main (front desk) pages"""
    access = get_user_access_level(user)
    return access['can_access_main']


def can_access_support(user):
    """Check if user can access support (housekeeping/maintenance/F&B) pages"""
    access = get_user_access_level(user)
    return access['can_access_support']


class HasDepartmentAccess(permissions.BasePermission):
    """
    Permission class to check if user's department has access to requested resource
    Usage: Set required_access = 'office' or 'main' or 'support' in view
    """

    def has_permission(self, request, view):
        # Allow superusers full access
        if request.user and request.user.is_superuser:
            return True

        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Get required access level from view
        required_access = getattr(view, 'required_access', None)
        if not required_access:
            return True  # No specific access required

        # Get user's access level
        access = get_user_access_level(request.user)

        # Check if user has required access
        if required_access == 'office':
            return access['can_access_office']
        elif required_access == 'main':
            return access['can_access_main']
        elif required_access == 'support':
            return access['can_access_support']

        return False
