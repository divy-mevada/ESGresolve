"""
ESG Processing Engine - Converts SME-friendly inputs into ESG scores
"""
from .models import ESGInput, ESGSnapshot, ESGScore, ESGRecommendation


class ESGProcessor:
    """Processes ESG inputs and generates scores with confidence levels"""
    
    @staticmethod
    def calculate_environmental_score(esg_input: ESGInput) -> tuple[float, float]:
        """
        Calculate environmental score (0-100) and data completeness
        Returns: (score, completeness_percentage)
        """
        scores = []
        completeness = []
        max_scores = []
        
        # Energy efficiency (40 points)
        energy_score = ESGProcessor._calculate_energy_score(esg_input)
        scores.append(energy_score['score'])
        max_scores.append(energy_score['max_score'])
        completeness.append(energy_score['completeness'])
        
        # Water management (20 points)
        water_score = ESGProcessor._calculate_water_score(esg_input)
        scores.append(water_score['score'])
        max_scores.append(water_score['max_score'])
        completeness.append(water_score['completeness'])
        
        # Waste management (30 points)
        waste_score = ESGProcessor._calculate_waste_score(esg_input)
        scores.append(waste_score['score'])
        max_scores.append(waste_score['max_score'])
        completeness.append(waste_score['completeness'])
        
        # Renewable energy (10 points)
        renewable_score = ESGProcessor._calculate_renewable_score(esg_input)
        scores.append(renewable_score['score'])
        max_scores.append(renewable_score['max_score'])
        completeness.append(renewable_score['completeness'])
        
        total_score = sum(scores)
        total_max = sum(max_scores)
        avg_completeness = sum(completeness) / len(completeness) if completeness else 0
        
        final_score = (total_score / total_max * 100) if total_max > 0 else 0
        
        return final_score, avg_completeness
    
    @staticmethod
    def _calculate_energy_score(esg_input: ESGInput) -> dict:
        """Calculate energy efficiency score"""
        score = 0
        max_score = 40
        completeness = 0
        
        # Normalize energy consumption per employee
        if esg_input.electricity_kwh or esg_input.electricity_bill_amount:
            completeness += 50
            
            # Estimate kWh from bill if needed (average $0.12/kWh)
            if esg_input.electricity_kwh:
                kwh = esg_input.electricity_kwh
            else:
                kwh = esg_input.electricity_bill_amount / 0.12
            
            # Normalize per employee
            kwh_per_employee = kwh / esg_input.total_employees if esg_input.total_employees > 0 else kwh
            
            # Benchmark: < 200 kWh/employee/month = excellent, > 500 = poor
            if kwh_per_employee < 200:
                score += 30
            elif kwh_per_employee < 300:
                score += 20
            elif kwh_per_employee < 500:
                score += 10
            else:
                score += 5
        
        # Generator usage penalty
        if esg_input.generator_usage_liters or esg_input.generator_usage_hours:
            completeness += 30
            # High generator usage reduces score
            if esg_input.generator_usage_liters:
                liters_per_employee = esg_input.generator_usage_liters / esg_input.total_employees
                if liters_per_employee < 10:
                    score += 5
                elif liters_per_employee < 30:
                    score += 3
                else:
                    score += 1
            else:
                score += 3  # Partial credit
        
        # Office area normalization (if available)
        if esg_input.business_profile.office_area_sqm:
            completeness += 20
        
        return {'score': score, 'max_score': max_score, 'completeness': completeness}
    
    @staticmethod
    def _calculate_water_score(esg_input: ESGInput) -> dict:
        """Calculate water management score"""
        score = 0
        max_score = 20
        completeness = 0
        
        # Water source
        if esg_input.water_source:
            completeness += 50
            if esg_input.water_source == 'municipal':
                score += 8
            elif esg_input.water_source == 'borehole':
                score += 6
            elif esg_input.water_source == 'both':
                score += 5
            else:
                score += 4
        
        # Water usage tracking
        if esg_input.water_usage_liters:
            completeness += 50
            # Normalize per employee
            liters_per_employee = esg_input.water_usage_liters / esg_input.total_employees
            # Benchmark: < 5000L/employee/month = good
            if liters_per_employee < 5000:
                score += 12
            elif liters_per_employee < 10000:
                score += 8
            else:
                score += 4
        else:
            score += 6  # Partial credit for source info
        
        return {'score': score, 'max_score': max_score, 'completeness': completeness}
    
    @staticmethod
    def _calculate_waste_score(esg_input: ESGInput) -> dict:
        """Calculate waste management score"""
        score = 0
        max_score = 30
        completeness = 0
        
        # Recycling
        if esg_input.waste_recycling:
            completeness += 50
            score += 15
            if esg_input.waste_recycling_frequency:
                completeness += 30
                if esg_input.waste_recycling_frequency == 'daily':
                    score += 10
                elif esg_input.waste_recycling_frequency == 'weekly':
                    score += 7
                elif esg_input.waste_recycling_frequency == 'monthly':
                    score += 4
                else:
                    score += 2
            else:
                score += 5
        else:
            completeness += 20
        
        # Waste segregation
        if esg_input.waste_segregation:
            completeness += 20
            score += 5
        
        return {'score': score, 'max_score': max_score, 'completeness': completeness}
    
    @staticmethod
    def _calculate_renewable_score(esg_input: ESGInput) -> dict:
        """Calculate renewable energy score"""
        score = 0
        max_score = 10
        completeness = 0
        
        if esg_input.has_solar:
            completeness += 100
            score += 5
            if esg_input.solar_capacity_kw:
                # More capacity = better score
                if esg_input.solar_capacity_kw >= 10:
                    score += 5
                elif esg_input.solar_capacity_kw >= 5:
                    score += 3
                else:
                    score += 2
            else:
                score += 2
        else:
            completeness += 50
        
        return {'score': score, 'max_score': max_score, 'completeness': completeness}
    
    @staticmethod
    def calculate_social_score(esg_input: ESGInput) -> tuple[float, float]:
        """Calculate social score (0-100)"""
        score = 0
        max_score = 100
        completeness = 0
        
        # Safety training (30 points)
        if esg_input.safety_training_provided:
            completeness += 50
            score += 20
            if esg_input.safety_training_frequency:
                completeness += 50
                if esg_input.safety_training_frequency == 'monthly':
                    score += 10
                elif esg_input.safety_training_frequency == 'quarterly':
                    score += 7
                elif esg_input.safety_training_frequency == 'annually':
                    score += 5
                else:
                    score += 2
            else:
                score += 5
        else:
            completeness += 20
        
        # Employee benefits (25 points)
        if esg_input.employee_benefits:
            completeness += 50
            benefit_count = len(esg_input.employee_benefits) if isinstance(esg_input.employee_benefits, list) else 0
            score += min(benefit_count * 5, 25)
        else:
            completeness += 20
        
        # Health insurance (20 points)
        if esg_input.health_insurance:
            completeness += 50
            score += 20
        else:
            completeness += 20
        
        # Diversity policy (15 points)
        if esg_input.diversity_policy:
            completeness += 50
            score += 15
        else:
            completeness += 20
        
        # Employee count consideration (10 points)
        # Larger companies get partial credit for scale
        if esg_input.total_employees >= 50:
            score += 10
        elif esg_input.total_employees >= 20:
            score += 7
        elif esg_input.total_employees >= 10:
            score += 5
        else:
            score += 3
        
        final_score = (score / max_score * 100) if max_score > 0 else 0
        avg_completeness = completeness / 4 if completeness > 0 else 0
        
        return final_score, avg_completeness
    
    @staticmethod
    def calculate_governance_score(esg_input: ESGInput) -> tuple[float, float]:
        """Calculate governance score (0-100)"""
        score = 0
        max_score = 100
        completeness = 0
        
        policies = [
            ('code_of_conduct', 20),
            ('anti_corruption_policy', 20),
            ('data_privacy_policy', 15),
            ('whistleblower_policy', 15),
            ('board_oversight', 15),
            ('risk_management_policy', 15),
        ]
        
        for policy_field, points in policies:
            if hasattr(esg_input, policy_field) and getattr(esg_input, policy_field):
                score += points
                completeness += 100 / len(policies)
            else:
                completeness += 50 / len(policies)
        
        final_score = (score / max_score * 100) if max_score > 0 else 0
        
        return final_score, completeness
    
    @staticmethod
    def calculate_overall_score(env_score: float, social_score: float, gov_score: float, 
                                env_completeness: float, social_completeness: float, gov_completeness: float) -> tuple[float, str]:
        """
        Calculate weighted overall ESG score with confidence level
        Returns: (overall_score, confidence_level)
        """
        # Weighted average based on completeness
        total_completeness = env_completeness + social_completeness + gov_completeness
        
        if total_completeness == 0:
            return 0, 'low'
        
        # Weight scores by completeness
        weighted_env = env_score * (env_completeness / total_completeness)
        weighted_social = social_score * (social_completeness / total_completeness)
        weighted_gov = gov_score * (gov_completeness / total_completeness)
        
        # Equal weighting for E, S, G (can be adjusted)
        overall_score = (env_score * 0.4 + social_score * 0.3 + gov_score * 0.3)
        
        # Determine confidence level
        avg_completeness = total_completeness / 3
        if avg_completeness >= 70:
            confidence = 'high'
        elif avg_completeness >= 40:
            confidence = 'medium'
        else:
            confidence = 'low'
        
        return overall_score, confidence
    
    @staticmethod
    def process_esg_input(esg_input: ESGInput) -> ESGSnapshot:
        """Process ESG input and create snapshot"""
        # Calculate scores
        env_score, env_completeness = ESGProcessor.calculate_environmental_score(esg_input)
        social_score, social_completeness = ESGProcessor.calculate_social_score(esg_input)
        gov_score, gov_completeness = ESGProcessor.calculate_governance_score(esg_input)
        
        # Calculate overall score and confidence
        overall_score, confidence = ESGProcessor.calculate_overall_score(
            env_score, social_score, gov_score,
            env_completeness, social_completeness, gov_completeness
        )
        
        avg_completeness = (env_completeness + social_completeness + gov_completeness) / 3
        
        # Create snapshot
        snapshot = ESGSnapshot.objects.create(
            business_profile=esg_input.business_profile,
            esg_input=esg_input,
            environmental_score=round(env_score, 2),
            social_score=round(social_score, 2),
            governance_score=round(gov_score, 2),
            overall_esg_score=round(overall_score, 2),
            confidence_level=confidence,
            data_completeness=round(avg_completeness, 2)
        )
        
        return snapshot

