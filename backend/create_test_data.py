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
from esgapp.models import BusinessProfile, ESGInput
from esgapp.ai_scoring_service import AIScoringService

def create_test_data():
    try:
        # Get or create user
        user = User.objects.first()
        if not user:
            print("No user found. Please create a user first.")
            return False
        
        print(f"Using user: {user.username}")
        
        # Create business profile
        bp, created = BusinessProfile.objects.get_or_create(
            user=user,
            defaults={
                'business_name': 'Test Company',
                'industry': 'Technology',
                'employee_count': 10
            }
        )
        print(f"Business profile: {bp.business_name} (created: {created})")
        
        # Create ESG input
        esg = ESGInput.objects.create(
            business_profile=bp,
            total_employees=10,
            electricity_kwh=1000,
            has_solar=True,
            waste_recycling=True,
            safety_training_provided=True,
            health_insurance=True,
            code_of_conduct=True
        )
        print(f"Created ESG Input ID: {esg.id}")
        
        # Test AI scoring service
        service = AIScoringService()
        print(f"AI Service client exists: {service.client is not None}")
        
        # Test fallback scoring
        result = service._fallback_scoring(esg)
        print(f"Fallback scoring result: {result}")
        
        return esg.id
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    esg_id = create_test_data()
    if esg_id:
        print(f"\nTest ESG input created with ID: {esg_id}")
        print(f"You can now test: curl -X POST http://localhost:8000/api/esg-inputs/{esg_id}/process/")