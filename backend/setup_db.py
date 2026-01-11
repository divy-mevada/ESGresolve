#!/usr/bin/env python
"""
Quick database setup script
Run this after migrations to create initial data if needed
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esgplatform.settings')
django.setup()

from django.contrib.auth.models import User
from esgapp.models import BusinessProfile

def setup():
    print("Database setup complete!")
    print("\nTo create a superuser, run:")
    print("python manage.py createsuperuser")

if __name__ == '__main__':
    setup()

