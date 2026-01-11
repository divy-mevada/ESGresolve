from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class BusinessProfile(models.Model):
    """Business profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='business_profile')
    business_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100)
    employee_count = models.IntegerField(validators=[MinValueValidator(1)])
    office_area_sqm = models.FloatField(null=True, blank=True, help_text="Office area in square meters")
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name} ({self.user.username})"


class ESGInput(models.Model):
    """Comprehensive ESG inputs for realistic assessment"""
    business_profile = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name='esg_inputs')
    
    # Environmental inputs - Energy & Climate
    electricity_kwh = models.FloatField(null=True, blank=True, help_text="Monthly electricity in kWh")
    electricity_bill_amount = models.FloatField(null=True, blank=True, help_text="Monthly electricity bill amount")
    generator_usage_liters = models.FloatField(null=True, blank=True, help_text="Monthly generator fuel in liters")
    generator_usage_hours = models.FloatField(null=True, blank=True, help_text="Monthly generator usage hours")
    has_solar = models.BooleanField(default=False)
    solar_capacity_kw = models.FloatField(null=True, blank=True)
    energy_efficiency_measures = models.JSONField(default=list, help_text="LED lights, efficient AC, etc.")
    carbon_footprint_tracking = models.BooleanField(default=False)
    renewable_energy_percentage = models.FloatField(null=True, blank=True, help_text="% of renewable energy")
    
    # Environmental - Water & Waste
    water_source = models.CharField(max_length=50, choices=[
        ('municipal', 'Municipal'),
        ('borehole', 'Borehole/Well'),
        ('both', 'Both'),
        ('rainwater', 'Rainwater Harvesting'),
        ('other', 'Other')
    ], default='municipal')
    water_usage_liters = models.FloatField(null=True, blank=True)
    water_conservation_measures = models.JSONField(default=list, help_text="Water-saving devices, recycling")
    waste_recycling = models.BooleanField(default=False)
    waste_recycling_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('rarely', 'Rarely'),
    ], null=True, blank=True)
    waste_segregation = models.BooleanField(default=False)
    hazardous_waste_management = models.BooleanField(default=False)
    paper_reduction_initiatives = models.BooleanField(default=False)
    
    # Environmental - Transportation & Supply Chain
    business_travel_policy = models.BooleanField(default=False)
    remote_work_policy = models.BooleanField(default=False)
    sustainable_procurement = models.BooleanField(default=False)
    supplier_esg_requirements = models.BooleanField(default=False)
    
    # Social inputs - Employees
    total_employees = models.IntegerField(validators=[MinValueValidator(1)])
    female_employees_percentage = models.FloatField(null=True, blank=True, help_text="% of female employees")
    safety_training_provided = models.BooleanField(default=False)
    safety_training_frequency = models.CharField(max_length=20, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
        ('rarely', 'Rarely'),
    ], null=True, blank=True)
    workplace_accidents_last_year = models.IntegerField(null=True, blank=True)
    employee_benefits = models.JSONField(default=list, help_text="List of benefits provided")
    diversity_policy = models.BooleanField(default=False)
    health_insurance = models.BooleanField(default=False)
    mental_health_support = models.BooleanField(default=False)
    employee_training_hours = models.FloatField(null=True, blank=True, help_text="Average training hours per employee")
    employee_satisfaction_survey = models.BooleanField(default=False)
    flexible_work_arrangements = models.BooleanField(default=False)
    
    # Social - Community & Stakeholders
    community_engagement = models.BooleanField(default=False)
    local_hiring_preference = models.BooleanField(default=False)
    charitable_contributions = models.BooleanField(default=False)
    customer_satisfaction_tracking = models.BooleanField(default=False)
    product_safety_standards = models.BooleanField(default=False)
    
    # Governance inputs - Structure & Policies
    code_of_conduct = models.BooleanField(default=False)
    anti_corruption_policy = models.BooleanField(default=False)
    data_privacy_policy = models.BooleanField(default=False)
    whistleblower_policy = models.BooleanField(default=False)
    board_oversight = models.BooleanField(default=False)
    risk_management_policy = models.BooleanField(default=False)
    cybersecurity_measures = models.BooleanField(default=False)
    regulatory_compliance_tracking = models.BooleanField(default=False)
    
    # Governance - Transparency & Reporting
    sustainability_reporting = models.BooleanField(default=False)
    stakeholder_engagement = models.BooleanField(default=False)
    esg_goals_set = models.BooleanField(default=False)
    third_party_audits = models.BooleanField(default=False)
    public_esg_commitments = models.BooleanField(default=False)
    
    # Financial ESG Integration
    esg_linked_executive_compensation = models.BooleanField(default=False)
    sustainable_finance_products = models.BooleanField(default=False)
    esg_investment_policy = models.BooleanField(default=False)
    
    # Additional ESG Reporting Fields
    annual_revenue = models.FloatField(null=True, blank=True, help_text="Annual revenue in USD")
    esg_budget_percentage = models.FloatField(null=True, blank=True, help_text="% of revenue allocated to ESG")
    scope1_emissions = models.FloatField(null=True, blank=True, help_text="Direct emissions (tons CO2)")
    scope2_emissions = models.FloatField(null=True, blank=True, help_text="Indirect emissions (tons CO2)")
    scope3_emissions = models.FloatField(null=True, blank=True, help_text="Value chain emissions (tons CO2)")
    water_intensity = models.FloatField(null=True, blank=True, help_text="Water usage per revenue (L/USD)")
    waste_generated_tons = models.FloatField(null=True, blank=True, help_text="Total waste generated (tons/year)")
    waste_recycled_percentage = models.FloatField(null=True, blank=True, help_text="% of waste recycled")
    employee_turnover_rate = models.FloatField(null=True, blank=True, help_text="Annual employee turnover %")
    board_diversity_percentage = models.FloatField(null=True, blank=True, help_text="% diverse board members")
    supplier_esg_assessment = models.BooleanField(default=False)
    esg_materiality_assessment = models.BooleanField(default=False)
    stakeholder_engagement_frequency = models.CharField(max_length=20, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
        ('never', 'Never')
    ], null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ESG Input for {self.business_profile.business_name} - {self.created_at.date()}"


class ESGSnapshot(models.Model):
    """ESG assessment snapshot - never overwrites old data"""
    business_profile = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name='esg_snapshots')
    esg_input = models.OneToOneField(ESGInput, on_delete=models.CASCADE, related_name='snapshot')
    
    # Overall scores (0-100)
    environmental_score = models.FloatField(validators=[MinValueValidator(0)])
    social_score = models.FloatField(validators=[MinValueValidator(0)])
    governance_score = models.FloatField(validators=[MinValueValidator(0)])
    overall_esg_score = models.FloatField(validators=[MinValueValidator(0)])
    
    # Confidence level
    CONFIDENCE_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    confidence_level = models.CharField(max_length=10, choices=CONFIDENCE_CHOICES, default='medium')
    
    # Metadata
    data_completeness = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)], 
                                         help_text="Percentage of data completeness")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ESG Snapshot {self.id} - {self.business_profile.business_name} ({self.overall_esg_score:.1f})"


class ESGScore(models.Model):
    """Detailed breakdown of ESG scores (optional)"""
    snapshot = models.ForeignKey(ESGSnapshot, on_delete=models.CASCADE, related_name='score_breakdown')
    category = models.CharField(max_length=50)  # e.g., "energy_efficiency", "waste_management"
    score = models.FloatField(validators=[MinValueValidator(0)])
    max_score = models.FloatField(validators=[MinValueValidator(0)])
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.category}: {self.score}/{self.max_score}"


class ESGRecommendation(models.Model):
    """Recommendations generated for a snapshot"""
    snapshot = models.ForeignKey(ESGSnapshot, on_delete=models.CASCADE, related_name='recommendations')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=1, choices=[
        ('E', 'Environmental'),
        ('S', 'Social'),
        ('G', 'Governance'),
    ])
    priority = models.CharField(max_length=10, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ])
    cost_level = models.CharField(max_length=10, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ])
    expected_impact = models.TextField(help_text="Expected ESG impact description")
    
    # New fields for opportunities enhancement
    esg_impact_points = models.CharField(max_length=50, default="+2 to +4 ESG points", help_text="Expected ESG score improvement")
    business_benefit = models.TextField(default="Improved ESG performance", help_text="Business benefits like cost savings, risk reduction")
    why_matters = models.TextField(default="", blank=True, help_text="Why this matters for this specific business")
    risk_reduction = models.CharField(max_length=20, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], default='medium', help_text="Risk reduction level")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['priority', 'category']

    def __str__(self):
        return f"{self.category} - {self.title}"


class ESGRoadmap(models.Model):
    """90-day ESG action roadmap"""
    snapshot = models.ForeignKey(ESGSnapshot, on_delete=models.CASCADE, related_name='roadmaps')
    
    phase = models.IntegerField(choices=[
        (1, 'Phase 1 (0-30 days)'),
        (2, 'Phase 2 (31-60 days)'),
        (3, 'Phase 3 (61-90 days)'),
    ])
    action_title = models.CharField(max_length=255)
    description = models.TextField()
    responsible_role = models.CharField(max_length=100)
    effort_level = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ])
    esg_category = models.CharField(max_length=1, choices=[
        ('E', 'Environmental'),
        ('S', 'Social'),
        ('G', 'Governance'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['phase', 'id']

    def __str__(self):
        return f"Phase {self.phase} - {self.action_title}"


class ChatSession(models.Model):
    """Chat sessions for ESG chatbot"""
    snapshot = models.ForeignKey(ESGSnapshot, on_delete=models.CASCADE, related_name='chat_sessions')
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat Session {self.session_id}"


class ChatMessage(models.Model):
    """Individual chat messages"""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."

