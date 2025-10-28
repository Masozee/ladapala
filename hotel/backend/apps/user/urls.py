from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout, name='logout'),
    path('check-session/', views.check_session, name='check-session'),
    path('profile/', views.user_profile, name='user-profile'),
    path('shifts/', views.user_shifts, name='user-shifts'),
    path('active-session/', views.active_session, name='active-session'),
]
