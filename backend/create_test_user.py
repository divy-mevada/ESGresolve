#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esgplatform.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

def create_test_user():
    try:
        # Create test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print('[OK] Test user created successfully')
        else:
            print('[OK] Test user already exists')

        # Create token
        token, created = Token.objects.get_or_create(user=user)
        print(f'[OK] Token: {token.key[:20]}...')
        
        print('\nTest credentials:')
        print('Username: testuser')
        print('Password: testpass123')
        
        return True
    except Exception as e:
        print(f'[ERROR] Error creating test user: {e}')
        return False

if __name__ == '__main__':
    create_test_user()