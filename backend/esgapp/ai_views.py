"""
Enhanced API endpoints for free AI-powered ESG analysis
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings
import json
import uuid

from .models import ESGInput, ESGSnapshot, ChatSession, ChatMessage
from .free_ai_service import FreeAIService
from .serializers import ESGSnapshotSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_comprehensive_analysis(request):
    """Generate comprehensive AI-powered ESG analysis using free APIs"""
    try:
        esg_input_id = request.data.get('esg_input_id')
        if not esg_input_id:
            return Response({'error': 'esg_input_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        esg_input = get_object_or_404(
            ESGInput,
            id=esg_input_id,
            business_profile__user=request.user
        )
        
        # Initialize free AI service
        ai_service = FreeAIService()
        
        # Generate comprehensive analysis
        analysis_data = ai_service.generate_comprehensive_esg_analysis(esg_input)
        
        # Extract scores from analysis
        overall_assessment = analysis_data.get('overall_assessment', {})
        
        # Create or update ESG snapshot
        snapshot, created = ESGSnapshot.objects.get_or_create(
            esg_input=esg_input,
            defaults={
                'business_profile': esg_input.business_profile,
                'environmental_score': overall_assessment.get('environmental_score', 45),
                'social_score': overall_assessment.get('social_score', 45),
                'governance_score': overall_assessment.get('governance_score', 45),
                'overall_esg_score': overall_assessment.get('overall_esg_score', 45),
                'confidence_level': overall_assessment.get('confidence_level', 'medium'),
                'data_completeness': overall_assessment.get('data_completeness', 50)
            }
        )
        
        if not created:
            # Update existing snapshot
            snapshot.environmental_score = overall_assessment.get('environmental_score', snapshot.environmental_score)
            snapshot.social_score = overall_assessment.get('social_score', snapshot.social_score)
            snapshot.governance_score = overall_assessment.get('governance_score', snapshot.governance_score)
            snapshot.overall_esg_score = overall_assessment.get('overall_esg_score', snapshot.overall_esg_score)
            snapshot.confidence_level = overall_assessment.get('confidence_level', snapshot.confidence_level)
            snapshot.data_completeness = overall_assessment.get('data_completeness', snapshot.data_completeness)
            snapshot.save()
        
        # Store detailed analysis data (you might want to add a JSONField to ESGSnapshot model)
        # For now, we'll return it in the response
        
        # Create enhanced recommendations from AI analysis
        recommendations_data = analysis_data.get('actionable_recommendations', [])
        
        # Clear existing recommendations and create new ones
        snapshot.recommendations.all().delete()
        
        from .models import ESGRecommendation
        for rec_data in recommendations_data[:10]:  # Limit to top 10
            ESGRecommendation.objects.create(
                snapshot=snapshot,
                title=rec_data.get('title', 'ESG Improvement'),
                description=rec_data.get('expected_impact', 'Improve ESG performance'),
                category=rec_data.get('category', 'E'),
                priority=rec_data.get('priority', 'medium'),
                cost_level=rec_data.get('cost_estimate', 'medium').split(' ')[0].replace('$', '').lower() if '$' in rec_data.get('cost_estimate', '') else 'medium',
                expected_impact=rec_data.get('expected_impact', 'Positive ESG impact'),
                esg_impact_points=rec_data.get('esg_score_improvement', '+2-4 points'),
                business_benefit='; '.join(rec_data.get('business_benefits', ['Improved ESG performance'])),
                why_matters=f"Implementation time: {rec_data.get('implementation_time', 'TBD')}. Cost: {rec_data.get('cost_estimate', 'TBD')}",
                risk_reduction='high' if rec_data.get('priority') == 'high' else 'medium'
            )
        
        return Response({
            'snapshot': ESGSnapshotSerializer(snapshot).data,
            'comprehensive_analysis': analysis_data,
            'message': 'AI-powered comprehensive ESG analysis completed successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"AI comprehensive analysis error: {e}")
        print(error_detail)
        return Response({
            'error': str(e),
            'detail': 'Failed to generate AI analysis',
            'traceback': error_detail if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_chatbot_query(request):
    """Enhanced AI chatbot with comprehensive ESG context"""
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
                session_id = str(uuid.uuid4())
                chat_session = ChatSession.objects.create(snapshot=snapshot, session_id=session_id)
        else:
            session_id = str(uuid.uuid4())
            chat_session = ChatSession.objects.create(snapshot=snapshot, session_id=session_id)
        
        # Save user message
        ChatMessage.objects.create(session=chat_session, role='user', content=query)
        
        # Get conversation history
        recent_messages = ChatMessage.objects.filter(session=chat_session).order_by('-created_at')[:6]
        conversation_history = [
            {'role': msg.role, 'content': msg.content} 
            for msg in reversed(recent_messages) if msg.content != query
        ]
        
        # Prepare context for AI
        context = {
            'business_name': snapshot.business_profile.business_name,
            'industry': snapshot.business_profile.industry,
            'environmental_score': snapshot.environmental_score,
            'social_score': snapshot.social_score,
            'governance_score': snapshot.governance_score,
            'overall_score': snapshot.overall_esg_score,
            'data_completeness': snapshot.data_completeness,
            'confidence_level': snapshot.confidence_level
        }
        
        # Initialize AI service and generate response
        ai_service = FreeAIService()
        response_text = ai_service.generate_chatbot_response(query, context, conversation_history)
        
        # Save assistant response
        ChatMessage.objects.create(session=chat_session, role='assistant', content=response_text)
        
        return Response({
            'response': response_text,
            'session_id': session_id,
            'context_used': context
        })
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"AI chatbot error: {e}")
        print(error_detail)
        
        # Fallback response
        fallback_response = "I'm here to help with your ESG improvements. Could you please rephrase your question or ask about specific areas like energy efficiency, employee safety, or governance policies?"
        
        return Response({
            'response': fallback_response,
            'session_id': session_id if 'session_id' in locals() else str(uuid.uuid4()),
            'error': 'AI service temporarily unavailable, using fallback response',
            'traceback': error_detail if settings.DEBUG else None
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_ai_report(request):
    """Generate comprehensive ESG report using AI"""
    try:
        snapshot_id = request.data.get('snapshot_id')
        if not snapshot_id:
            return Response({'error': 'snapshot_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        snapshot = get_object_or_404(
            ESGSnapshot,
            id=snapshot_id,
            business_profile__user=request.user
        )
        
        # Prepare analysis data
        analysis_data = {
            'scores': {
                'environmental': snapshot.environmental_score,
                'social': snapshot.social_score,
                'governance': snapshot.governance_score,
                'overall': snapshot.overall_esg_score
            },
            'confidence': snapshot.confidence_level,
            'data_completeness': snapshot.data_completeness,
            'recommendations_count': snapshot.recommendations.count()
        }
        
        # Initialize AI service and generate report
        ai_service = FreeAIService()
        report_data = ai_service.generate_esg_report_data(snapshot.esg_input, analysis_data)
        
        # Generate HTML report
        report_html = _generate_enhanced_html_report(snapshot, report_data)
        
        return Response({
            'report_html': report_html,
            'report_data': report_data,
            'message': 'AI-powered ESG report generated successfully'
        })
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"AI report generation error: {e}")
        print(error_detail)
        return Response({
            'error': str(e),
            'detail': 'Failed to generate AI report',
            'traceback': error_detail if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_service_status(request):
    """Check AI service availability and configuration"""
    ai_service = FreeAIService()
    client, model = ai_service.get_available_client()
    
    status_info = {
        'groq_available': bool(ai_service.groq_client),
        'openrouter_available': bool(ai_service.openrouter_client),
        'huggingface_available': bool(ai_service.hf_api_key),
        'active_client': 'groq' if ai_service.groq_client else 'openrouter' if ai_service.openrouter_client else 'none',
        'active_model': model,
        'service_operational': bool(client)
    }
    
    return Response(status_info)


def _generate_enhanced_html_report(snapshot, report_data):
    """Generate enhanced HTML report with AI insights"""
    
    def safe_get(data, key, default="N/A"):
        return data.get(key, default) if data else default
    
    def format_score(score):
        try:
            return f"{float(score):.1f}"
        except:
            return "N/A"
    
    business_name = snapshot.business_profile.business_name or "Business"
    industry = snapshot.business_profile.industry or "N/A"
    assessment_date = snapshot.created_at.strftime('%Y-%m-%d') if snapshot.created_at else "N/A"
    
    # Get report sections
    executive_summary = safe_get(report_data, 'executive_summary', 'Comprehensive ESG assessment completed with AI-powered analysis.')
    key_findings = report_data.get('key_findings', ['ESG assessment completed', 'Improvement opportunities identified'])
    critical_actions = report_data.get('critical_actions', ['Implement energy efficiency measures', 'Develop ESG policies'])
    investment_priorities = report_data.get('investment_priorities', [])
    
    html_report = f"""
