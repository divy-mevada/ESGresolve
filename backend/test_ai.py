#!/usr/bin/env python3
"""
Test script to verify AI service connection
"""
import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esgplatform.settings')
django.setup()

from esgapp.free_ai_service import FreeAIService

def test_ai_connection():
    """Test AI service connection"""
    print("Testing AI Service Connection...")
    print("=" * 50)
    
    # Initialize service
    ai_service = FreeAIService()
    
    # Check client availability
    client, model = ai_service.get_available_client()
    print(f"Client available: {bool(client)}")
    print(f"Model: {model}")
    
    if not client:
        print("No AI client available")
        return False
    
    # Test connection
    try:
        connection_ok, result = ai_service.test_connection()
        print(f"Connection test: {'Success' if connection_ok else 'Failed'}")
        print(f"Result: {result}")
        
        if connection_ok:
            # Test chatbot response
            print("\nTesting chatbot response...")
            context = {
                'business_name': 'Test Company',
                'industry': 'Technology',
                'environmental_score': 45,
                'social_score': 50,
                'governance_score': 40,
                'overall_score': 45
            }
            
            response = ai_service.generate_chatbot_response(
                "Hello, can you help me improve my ESG score?", 
                context
            )
            print(f"Chatbot response: {response[:200]}...")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_ai_connection()
    sys.exit(0 if success else 1)