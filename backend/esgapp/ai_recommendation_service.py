"""
AI-powered Recommendation Service for ESG improvements
"""
from openai import OpenAI
from django.conf import settings
from .models import ESGSnapshot, ESGRecommendation
import json


class AIRecommendationService:
    """Generates ESG recommendations using AI API"""
    
    def __init__(self):
        if settings.GROQ_API_KEY:
            try:
                self.client = OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.AI_BASE_URL
                )
                self.model = settings.AI_MODEL
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")
                self.client = None
                self.model = None
        else:
            self.client = None
            self.model = None
    
    def generate_recommendations(self, snapshot: ESGSnapshot) -> list[ESGRecommendation]:
        """Generate AI-powered recommendations for a snapshot"""
        if not self.client:
            return self._fallback_recommendations(snapshot)
        
        try:
            # Prepare context for AI
            context = self._prepare_context(snapshot)
            
            # Call AI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an ESG consultant. Generate 5-8 actionable recommendations in JSON format with fields: title, description, category (E/S/G), priority (high/medium/low), cost_level (low/medium/high), expected_impact."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse AI response
            ai_content = response.choices[0].message.content
            recommendations = self._parse_ai_recommendations(ai_content, snapshot)
            
            return recommendations
            
        except Exception as e:
            print(f"AI recommendation error: {e}")
            return self._fallback_recommendations(snapshot)
    
    def _prepare_context(self, snapshot: ESGSnapshot) -> str:
        """Prepare context for AI API"""
        esg_input = snapshot.esg_input
        
        context = f"""
Business Profile:
- Name: {snapshot.business_profile.business_name}
- Industry: {snapshot.business_profile.industry}
- Employees: {snapshot.business_profile.employee_count}

Current ESG Scores:
- Environmental: {snapshot.environmental_score}/100
- Social: {snapshot.social_score}/100  
- Governance: {snapshot.governance_score}/100
- Overall: {snapshot.overall_esg_score}/100

Key Business Data:
- Energy: {esg_input.electricity_kwh or 'Not provided'} kWh
- Solar: {'Yes' if esg_input.has_solar else 'No'}
- Waste recycling: {'Yes' if esg_input.waste_recycling else 'No'}
- Safety training: {'Yes' if esg_input.safety_training_provided else 'No'}
- Health insurance: {'Yes' if esg_input.health_insurance else 'No'}
- Code of conduct: {'Yes' if esg_input.code_of_conduct else 'No'}

Generate specific, actionable ESG improvement recommendations for this SME.
"""
        return context
    
    def _parse_ai_recommendations(self, ai_content: str, snapshot: ESGSnapshot) -> list[ESGRecommendation]:
        """Parse AI response into recommendation objects"""
        recommendations = []
        
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\[.*\]', ai_content, re.DOTALL)
            if json_match:
                items = json.loads(json_match.group())
            else:
                # Fallback parsing
                items = self._simple_parse(ai_content)
            
            for item in items[:8]:  # Limit to 8 recommendations
                rec = ESGRecommendation(
                    snapshot=snapshot,
                    title=item.get('title', 'ESG Improvement'),
                    description=item.get('description', ''),
                    category=item.get('category', 'E'),
                    priority=item.get('priority', 'medium').lower(),
                    cost_level=item.get('cost_level', 'medium').lower(),
                    expected_impact=item.get('expected_impact', 'Improve ESG performance')
                )
                recommendations.append(rec)
                
        except Exception as e:
            print(f"Parsing error: {e}")
            return self._fallback_recommendations(snapshot)
        
        return recommendations
    
    def _simple_parse(self, content: str) -> list[dict]:
        """Simple fallback parsing"""
        return [
            {
                "title": "Energy Efficiency Program",
                "description": "Implement energy-saving measures to reduce consumption",
                "category": "E",
                "priority": "high",
                "cost_level": "medium",
                "expected_impact": "Reduce energy costs by 15-25%"
            },
            {
                "title": "Employee Safety Training",
                "description": "Conduct regular safety training sessions",
                "category": "S", 
                "priority": "high",
                "cost_level": "low",
                "expected_impact": "Improve workplace safety"
            },
            {
                "title": "Governance Policy Development",
                "description": "Create formal governance policies",
                "category": "G",
                "priority": "medium", 
                "cost_level": "low",
                "expected_impact": "Strengthen governance framework"
            }
        ]
    
    def _fallback_recommendations(self, snapshot: ESGSnapshot) -> list[ESGRecommendation]:
        """Fallback recommendations when AI is unavailable"""
        recommendations = []
        
        # Basic recommendations based on scores
        if snapshot.environmental_score < 60:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Energy Efficiency Measures",
                description="Implement LED lighting and energy-efficient equipment",
                category='E',
                priority='high',
                cost_level='medium',
                expected_impact="Reduce energy consumption by 15-25%"
            ))
        
        if snapshot.social_score < 60:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Employee Welfare Program",
                description="Enhance employee benefits and safety measures",
                category='S',
                priority='high',
                cost_level='medium',
                expected_impact="Improve employee satisfaction and retention"
            ))
        
        if snapshot.governance_score < 60:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Governance Framework",
                description="Establish formal policies and procedures",
                category='G',
                priority='medium',
                cost_level='low',
                expected_impact="Strengthen organizational governance"
            ))
        
        return recommendations