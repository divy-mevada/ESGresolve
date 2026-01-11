"""
Rule-based Recommendation Engine for ESG improvements
"""
from .models import ESGSnapshot, ESGRecommendation, ESGInput


class RecommendationEngine:
    """Generates actionable ESG recommendations based on gaps"""
    
    @staticmethod
    def generate_recommendations(snapshot: ESGSnapshot) -> list[ESGRecommendation]:
        """Generate recommendations for a snapshot"""
        recommendations = []
        esg_input = snapshot.esg_input
        
        # Environmental recommendations
        recommendations.extend(RecommendationEngine._get_environmental_recommendations(snapshot, esg_input))
        
        # Social recommendations
        recommendations.extend(RecommendationEngine._get_social_recommendations(snapshot, esg_input))
        
        # Governance recommendations
        recommendations.extend(RecommendationEngine._get_governance_recommendations(snapshot, esg_input))
        
        return recommendations
    
    @staticmethod
    def _get_environmental_recommendations(snapshot: ESGSnapshot, esg_input: ESGInput) -> list[ESGRecommendation]:
        """Generate environmental recommendations"""
        recommendations = []
        
        # Energy efficiency recommendations
        if snapshot.environmental_score < 60:
            # High energy consumption
            if esg_input.electricity_kwh or esg_input.electricity_bill_amount:
                kwh = esg_input.electricity_kwh or (esg_input.electricity_bill_amount / 0.12)
                kwh_per_employee = kwh / esg_input.total_employees if esg_input.total_employees > 0 else kwh
                
                if kwh_per_employee > 300:
                    recommendations.append(ESGRecommendation(
                        snapshot=snapshot,
                        title="Implement Energy Efficiency Measures",
                        description="Your energy consumption per employee is above average. Consider LED lighting, energy-efficient appliances, and smart thermostats.",
                        category='E',
                        priority='high',
                        cost_level='medium',
                        expected_impact="Reduce energy consumption by 15-25% and lower operational costs."
                    ))
            
            # Generator usage
            if esg_input.generator_usage_liters and esg_input.generator_usage_liters > 50:
                recommendations.append(ESGRecommendation(
                    snapshot=snapshot,
                    title="Reduce Generator Dependency",
                    description="High generator usage increases emissions. Consider solar backup or grid stabilization solutions.",
                    category='E',
                    priority='medium',
                    cost_level='high',
                    expected_impact="Significantly reduce carbon footprint and fuel costs."
                ))
        
        # Solar energy
        if not esg_input.has_solar and snapshot.environmental_score < 70:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Install Solar Panels",
                description="Consider installing solar panels to reduce grid dependency and lower energy costs.",
                category='E',
                priority='medium',
                cost_level='high',
                expected_impact="Reduce electricity costs by 30-50% and improve environmental score."
            ))
        
        # Waste management
        if not esg_input.waste_recycling:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Start Recycling Program",
                description="Implement a recycling program for paper, plastic, and electronic waste.",
                category='E',
                priority='high',
                cost_level='low',
                expected_impact="Improve waste management score and reduce environmental impact."
            ))
        
        if not esg_input.waste_segregation:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Implement Waste Segregation",
                description="Set up separate bins for recyclables, organic waste, and general waste.",
                category='E',
                priority='medium',
                cost_level='low',
                expected_impact="Improve recycling efficiency and reduce landfill waste."
            ))
        
        # Water management
        if esg_input.water_source == 'borehole' and snapshot.environmental_score < 65:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Monitor Water Usage",
                description="Track water consumption and implement water-saving measures like low-flow fixtures.",
                category='E',
                priority='low',
                cost_level='low',
                expected_impact="Reduce water consumption and operational costs."
            ))
        
        return recommendations
    
    @staticmethod
    def _get_social_recommendations(snapshot: ESGSnapshot, esg_input: ESGInput) -> list[ESGRecommendation]:
        """Generate social recommendations"""
        recommendations = []
        
        # Safety training
        if not esg_input.safety_training_provided:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Implement Safety Training Program",
                description="Provide regular safety training sessions for all employees covering workplace hazards and emergency procedures.",
                category='S',
                priority='high',
                cost_level='low',
                expected_impact="Improve workplace safety, reduce accidents, and enhance employee well-being."
            ))
        elif esg_input.safety_training_frequency in ['rarely', 'annually']:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Increase Safety Training Frequency",
                description="Conduct safety training more frequently (quarterly or monthly) to keep safety practices top of mind.",
                category='S',
                priority='medium',
                cost_level='low',
                expected_impact="Maintain high safety standards and reduce workplace incidents."
            ))
        
        # Employee benefits
        if not esg_input.employee_benefits or len(esg_input.employee_benefits) < 2:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Expand Employee Benefits Package",
                description="Consider adding benefits like health insurance, retirement plans, flexible work arrangements, or professional development opportunities.",
                category='S',
                priority='medium',
                cost_level='medium',
                expected_impact="Improve employee satisfaction, retention, and attract top talent."
            ))
        
        # Health insurance
        if not esg_input.health_insurance:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Provide Health Insurance",
                description="Offer health insurance coverage to employees to support their well-being.",
                category='S',
                priority='high',
                cost_level='medium',
                expected_impact="Significantly improve employee satisfaction and social score."
            ))
        
        # Diversity policy
        if not esg_input.diversity_policy:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Develop Diversity and Inclusion Policy",
                description="Create a formal diversity and inclusion policy that promotes equal opportunities for all employees.",
                category='S',
                priority='medium',
                cost_level='low',
                expected_impact="Enhance workplace culture and improve social governance."
            ))
        
        return recommendations
    
    @staticmethod
    def _get_governance_recommendations(snapshot: ESGSnapshot, esg_input: ESGInput) -> list[ESGRecommendation]:
        """Generate governance recommendations"""
        recommendations = []
        
        # Code of conduct
        if not esg_input.code_of_conduct:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Develop Code of Conduct",
                description="Create a comprehensive code of conduct that outlines expected behaviors and ethical standards for all employees.",
                category='G',
                priority='high',
                cost_level='low',
                expected_impact="Establish clear ethical guidelines and improve governance framework."
            ))
        
        # Anti-corruption policy
        if not esg_input.anti_corruption_policy:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Implement Anti-Corruption Policy",
                description="Develop and communicate an anti-corruption policy that prohibits bribery and unethical practices.",
                category='G',
                priority='high',
                cost_level='low',
                expected_impact="Strengthen ethical standards and reduce compliance risks."
            ))
        
        # Data privacy
        if not esg_input.data_privacy_policy:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Create Data Privacy Policy",
                description="Establish a data privacy policy that complies with data protection regulations and protects customer and employee information.",
                category='G',
                priority='high',
                cost_level='low',
                expected_impact="Ensure data protection compliance and build trust with stakeholders."
            ))
        
        # Whistleblower policy
        if not esg_input.whistleblower_policy:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Establish Whistleblower Policy",
                description="Create a confidential reporting mechanism for employees to report misconduct or unethical behavior.",
                category='G',
                priority='medium',
                cost_level='low',
                expected_impact="Encourage transparency and early detection of issues."
            ))
        
        # Board oversight
        if not esg_input.board_oversight:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Implement Board Oversight Structure",
                description="Establish governance oversight mechanisms, even if informal, to ensure accountability and strategic direction.",
                category='G',
                priority='medium',
                cost_level='low',
                expected_impact="Improve decision-making processes and governance structure."
            ))
        
        # Risk management
        if not esg_input.risk_management_policy:
            recommendations.append(ESGRecommendation(
                snapshot=snapshot,
                title="Develop Risk Management Policy",
                description="Create a risk management framework to identify, assess, and mitigate business risks.",
                category='G',
                priority='medium',
                cost_level='low',
                expected_impact="Improve resilience and proactive risk management."
            ))
        
        return recommendations

