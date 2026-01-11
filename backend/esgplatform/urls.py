"""
URL configuration for esgplatform project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('esgapp.urls')),
]

