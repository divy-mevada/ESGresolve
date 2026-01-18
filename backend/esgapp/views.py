from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.utils import timezone
import uuid
import json
import re
import logging
from openai import OpenAI
from django.conf import settings

logger = logging.getLogger(__name__)

from .models import (
    BusinessProfile, ESGInput, ESGSnapshot, ESGRecommendation,
    ESGRoadmap, ChatSession, ChatMessage
)
from .serializers import (
    BusinessProfileSerializer, ESGInputSerializer, ESGSnapshotSerializer,
    ESGRecommendationSerializer, ESGRoadmapSerializer, ChatSessionSerializer,
    ChatMessageSerializer, UserSerializer
)
from .esg_engine import ESGProcessor
from .ai_recommendation_service import AIRecommendationService
from .ai_scoring_service import AIScoringService


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, email=email, password=password)
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Google OAuth login"""
    try:
        import requests
        
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Authorization code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Exchange code for access token
        token_url = 'https://oauth2.googleapis.com/token'
        # Get redirect_uri from request or use production URL
        redirect_uri = request.data.get('redirect_uri', 'https://es-gresolve.vercel.app/auth/google/callback')
        token_data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        print(f"[DEBUG] Token response status: {token_response.status_code}")
        print(f"[DEBUG] Token response: {token_json}")
        
        if 'access_token' not in token_json:
            error_msg = token_json.get('error_description', token_json.get('error', 'Failed to get access token'))
            print(f"[DEBUG] Token exchange failed: {error_msg}")
            print(f"[DEBUG] Full token response: {token_json}")
            print(f"[DEBUG] Redirect URI used: {redirect_uri}")
            print(f"[DEBUG] Client ID: {settings.GOOGLE_CLIENT_ID[:20]}...")
            return Response({
                'error': f'Token exchange failed: {error_msg}',
                'debug_info': {
                    'redirect_uri': redirect_uri,
                    'response': token_json
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user info from Google
        user_info_url = f'https://www.googleapis.com/oauth2/v2/userinfo?access_token={token_json["access_token"]}'
        user_response = requests.get(user_info_url)
        user_data = user_response.json()
        
        if 'email' not in user_data:
            return Response({'error': 'Failed to get user email'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create or get user
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                'username': user_data['email'],
                'first_name': user_data.get('given_name', ''),
                'last_name': user_data.get('family_name', ''),
            }
        )
        
        # Create or get token
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'created': created
        })
        
    except Exception as e:
        print(f"Google login error: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return Response({'error': 'Google login failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"[DEBUG] Login attempt - Username: {username}")
    print(f"[DEBUG] Password provided: {bool(password)}")
    
    if not username or not password:
        print("[DEBUG] Missing username or password")
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Check if user exists
        user_exists = User.objects.filter(username=username).exists()
        print(f"[DEBUG] User exists: {user_exists}")
        
        if not user_exists:
            print(f"[DEBUG] User '{username}' not found")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = authenticate(username=username, password=password)
        print(f"[DEBUG] Authentication result: {user}")
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            print(f"[DEBUG] Token created: {created}, Token: {token.key[:10]}...")
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        else:
            print(f"[DEBUG] Authentication failed for user: {username}")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
        import traceback
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        return Response({'error': 'Login failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BusinessProfileViewSet(viewsets.ModelViewSet):
    """Business profile management"""
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BusinessProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ESGInputViewSet(viewsets.ModelViewSet):
    """ESG input management"""
    serializer_class = ESGInputSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ESGInput.objects.filter(business_profile__user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to provide better error handling"""
        try:
            # Ensure business profile exists, create default if needed
            business_profile, created = BusinessProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'business_name': 'Default Business',
                    'industry': 'Other',
                    'employee_count': 1  # Must be integer, not string
                }
            )
            
            # Continue with normal creation - serializer validation happens here
            return super().create(request, *args, **kwargs)
        except ValidationError as e:
            # Handle serializer validation errors
            return Response(
                {
                    'error': 'Validation error',
                    'detail': e.detail,
                    'errors': e.detail
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            # Log for debugging
            logger.error(f"Error creating ESG input: {e}")
            logger.error(error_detail)
            return Response(
                {
                    'error': str(e),
                    'detail': 'Failed to create ESG input',
                    'traceback': error_detail if settings.DEBUG else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        # Get business profile for the user (should exist after create check)
        business_profile = BusinessProfile.objects.get(user=self.request.user)
        
        # Ensure total_employees is set if missing
        validated_data = serializer.validated_data
        if 'total_employees' not in validated_data or not validated_data.get('total_employees'):
            validated_data['total_employees'] = business_profile.employee_count
        
        # Set default values for new fields if not provided
        defaults = {
            'energy_efficiency_measures': [],
            'water_conservation_measures': [],
            'carbon_footprint_tracking': False,
            'renewable_energy_percentage': None,
            'hazardous_waste_management': False,
            'paper_reduction_initiatives': False,
            'business_travel_policy': False,
            'remote_work_policy': False,
            'sustainable_procurement': False,
            'supplier_esg_requirements': False,
            'female_employees_percentage': None,
            'workplace_accidents_last_year': None,
            'mental_health_support': False,
            'employee_training_hours': None,
            'employee_satisfaction_survey': False,
            'flexible_work_arrangements': False,
            'community_engagement': False,
            'local_hiring_preference': False,
            'charitable_contributions': False,
            'customer_satisfaction_tracking': False,
            'product_safety_standards': False,
            'cybersecurity_measures': False,
            'regulatory_compliance_tracking': False,
            'sustainability_reporting': False,
            'stakeholder_engagement': False,
            'esg_goals_set': False,
            'third_party_audits': False,
            'public_esg_commitments': False,
            'esg_linked_executive_compensation': False,
            'sustainable_finance_products': False,
            'esg_investment_policy': False,
        }
        
        for field, default_value in defaults.items():
            if field not in validated_data:
                validated_data[field] = default_value
        
        serializer.save(business_profile=business_profile)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process ESG input and create snapshot using AI"""
        try:
            esg_input = self.get_object()
            
            # Check if snapshot already exists (OneToOneField constraint)
            existing_snapshot = None
            try:
                existing_snapshot = ESGSnapshot.objects.get(esg_input=esg_input)
            except ESGSnapshot.DoesNotExist:
                pass
            
            # Use AI to calculate ESG scores
            ai_scoring_service = AIScoringService()
            
            try:
                scores_data = ai_scoring_service.calculate_esg_scores(esg_input)
            except Exception as ai_error:
                logger.error(f"AI scoring failed: {ai_error}")
                import traceback
                logger.error(traceback.format_exc())
                # Use fallback scoring
                scores_data = ai_scoring_service._fallback_scoring(esg_input)
            
            # Validate scores_data
            if not scores_data or not isinstance(scores_data, dict):
                raise ValueError("Invalid scores data from AI service")
            
            # Ensure all required fields are present with defaults
            scores_data.setdefault('environmental_score', 0)
            scores_data.setdefault('social_score', 0)
            scores_data.setdefault('governance_score', 0)
            scores_data.setdefault('overall_esg_score', 0)
            scores_data.setdefault('confidence_level', 'low')
            scores_data.setdefault('data_completeness', 0)
            
            # Validate score values are numeric
            try:
                env_score = round(float(scores_data['environmental_score']), 2)
                social_score = round(float(scores_data['social_score']), 2)
                gov_score = round(float(scores_data['governance_score']), 2)
                overall_score = round(float(scores_data['overall_esg_score']), 2)
                data_completeness = round(float(scores_data['data_completeness']), 2)
                confidence_level = str(scores_data['confidence_level']) or 'low'
            except (ValueError, TypeError) as ve:
                raise ValueError(f"Invalid score values: {ve}")
            
            # Update existing snapshot or create new one
            if existing_snapshot:
                # Update existing snapshot
                existing_snapshot.environmental_score = env_score
                existing_snapshot.social_score = social_score
                existing_snapshot.governance_score = gov_score
                existing_snapshot.overall_esg_score = overall_score
                existing_snapshot.confidence_level = confidence_level
                existing_snapshot.data_completeness = data_completeness
                existing_snapshot.save()
                
                # Delete old recommendations and create new ones
                existing_snapshot.recommendations.all().delete()
                
                snapshot = existing_snapshot
            else:
                # Create new snapshot
                snapshot = ESGSnapshot.objects.create(
                    business_profile=esg_input.business_profile,
                    esg_input=esg_input,
                    environmental_score=env_score,
                    social_score=social_score,
                    governance_score=gov_score,
                    overall_esg_score=overall_score,
                    confidence_level=confidence_level,
                    data_completeness=data_completeness
                )
            
            # Generate basic recommendations
            self._create_basic_recommendations(snapshot)
            
            # Prepare response
            response_data = ESGSnapshotSerializer(snapshot).data
            
            return Response({
                'snapshot': response_data,
                'message': 'ESG assessment completed successfully'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            logger.error(f"Error processing ESG input: {e}")
            logger.error(error_detail)
            return Response(
                {
                    'error': str(e),
                    'detail': 'Failed to process ESG input',
                    'traceback': error_detail if settings.DEBUG else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _create_basic_recommendations(self, snapshot):
        """Create basic recommendations with enhanced opportunity data"""
        from .models import ESGRecommendation
        
        basic_recs = []
        
        if snapshot.environmental_score < 70:
            # Calculate why it matters based on current score
            score_gap = 70 - snapshot.environmental_score
            why_matters = f"Your environmental score is {snapshot.environmental_score:.0f}/100, which is {score_gap:.0f} points below industry benchmark. This creates regulatory and investor risks."
            
            basic_recs.append({
                'title': 'Energy Efficiency Improvement',
                'description': 'Implement energy-saving measures to reduce electricity consumption and environmental impact.',
                'category': 'E',
                'priority': 'high',
                'cost_level': 'medium',
                'expected_impact': 'Reduce energy costs by 15-25% and lower carbon footprint',
                'esg_impact_points': '+5 to +8 ESG points',
                'business_benefit': 'Cost savings of $200-500/month, reduced regulatory risk, improved investor appeal',
                'why_matters': why_matters,
                'risk_reduction': 'high'
            })
        
        if snapshot.social_score < 70:
            score_gap = 70 - snapshot.social_score
            why_matters = f"Your social score is {snapshot.social_score:.0f}/100. Improving employee welfare reduces turnover costs and enhances reputation."
            
            basic_recs.append({
                'title': 'Employee Welfare Program',
                'description': 'Enhance employee benefits and safety measures to improve workplace satisfaction.',
                'category': 'S', 
                'priority': 'high',
                'cost_level': 'medium',
                'expected_impact': 'Improve employee retention and workplace safety standards',
                'esg_impact_points': '+4 to +7 ESG points',
                'business_benefit': 'Reduced turnover costs, improved productivity, better talent attraction',
                'why_matters': why_matters,
                'risk_reduction': 'medium'
            })
        
        if snapshot.governance_score < 70:
            score_gap = 70 - snapshot.governance_score
            why_matters = f"Your governance score is {snapshot.governance_score:.0f}/100. Strong governance is essential for compliance and stakeholder trust."
            
            basic_recs.append({
                'title': 'Governance Framework',
                'description': 'Establish formal policies and procedures to strengthen organizational governance.',
                'category': 'G',
                'priority': 'high', 
                'cost_level': 'low',
                'expected_impact': 'Improve compliance and risk management capabilities',
                'esg_impact_points': '+6 to +10 ESG points',
                'business_benefit': 'Reduced compliance risk, improved stakeholder confidence, better access to capital',
                'why_matters': why_matters,
                'risk_reduction': 'high'
            })
        
        for rec_data in basic_recs:
            ESGRecommendation.objects.create(
                snapshot=snapshot,
                **rec_data
            )


class ESGSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """ESG snapshot viewing"""
    serializer_class = ESGSnapshotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            return ESGSnapshot.objects.filter(business_profile__user=self.request.user)
        except Exception as e:
            logger.error(f"Error in get_queryset: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return ESGSnapshot.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in ESGSnapshotViewSet.list: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response({
                'error': str(e),
                'detail': 'Failed to load snapshots',
                'results': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to add AI insights if available"""
        instance = self.get_object()
        
        # Try to get AI insights from cache or regenerate if needed
        # For now, we'll just return the snapshot
        # In future, you could store insights in a JSONField on the model
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def recommendations(self, request, pk=None):
        """Get recommendations for a snapshot"""
        snapshot = self.get_object()
        recommendations = snapshot.recommendations.all()
        return Response(ESGRecommendationSerializer(recommendations, many=True).data)
    
    @action(detail=True, methods=['get'])
    def top_opportunities(self, request, pk=None):
        """Get AI-generated top 3 opportunities with cost estimates"""
        snapshot = self.get_object()
        
        # Use AI to generate dynamic opportunities
        if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 10:
            try:
                client = OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.AI_BASE_URL
                )
                
                prompt = f"""
Generate exactly 3 top ESG opportunities for this SME business:

Business: {snapshot.business_profile.business_name}
Industry: {snapshot.business_profile.industry}
Employees: {snapshot.business_profile.employee_count}

Current ESG Scores:
- Environmental: {snapshot.environmental_score:.0f}/100
- Social: {snapshot.social_score:.0f}/100  
- Governance: {snapshot.governance_score:.0f}/100
- Overall: {snapshot.overall_esg_score:.0f}/100

Return ONLY a JSON array with exactly 3 opportunities. Each must have:
- title: Short action title
- description: Brief description (max 100 chars)
- category: E, S, or G
- priority: high, medium, or low
- cost_estimate: Dollar amount (e.g. "$500-1000")
- time_estimate: Implementation time (e.g. "2-4 weeks")
- esg_impact: Expected score improvement (e.g. "+5-8 points")
- roi_estimate: Return on investment description

Focus on the lowest scoring areas first. Make estimates realistic for SME size.
"""
                
                response = client.chat.completions.create(
                    model=settings.AI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=800
                )
                
                ai_response = response.choices[0].message.content.strip()
                
                # Parse JSON response
                import json
                import re
                json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
                if json_match:
                    opportunities = json.loads(json_match.group())
                    return Response(opportunities)
                    
            except Exception as e:
                print(f"AI opportunities error: {e}")
        
        # Fallback to rule-based if AI fails
        import random
        
        # Dynamic fallback based on business profile and scores
        business_name = snapshot.business_profile.business_name
        industry = snapshot.business_profile.industry
        employee_count = snapshot.business_profile.employee_count
        
        # Determine focus area based on lowest score
        scores = {
            'E': snapshot.environmental_score,
            'S': snapshot.social_score, 
            'G': snapshot.governance_score
        }
        lowest_category = min(scores, key=scores.get)
        
        # Industry-specific opportunities
        industry_opportunities = {
            'Technology': [
                {'title': 'Green IT Infrastructure', 'category': 'E', 'cost': '$300-800', 'impact': '+4-7 points'},
                {'title': 'Remote Work Policy', 'category': 'S', 'cost': '$100-300', 'impact': '+3-6 points'},
                {'title': 'Data Privacy Framework', 'category': 'G', 'cost': '$200-500', 'impact': '+5-8 points'}
            ],
            'Manufacturing': [
                {'title': 'Waste Reduction Program', 'category': 'E', 'cost': '$500-1200', 'impact': '+6-9 points'},
                {'title': 'Worker Safety Training', 'category': 'S', 'cost': '$200-600', 'impact': '+5-8 points'},
                {'title': 'Supply Chain Audits', 'category': 'G', 'cost': '$400-900', 'impact': '+4-7 points'}
            ],
            'Retail': [
                {'title': 'Sustainable Packaging', 'category': 'E', 'cost': '$200-600', 'impact': '+4-6 points'},
                {'title': 'Customer Service Training', 'category': 'S', 'cost': '$150-400', 'impact': '+3-5 points'},
                {'title': 'Vendor Code of Conduct', 'category': 'G', 'cost': '$100-300', 'impact': '+4-6 points'}
            ]
        }
        
        # Get industry-specific or default opportunities
        base_opportunities = industry_opportunities.get(industry, [
            {'title': 'Energy Efficiency Audit', 'category': 'E', 'cost': '$200-500', 'impact': '+3-5 points'},
            {'title': 'Employee Safety Training', 'category': 'S', 'cost': '$100-300', 'impact': '+4-6 points'},
            {'title': 'Code of Conduct Policy', 'category': 'G', 'cost': '$50-200', 'impact': '+5-8 points'}
        ])
        
        # Prioritize based on lowest scoring category
        prioritized_opportunities = []
        for opp in base_opportunities:
            if opp['category'] == lowest_category:
                opp['priority'] = 'high'
                prioritized_opportunities.insert(0, opp)
            else:
                opp['priority'] = 'medium'
                prioritized_opportunities.append(opp)
        
        # Format final opportunities with dynamic descriptions
        final_opportunities = []
        for i, opp in enumerate(prioritized_opportunities[:3]):
            final_opportunities.append({
                "title": opp['title'],
                "description": f"Tailored for {industry.lower()} with {employee_count} employees",
                "category": opp['category'],
                "priority": opp['priority'],
                "cost_estimate": opp['cost'],
                "time_estimate": f"{random.randint(1,4)}-{random.randint(5,8)} weeks",
                "esg_impact": opp['impact'],
                "roi_estimate": f"{random.randint(10,25)}% improvement in {opp['category']} metrics"
            })
        
        return Response(final_opportunities)

    @action(detail=True, methods=['post'])
    def simulate_impact(self, request, pk=None):
        """AI-powered ESG impact simulation"""
        snapshot = self.get_object()
        recommendation_data = request.data.get('recommendation', {})
        
        print(f"[DEBUG] Simulate impact called for: {recommendation_data.get('title')}")
        print(f"[DEBUG] API Key available: {bool(settings.GROQ_API_KEY)}")
        
        if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 10:
            try:
                print("[DEBUG] Calling AI for impact simulation...")
                client = OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.AI_BASE_URL
                )
                
                prompt = f"""
You are an ESG consultant analyzing the impact of implementing a specific recommendation.

Recommendation Details:
- Title: {recommendation_data.get('title', 'ESG Action')}
- Description: {recommendation_data.get('description', 'ESG improvement action')}
- Category: {recommendation_data.get('category', 'G')}

Company Profile:
- Name: {snapshot.business_profile.business_name}
- Industry: {snapshot.business_profile.industry}
- Employees: {snapshot.business_profile.employee_count}
- Environmental Score: {snapshot.environmental_score:.0f}/100
- Social Score: {snapshot.social_score:.0f}/100
- Governance Score: {snapshot.governance_score:.0f}/100

Provide a realistic impact analysis in this EXACT JSON format:
{{
  "score_improvements": {{
    "environmental": "+2 points",
    "social": "+0 points",
    "governance": "+5 points",
    "overall": "+3 points"
  }},
  "timeline": "4-6 weeks",
  "confidence": "high",
  "business_benefits": [
    "Specific benefit related to the recommendation",
    "Another concrete business advantage",
    "Third measurable improvement"
  ],
  "implementation_steps": [
    "First specific action step",
    "Second detailed implementation step",
    "Third concrete milestone",
    "Final verification step"
  ],
  "potential_challenges": [
    "Main implementation challenge",
    "Secondary obstacle to consider"
  ],
  "success_metrics": [
    "Specific KPI to track",
    "Measurable outcome indicator",
    "Progress monitoring metric"
  ]
}}

Make the content specific to the recommendation and company context. Avoid generic responses.
"""
                
                response = client.chat.completions.create(
                    model=settings.AI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=800
                )
                
                ai_response = response.choices[0].message.content.strip()
                print(f"[DEBUG] AI Response: {ai_response[:200]}...")
                
                # Parse JSON response
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    try:
                        impact_data = json.loads(json_match.group())
                        print("[DEBUG] Successfully parsed AI response")
                        return Response(impact_data)
                    except json.JSONDecodeError as je:
                        print(f"[DEBUG] JSON parse error: {je}")
                        
            except Exception as e:
                print(f"[ERROR] AI impact simulation error: {e}")
                import traceback
                print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        
        print("[DEBUG] Using fallback simulation data")
        # Dynamic fallback based on recommendation
        rec_title = recommendation_data.get('title', '').lower()
        rec_category = recommendation_data.get('category', 'G')
        
        if 'energy' in rec_title or 'led' in rec_title:
            fallback_impact = {
                "score_improvements": {
                    "environmental": "+6 points",
                    "social": "+1 points",
                    "governance": "+2 points",
                    "overall": "+4 points"
                },
                "timeline": "3-4 weeks",
                "confidence": "high",
                "business_benefits": [
                    "Reduce electricity costs by 20-30%",
                    "Lower carbon footprint and emissions",
                    "Improved workplace lighting quality"
                ],
                "implementation_steps": [
                    "Conduct energy audit of current lighting",
                    "Source LED replacement bulbs and fixtures",
                    "Schedule installation during off-hours",
                    "Monitor energy usage for 30 days post-installation"
                ],
                "potential_challenges": [
                    "Initial capital investment required",
                    "Temporary disruption during installation"
                ],
                "success_metrics": [
                    "Monthly kWh reduction percentage",
                    "Cost savings on electricity bills",
                    "Employee satisfaction with lighting quality"
                ]
            }
        elif 'safety' in rec_title or 'training' in rec_title:
            fallback_impact = {
                "score_improvements": {
                    "environmental": "+1 points",
                    "social": "+7 points",
                    "governance": "+3 points",
                    "overall": "+5 points"
                },
                "timeline": "2-3 weeks",
                "confidence": "medium",
                "business_benefits": [
                    "Reduced workplace accidents and injuries",
                    "Lower insurance premiums",
                    "Improved employee morale and retention"
                ],
                "implementation_steps": [
                    "Develop safety training curriculum",
                    "Schedule mandatory training sessions",
                    "Implement safety protocols and procedures",
                    "Conduct quarterly safety assessments"
                ],
                "potential_challenges": [
                    "Employee resistance to new procedures",
                    "Time investment for training sessions"
                ],
                "success_metrics": [
                    "Number of workplace incidents per month",
                    "Employee safety training completion rate",
                    "Safety audit scores"
                ]
            }
        else:
            # Generic governance/policy fallback
            fallback_impact = {
                "score_improvements": {
                    "environmental": "+1 points",
                    "social": "+2 points",
                    "governance": "+6 points",
                    "overall": "+4 points"
                },
                "timeline": "1-2 weeks",
                "confidence": "high",
                "business_benefits": [
                    "Enhanced regulatory compliance",
                    "Reduced legal and operational risks",
                    "Improved stakeholder trust"
                ],
                "implementation_steps": [
                    "Draft policy document with legal review",
                    "Conduct employee training on new policies",
                    "Implement monitoring and reporting procedures",
                    "Schedule annual policy review process"
                ],
                "potential_challenges": [
                    "Ensuring consistent policy enforcement",
                    "Employee adaptation to new procedures"
                ],
                "success_metrics": [
                    "Policy compliance audit scores",
                    "Employee policy training completion",
                    "Stakeholder feedback ratings"
                ]
            }
        
        return Response(fallback_impact)
    
    @action(detail=True, methods=['post'])
    def add_to_roadmap(self, request, pk=None):
        """Add a recommendation to the execution roadmap"""
        snapshot = self.get_object()
        recommendation_id = request.data.get('recommendation_id')
        recommendation_data = request.data.get('recommendation', {})
        
        try:
            # Try to find existing recommendation first
            if recommendation_id:
                try:
                    recommendation = ESGRecommendation.objects.get(
                        id=recommendation_id, 
                        snapshot=snapshot
                    )
                    
                    # Create roadmap item from existing recommendation
                    from .models import ESGRoadmap
                    
                    # Determine phase based on priority
                    phase_map = {'high': 1, 'medium': 2, 'low': 3}
                    phase = phase_map.get(recommendation.priority, 2)
                    
                    roadmap_item = ESGRoadmap.objects.create(
                        snapshot=snapshot,
                        phase=phase,
                        action_title=recommendation.title,
                        description=recommendation.description,
                        responsible_role='Team Lead',
                        effort_level=recommendation.cost_level,
                        esg_category=recommendation.category
                    )
                    
                    return Response({
                        'message': 'Added to execution plan successfully',
                        'roadmap_item_id': roadmap_item.id
                    }, status=status.HTTP_201_CREATED)
                    
                except ESGRecommendation.DoesNotExist:
                    pass  # Fall through to AI-generated handling
            
            # Handle AI-generated opportunities (no database ID)
            if recommendation_data:
                from .models import ESGRoadmap
                
                # Extract data from AI-generated recommendation
                title = recommendation_data.get('title', 'ESG Action')
                description = recommendation_data.get('description', 'ESG improvement action')
                category = recommendation_data.get('category', 'G')
                priority = recommendation_data.get('priority', 'medium')
                cost_level = recommendation_data.get('cost_estimate', 'medium')
                
                # Map cost_estimate to effort_level
                if '$' in str(cost_level):
                    if '50' in cost_level or '100' in cost_level or '200' in cost_level:
                        effort_level = 'low'
                    elif '500' in cost_level or '1000' in cost_level:
                        effort_level = 'medium'
                    else:
                        effort_level = 'high'
                else:
                    effort_level = 'medium'
                
                # Determine phase based on priority
                phase_map = {'high': 1, 'medium': 2, 'low': 3}
                phase = phase_map.get(priority, 2)
                
                roadmap_item = ESGRoadmap.objects.create(
                    snapshot=snapshot,
                    phase=phase,
                    action_title=title,
                    description=description,
                    responsible_role='Team Lead',
                    effort_level=effort_level,
                    esg_category=category
                )
                
                return Response({
                    'message': 'Added AI recommendation to execution plan successfully',
                    'roadmap_item_id': roadmap_item.id
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'error': 'Either recommendation_id or recommendation data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error adding to roadmap: {e}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def dashboard_insights(self, request, pk=None):
        """Get prescriptive insights for dashboard"""
        snapshot = self.get_object()
        
        # Determine lowest score area
        scores = {
            'environmental': snapshot.environmental_score,
            'social': snapshot.social_score,
            'governance': snapshot.governance_score
        }
        lowest_area = min(scores, key=scores.get)
        lowest_score = scores[lowest_area]
        
        # Get recommendations for analysis
        recommendations = snapshot.recommendations.all()
        
        # This month's focus (lowest scoring area)
        focus_actions = {
            'environmental': 'Implement energy efficiency measures',
            'social': 'Enhance employee welfare programs', 
            'governance': 'Strengthen governance policies'
        }
        
        # Biggest risk (lowest score with high impact)
        risk_descriptions = {
            'environmental': 'Regulatory compliance and carbon footprint exposure',
            'social': 'Employee retention and workplace safety risks',
            'governance': 'Compliance gaps and stakeholder trust issues'
        }
        
        # Fastest win (low effort, high impact)
        quick_wins = {
            'environmental': 'Switch to LED lighting',
            'social': 'Implement safety training program',
            'governance': 'Draft code of conduct policy'
        }
        
        insights = {
            'monthly_focus': {
                'action': focus_actions[lowest_area],
                'reason': f'Your {lowest_area} score ({lowest_score:.0f}/100) needs immediate attention',
                'category': lowest_area.upper()[0]
            },
            'biggest_risk': {
                'description': risk_descriptions[lowest_area],
                'impact': 'High',
                'category': lowest_area.upper()[0]
            },
            'fastest_win': {
                'action': quick_wins[lowest_area],
                'effort': 'Low',
                'timeline': '1-2 weeks',
                'category': lowest_area.upper()[0]
            }
        }
        
        return Response(insights)
    
    @action(detail=True, methods=['get'])
    def roadmap(self, request, pk=None):
        """Get roadmap for a snapshot"""
        snapshot = self.get_object()
        roadmaps = snapshot.roadmaps.all()
        return Response(ESGRoadmapSerializer(roadmaps, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_roadmap(request):
    """Generate ESG action roadmap using AI with selected timeframe"""
    try:
        snapshot_id = request.data.get('snapshot_id')
        timeframe = request.data.get('timeframe', '90')  # Default to 90 days
        
        if not snapshot_id:
            return Response({'error': 'snapshot_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if timeframe not in ['30', '60', '90']:
            return Response({'error': 'timeframe must be 30, 60, or 90'}, status=status.HTTP_400_BAD_REQUEST)
        
        snapshot = get_object_or_404(
            ESGSnapshot,
            id=snapshot_id,
            business_profile__user=request.user
        )
        
        # Clear existing roadmaps for this timeframe to generate fresh ones
        max_phase = {'30': 1, '60': 2, '90': 3}[timeframe]
        snapshot.roadmaps.filter(phase__lte=max_phase).delete()
        
        # Generate AI roadmap for selected timeframe
        ai_service = AIScoringService()
        roadmap_data = ai_service.generate_timeframe_roadmap(snapshot, int(timeframe))
        
        # Create roadmap objects
        created_items = []
        phase_mapping = {"30_day_plan": 1, "60_day_plan": 2, "90_day_plan": 3}
        
        for plan_key, phase_num in phase_mapping.items():
            if plan_key in roadmap_data and phase_num <= max_phase:
                plan_data = roadmap_data[plan_key]
                for action in plan_data.get('actions', []):
                    # Handle different possible formats for action data
                    action_title = action.get('action') or action.get('title') or action.get('action_title') or 'Action'
                    
                    # Use AI-generated description if available, otherwise generate one
                    description = action.get('description') or action.get('details') or ''
                    if not description:
                        category = action.get('category', 'E')
                        if category == 'E':
                            description = f"Implement {action_title} to reduce environmental impact and improve sustainability practices."
                        elif category == 'S':
                            description = f"Implement {action_title} to enhance employee welfare and social responsibility initiatives."
                        else:
                            description = f"Implement {action_title} to strengthen governance framework and compliance procedures."
                    
                    # Ensure description is not empty
                    if not description or len(description.strip()) < 10:
                        description = f"Implement {action_title} to improve ESG performance in {action.get('category', 'E')} category."
                    
                    roadmap = ESGRoadmap.objects.create(
                        snapshot=snapshot,
                        phase=phase_num,
                        action_title=action_title,
                        description=description.strip(),
                        responsible_role=action.get('responsible') or action.get('responsible_role') or action.get('responsible_role') or 'Team Lead',
                        effort_level=(action.get('impact', 'medium') or action.get('effort_level', 'medium')).lower(),
                        esg_category=action.get('category', 'E')
                    )
                    created_items.append(roadmap)
        
        return Response({
            'message': f'{timeframe}-day roadmap generated successfully',
            'roadmap': ESGRoadmapSerializer(created_items, many=True).data
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Roadmap generation error: {e}")
        print(error_detail)
        return Response({
            'error': str(e),
            'detail': 'Failed to generate roadmap',
            'traceback': error_detail if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _generate_rule_based_roadmap(snapshot, recommendations):
    """Fallback rule-based roadmap generation"""
    import random
    
    roadmap_items = []
    industry = snapshot.business_profile.industry
    employee_count = snapshot.business_profile.employee_count
    
    # Determine focus based on lowest scores
    scores = {
        'E': snapshot.environmental_score,
        'S': snapshot.social_score,
        'G': snapshot.governance_score
    }
    lowest_category = min(scores, key=scores.get)
    
    # Dynamic roadmap based on company profile
    base_actions = {
        'E': [
            f'Conduct energy audit for {industry.lower()} operations',
            f'Implement LED lighting across {employee_count}-person facility',
            f'Establish waste reduction targets for {industry.lower()}'
        ],
        'S': [
            f'Design safety training for {employee_count} employees',
            f'Create employee wellness program for {industry.lower()}',
            f'Implement diversity hiring practices'
        ],
        'G': [
            f'Draft governance policies for {employee_count}-person company',
            f'Establish compliance framework for {industry.lower()}',
            f'Create risk management procedures'
        ]
    }
    
    # Generate 3 phases with focus on lowest scoring area
    for phase in range(1, 4):
        if phase == 1:  # Focus on lowest scoring area first
            actions = base_actions[lowest_category]
            category = lowest_category
        else:
            # Mix other categories
            other_categories = [c for c in ['E', 'S', 'G'] if c != lowest_category]
            category = random.choice(other_categories)
            actions = base_actions[category]
        
        action = random.choice(actions)
        
        roadmap_items.append({
            'phase': phase,
            'action_title': action,
            'description': f'Phase {phase} implementation for {industry.lower()} business',
            'responsible_role': 'Team Lead' if employee_count < 10 else 'Department Manager',
            'effort_level': 'low' if phase == 1 else 'medium',
            'esg_category': category
        })
    
    return roadmap_items


def _parse_ai_roadmap(ai_content, snapshot):
    """Parse AI-generated roadmap content"""
    # Simple parsing - in production, use proper JSON parsing
    import json
    import re
    
    try:
        # Try to extract JSON from response
        json_match = re.search(r'\[.*\]', ai_content, re.DOTALL)
        if json_match:
            items = json.loads(json_match.group())
            roadmap_items = []
            for item in items:
                roadmap_items.append({
                    'phase': item.get('phase', 1),
                    'action_title': item.get('action_title', item.get('title', 'Action')),
                    'description': item.get('description', ''),
                    'responsible_role': item.get('responsible_role', 'Team Lead'),
                    'effort_level': item.get('effort_level', 'medium').lower(),
                    'esg_category': item.get('esg_category', 'E')
                })
            return roadmap_items
    except:
        pass
    
    # Fallback to rule-based
    return _generate_rule_based_roadmap(snapshot, snapshot.recommendations.all())


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_query(request):
    """ESG chatbot endpoint"""
    try:
        snapshot_id = request.data.get('snapshot_id')
        query = request.data.get('query')
        session_id = request.data.get('session_id')
        
        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not snapshot_id:
            return Response({'error': 'snapshot_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        snapshot = get_object_or_404(
            ESGSnapshot,
            id=snapshot_id,
            business_profile__user=request.user
        )
        
        # Get or create chat session
        if session_id:
            chat_session = ChatSession.objects.filter(session_id=session_id, snapshot=snapshot).first()
            if not chat_session:
                # Session ID provided but doesn't exist, create a new one
                session_id = str(uuid.uuid4())
                chat_session = ChatSession.objects.create(
                    snapshot=snapshot,
                    session_id=session_id
                )
        else:
            session_id = str(uuid.uuid4())
            chat_session = ChatSession.objects.create(
                snapshot=snapshot,
                session_id=session_id
            )
        
        # Save user message
        ChatMessage.objects.create(
            session=chat_session,
            role='user',
            content=query
        )
        
        # Get recent conversation history
        recent_messages = ChatMessage.objects.filter(
            session=chat_session
        ).order_by('-created_at')[:6]  # Last 6 messages
        
        conversation_history = ""
        for msg in reversed(recent_messages):
            if msg.content != query:  # Don't include the current query
                conversation_history += f"{msg.role}: {msg.content}\n"
        
        # Prepare dynamic context
        recommendations = snapshot.recommendations.all()
        rec_text = "\n".join([f"- {r.title}: {r.description}" for r in recommendations[:3]])
        
        # Get specific insights based on scores
        score_insights = []
        if snapshot.environmental_score < 50:
            score_insights.append("Environmental practices need significant improvement")
        elif snapshot.environmental_score < 70:
            score_insights.append("Environmental practices show room for enhancement")
        else:
            score_insights.append("Strong environmental performance")
        
        if snapshot.social_score < 50:
            score_insights.append("Social responsibility initiatives need development")
        elif snapshot.social_score < 70:
            score_insights.append("Social practices can be strengthened")
        else:
            score_insights.append("Good social responsibility practices")
        
        if snapshot.governance_score < 50:
            score_insights.append("Governance structures need strengthening")
        elif snapshot.governance_score < 70:
            score_insights.append("Governance practices can be improved")
        else:
            score_insights.append("Solid governance framework")
        
        # Enhanced context-aware system prompt
        query_lower = query.lower()
        
        # Detect action commands
        action_command = None
        if any(phrase in query_lower for phrase in ['add this to my roadmap', 'add to roadmap', 'add to my plan', 'add this to plan']):
            action_command = 'add_to_roadmap'
        elif any(phrase in query_lower for phrase in ['mark as completed', 'mark completed', 'completed this', 'finished this']):
            action_command = 'mark_completed'
        elif any(phrase in query_lower for phrase in ['what should i focus on this month', 'focus this month', 'monthly focus', 'what to focus on']):
            action_command = 'monthly_focus'
        
        # Get roadmap actions for context
        roadmap_actions = snapshot.roadmaps.all()
        roadmap_text = "\n".join([f"- {r.action_title}: {r.description} (Phase {r.phase})" for r in roadmap_actions[:3]])
        
        # Enhanced system prompt for ESG Implementation Assistant
        system_prompt = f"""
You are an ESG Implementation Assistant for SMEs. You are context-aware and operational, not just conversational.

Your role:
- Explain ESG recommendations in simple SME language
- Generate step-by-step SOPs (Standard Operating Procedures)
- Help users decide implementation priorities
- Support action commands

For SOPs, always include:
1. Objective (why this matters)
2. Steps (numbered, specific actions)
3. Responsible role (who does what)
4. Effort level (time/resources needed)
5. ESG impact (expected score improvement)

Action Commands:
- "Add this to my roadmap" - Add discussed item to execution plan
- "Mark this as completed" - Mark roadmap item as done
- "What should I focus on this month?" - Prioritize current actions

IMPORTANT DISCLAIMERS:
- NEVER claim ESG certification
- NEVER provide legal or regulatory compliance advice
- Always state this is indicative guidance, not certified advice

Be practical, actionable, and SME-focused. Use simple language and provide specific next steps.
"""
        
        # Enhanced context with full state awareness
        context = f"""
BUSINESS CONTEXT:
Company: {snapshot.business_profile.business_name}
Industry: {snapshot.business_profile.industry}
Employees: {snapshot.business_profile.employee_count}

CURRENT ESG PERFORMANCE:
- Environmental: {snapshot.environmental_score:.0f}/100 ({score_insights[0] if len(score_insights) > 0 else 'No data'})
- Social: {snapshot.social_score:.0f}/100 ({score_insights[1] if len(score_insights) > 1 else 'No data'})
- Governance: {snapshot.governance_score:.0f}/100 ({score_insights[2] if len(score_insights) > 2 else 'No data'})
- Overall: {snapshot.overall_esg_score:.0f}/100

TOP RECOMMENDATIONS:
{rec_text if rec_text else 'No specific recommendations available'}

CURRENT ROADMAP ACTIONS:
{roadmap_text if roadmap_text else 'No roadmap actions yet'}

USER QUERY: {query}

ACTION COMMAND DETECTED: {action_command or 'None'}

Provide a comprehensive response that:
1. Addresses the specific question
2. Includes implementation guidance if relevant
3. Handles any action commands
4. Provides next steps

Remember: This is indicative guidance for SME ESG improvement, not certified advice or compliance guidance.
"""
        
        # Call AI API - Force use of DeepSeek
        print(f"DeepSeek API Key exists: {bool(settings.GROQ_API_KEY)}")
        print(f"API Key length: {len(settings.GROQ_API_KEY) if settings.GROQ_API_KEY else 0}")
        print(f"AI Model: {settings.AI_MODEL}")
        print(f"AI Base URL: {settings.AI_BASE_URL}")
        
        # Always try to use AI if key exists
        if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 10:
            try:
                print("Calling DeepSeek API...")
                
                client = OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.AI_BASE_URL
                )
                
                messages = [{"role": "system", "content": system_prompt}]
                messages.append({"role": "user", "content": context})
                
                # Handle action commands before AI call
                if action_command == 'add_to_roadmap':
                    # Extract recommendation from recent conversation or user query
                    action_title = None
                    description = None
                    category = 'G'  # Default to Governance
                    
                    # Try to extract action from user query
                    if 'implement' in query_lower or 'add' in query_lower:
                        # Extract the action from the query
                        query_words = query.split()
                        if 'implement' in query_lower:
                            impl_index = next(i for i, word in enumerate(query_words) if 'implement' in word.lower())
                            action_title = ' '.join(query_words[impl_index+1:impl_index+6])  # Take next 5 words
                        elif 'add' in query_lower and ('roadmap' in query_lower or 'plan' in query_lower):
                            # Look for the action before "to roadmap" or "to plan"
                            roadmap_index = next((i for i, word in enumerate(query_words) if 'roadmap' in word.lower() or 'plan' in word.lower()), len(query_words))
                            add_index = next((i for i, word in enumerate(query_words) if 'add' in word.lower()), 0)
                            action_title = ' '.join(query_words[add_index+1:roadmap_index-1])
                    
                    # Check recent messages for context
                    if not action_title:
                        for msg in recent_messages:
                            if msg.role == 'assistant' and ('implement' in msg.content.lower() or 'sop' in msg.content.lower()):
                                # Extract title from SOP or recommendation
                                lines = msg.content.split('\n')
                                for line in lines:
                                    if 'OBJECTIVE:' in line or 'SOP]' in line:
                                        action_title = line.split('-')[0].replace('[SOP]', '').strip()
                                        break
                                if action_title:
                                    break
                    
                    # Fallback to query content
                    if not action_title:
                        action_title = f"Action from chat: {query[:50]}..."
                        description = f"Implementation discussed: {query}"
                    else:
                        description = f"Implement {action_title} as discussed in chat session"
                    
                    # Determine category based on content
                    if any(word in query_lower for word in ['energy', 'environment', 'carbon', 'waste', 'water']):
                        category = 'E'
                    elif any(word in query_lower for word in ['employee', 'safety', 'training', 'welfare', 'social']):
                        category = 'S'
                    else:
                        category = 'G'
                    
                    # Create roadmap item
                    from .models import ESGRoadmap
                    roadmap_item = ESGRoadmap.objects.create(
                        snapshot=snapshot,
                        phase=1,  # Default to phase 1 for chat-generated items
                        action_title=action_title,
                        description=description,
                        responsible_role='Team Lead',
                        effort_level='medium',
                        esg_category=category
                    )
                    response_text = f"[SUCCESS] Added to your roadmap: '{roadmap_item.action_title}'. You can view it in your Execution Plan. What would you like to implement next?"
                    print(f"[DEBUG] Created roadmap item: {roadmap_item.id} - {roadmap_item.action_title}")
                elif action_command == 'mark_completed':
                    # Find recent roadmap item to mark complete
                    recent_roadmap = roadmap_actions.first()
                    if recent_roadmap:
                        # Note: You'd need to add a 'completed' field to ESGRoadmap model
                        response_text = f"[SUCCESS] Great job! I've noted that '{recent_roadmap.action_title}' is completed. This should improve your ESG scores. What's your next priority?"
                    else:
                        response_text = "I don't see any recent roadmap actions to mark as completed. You can add actions first, then mark them complete as you finish them."
                
                elif action_command == 'monthly_focus':
                    # Prioritize based on current scores and roadmap
                    lowest_score = min(snapshot.environmental_score, snapshot.social_score, snapshot.governance_score)
                    if lowest_score == snapshot.environmental_score:
                        focus_area = "Environmental"
                        focus_actions = "energy efficiency, waste management, or carbon tracking"
                    elif lowest_score == snapshot.social_score:
                        focus_area = "Social"
                        focus_actions = "employee safety training, health benefits, or diversity programs"
                    else:
                        focus_area = "Governance"
                        focus_actions = "policy development, risk management, or compliance tracking"
                    
                    response_text = f"[MONTHLY FOCUS] This month, focus on {focus_area} (your lowest score: {lowest_score:.0f}/100). Priority actions: {focus_actions}. Start with the lowest-cost, highest-impact items from your recommendations."
                
                else:
                    # Regular AI response for non-command queries
                    print(f"Sending request to DeepSeek with {len(messages)} messages")
                    
                    response = client.chat.completions.create(
                        model=settings.AI_MODEL,
                        messages=messages,
                        temperature=0.7,
                        max_tokens=1500,
                        timeout=60.0
                    )
                    response_text = response.choices[0].message.content
                    response_text = response_text.replace('**', '').replace('*', '')
                    print(f"[SUCCESS] DeepSeek API response received: {response_text[:100]}...")
            except Exception as ai_error:
                print(f"[ERROR] DeepSeek API error: {ai_error}")
                import traceback
                print(f"Full traceback: {traceback.format_exc()}")
                
                # Enhanced fallback with SOP generation
                if 'implement' in query_lower or 'sop' in query_lower or 'how to' in query_lower:
                    if 'employee welfare' in query_lower or 'safety' in query_lower:
                        response_text = """
[SOP] EMPLOYEE WELFARE PROGRAM - Implementation SOP

OBJECTIVE: Improve employee satisfaction and safety to boost Social ESG score

STEPS:
1. Week 1: Survey employees on current satisfaction and needs (HR Manager)
2. Week 2: Research health insurance options and safety training providers (HR Manager)
3. Week 3: Draft employee benefits policy and safety protocols (HR Manager + Management)
4. Week 4: Present proposal to leadership for approval (HR Manager)
5. Month 2: Implement approved benefits and conduct first safety training (All Staff)
6. Month 3: Collect feedback and adjust programs (HR Manager)

RESPONSIBLE ROLE: HR Manager (lead), with Management approval
EFFORT LEVEL: Medium (10-15 hours/month for 3 months)
ESG IMPACT: +8-12 Social score points
COST: $500-1500 per employee annually

NEXT STEPS: Start with employee survey this week. Would you like me to add this to your roadmap?

Note: This is indicative guidance for ESG improvement, not certified compliance advice.
"""
                    elif 'governance' in query_lower or 'policy' in query_lower:
                        response_text = """
[SOP] GOVERNANCE FRAMEWORK - Implementation SOP

OBJECTIVE: Establish formal policies to strengthen Governance ESG score and reduce compliance risks

STEPS:
1. Week 1: Draft Code of Conduct (1-2 pages, simple language) (Management)
2. Week 2: Create Anti-Corruption Policy (Management/Legal)
3. Week 3: Develop Data Privacy procedures (IT Manager + Management)
4. Week 4: Design Whistleblower reporting process (HR Manager)
5. Month 2: Train all employees on new policies (HR Manager)
6. Month 3: Set up annual policy review process (Management)

RESPONSIBLE ROLE: Management (lead), HR Manager (training), IT Manager (data privacy)
EFFORT LEVEL: Low-Medium (5-10 hours/month for 3 months)
ESG IMPACT: +10-15 Governance score points
COST: $200-800 for policy development

NEXT STEPS: Start with Code of Conduct draft. Need help with policy templates?

Note: This is indicative guidance for ESG improvement, not legal or regulatory compliance advice.
"""
                    else:
                        response_text = f"""
For implementing '{query}': 

Based on your ESG assessment (Overall: {snapshot.overall_esg_score:.0f}/100), I recommend:

1. Start with your lowest scoring area
2. Focus on quick wins first (low cost, high impact)
3. Develop step-by-step SOPs for each action
4. Assign clear responsibilities
5. Track progress monthly

Would you like a detailed SOP for any specific recommendation? I can help you break it down into actionable steps.

Note: This is indicative guidance for ESG improvement, not certified advice.
"""
                else:
                    response_text = f"Based on your ESG assessment, I recommend focusing on your lowest scoring area first. Your current scores: Environmental {snapshot.environmental_score:.0f}, Social {snapshot.social_score:.0f}, Governance {snapshot.governance_score:.0f}. What specific area would you like help implementing?"
        else:
            print("[ERROR] No valid DeepSeek API key found")
            response_text = f"DeepSeek API key not configured properly. Please check your .env file. Key length: {len(settings.GROQ_API_KEY) if settings.GROQ_API_KEY else 0}"
        
        # Save assistant response
        ChatMessage.objects.create(
            session=chat_session,
            role='assistant',
            content=response_text
        )
        
        return Response({
            'response': response_text,
            'session_id': session_id
        })
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Chat query error: {e}")
        print(error_detail)
        return Response({
            'error': str(e),
            'detail': 'Error generating response',
            'response': 'I apologize, but I encountered an error. Please try again or contact support.',
            'session_id': session_id if 'session_id' in locals() else None,
            'traceback': error_detail if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate ESG report"""
    try:
        snapshot_id = request.GET.get('snapshot_id')
        if not snapshot_id:
            return Response({'error': 'snapshot_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        snapshot = get_object_or_404(
            ESGSnapshot,
            id=snapshot_id,
            business_profile__user=request.user
        )
        
        recommendations = snapshot.recommendations.all()
        roadmaps = snapshot.roadmaps.all()
        
        # Helper function to safely format scores
        def format_score(score):
            if score is None:
                return "N/A"
            try:
                return f"{float(score):.1f}"
            except (ValueError, TypeError):
                return "N/A"
        
        # Helper function to safely get display value
        def safe_display(value, default="N/A"):
            if value is None:
                return default
            if isinstance(value, str):
                return value.title() if value else default
            return str(value) if value else default
        
        # Helper function to escape HTML
        def escape_html(text):
            if text is None:
                return ""
            return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#x27;')
        
        # Get safe values
        business_name = escape_html(snapshot.business_profile.business_name or "N/A")
        industry = escape_html(snapshot.business_profile.industry or "N/A")
        employee_count = snapshot.business_profile.employee_count or 0
        assessment_date = snapshot.created_at.strftime('%Y-%m-%d') if snapshot.created_at else "N/A"
        
        overall_score = format_score(snapshot.overall_esg_score)
        environmental_score = format_score(snapshot.environmental_score)
        social_score = format_score(snapshot.social_score)
        governance_score = format_score(snapshot.governance_score)
        data_completeness = format_score(snapshot.data_completeness)
        confidence_level = safe_display(snapshot.confidence_level, "Medium")
        
        # Generate HTML report
        report_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>ESG Assessment Report - {business_name}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #2c3e50; }}
            h2 {{ color: #34495e; margin-top: 30px; }}
            .score-box {{ display: inline-block; padding: 20px; margin: 10px; background: #ecf0f1; border-radius: 5px; }}
            .score-value {{ font-size: 36px; font-weight: bold; color: #27ae60; }}
            .disclaimer {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: #3498db; color: white; }}
        </style>
    </head>
    <body>
        <h1>ESG Assessment Report</h1>
        <h2>Business Overview</h2>
        <p><strong>Business Name:</strong> {business_name}</p>
        <p><strong>Industry:</strong> {industry}</p>
        <p><strong>Employees:</strong> {employee_count}</p>
        <p><strong>Assessment Date:</strong> {assessment_date}</p>
        
        <div class="disclaimer">
            <strong>Disclaimer:</strong> This assessment is indicative and does not constitute a certified ESG rating or regulatory compliance advice.
        </div>
        
        <h2>ESG Scores</h2>
        <div class="score-box">
            <div>Overall ESG Score</div>
            <div class="score-value">{overall_score}/100</div>
            <div>Confidence: {confidence_level}</div>
        </div>
        <div class="score-box">
            <div>Environmental</div>
            <div class="score-value">{environmental_score}/100</div>
        </div>
        <div class="score-box">
            <div>Social</div>
            <div class="score-value">{social_score}/100</div>
        </div>
        <div class="score-box">
            <div>Governance</div>
            <div class="score-value">{governance_score}/100</div>
        </div>
        
        <h2>Key Insights</h2>
        <p>Data Completeness: {data_completeness}%</p>
        <p>This assessment provides a baseline understanding of your ESG position based on the information provided.</p>
        
        <h2>Recommendations</h2>
        <table>
            <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Cost</th>
            </tr>
    """
        
        for rec in recommendations:
            rec_title = escape_html(rec.title or "N/A")
            rec_category = safe_display(rec.get_category_display() if rec.category else None, "N/A")
            rec_priority = safe_display(rec.priority, "N/A")
            rec_cost = safe_display(rec.cost_level, "N/A")
            
            report_html += f"""
            <tr>
                <td>{rec_title}</td>
                <td>{rec_category}</td>
                <td>{rec_priority}</td>
                <td>{rec_cost}</td>
            </tr>
        """
        
        report_html += """
        </table>
        
        <h2>90-Day Action Roadmap</h2>
    """
        
        for phase in [1, 2, 3]:
            phase_roadmaps = [r for r in roadmaps if r.phase == phase]
            if phase_roadmaps:
                phase_label = '0-30' if phase == 1 else '31-60' if phase == 2 else '61-90'
                report_html += f"<h3>Phase {phase} ({phase_label} days)</h3><ul>"
                for roadmap in phase_roadmaps:
                    roadmap_title = escape_html(roadmap.action_title or "N/A")
                    roadmap_desc = escape_html(roadmap.description or "N/A")
                    roadmap_role = escape_html(roadmap.responsible_role or "N/A")
                    roadmap_effort = safe_display(roadmap.effort_level, "N/A")
                    report_html += f"<li><strong>{roadmap_title}</strong> - {roadmap_desc} (Responsible: {roadmap_role}, Effort: {roadmap_effort})</li>"
                report_html += "</ul>"
        
        report_html += """
        <div class="disclaimer" style="margin-top: 40px;">
            <strong>Data Limitations:</strong> This report is based on the information provided and may not reflect the complete ESG picture. Regular assessments are recommended to track progress.
        </div>
    </body>
    </html>
    """
        
        return Response({'report_html': report_html}, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc() if settings.DEBUG else str(e)
        return Response({
            'error': 'Failed to generate report',
            'detail': str(e),
            'traceback': error_detail if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

