from django.urls import path
from .views import LoginView, logout, user_profile, check_session, user_shifts

urlpatterns = [
    path('login/', LoginView.as_view(), name='api_login'),
    path('logout/', logout, name='api_logout'),
    path('profile/', user_profile, name='user_profile'),
    path('check-session/', check_session, name='check_session'),
    path('shifts/', user_shifts, name='user_shifts'),
]