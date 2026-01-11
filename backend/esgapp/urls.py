from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import ai_views

router = DefaultRouter()
router.register(r'business-profiles', views.BusinessProfileViewSet, basename='businessprofile')
router.register(r'esg-inputs', views.ESGInputViewSet, basename='esginput')
router.register(r'esg-snapshots', views.ESGSnapshotViewSet, basename='esgsnapshot')

urlpatterns = [
    # Authentication
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/google/', views.google_login, name='google_login'),
    
    # Original endpoints
    path('chat/query/', views.chat_query, name='chat_query'),
    path('esg/roadmap/', views.generate_roadmap, name='generate_roadmap'),
    path('esg/report/', views.generate_report, name='generate_report'),
    
    # New AI-powered endpoints
    path('ai/comprehensive-analysis/', ai_views.ai_comprehensive_analysis, name='ai_comprehensive_analysis'),
    path('ai/chatbot/', ai_views.ai_chatbot_query, name='ai_chatbot_query'),
    path('ai/report/', ai_views.generate_ai_report, name='generate_ai_report'),
    path('ai/status/', ai_views.ai_service_status, name='ai_service_status'),
    
    path('', include(router.urls)),
]