<!DOCTYPE html>
<html>
<head>
    <title>AI-Powered ESG Report - {business_name}</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: #f8f9fa; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 2.5em; }}
        h2 {{ color: #34495e; margin-top: 40px; margin-bottom: 20px; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h3 {{ color: #2c3e50; margin-top: 30px; }}
        .header-info {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }}
        .score-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }}
        .score-card {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }}
        .score-value {{ font-size: 3em; font-weight: bold; margin: 10px 0; }}
        .score-label {{ font-size: 1.1em; opacity: 0.9; }}
        .ai-insight {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; }}
        .findings-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }}
        .finding-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; }}
        .action-item {{ background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #27ae60; }}
        .investment-card {{ background: #fff3cd; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ffc107; }}
        .disclaimer {{ background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #dc3545; }}
        .ai-badge {{ background: #6f42c1; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.8em; display: inline-block; margin-bottom: 15px; }}
        ul {{ padding-left: 20px; }}
        li {{ margin: 8px 0; line-height: 1.6; }}
        .highlight {{ background: #fff3cd; padding: 2px 6px; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="ai-badge">🤖 AI-Powered Analysis</div>
        <h1>ESG Assessment Report</h1>
        
        <div class="header-info">
            <h2 style="margin-top: 0; border: none; color: white;">Business Overview</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div><strong>Business:</strong> {business_name}</div>
                <div><strong>Industry:</strong> {industry}</div>
                <div><strong>Employees:</strong> {snapshot.esg_input.total_employees or 'N/A'}</div>
                <div><strong>Assessment Date:</strong> {assessment_date}</div>
            </div>
        </div>
        
        <div class="ai-insight">
            <h3 style="margin-top: 0; color: white;">🎯 AI Executive Summary</h3>
            <p style="font-size: 1.1em; line-height: 1.6; margin: 0;">{executive_summary}</p>
        </div>
        
        <h2>📊 ESG Performance Scores</h2>
        <div class="score-grid">
            <div class="score-card">
                <div class="score-label">Overall ESG</div>
                <div class="score-value">{format_score(snapshot.overall_esg_score)}</div>
                <div class="score-label">out of 100</div>
            </div>
            <div class="score-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
                <div class="score-label">Environmental</div>
                <div class="score-value">{format_score(snapshot.environmental_score)}</div>
                <div class="score-label">Score</div>
            </div>
            <div class="score-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="score-label">Social</div>
                <div class="score-value">{format_score(snapshot.social_score)}</div>
                <div class="score-label">Score</div>
            </div>
            <div class="score-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div class="score-label">Governance</div>
                <div class="score-value">{format_score(snapshot.governance_score)}</div>
                <div class="score-label">Score</div>
            </div>
        </div>
        
        <h2>🔍 AI Key Findings</h2>
        <div class="findings-grid">
    """
    
    for i, finding in enumerate(key_findings[:6]):
        html_report += f"""
            <div class="finding-card">
                <strong>Finding {i+1}:</strong> {finding}
            </div>
        """
    
    html_report += f"""
        </div>
        
        <h2>⚡ Critical Actions Required</h2>
    """
    
    for i, action in enumerate(critical_actions[:5]):
        html_report += f"""
        <div class="action-item">
            <strong>Action {i+1}:</strong> {action}
        </div>
        """
    
    if investment_priorities:
        html_report += """
        <h2>💰 Investment Priorities</h2>
        """
        for priority in investment_priorities[:3]:
            html_report += f"""
            <div class="investment-card">
                <h4 style="margin-top: 0;">{safe_get(priority, 'area', 'Investment Area')}</h4>
                <p><strong>Investment:</strong> {safe_get(priority, 'investment', 'TBD')}</p>
                <p><strong>Expected ROI:</strong> {safe_get(priority, 'expected_roi', 'Positive impact expected')}</p>
                <p><strong>Timeline:</strong> {safe_get(priority, 'timeline', 'TBD')}</p>
            </div>
            """
    
    # Add recommendations
    recommendations = snapshot.recommendations.all()[:5]
    if recommendations:
        html_report += """
        <h2>📋 Top Recommendations</h2>
        <div class="findings-grid">
        """
        for rec in recommendations:
            html_report += f"""
            <div class="finding-card">
                <h4 style="margin-top: 0; color: #2c3e50;">{rec.title}</h4>
                <p><strong>Category:</strong> <span class="highlight">{rec.get_category_display()}</span></p>
                <p><strong>Priority:</strong> <span class="highlight">{rec.priority.upper()}</span></p>
                <p>{rec.description}</p>
            </div>
            """
        html_report += "</div>"
    
    html_report += f"""
        <div class="disclaimer">
            <h3 style="margin-top: 0;">⚠️ Important Disclaimer</h3>
            <p><strong>AI-Generated Content:</strong> This report contains AI-generated analysis and recommendations. While based on your input data and industry best practices, this assessment is indicative and does not constitute:</p>
            <ul>
                <li>Certified ESG rating or official compliance assessment</li>
                <li>Professional consulting or legal advice</li>
                <li>Guarantee of regulatory compliance</li>
                <li>Investment or financial advice</li>
            </ul>
            <p><strong>Data Completeness:</strong> {format_score(snapshot.data_completeness)}% - Regular assessments recommended for comprehensive ESG tracking.</p>
            <p><strong>Confidence Level:</strong> {snapshot.confidence_level.upper() if snapshot.confidence_level else 'MEDIUM'}</p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #6c757d;">Generated by ESG Resolve AI • {assessment_date}</p>
            <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 0.9em;">Powered by Advanced AI Analysis</p>
        </div>
    </div>
</body>
</html>
    """
    
    return html_report