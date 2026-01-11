"""
Free AI Service for ESG Analysis using multiple free APIs
Supports Groq, OpenRouter, and Hugging Face APIs
"""
import json
import requests
from django.conf import settings
from openai import OpenAI
import os
from typing import Dict, List, Optional

class FreeAIService:
    """Enhanced AI service using free APIs for comprehensive ESG analysis"""
    
    def __init__(self):
        self.deepseek_client = None
        self.openrouter_client = None
        self.hf_api_key = os.getenv('HUGGINGFACE_API_KEY', '')
        
        # Initialize DeepSeek client
        if settings.GROQ_API_KEY:
            try:
                self.deepseek_client = OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.AI_BASE_URL
                )
            except Exception as e:
                print(f"Failed to initialize DeepSeek client: {e}")
        
        # Initialize OpenRouter client (backup)
        openrouter_key = os.getenv('OPENROUTER_API_KEY', '')
        if openrouter_key:
            try:
                self.openrouter_client = OpenAI(
                    api_key=openrouter_key,
                    base_url="https://openrouter.ai/api/v1"
                )
            except Exception as e:
                print(f"Failed to initialize OpenRouter client: {e}")
    
    def get_available_client(self):
        """Get the first available AI client"""
        if self.deepseek_client:
            return self.deepseek_client, settings.AI_MODEL
        elif self.openrouter_client:
            return self.openrouter_client, "meta-llama/llama-3.1-8b-instruct:free"
        return None, None
    
    def generate_comprehensive_esg_analysis(self, esg_input) -> Dict:
        """Generate comprehensive ESG analysis with detailed insights"""
        
        client, model = self.get_available_client()
        if not client:
            return self._fallback_analysis(esg_input)
        
        # Prepare comprehensive business context
        context = self._prepare_detailed_context(esg_input)
        
        prompt = f"""
You are an expert ESG analyst. Analyze this business data and provide a comprehensive ESG assessment.

{context}

Provide a detailed JSON response with this exact structure:
{{
    "overall_assessment": {{
        "environmental_score": 0-100,
        "social_score": 0-100,
        "governance_score": 0-100,
        "overall_esg_score": 0-100,
        "confidence_level": "high/medium/low",
        "data_completeness": 0-100
    }},
    "detailed_insights": {{
        "environmental": {{
            "current_performance": "detailed analysis",
            "key_strengths": ["strength 1", "strength 2"],
            "critical_gaps": ["gap 1", "gap 2"],
            "carbon_footprint_assessment": "analysis",
            "energy_efficiency_rating": "poor/fair/good/excellent",
            "waste_management_score": 0-100
        }},
        "social": {{
            "employee_welfare_score": 0-100,
            "diversity_inclusion_rating": "poor/fair/good/excellent",
            "safety_performance": "analysis",
            "community_impact": "assessment",
            "key_social_risks": ["risk 1", "risk 2"]
        }},
        "governance": {{
            "policy_framework_score": 0-100,
            "risk_management_maturity": "basic/developing/advanced",
            "compliance_readiness": 0-100,
            "transparency_level": "low/medium/high",
            "governance_gaps": ["gap 1", "gap 2"]
        }}
    }},
    "actionable_recommendations": [
        {{
            "title": "recommendation title",
            "category": "E/S/G",
            "priority": "high/medium/low",
            "cost_estimate": "$X - $Y",
            "implementation_time": "X weeks/months",
            "expected_impact": "detailed impact description",
            "esg_score_improvement": "+X points",
            "business_benefits": ["benefit 1", "benefit 2"],
            "implementation_steps": ["step 1", "step 2", "step 3"]
        }}
    ],
    "risk_assessment": {{
        "high_priority_risks": ["risk 1", "risk 2"],
        "medium_priority_risks": ["risk 1", "risk 2"],
        "regulatory_compliance_risks": ["risk 1", "risk 2"],
        "reputational_risks": ["risk 1", "risk 2"]
    }},
    "industry_benchmarking": {{
        "industry_average_esg": 0-100,
        "performance_vs_peers": "below/at/above average",
        "competitive_advantages": ["advantage 1", "advantage 2"],
        "areas_needing_attention": ["area 1", "area 2"]
    }},
    "implementation_roadmap": {{
        "quick_wins_30_days": [
            {{
                "action": "action name",
                "description": "detailed description",
                "cost": "$X",
                "impact": "high/medium/low"
            }}
        ],
        "medium_term_60_days": [
            {{
                "action": "action name", 
                "description": "detailed description",
                "cost": "$X",
                "impact": "high/medium/low"
            }}
        ],
        "long_term_90_days": [
            {{
                "action": "action name",
                "description": "detailed description", 
                "cost": "$X",
                "impact": "high/medium/low"
            }}
        ]
    }}
}}

SCORING GUIDELINES:
- Be realistic and fair in scoring
- Reward actual practices and data provided
- Consider company size and industry context
- Provide actionable, specific recommendations
- Focus on cost-effective improvements for SMEs

Return ONLY valid JSON without markdown formatting.
"""
        
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert ESG consultant specializing in SME assessments. Provide comprehensive, actionable analysis in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=3000
            )
            
            content = response.choices[0].message.content
            return self._parse_comprehensive_response(content, esg_input)
            
        except Exception as e:
            print(f"AI analysis error: {e}")
            return self._fallback_analysis(esg_input)
    
    def generate_chatbot_response(self, query: str, context: Dict, conversation_history: List = None) -> str:
        """Generate intelligent chatbot response with ESG context"""
        
        client, model = self.get_available_client()
        if not client:
            return self._fallback_chatbot_response(query, context)
        
        # Prepare context-aware prompt
        esg_context = f"""
Business: {context.get('business_name', 'N/A')} ({context.get('industry', 'N/A')})
ESG Scores: E:{context.get('environmental_score', 0):.1f} S:{context.get('social_score', 0):.1f} G:{context.get('governance_score', 0):.1f}
Overall: {context.get('overall_score', 0):.1f}/100

Key Areas for Improvement:
{self._get_improvement_areas(context)}
"""
        
        # Build conversation messages
        messages = [
            {"role": "system", "content": f"""You are an expert ESG consultant and implementation specialist. 

Current Business Context:
{esg_context}

Guidelines:
- Provide specific, actionable advice
- Consider the business size and industry
- Focus on cost-effective solutions
- Be encouraging and supportive
- Explain WHY recommendations matter
- Provide step-by-step guidance when asked
- Use simple language, avoid jargon
- Always end with a practical next step

Keep responses concise but comprehensive (max 300 words)."""}
        ]
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-4:]:  # Last 4 messages for context
                messages.append({"role": msg.get('role', 'user'), "content": msg.get('content', '')})
        
        messages.append({"role": "user", "content": query})
        
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Chatbot error: {e}")
            return self._fallback_chatbot_response(query, context)
    
    def generate_esg_report_data(self, esg_input, analysis_data: Dict) -> Dict:
        """Generate comprehensive ESG report data"""
        
        client, model = self.get_available_client()
        if not client:
            return self._fallback_report_data(esg_input, analysis_data)
        
        prompt = f"""
Generate a comprehensive ESG report summary based on this analysis:

Business: {esg_input.business_profile.business_name}
Industry: {esg_input.business_profile.industry}
Employees: {esg_input.total_employees}

Analysis Data: {json.dumps(analysis_data, indent=2)}

Provide a JSON response with:
{{
    "executive_summary": "2-3 paragraph summary of ESG performance",
    "key_findings": [
        "finding 1",
        "finding 2", 
        "finding 3"
    ],
    "performance_highlights": [
        "highlight 1",
        "highlight 2"
    ],
    "critical_actions": [
        "action 1",
        "action 2",
        "action 3"
    ],
    "investment_priorities": [
        {{
            "area": "area name",
            "investment": "$X - $Y",
            "expected_roi": "description",
            "timeline": "X months"
        }}
    ],
    "compliance_status": {{
        "current_compliance_level": "basic/developing/advanced",
        "regulatory_gaps": ["gap 1", "gap 2"],
        "recommended_actions": ["action 1", "action 2"]
    }},
    "stakeholder_communication": {{
        "key_messages": ["message 1", "message 2"],
        "investor_highlights": ["highlight 1", "highlight 2"],
        "customer_benefits": ["benefit 1", "benefit 2"]
    }}
}}

Return ONLY valid JSON.
"""
        
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an ESG reporting specialist. Generate comprehensive, professional report content."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            return self._parse_json_response(content)
            
        except Exception as e:
            print(f"Report generation error: {e}")
            return self._fallback_report_data(esg_input, analysis_data)
    
    def _prepare_detailed_context(self, esg_input) -> str:
        """Prepare detailed business context for AI analysis"""
        bp = esg_input.business_profile
        
        return f"""
BUSINESS PROFILE:
- Company: {bp.business_name}
- Industry: {bp.industry} 
- Size: {esg_input.total_employees} employees
- Office: {bp.office_area_sqm or 'Not specified'} sqm
- Location: {bp.location or 'Not specified'}

ENVIRONMENTAL DATA:
- Electricity: {esg_input.electricity_kwh or 0} kWh/month (${esg_input.electricity_bill_amount or 0}/month)
- Generator: {esg_input.generator_usage_liters or 0} liters/month, {esg_input.generator_usage_hours or 0} hours/month
- Water: {esg_input.water_usage_liters or 0} liters/month from {esg_input.water_source or 'unspecified source'}
- Solar: {'Yes' if esg_input.has_solar else 'No'} ({esg_input.solar_capacity_kw or 0} kW capacity)
- Renewable Energy: {esg_input.renewable_energy_percentage or 0}%
- Waste Management: Recycling: {'Yes' if esg_input.waste_recycling else 'No'}, Segregation: {'Yes' if esg_input.waste_segregation else 'No'}
- Environmental Practices: 
  * Carbon tracking: {'Yes' if esg_input.carbon_footprint_tracking else 'No'}
  * Energy efficiency measures: {esg_input.energy_efficiency_measures or 'None specified'}
  * Water conservation: {esg_input.water_conservation_measures or 'None specified'}
  * Hazardous waste management: {'Yes' if esg_input.hazardous_waste_management else 'No'}
  * Paper reduction: {'Yes' if esg_input.paper_reduction_initiatives else 'No'}
  * Sustainable procurement: {'Yes' if esg_input.sustainable_procurement else 'No'}

SOCIAL DATA:
- Safety: Training provided: {'Yes' if esg_input.safety_training_provided else 'No'} ({esg_input.safety_training_frequency or 'No frequency specified'})
- Workplace accidents (last year): {esg_input.workplace_accidents_last_year or 'Not specified'}
- Employee Benefits: {esg_input.employee_benefits or 'Not specified'}
- Health insurance: {'Yes' if esg_input.health_insurance else 'No'}
- Diversity: Policy: {'Yes' if esg_input.diversity_policy else 'No'}, Female employees: {esg_input.female_employees_percentage or 'Not specified'}%
- Employee Development: Training hours: {esg_input.employee_training_hours or 'Not specified'} hours/employee/year
- Workplace Culture:
  * Mental health support: {'Yes' if esg_input.mental_health_support else 'No'}
  * Employee satisfaction surveys: {'Yes' if esg_input.employee_satisfaction_survey else 'No'}
  * Flexible work arrangements: {'Yes' if esg_input.flexible_work_arrangements else 'No'}
- Community Engagement:
  * Community programs: {'Yes' if esg_input.community_engagement else 'No'}
  * Local hiring preference: {'Yes' if esg_input.local_hiring_preference else 'No'}
  * Charitable contributions: {'Yes' if esg_input.charitable_contributions else 'No'}

GOVERNANCE DATA:
- Core Policies:
  * Code of conduct: {'Yes' if esg_input.code_of_conduct else 'No'}
  * Anti-corruption policy: {'Yes' if esg_input.anti_corruption_policy else 'No'}
  * Data privacy policy: {'Yes' if esg_input.data_privacy_policy else 'No'}
  * Whistleblower policy: {'Yes' if esg_input.whistleblower_policy else 'No'}
- Management Structure:
  * Board oversight: {'Yes' if esg_input.board_oversight else 'No'}
  * Risk management policy: {'Yes' if esg_input.risk_management_policy else 'No'}
- Compliance & Reporting:
  * Cybersecurity measures: {'Yes' if esg_input.cybersecurity_measures else 'No'}
  * Regulatory compliance tracking: {'Yes' if esg_input.regulatory_compliance_tracking else 'No'}
  * Sustainability reporting: {'Yes' if esg_input.sustainability_reporting else 'No'}
  * Third-party audits: {'Yes' if esg_input.third_party_audits else 'No'}
- ESG Integration:
  * ESG goals set: {'Yes' if esg_input.esg_goals_set else 'No'}
  * Public ESG commitments: {'Yes' if esg_input.public_esg_commitments else 'No'}
  * ESG-linked executive compensation: {'Yes' if esg_input.esg_linked_executive_compensation else 'No'}
"""
    
    def _parse_comprehensive_response(self, content: str, esg_input) -> Dict:
        """Parse comprehensive AI response"""
        try:
            # Clean and parse JSON
            content = content.replace('```json', '').replace('```', '').strip()
            parsed = json.loads(content)
            
            # Validate and structure response
            return {
                'overall_assessment': parsed.get('overall_assessment', {}),
                'detailed_insights': parsed.get('detailed_insights', {}),
                'actionable_recommendations': parsed.get('actionable_recommendations', []),
                'risk_assessment': parsed.get('risk_assessment', {}),
                'industry_benchmarking': parsed.get('industry_benchmarking', {}),
                'implementation_roadmap': parsed.get('implementation_roadmap', {})
            }
            
        except Exception as e:
            print(f"Error parsing comprehensive response: {e}")
            return self._fallback_analysis(esg_input)
    
    def _parse_json_response(self, content: str) -> Dict:
        """Parse JSON response with error handling"""
        try:
            content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except:
            return {}
    
    def _get_improvement_areas(self, context: Dict) -> str:
        """Get key improvement areas based on scores"""
        areas = []
        if context.get('environmental_score', 0) < 60:
            areas.append("Environmental practices (energy, waste, carbon footprint)")
        if context.get('social_score', 0) < 60:
            areas.append("Employee welfare and safety programs")
        if context.get('governance_score', 0) < 60:
            areas.append("Governance policies and risk management")
        
        return "; ".join(areas) if areas else "Continue strengthening current practices"
    
    def _fallback_analysis(self, esg_input) -> Dict:
        """Fallback analysis when AI is unavailable"""
        return {
            'overall_assessment': {
                'environmental_score': 45,
                'social_score': 50,
                'governance_score': 40,
                'overall_esg_score': 45,
                'confidence_level': 'medium',
                'data_completeness': 60
            },
            'detailed_insights': {
                'environmental': {
                    'current_performance': 'Basic environmental practices in place',
                    'key_strengths': ['Some data tracking'],
                    'critical_gaps': ['Limited renewable energy', 'No carbon tracking'],
                    'carbon_footprint_assessment': 'Needs improvement',
                    'energy_efficiency_rating': 'fair',
                    'waste_management_score': 40
                },
                'social': {
                    'employee_welfare_score': 50,
                    'diversity_inclusion_rating': 'fair',
                    'safety_performance': 'Basic safety measures',
                    'community_impact': 'Limited community engagement',
                    'key_social_risks': ['Employee retention', 'Safety compliance']
                },
                'governance': {
                    'policy_framework_score': 40,
                    'risk_management_maturity': 'basic',
                    'compliance_readiness': 45,
                    'transparency_level': 'medium',
                    'governance_gaps': ['Missing key policies', 'Limited oversight']
                }
            },
            'actionable_recommendations': [
                {
                    'title': 'Implement Energy Efficiency Program',
                    'category': 'E',
                    'priority': 'high',
                    'cost_estimate': '$500 - $2000',
                    'implementation_time': '4-6 weeks',
                    'expected_impact': 'Reduce energy costs by 15-25%',
                    'esg_score_improvement': '+8-12 points',
                    'business_benefits': ['Cost savings', 'Improved ESG rating'],
                    'implementation_steps': ['Energy audit', 'LED lighting', 'HVAC optimization']
                }
            ],
            'risk_assessment': {
                'high_priority_risks': ['Regulatory compliance gaps'],
                'medium_priority_risks': ['Energy cost volatility'],
                'regulatory_compliance_risks': ['Missing ESG policies'],
                'reputational_risks': ['Limited sustainability practices']
            },
            'industry_benchmarking': {
                'industry_average_esg': 55,
                'performance_vs_peers': 'below average',
                'competitive_advantages': ['Willing to improve'],
                'areas_needing_attention': ['All ESG categories']
            },
            'implementation_roadmap': {
                'quick_wins_30_days': [
                    {
                        'action': 'Energy Audit',
                        'description': 'Conduct comprehensive energy assessment',
                        'cost': '$200',
                        'impact': 'medium'
                    }
                ],
                'medium_term_60_days': [
                    {
                        'action': 'Policy Development',
                        'description': 'Develop core ESG policies',
                        'cost': '$500',
                        'impact': 'high'
                    }
                ],
                'long_term_90_days': [
                    {
                        'action': 'ESG Management System',
                        'description': 'Implement comprehensive ESG tracking',
                        'cost': '$2000',
                        'impact': 'high'
                    }
                ]
            }
        }
    
    def _fallback_chatbot_response(self, query: str, context: Dict) -> str:
        """Fallback chatbot response when AI is unavailable"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['hello', 'hi', 'hey']):
            return f"Hello! I'm your ESG assistant. Your current overall ESG score is {context.get('overall_score', 0):.1f}/100. How can I help you improve it today?"
        
        elif any(word in query_lower for word in ['score', 'rating']):
            return f"Your ESG scores are: Environmental {context.get('environmental_score', 0):.1f}, Social {context.get('social_score', 0):.1f}, Governance {context.get('governance_score', 0):.1f}. Focus on the lowest scoring area for maximum impact."
        
        elif any(word in query_lower for word in ['improve', 'better', 'increase']):
            return "To improve your ESG score: 1) Implement energy efficiency measures, 2) Develop employee safety programs, 3) Create governance policies. Start with quick wins that cost less than $500."
        
        else:
            return "I can help you with ESG improvements, score analysis, and implementation guidance. What specific area would you like to focus on - Environmental, Social, or Governance?"
    
    def _fallback_report_data(self, esg_input, analysis_data: Dict) -> Dict:
        """Fallback report data when AI is unavailable"""
        return {
            'executive_summary': f"ESG assessment for {esg_input.business_profile.business_name} shows opportunities for improvement across all categories. Current performance indicates basic ESG practices with significant potential for enhancement.",
            'key_findings': [
                "Basic ESG practices currently in place",
                "Significant opportunities for improvement identified",
                "Cost-effective solutions available for quick wins"
            ],
            'performance_highlights': [
                "Willingness to improve ESG performance",
                "Data collection capabilities established"
            ],
            'critical_actions': [
                "Implement energy efficiency measures",
                "Develop comprehensive ESG policies",
                "Establish regular ESG monitoring"
            ],
            'investment_priorities': [
                {
                    'area': 'Energy Efficiency',
                    'investment': '$500 - $2000',
                    'expected_roi': '15-25% cost savings',
                    'timeline': '3-6 months'
                }
            ],
            'compliance_status': {
                'current_compliance_level': 'basic',
                'regulatory_gaps': ['Missing ESG policies', 'Limited reporting'],
                'recommended_actions': ['Develop policy framework', 'Implement tracking systems']
            },
            'stakeholder_communication': {
                'key_messages': ['Committed to ESG improvement', 'Implementing systematic approach'],
                'investor_highlights': ['ESG roadmap in development', 'Measurable improvement targets'],
                'customer_benefits': ['Sustainable business practices', 'Environmental responsibility']
            }
        }