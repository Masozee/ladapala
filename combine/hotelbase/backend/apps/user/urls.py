from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for viewsets
router = DefaultRouter()
router.register(r'employees', views.EmployeeViewSet, basename='employee')
router.register(r'departments-manage', views.DepartmentViewSet, basename='department-manage')
router.register(r'shifts-manage', views.ShiftViewSet, basename='shift-manage')

urlpatterns = [
    path('csrf/', views.get_csrf_token, name='csrf-token'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout, name='logout'),
    path('check-session/', views.check_session, name='check-session'),
    path('profile/', views.user_profile, name='user-profile'),
    path('shifts/', views.user_shifts, name='user-shifts'),
    path('active-session/', views.active_session, name='active-session'),

    # User management endpoints
    path('users/', views.manage_users, name='manage-users'),
    path('users/<int:user_id>/', views.manage_user_detail, name='manage-user-detail'),
    path('departments/', views.department_choices, name='department-choices'),
    path('roles/', views.role_choices, name='role-choices'),

    # Include router URLs
    path('', include(router.urls)),
]
