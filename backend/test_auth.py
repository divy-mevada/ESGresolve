#!/usr/bin/env python
"""
Test script to verify Django authentication endpoints
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esgplatform.settings')
django.setup()

def test_auth_endpoints():
    base_url = "http://localhost:8000"
    
    print("Testing Django Authentication Endpoints...")
    print("=" * 50)
    
    # Test registration
    print("\n1. Testing Registration...")
    register_data = {
        "username": "testuser",
        "email": "test@example.com", 
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register/", json=register_data)
        print(f"Registration Status: {response.status_code}")
        if response.status_code == 201:
            print("✓ Registration successful")
            data = response.json()
            token = data.get('token')
            print(f"Token received: {token[:20]}...")
        else:
            print(f"✗ Registration failed: {response.text}")
            return
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to Django server. Make sure it's running on port 8000")
        print("Run: python manage.py runserver 8000")
        return
    except Exception as e:
        print(f"✗ Registration error: {e}")
        return
    
    # Test login
    print("\n2. Testing Login...")
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Login successful")
            data = response.json()
            token = data.get('token')
            print(f"Token received: {token[:20]}...")
        else:
            print(f"✗ Login failed: {response.text}")
    except Exception as e:
        print(f"✗ Login error: {e}")
    
    # Test protected endpoint
    print("\n3. Testing Protected Endpoint...")
    headers = {"Authorization": f"Token {token}"}
    try:
        response = requests.get(f"{base_url}/api/business-profiles/", headers=headers)
        print(f"Protected endpoint Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Protected endpoint accessible")
        else:
            print(f"✗ Protected endpoint failed: {response.text}")
    except Exception as e:
        print(f"✗ Protected endpoint error: {e}")

if __name__ == "__main__":
    test_auth_endpoints()