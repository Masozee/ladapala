from django.urls import path
from .views import CustomAuthToken, logout, user_profile

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('logout/', logout, name='api_logout'),
    path('profile/', user_profile, name='user_profile'),
]