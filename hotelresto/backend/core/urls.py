"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from views.license import validate_license, get_license_status

router = routers.DefaultRouter()

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/', include('apps.user.urls')),
    path('api/hotel/', include('apps.hotel.urls')),
    path('api/restaurant/', include('apps.restaurant.urls')),  # Restaurant API endpoints
    path('api/warehouse/', include('apps.warehouse.urls')),  # Unified warehouse API endpoints
    path('api/', include('apps.hotel.urls_public')),  # Public hotel API endpoints
    path('api/', include('apps.restaurant.urls')),  # Restaurant API endpoints (alias for /api/dashboard, etc.)
    path('api-auth/', include('rest_framework.urls')),
    # License validation endpoints (shared)
    path('api/validate-license/', validate_license, name='validate-license'),
    path('api/license-status/', get_license_status, name='license-status'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
