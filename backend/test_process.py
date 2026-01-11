#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esgplatform.settings')
django.setup()

from esgapp.models import ESGInput, ESGSnapshot, ESGRecommendation
from esgapp.ai_scoring_service import AIScoringService

def test_process():
    try:
        # Get the ESG input
        esg_input = ESGInput.objects.get(id=1)
        print(f"Found ESG input: {esg_input.id}")
        
        # Test AI scoring service
        ai_scoring_service = AIScoringService()
        print("AI scoring service created")
        
        # Get scores
        scores_data = ai_scoring_service._fallback_scoring(esg_input)
        print(f"Scores calculated: {scores_data}")
        
        # Test snapshot creation
        snapshot = ESGSnapshot.objects.create(
            business_profile=esg_input.business_profile,
            esg_input=esg_input,
            environmental_score=round(float(scores_data['environmental_score']), 2),
            social_score=round(float(scores_data['social_score']), 2),
            governance_score=round(float(scores_data['governance_score']), 2),
            overall_esg_score=round(float(scores_data['overall_esg_score']), 2),
            confidence_level=str(scores_data['confidence_level']),
            data_completeness=round(float(scores_data['data_completeness']), 2)
        )
        print(f"Snapshot created: {snapshot.id}")
        
        # Test basic recommendations
        rec = ESGRecommendation.objects.create(
            snapshot=snapshot,
            title='Test Recommendation',
            description='Test description',
            category='E',
            priority='high',
            cost_level='medium',
            expected_impact='Test impact'
        )
        print(f"Recommendation created: {rec.id}")
        
        print("All tests passed!")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_process()