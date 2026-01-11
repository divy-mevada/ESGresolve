from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    BusinessProfile, ESGInput, ESGSnapshot, ESGScore,
    ESGRecommendation, ESGRoadmap, ChatSession, ChatMessage
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}


class BusinessProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = BusinessProfile
        fields = ['id', 'user', 'business_name', 'industry', 'employee_count', 
                 'office_area_sqm', 'location', 'created_at', 'updated_at']


class ESGInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGInput
        fields = '__all__'
        read_only_fields = ['business_profile', 'created_at']
    
    def to_representation(self, instance):
        """Override to handle missing fields gracefully"""
        try:
            return super().to_representation(instance)
        except Exception as e:
            print(f"ESGInputSerializer error: {e}")
            # Return basic representation with safe defaults
            return {
                'id': getattr(instance, 'id', None),
                'total_employees': getattr(instance, 'total_employees', 0),
                'electricity_kwh': getattr(instance, 'electricity_kwh', 0),
                'water_usage_liters': getattr(instance, 'water_usage_liters', 0),
                'created_at': getattr(instance, 'created_at', None),
                # Add other essential fields with safe defaults
                'annual_revenue': getattr(instance, 'annual_revenue', None),
                'scope1_emissions': getattr(instance, 'scope1_emissions', None),
                'scope2_emissions': getattr(instance, 'scope2_emissions', None),
                'waste_generated_tons': getattr(instance, 'waste_generated_tons', None),
                'employee_turnover_rate': getattr(instance, 'employee_turnover_rate', None),
                'board_diversity_percentage': getattr(instance, 'board_diversity_percentage', None)
            }


class ESGScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGScore
        fields = '__all__'


class ESGSnapshotSerializer(serializers.ModelSerializer):
    recommendations = serializers.SerializerMethodField()
    roadmaps = serializers.SerializerMethodField()
    ai_insights = serializers.SerializerMethodField()
    strengths = serializers.SerializerMethodField()
    weaknesses = serializers.SerializerMethodField()
    score_breakdown = serializers.SerializerMethodField()
    esg_input = serializers.SerializerMethodField()
    business_profile = BusinessProfileSerializer(read_only=True)
    
    class Meta:
        model = ESGSnapshot
        fields = ['id', 'business_profile', 'environmental_score', 'social_score',
                 'governance_score', 'overall_esg_score', 'confidence_level',
                 'data_completeness', 'created_at', 'recommendations', 'roadmaps',
                 'ai_insights', 'strengths', 'weaknesses', 'score_breakdown', 'esg_input']
    
    def get_recommendations(self, obj):
        return ESGRecommendationSerializer(obj.recommendations.all(), many=True).data
    
    def get_roadmaps(self, obj):
        return ESGRoadmapSerializer(obj.roadmaps.all(), many=True).data
    
    def get_ai_insights(self, obj):
        # Return AI insights if available in response context
        return getattr(obj, '_ai_insights', {})
    
    def get_strengths(self, obj):
        return getattr(obj, '_strengths', [])
    
    def get_weaknesses(self, obj):
        return getattr(obj, '_weaknesses', [])
    
    def get_score_breakdown(self, obj):
        return getattr(obj, '_score_breakdown', {})
    
    def get_esg_input(self, obj):
        # Include ESG input data for calculations
        try:
            if hasattr(obj, 'esg_input') and obj.esg_input:
                return ESGInputSerializer(obj.esg_input).data
            return None
        except Exception as e:
            print(f"Error serializing ESG input: {e}")
            return None


class ESGRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGRecommendation
        fields = '__all__'


class ESGRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGRoadmap
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['session', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'snapshot', 'session_id', 'created_at', 'updated_at', 'messages']

