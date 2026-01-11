"""
AI-based ESG Scoring Service using Groq API
"""
from openai import OpenAI
from django.conf import settings
from .models import ESGInput, ESGSnapshot
import json
import re


class AIScoringService:
    """AI-powered ESG scoring using Llama model via Groq"""
    
    def __init__(self):
        if settings.GROQ_API_KEY:
            try:
                self.client = OpenAI(
                    api_key=settings.GROQ_API_KEY,
                    base_url=settings.AI_BASE_URL
                )
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")
                self.client = None
        else:
            self.client = None
    
    def generate_esg_scores(self, esg_input: ESGInput) -> dict:
        """Generate comprehensive ESG scores using AI"""
        
        if not self.client:
            print("Groq API key not configured, using fallback scoring")
            return self._fallback_scoring(esg_input)
        
        # Prepare detailed business context
        context = self._prepare_business_context(esg_input)
        
        prompt = f"""
You are an expert ESG analyst. Analyze the following business data and provide detailed ESG scores.

Business Context:
{context}

Provide a JSON response with the following structure:
{{
    "environmental_score": 0-100,
    "social_score": 0-100,
    "governance_score": 0-100,
    "overall_esg_score": 0-100,
    "confidence_level": "high/medium/low",
    "data_completeness": 0-100,
    "detailed_analysis": {{
        "environmental": {{
            "strengths": ["list of strengths"],
            "weaknesses": ["list of weaknesses"],
            "key_metrics": {{"metric": "value"}},
            "industry_benchmark": "comparison text"
        }},
        "social": {{
            "strengths": ["list of strengths"],
            "weaknesses": ["list of weaknesses"],
            "key_metrics": {{"metric": "value"}},
            "industry_benchmark": "comparison text"
        }},
        "governance": {{
            "strengths": ["list of strengths"],
            "weaknesses": ["list of weaknesses"],
            "key_metrics": {{"metric": "value"}},
            "industry_benchmark": "comparison text"
        }}
    }},
    "risk_assessment": {{
        "high_risks": ["list of high risks"],
        "medium_risks": ["list of medium risks"],
        "low_risks": ["list of low risks"]
    }},
    "improvement_priorities": ["top 5 priorities"],
    "estimated_costs": {{
        "low_cost": ["<$1000 improvements"],
        "medium_cost": ["$1000-$10000 improvements"],
        "high_cost": [">$10000 improvements"]
    }}
}}

Consider industry standards, company size, and regional context. Be thorough and analytical.

SCORING GUIDELINES:
- Evaluate both data provided AND practices implemented
- If good data is provided (energy usage, water usage, employee info, etc.), give appropriate scores (30-60 range)
- If practices are implemented (solar panels, waste recycling, safety training, policies, etc.), add significant points (20-40 points per category)
- If both data AND practices are provided, scores should be higher (50-80 range)
- If excellent practices across all categories, scores can reach 70-90
- Only give very low scores (0-20) if truly minimal or no data AND no practices
- Data completeness should reflect percentage of fields filled (0-100%)
- Reward positive practices: solar energy, waste management, employee benefits, governance policies, etc.

Examples:
- Business with energy data + solar panels + waste recycling = Environmental score 50-70
- Business with employee data + safety training + health insurance = Social score 50-70  
- Business with multiple governance policies = Governance score 60-80
- Business with comprehensive data AND practices = Overall score 60-85

Return ONLY valid JSON without markdown formatting.
"""
        
        try:
            print(f"Calling AI for ESG scoring with model: {settings.AI_MODEL}")
            response = self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert ESG analyst. Provide detailed, accurate ESG assessments in valid JSON format. Return ONLY valid JSON without markdown code blocks. Be generous with scores when data and practices are provided - reward businesses for their ESG efforts."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            print(f"AI response received, length: {len(content)}")
            parsed_result = self._parse_ai_response(content, esg_input)
            
            # Log the scores for debugging
            print(f"AI Scores - Environmental: {parsed_result.get('environmental_score')}, Social: {parsed_result.get('social_score')}, Governance: {parsed_result.get('governance_score')}, Overall: {parsed_result.get('overall_esg_score')}")
            
            return parsed_result
            
        except Exception as e:
            print(f"AI scoring error: {e}")
            import traceback
            print(traceback.format_exc())
            print("Falling back to rule-based scoring")
            fallback_result = self._fallback_scoring(esg_input)
            print(f"Fallback Scores - Environmental: {fallback_result.get('environmental_score')}, Social: {fallback_result.get('social_score')}, Governance: {fallback_result.get('governance_score')}, Overall: {fallback_result.get('overall_esg_score')}")
            return fallback_result
    
    def _prepare_business_context(self, esg_input: ESGInput) -> str:
        """Prepare comprehensive business context for AI analysis"""
        
        bp = esg_input.business_profile
        
        context = f"""
Business Profile:
- Name: {bp.business_name}
- Industry: {bp.industry}
- Employees: {esg_input.total_employees}
- Office Area: {bp.office_area_sqm or 'Not specified'} sqm
- Location: {bp.location or 'Not specified'}

Environmental Data:
- Electricity Usage: {esg_input.electricity_kwh or 'Not specified'} kWh/month
- Electricity Bill: ${esg_input.electricity_bill_amount or 'Not specified'}/month
- Generator Usage: {esg_input.generator_usage_liters or 'Not specified'} liters/month
- Generator Hours: {esg_input.generator_usage_hours or 'Not specified'} hours/month
- Water Source: {esg_input.water_source or 'Not specified'}
- Water Usage: {esg_input.water_usage_liters or 'Not specified'} liters/month
- Solar Installation: {'Yes' if esg_input.has_solar else 'No'}
- Solar Capacity: {esg_input.solar_capacity_kw or 'Not specified'} kW
- Waste Recycling: {'Yes' if esg_input.waste_recycling else 'No'}
- Recycling Frequency: {esg_input.waste_recycling_frequency or 'Not specified'}
- Waste Segregation: {'Yes' if esg_input.waste_segregation else 'No'}
- Energy Efficiency Measures: {esg_input.energy_efficiency_measures or 'None specified'}
- Carbon Footprint Tracking: {'Yes' if esg_input.carbon_footprint_tracking else 'No'}
- Renewable Energy %: {esg_input.renewable_energy_percentage or 'Not specified'}%
- Water Conservation: {esg_input.water_conservation_measures or 'None specified'}
- Hazardous Waste Management: {'Yes' if esg_input.hazardous_waste_management else 'No'}
- Paper Reduction: {'Yes' if esg_input.paper_reduction_initiatives else 'No'}
- Business Travel Policy: {'Yes' if esg_input.business_travel_policy else 'No'}
- Remote Work Policy: {'Yes' if esg_input.remote_work_policy else 'No'}
- Sustainable Procurement: {'Yes' if esg_input.sustainable_procurement else 'No'}
- Supplier ESG Requirements: {'Yes' if esg_input.supplier_esg_requirements else 'No'}

Social Data:
- Safety Training: {'Yes' if esg_input.safety_training_provided else 'No'}
- Training Frequency: {esg_input.safety_training_frequency or 'Not specified'}
- Employee Benefits: {esg_input.employee_benefits or 'Not specified'}
- Health Insurance: {'Yes' if esg_input.health_insurance else 'No'}
- Diversity Policy: {'Yes' if esg_input.diversity_policy else 'No'}
- Female Employee %: {esg_input.female_employees_percentage or 'Not specified'}%
- Workplace Accidents (Last Year): {esg_input.workplace_accidents_last_year or 'Not specified'}
- Mental Health Support: {'Yes' if esg_input.mental_health_support else 'No'}
- Employee Training Hours: {esg_input.employee_training_hours or 'Not specified'} hours/employee
- Employee Satisfaction Survey: {'Yes' if esg_input.employee_satisfaction_survey else 'No'}
- Flexible Work Arrangements: {'Yes' if esg_input.flexible_work_arrangements else 'No'}
- Community Engagement: {'Yes' if esg_input.community_engagement else 'No'}
- Local Hiring Preference: {'Yes' if esg_input.local_hiring_preference else 'No'}
- Charitable Contributions: {'Yes' if esg_input.charitable_contributions else 'No'}
- Customer Satisfaction Tracking: {'Yes' if esg_input.customer_satisfaction_tracking else 'No'}
- Product Safety Standards: {'Yes' if esg_input.product_safety_standards else 'No'}

Governance Data:
- Code of Conduct: {'Yes' if esg_input.code_of_conduct else 'No'}
- Anti-Corruption Policy: {'Yes' if esg_input.anti_corruption_policy else 'No'}
- Data Privacy Policy: {'Yes' if esg_input.data_privacy_policy else 'No'}
- Whistleblower Policy: {'Yes' if esg_input.whistleblower_policy else 'No'}
- Board Oversight: {'Yes' if esg_input.board_oversight else 'No'}
- Risk Management: {'Yes' if esg_input.risk_management_policy else 'No'}
- Cybersecurity Measures: {'Yes' if esg_input.cybersecurity_measures else 'No'}
- Regulatory Compliance Tracking: {'Yes' if esg_input.regulatory_compliance_tracking else 'No'}
- Sustainability Reporting: {'Yes' if esg_input.sustainability_reporting else 'No'}
- Stakeholder Engagement: {'Yes' if esg_input.stakeholder_engagement else 'No'}
- ESG Goals Set: {'Yes' if esg_input.esg_goals_set else 'No'}
- Third-party Audits: {'Yes' if esg_input.third_party_audits else 'No'}
- Public ESG Commitments: {'Yes' if esg_input.public_esg_commitments else 'No'}
- ESG-linked Executive Compensation: {'Yes' if esg_input.esg_linked_executive_compensation else 'No'}
- Sustainable Finance Products: {'Yes' if esg_input.sustainable_finance_products else 'No'}
- ESG Investment Policy: {'Yes' if esg_input.esg_investment_policy else 'No'}
"""
        return context
    
    def _parse_ai_response(self, content: str, esg_input: ESGInput) -> dict:
        """Parse AI response and extract JSON data"""
        try:
            # Try to extract JSON from response - handle both single JSON and markdown-wrapped JSON
            json_match = re.search(r'\{[\s\S]*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                # Clean up markdown code blocks if present
                json_str = re.sub(r'```json\s*', '', json_str)
                json_str = re.sub(r'```\s*$', '', json_str, flags=re.MULTILINE)
                parsed = json.loads(json_str)
                
                # Ensure all required fields are present and extract insights
                result = {
                    "environmental_score": parsed.get("environmental_score") or 50,
                    "social_score": parsed.get("social_score") or 50,
                    "governance_score": parsed.get("governance_score") or 50,
                    "overall_esg_score": parsed.get("overall_esg_score") or 50,
                    "confidence_level": parsed.get("confidence_level") or "medium",
                    "data_completeness": parsed.get("data_completeness") or 30,
                    "detailed_analysis": parsed.get("detailed_analysis") or {},
                    "risk_assessment": parsed.get("risk_assessment") or {},
                    "improvement_priorities": parsed.get("improvement_priorities") or [],
                    "estimated_costs": parsed.get("estimated_costs") or {},
                    "insights": parsed.get("detailed_analysis") or {},
                    "strengths": self._extract_strengths(parsed),
                    "weaknesses": self._extract_weaknesses(parsed)
                }
                return result
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            print(f"Content: {content[:500]}")
        
        # If parsing fails, validate scores and fall back if needed
        # Check if parsed data exists and is valid, otherwise use fallback
        try:
            # Try one more time with simpler regex
            # Remove markdown if present
            content_clean = content.replace('```json', '').replace('```', '').strip()
            parsed = json.loads(content_clean)
            
            # Validate scores - if they seem too high for no data, use fallback
            env_score = float(parsed.get("environmental_score") or 0)
            social_score = float(parsed.get("social_score") or 0)
            gov_score = float(parsed.get("governance_score") or 0)
            
            # If scores are suspiciously high (>20) but no meaningful data provided, use fallback
            has_data = (
                esg_input.electricity_kwh or esg_input.has_solar or esg_input.waste_recycling or
                esg_input.safety_training_provided or esg_input.health_insurance or
                esg_input.code_of_conduct or esg_input.anti_corruption_policy
            )
            
            if not has_data and (env_score > 20 or social_score > 20 or gov_score > 20):
                print("AI returned suspiciously high scores for empty data, using fallback")
                return self._fallback_scoring(esg_input)
            
            # Return parsed data if valid
            result = {
                "environmental_score": env_score,
                "social_score": social_score,
                "governance_score": gov_score,
                "overall_esg_score": float(parsed.get("overall_esg_score", 0)),
                "confidence_level": parsed.get("confidence_level", "low"),
                "data_completeness": float(parsed.get("data_completeness", 0)),
                "detailed_analysis": parsed.get("detailed_analysis", {}),
                "risk_assessment": parsed.get("risk_assessment", {}),
                "improvement_priorities": parsed.get("improvement_priorities", []),
                "estimated_costs": parsed.get("estimated_costs", {}),
                "insights": parsed.get("detailed_analysis", {}),
                "strengths": self._extract_strengths(parsed),
                "weaknesses": self._extract_weaknesses(parsed)
            }
            return result
        except:
            pass
        
        # Fallback parsing - use fallback scoring which checks actual data
        return self._fallback_scoring(esg_input)
    
    def _extract_strengths(self, parsed_data: dict) -> list:
        """Extract strengths from parsed AI response"""
        strengths = []
        detailed_analysis = parsed_data.get("detailed_analysis") or {}
        
        for category in ["environmental", "social", "governance"]:
            category_data = detailed_analysis.get(category) or {}
            category_strengths = category_data.get("strengths") or []
            if isinstance(category_strengths, list):
                strengths.extend([f"{category.title()}: {s}" for s in category_strengths])
        
        return strengths[:10]  # Limit to top 10
    
    def _extract_weaknesses(self, parsed_data: dict) -> list:
        """Extract weaknesses from parsed AI response"""
        weaknesses = []
        detailed_analysis = parsed_data.get("detailed_analysis") or {}
        
        for category in ["environmental", "social", "governance"]:
            category_data = detailed_analysis.get(category) or {}
            category_weaknesses = category_data.get("weaknesses") or []
            if isinstance(category_weaknesses, list):
                weaknesses.extend([f"{category.title()}: {w}" for w in category_weaknesses])
        
        return weaknesses[:10]  # Limit to top 10
    
    def _fallback_scoring(self, esg_input: ESGInput) -> dict:
        """Fallback scoring if AI fails - calculates scores based on actual data provided"""
        # Count how much data is provided
        data_points = 0
        max_data_points = 0
        
        # Environmental data
        env_data = 0
        env_max = 12
        if esg_input.electricity_kwh is not None: env_data += 1
        if esg_input.electricity_bill_amount is not None: env_data += 1
        if esg_input.generator_usage_liters is not None: env_data += 1
        if esg_input.generator_usage_hours is not None: env_data += 1
        if esg_input.has_solar: env_data += 1
        if esg_input.solar_capacity_kw is not None: env_data += 1
        if esg_input.water_usage_liters is not None: env_data += 1
        if esg_input.waste_recycling: env_data += 1
        if esg_input.waste_segregation: env_data += 1
        if esg_input.carbon_footprint_tracking: env_data += 1
        if esg_input.renewable_energy_percentage is not None: env_data += 1
        if esg_input.hazardous_waste_management: env_data += 1
        
        # Social data
        social_data = 0
        social_max = 10
        if esg_input.safety_training_provided: social_data += 1
        if esg_input.safety_training_frequency: social_data += 1
        if esg_input.health_insurance: social_data += 1
        if esg_input.diversity_policy: social_data += 1
        if esg_input.female_employees_percentage is not None: social_data += 1
        if esg_input.workplace_accidents_last_year is not None: social_data += 1
        if esg_input.mental_health_support: social_data += 1
        if esg_input.employee_training_hours is not None: social_data += 1
        if esg_input.employee_satisfaction_survey: social_data += 1
        if esg_input.flexible_work_arrangements: social_data += 1
        
        # Governance data
        gov_data = 0
        gov_max = 13
        if esg_input.code_of_conduct: gov_data += 1
        if esg_input.anti_corruption_policy: gov_data += 1
        if esg_input.data_privacy_policy: gov_data += 1
        if esg_input.whistleblower_policy: gov_data += 1
        if esg_input.board_oversight: gov_data += 1
        if esg_input.risk_management_policy: gov_data += 1
        if esg_input.cybersecurity_measures: gov_data += 1
        if esg_input.regulatory_compliance_tracking: gov_data += 1
        if esg_input.sustainability_reporting: gov_data += 1
        if esg_input.stakeholder_engagement: gov_data += 1
        if esg_input.esg_goals_set: gov_data += 1
        if esg_input.third_party_audits: gov_data += 1
        if esg_input.public_esg_commitments: gov_data += 1
        
        # Calculate scores based on data completeness AND practices
        # Reward both data provision and actual ESG practices
        env_score = 0.0
        
        # Base score from data completeness (max 40 points)
        if env_data > 0:
            env_score = min((env_data / env_max) * 40, 40)
        
        # Additional points for positive practices (max 60 points)
        positive_practices = sum([
            esg_input.has_solar,
            esg_input.waste_recycling,
            esg_input.waste_segregation,
            esg_input.carbon_footprint_tracking,
            esg_input.hazardous_waste_management,
            esg_input.paper_reduction_initiatives,
            esg_input.business_travel_policy,
            esg_input.remote_work_policy,
            esg_input.sustainable_procurement
        ])
        env_score += min(positive_practices * 6.67, 60)  # Max 60 points for practices
        
        # Bonus for renewable energy percentage if provided
        if esg_input.renewable_energy_percentage and esg_input.renewable_energy_percentage > 0:
            env_score += min(esg_input.renewable_energy_percentage * 0.2, 10)  # Up to 10 bonus points
        
        # Ensure score doesn't exceed 100
        env_score = min(env_score, 100)
        
        social_score = 0.0
        
        # Base score from data completeness (max 40 points)
        if social_data > 0:
            social_score = min((social_data / social_max) * 40, 40)
        elif esg_input.total_employees and esg_input.total_employees > 0:
            # Minimal score for just providing employee count
            social_score = 5.0
        
        # Additional points for positive practices (max 60 points)
        positive_practices = sum([
            esg_input.safety_training_provided,
            esg_input.health_insurance,
            esg_input.diversity_policy,
            esg_input.mental_health_support,
            esg_input.employee_satisfaction_survey,
            esg_input.flexible_work_arrangements,
            esg_input.community_engagement,
            esg_input.local_hiring_preference,
            esg_input.charitable_contributions
        ])
        social_score += min(positive_practices * 6.67, 60)  # Max 60 points for practices
        
        # Bonus for training hours if provided
        if esg_input.employee_training_hours and esg_input.employee_training_hours > 0:
            social_score += min(esg_input.employee_training_hours * 0.5, 10)  # Up to 10 bonus points
        
        # Bonus for good female employee percentage (diversity)
        if esg_input.female_employees_percentage and esg_input.female_employees_percentage >= 30:
            social_score += 5  # Bonus for diversity
        
        # Ensure score doesn't exceed 100
        social_score = min(social_score, 100)
        
        gov_score = 0.0
        
        # Base score from data completeness (max 30 points)
        if gov_data > 0:
            gov_score = min((gov_data / gov_max) * 30, 30)
        
        # Additional points for core policies (max 50 points)
        core_policies = sum([
            esg_input.code_of_conduct,
            esg_input.anti_corruption_policy,
            esg_input.data_privacy_policy,
            esg_input.whistleblower_policy,
            esg_input.board_oversight,
            esg_input.risk_management_policy
        ])
        gov_score += min(core_policies * 8.33, 50)  # Max 50 points for core policies
        
        # Additional points for advanced governance (max 20 points)
        advanced_governance = sum([
            esg_input.cybersecurity_measures,
            esg_input.regulatory_compliance_tracking,
            esg_input.sustainability_reporting,
            esg_input.stakeholder_engagement,
            esg_input.esg_goals_set,
            esg_input.third_party_audits,
            esg_input.public_esg_commitments
        ])
        gov_score += min(advanced_governance * 2.86, 20)  # Max 20 points for advanced governance
        
        # Ensure score doesn't exceed 100
        gov_score = min(gov_score, 100)
        
        # Calculate data completeness
        total_data = env_data + social_data + gov_data
        total_max = env_max + social_max + gov_max
        data_completeness = (total_data / total_max * 100) if total_max > 0 else 0
        
        # Calculate overall score (weighted average, but ensure minimum if data provided)
        if total_data == 0 and (not esg_input.total_employees or esg_input.total_employees == 0):
            # No data at all - return 0 scores
            overall_score = 0.0
            env_score = 0.0
            social_score = 0.0
            gov_score = 0.0
            data_completeness = 0.0
        else:
            # Calculate average, but ensure minimum scores if data is provided
            overall_score = (env_score + social_score + gov_score) / 3
            
            # If data is provided but scores are still very low, boost them slightly
            # This ensures that providing data gets recognized
            if total_data > 0 and overall_score < 20:
                # Minimum score boost for providing data
                overall_score = max(overall_score, 15.0)
                # Adjust individual scores proportionally
                if env_score < 15 and env_data > 0:
                    env_score = max(env_score, 15.0)
                if social_score < 15 and (social_data > 0 or esg_input.total_employees):
                    social_score = max(social_score, 15.0)
                if gov_score < 15 and gov_data > 0:
                    gov_score = max(gov_score, 15.0)
                # Recalculate overall
                overall_score = (env_score + social_score + gov_score) / 3
        
        return {
            "environmental_score": round(env_score, 2),
            "social_score": round(social_score, 2),
            "governance_score": round(gov_score, 2),
            "overall_esg_score": round(overall_score, 2),
            "confidence_level": "low" if data_completeness < 30 else "medium" if data_completeness < 70 else "high",
            "data_completeness": round(data_completeness, 2),
            "detailed_analysis": {
                "environmental": {
                    "strengths": ["Waste segregation"] if esg_input.waste_segregation else [],
                    "weaknesses": ["Limited environmental data provided"] if env_data < 5 else [],
                    "key_metrics": {},
                    "industry_benchmark": "Insufficient data for comparison"
                },
                "social": {
                    "strengths": ["Employee benefits"] if esg_input.health_insurance else [],
                    "weaknesses": ["Limited social data provided"] if social_data < 5 else [],
                    "key_metrics": {},
                    "industry_benchmark": "Insufficient data for comparison"
                },
                "governance": {
                    "strengths": ["Governance policies"] if gov_data > 5 else [],
                    "weaknesses": ["Limited governance data provided"] if gov_data < 5 else [],
                    "key_metrics": {},
                    "industry_benchmark": "Insufficient data for comparison"
                }
            },
            "risk_assessment": {
                "high_risks": ["Insufficient data for comprehensive assessment"] if data_completeness < 20 else [],
                "medium_risks": [],
                "low_risks": []
            },
            "improvement_priorities": [],
            "estimated_costs": {"low_cost": [], "medium_cost": [], "high_cost": []},
            "insights": {},
            "strengths": [],
            "weaknesses": []
        }
    
    def generate_timeframe_roadmap(self, snapshot: ESGSnapshot, timeframe: int) -> dict:
        """Generate roadmap for specific timeframe (30/60/90 days)"""
        
        if not self.client:
            print("Groq API key not configured, using fallback roadmap")
            return self._fallback_timeframe_roadmap(timeframe)
        
        context = f"""
Business: {snapshot.business_profile.business_name}
Industry: {snapshot.business_profile.industry}
Employees: {snapshot.esg_input.total_employees}

Current ESG Scores:
- Environmental: {snapshot.environmental_score}/100
- Social: {snapshot.social_score}/100
- Governance: {snapshot.governance_score}/100
- Overall: {snapshot.overall_esg_score}/100
"""
        
        if timeframe == 30:
            prompt = f"""
Create a focused 30-day ESG improvement plan:

{context}

Provide JSON response with detailed actions:
{{
    "30_day_plan": {{
        "title": "Quick Wins",
        "cost_estimate": "$X - $Y",
        "actions": [
            {{
                "action": "Action name",
                "description": "Detailed description of what needs to be done, why it's important, and expected outcomes",
                "responsible": "Role responsible for implementation",
                "cost": "$X",
                "impact": "high/medium/low",
                "category": "E/S/G"
            }}
        ]
    }}
}}

Each action MUST include a detailed description (at least 50 words). Return ONLY valid JSON without markdown formatting.
"""
        elif timeframe == 60:
            prompt = f"""
Create a comprehensive 60-day ESG improvement plan:

{context}

Provide JSON response with detailed actions:
{{
    "30_day_plan": {{
        "title": "Quick Wins",
        "cost_estimate": "$X - $Y",
        "actions": [
            {{
                "action": "Action name",
                "description": "Detailed description of what needs to be done, why it's important, and expected outcomes",
                "responsible": "Role responsible",
                "cost": "$X",
                "impact": "high/medium/low",
                "category": "E/S/G"
            }}
        ]
    }},
    "60_day_plan": {{
        "title": "Process Improvements",
        "cost_estimate": "$X - $Y",
        "actions": [
            {{
                "action": "Action name",
                "description": "Detailed description of what needs to be done, why it's important, and expected outcomes",
                "responsible": "Role responsible",
                "cost": "$X",
                "impact": "high/medium/low",
                "category": "E/S/G"
            }}
        ]
    }}
}}

Each action MUST include a detailed description (at least 50 words). Return ONLY valid JSON without markdown formatting.
"""
        else:  # 90 days
            prompt = f"""
Create a complete 90-day ESG transformation plan:

{context}

Provide JSON response with detailed actions:
{{
    "30_day_plan": {{
        "title": "Quick Wins",
        "cost_estimate": "$X - $Y",
        "actions": [
            {{
                "action": "Action name",
                "description": "Detailed description of what needs to be done, why it's important, and expected outcomes",
                "responsible": "Role responsible",
                "cost": "$X",
                "impact": "high/medium/low",
                "category": "E/S/G"
            }}
        ]
    }},
    "60_day_plan": {{
        "title": "Process Improvements",
        "cost_estimate": "$X - $Y",
        "actions": [
            {{
                "action": "Action name",
                "description": "Detailed description of what needs to be done, why it's important, and expected outcomes",
                "responsible": "Role responsible",
                "cost": "$X",
                "impact": "high/medium/low",
                "category": "E/S/G"
            }}
        ]
    }},
    "90_day_plan": {{
        "title": "Structural Changes",
        "cost_estimate": "$X - $Y",
        "actions": [
            {{
                "action": "Action name",
                "description": "Detailed description of what needs to be done, why it's important, and expected outcomes",
                "responsible": "Role responsible",
                "cost": "$X",
                "impact": "high/medium/low",
                "category": "E/S/G"
            }}
        ]
    }}
}}

Each action MUST include a detailed description (at least 50 words). Return ONLY valid JSON without markdown formatting.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an ESG implementation expert. Create practical, cost-effective roadmaps."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"Timeframe roadmap generation error: {e}")
        
        return self._fallback_timeframe_roadmap(timeframe)
    
    def calculate_esg_scores(self, esg_input: ESGInput) -> dict:
        """Main method to calculate ESG scores using AI"""
        return self.generate_esg_scores(esg_input)
    
    def _fallback_timeframe_roadmap(self, timeframe: int) -> dict:
        """Fallback roadmap for specific timeframe if AI fails"""
        base_roadmap = {
            "30_day_plan": {
                "title": "Quick Wins",
                "cost_estimate": "$100 - $500",
                "actions": [
                    {
                        "action": "Energy Audit",
                        "description": "Conduct a comprehensive energy assessment to identify areas of high consumption and potential savings. This will help establish baseline metrics and identify quick wins like replacing inefficient lighting, optimizing HVAC usage, and reducing phantom power consumption. Expected outcomes include reduced electricity bills and lower carbon footprint.",
                        "responsible": "Facilities Manager",
                        "cost": "$200",
                        "impact": "medium",
                        "category": "E"
                    },
                    {
                        "action": "Waste Segregation Setup",
                        "description": "Implement waste segregation bins and train staff on proper waste separation. This simple initiative helps improve recycling rates, reduces landfill waste, and demonstrates environmental commitment. Include bins for paper, plastic, organic waste, and hazardous materials where applicable.",
                        "responsible": "Operations Manager",
                        "cost": "$150",
                        "impact": "medium",
                        "category": "E"
                    }
                ]
            }
        }
        
        if timeframe >= 60:
            base_roadmap["60_day_plan"] = {
                "title": "Process Improvements",
                "cost_estimate": "$500 - $2000",
                "actions": [
                    {
                        "action": "Monthly Safety Training Program",
                        "description": "Establish a regular monthly safety training program covering workplace hazards, emergency procedures, and best practices. Include topics like fire safety, first aid, ergonomics, and industry-specific risks. This improves employee safety awareness, reduces accidents, and demonstrates commitment to worker welfare.",
                        "responsible": "HR Manager",
                        "cost": "$800",
                        "impact": "high",
                        "category": "S"
                    },
                    {
                        "action": "Employee Satisfaction Survey",
                        "description": "Conduct a comprehensive employee satisfaction survey to identify areas for improvement in workplace culture, benefits, and engagement. Use the results to develop targeted initiatives that improve retention, productivity, and employee well-being.",
                        "responsible": "HR Manager",
                        "cost": "$300",
                        "impact": "high",
                        "category": "S"
                    }
                ]
            }
        
        if timeframe >= 90:
            base_roadmap["90_day_plan"] = {
                "title": "Structural Changes",
                "cost_estimate": "$2000 - $10000",
                "actions": [
                    {
                        "action": "Comprehensive ESG Policy Framework",
                        "description": "Develop and implement a complete ESG policy framework including code of conduct, data privacy policy, whistleblower policy, anti-corruption policy, and risk management procedures. These formal policies strengthen governance, ensure compliance, and provide clear guidelines for employees. Include training programs to ensure understanding and adoption across the organization.",
                        "responsible": "CEO/Compliance Officer",
                        "cost": "$3000",
                        "impact": "high",
                        "category": "G"
                    },
                    {
                        "action": "Solar Panel Installation Assessment",
                        "description": "Conduct a feasibility study for solar panel installation including site assessment, cost-benefit analysis, and potential ROI. If feasible, proceed with installation planning to reduce reliance on grid electricity, lower energy costs long-term, and significantly reduce carbon footprint. Consider financing options and government incentives.",
                        "responsible": "Facilities Manager",
                        "cost": "$5000",
                        "impact": "high",
                        "category": "E"
                    }
                ]
            }
        
        return base_roadmap

    def generate_score_breakdown(self, esg_input: ESGInput, scores_data: dict) -> dict:
        """Generate detailed score breakdown"""
        return {
            'environmental_breakdown': scores_data.get('detailed_analysis', {}).get('environmental', {}),
            'social_breakdown': scores_data.get('detailed_analysis', {}).get('social', {}),
            'governance_breakdown': scores_data.get('detailed_analysis', {}).get('governance', {}),
            'risk_factors': scores_data.get('risk_assessment', {}),
            'cost_estimates': scores_data.get('estimated_costs', {})
        }