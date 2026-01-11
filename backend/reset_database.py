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
from esgapp.models import BusinessProfile, ESGInput, ESGSnapshot, ESGRecommendation, ESGRoadmap, ChatSession, ChatMessage

def clear_all_data():
    """Clear all data from database"""
    print("Clearing all data...")
    
    # Clear in reverse dependency order
    ChatMessage.objects.all().delete()
    ChatSession.objects.all().delete()
    ESGRoadmap.objects.all().delete()
    ESGRecommendation.objects.all().delete()
    ESGSnapshot.objects.all().delete()
    ESGInput.objects.all().delete()
    BusinessProfile.objects.all().delete()
    Token.objects.all().delete()
    User.objects.all().delete()
    
    print("All data cleared successfully")

def verify_models():
    """Verify all models can be created and work properly"""
    print("\nVerifying models...")
    
    try:
        # 1. Create User
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        print(f"User created: {user.username}")
        
        # 2. Create Token
        token, created = Token.objects.get_or_create(user=user)
        print(f"Token created: {token.key[:20]}...")
        
        # 3. Create BusinessProfile
        business_profile = BusinessProfile.objects.create(
            user=user,
            business_name='Test Company',
            industry='Technology',
            employee_count=25,
            office_area_sqm=500.0,
            location='New York'
        )
        print(f"BusinessProfile created: {business_profile.business_name}")
        
        # 4. Create ESGInput
        esg_input = ESGInput.objects.create(
            business_profile=business_profile,
            total_employees=25,
            electricity_kwh=2000.0,
            electricity_bill_amount=300.0,
            has_solar=True,
            solar_capacity_kw=10.0,
            water_source='municipal',
            water_usage_liters=5000.0,
            waste_recycling=True,
            waste_recycling_frequency='weekly',
            waste_segregation=True,
            safety_training_provided=True,
            safety_training_frequency='quarterly',
            employee_benefits=['health_insurance', 'dental', 'retirement'],
            health_insurance=True,
            diversity_policy=True,
            code_of_conduct=True,
            anti_corruption_policy=True,
            data_privacy_policy=True,
            whistleblower_policy=True,
            board_oversight=True,
            risk_management_policy=True
        )
        print(f"ESGInput created: ID {esg_input.id}")
        
        # 5. Create ESGSnapshot
        esg_snapshot = ESGSnapshot.objects.create(
            business_profile=business_profile,
            esg_input=esg_input,
            environmental_score=75.5,
            social_score=68.2,
            governance_score=82.1,
            overall_esg_score=75.3,
            confidence_level='high',
            data_completeness=85.0
        )
        print(f"ESGSnapshot created: ID {esg_snapshot.id}")
        
        # 6. Create ESGRecommendation
        recommendation = ESGRecommendation.objects.create(
            snapshot=esg_snapshot,
            title='Energy Efficiency Program',
            description='Implement LED lighting and smart thermostats',
            category='E',
            priority='high',
            cost_level='medium',
            expected_impact='Reduce energy costs by 20%'
        )
        print(f"ESGRecommendation created: {recommendation.title}")
        
        # 7. Create ESGRoadmap
        roadmap = ESGRoadmap.objects.create(
            snapshot=esg_snapshot,
            phase=1,
            action_title='Install LED Lighting',
            description='Replace all fluorescent lights with LED alternatives',
            responsible_role='Facilities Manager',
            effort_level='medium',
            esg_category='E'
        )
        print(f"ESGRoadmap created: {roadmap.action_title}")
        
        # 8. Create ChatSession
        chat_session = ChatSession.objects.create(
            snapshot=esg_snapshot,
            session_id='test-session-123'
        )
        print(f"ChatSession created: {chat_session.session_id}")
        
        # 9. Create ChatMessage
        chat_message = ChatMessage.objects.create(
            session=chat_session,
            role='user',
            content='How can I improve my environmental score?'
        )
        print(f"ChatMessage created: {chat_message.content[:30]}...")
        
        print("\nAll models verified successfully!")
        
        # Print summary
        print(f"\nDatabase Summary:")
        print(f"Users: {User.objects.count()}")
        print(f"Tokens: {Token.objects.count()}")
        print(f"Business Profiles: {BusinessProfile.objects.count()}")
        print(f"ESG Inputs: {ESGInput.objects.count()}")
        print(f"ESG Snapshots: {ESGSnapshot.objects.count()}")
        print(f"ESG Recommendations: {ESGRecommendation.objects.count()}")
        print(f"ESG Roadmaps: {ESGRoadmap.objects.count()}")
        print(f"Chat Sessions: {ChatSession.objects.count()}")
        print(f"Chat Messages: {ChatMessage.objects.count()}")
        
        return {
            'user_id': user.id,
            'token': token.key,
            'business_profile_id': business_profile.id,
            'esg_input_id': esg_input.id,
            'esg_snapshot_id': esg_snapshot.id
        }
        
    except Exception as e:
        print(f"Error verifying models: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    clear_all_data()
    result = verify_models()
    
    if result:
        print(f"\nTest Credentials:")
        print(f"Username: testuser")
        print(f"Password: testpass123")
        print(f"Token: {result['token']}")
        print(f"ESG Input ID: {result['esg_input_id']}")
        
        print(f"\nTest API Calls:")
        print(f"Login: curl -X POST http://localhost:8000/api/auth/login/ -H 'Content-Type: application/json' -d '{{\"username\":\"testuser\",\"password\":\"testpass123\"}}'")
        print(f"Get ESG Inputs: curl -X GET http://localhost:8000/api/esg-inputs/ -H 'Authorization: Token {result['token']}'")
        print(f"Process ESG: curl -X POST http://localhost:8000/api/esg-inputs/{result['esg_input_id']}/process/ -H 'Authorization: Token {result['token']}'")