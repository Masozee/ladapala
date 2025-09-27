from rest_framework import permissions
from .models import StaffRole


class IsManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'staff'):
            return request.user.staff.role in [StaffRole.ADMIN, StaffRole.MANAGER]
        
        return False


class IsKitchenStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'staff'):
            return request.user.staff.role in [StaffRole.KITCHEN, StaffRole.ADMIN, StaffRole.MANAGER]
        
        return False


class IsWarehouseStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'staff'):
            return request.user.staff.role in [StaffRole.WAREHOUSE, StaffRole.ADMIN, StaffRole.MANAGER]
        
        return False


class IsCashier(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'staff'):
            return request.user.staff.role in [StaffRole.CASHIER, StaffRole.ADMIN, StaffRole.MANAGER]
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user.staff
        
        return False