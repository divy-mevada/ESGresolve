import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../utils/api'

export default function ESGFormPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Environmental
    electricity_kwh: '',
    electricity_bill_amount: '',
    generator_usage_liters: '',
    generator_usage_hours: '',
    has_solar: false,
    solar_capacity_kw: '',
    water_source: 'municipal',
    water_usage_liters: '',
    waste_recycling: false,
    waste_recycling_frequency: '',
    waste_segregation: false,
    carbon_footprint_tracking: false,
    renewable_energy_percentage: '',
    hazardous_waste_management: false,
    paper_reduction_initiatives: false,
    business_travel_policy: false,
    remote_work_policy: false,
    sustainable_procurement: false,
    supplier_esg_requirements: false,
    // Social
    total_employees: '',
    female_employees_percentage: '',
    safety_training_provided: false,
    safety_training_frequency: '',
    workplace_accidents_last_year: '',
    employee_benefits: [],
    diversity_policy: false,
    health_insurance: false,
    mental_health_support: false,
    employee_training_hours: '',
    employee_satisfaction_survey: false,
    flexible_work_arrangements: false,
    community_engagement: false,
    local_hiring_preference: false,
    charitable_contributions: false,
    customer_satisfaction_tracking: false,
    product_safety_standards: false,
    // Governance
    code_of_conduct: false,
    anti_corruption_policy: false,
    data_privacy_policy: false,
    whistleblower_policy: false,
    board_oversight: false,
    risk_management_policy: false,
    cybersecurity_measures: false,
    regulatory_compliance_tracking: false,
    sustainability_reporting: false,
    stakeholder_engagement: false,
    esg_goals_set: false,
    third_party_audits: false,
    public_esg_commitments: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadBusinessProfile()
  }, [])

  const loadBusinessProfile = async () => {
    try {
      const response = await api.getBusinessProfile()
      if (response.data.results && response.data.results.length > 0) {
        const profile = response.data.results[0]
        setFormData(prev => ({ ...prev, total_employees: profile.employee_count }))
      }
    } catch (error) {
      console.error('Failed to load business profile')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only allow submission on step 3
    if (step !== 3) {
      return
    }
    
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      const errors = []
      
      // Total employees is required
      const totalEmployees = parseInt(formData.total_employees)
      if (!totalEmployees || totalEmployees < 1) {
        errors.push('Total number of employees is required (minimum 1)')
      }
      
      // Environmental required fields
      if (formData.electricity_kwh === '' || formData.electricity_kwh === null) {
        errors.push('Monthly Electricity (kWh) is required (enter 0 if not applicable)')
      } else if (parseFloat(formData.electricity_kwh) < 0) {
        errors.push('Monthly Electricity (kWh) cannot be negative')
      }
      if (formData.electricity_bill_amount === '' || formData.electricity_bill_amount === null) {
        errors.push('Monthly Electricity Bill Amount is required (enter 0 if not applicable)')
      } else if (parseFloat(formData.electricity_bill_amount) < 0) {
        errors.push('Monthly Electricity Bill Amount cannot be negative')
      }
      if (formData.generator_usage_liters === '' || formData.generator_usage_liters === null) {
        errors.push('Generator Fuel Usage is required (enter 0 if not applicable)')
      } else if (parseFloat(formData.generator_usage_liters) < 0) {
        errors.push('Generator Fuel Usage cannot be negative')
      }
      if (formData.generator_usage_hours === '' || formData.generator_usage_hours === null) {
        errors.push('Generator Usage (hours/month) is required (enter 0 if not applicable)')
      } else if (parseFloat(formData.generator_usage_hours) < 0) {
        errors.push('Generator Usage (hours/month) cannot be negative')
      }
      if (!formData.water_source) {
        errors.push('Water Source is required')
      }
      if (formData.water_usage_liters === '' || formData.water_usage_liters === null) {
        errors.push('Water Usage (liters/month) is required (enter 0 if not applicable)')
      } else if (parseFloat(formData.water_usage_liters) < 0) {
        errors.push('Water Usage (liters/month) cannot be negative')
      }
      
      // Social required fields
      if (formData.female_employees_percentage === '' || formData.female_employees_percentage === null) {
        errors.push('Female Employees Percentage is required')
      } else {
        const femalePercent = parseFloat(formData.female_employees_percentage)
        if (femalePercent < 0 || femalePercent > 100) {
          errors.push('Female Employees Percentage must be between 0 and 100')
        }
      }
      if (formData.workplace_accidents_last_year === '' || formData.workplace_accidents_last_year === null) {
        errors.push('Workplace Accidents (Last Year) is required (enter 0 if none)')
      } else {
        const accidents = parseInt(formData.workplace_accidents_last_year)
        if (accidents < 0) {
          errors.push('Workplace Accidents cannot be negative')
        }
      }
      
      // Governance required - at least one core policy
      const corePolicies = [
        formData.code_of_conduct,
        formData.anti_corruption_policy,
        formData.data_privacy_policy,
        formData.whistleblower_policy,
        formData.board_oversight,
        formData.risk_management_policy
      ]
      if (!corePolicies.some(policy => policy === true)) {
        errors.push('At least one Core Policy must be selected')
      }
      
      if (errors.length > 0) {
        setError(errors.join('. '))
        setLoading(false)
        return
      }

      const data = {
        ...formData,
        electricity_kwh: formData.electricity_kwh ? parseFloat(formData.electricity_kwh) : null,
        electricity_bill_amount: formData.electricity_bill_amount ? parseFloat(formData.electricity_bill_amount) : null,
        generator_usage_liters: formData.generator_usage_liters ? parseFloat(formData.generator_usage_liters) : null,
        generator_usage_hours: formData.generator_usage_hours ? parseFloat(formData.generator_usage_hours) : null,
        solar_capacity_kw: formData.has_solar && formData.solar_capacity_kw ? parseFloat(formData.solar_capacity_kw) : null,
        water_usage_liters: formData.water_usage_liters ? parseFloat(formData.water_usage_liters) : null,
        renewable_energy_percentage: formData.renewable_energy_percentage ? parseFloat(formData.renewable_energy_percentage) : null,
        total_employees: totalEmployees,
        female_employees_percentage: formData.female_employees_percentage ? parseFloat(formData.female_employees_percentage) : null,
        workplace_accidents_last_year: formData.workplace_accidents_last_year ? parseInt(formData.workplace_accidents_last_year) : null,
        employee_training_hours: formData.employee_training_hours ? parseFloat(formData.employee_training_hours) : null,
        waste_recycling_frequency: formData.waste_recycling ? formData.waste_recycling_frequency : null,
        safety_training_frequency: formData.safety_training_provided ? formData.safety_training_frequency : null,
        employee_benefits: Array.isArray(formData.employee_benefits) ? formData.employee_benefits : [],
        energy_efficiency_measures: [],
        water_conservation_measures: [],
      }

      const response = await api.createESGInput(data)
      const esgInputId = response.data.id
      
      // Process the ESG input
      await api.processESGInput(esgInputId)
      
      navigate('/dashboard')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to submit ESG assessment'
      setError(errorMessage)
      console.error('ESG Form Error:', error.response?.data || error)
    }
    setLoading(false)
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const progress = (step / 3) * 100

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">ESG Assessment</h1>
        <p className="text-gray-600 mb-4">
          Provide information about your business operations. Fields marked with <span className="text-red-500">*</span> are required.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Note: The more information you provide, the more accurate your ESG score will be. At minimum, please provide data in at least one category (Environmental, Social, or Governance).
        </p>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of 3
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit(e)
          }}
          onKeyDown={(e) => {
            // Prevent Enter key from auto-submitting form on step 3
            if (e.key === 'Enter') {
              const target = e.target
              const isButton = target.tagName === 'BUTTON'
              const isSubmitButton = target.type === 'submit'
              
              // Only allow submission if clicking the actual submit button
              if (!isSubmitButton) {
                const inputType = target.type || ''
                const isTextInput = target.tagName === 'INPUT' && 
                  (inputType === 'text' || inputType === 'number' || inputType === 'email' || inputType === '' || inputType === 'tel')
                const isTextarea = target.tagName === 'TEXTAREA'
                const isSelect = target.tagName === 'SELECT'
                // Exclude checkboxes, radio buttons, and buttons from Enter key handling
                const isInteractiveInput = isTextInput || isTextarea || isSelect
                
                // On step 3, prevent Enter from submitting form - user must click submit button
                if (step === 3 && isInteractiveInput && !isButton) {
                  e.preventDefault()
                  e.stopPropagation()
                  return false
                }
                
                // On steps 1 and 2, Enter can trigger Next button (only for text inputs and selects)
                if (step < 3 && isInteractiveInput && !isButton) {
                  e.preventDefault()
                  e.stopPropagation()
                  nextStep()
                  return false
                }
              }
            }
          }}
          className="bg-white shadow-md rounded-lg p-6"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Environmental</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Electricity (kWh) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formData.electricity_kwh}
                    onChange={(e) => setFormData({ ...formData, electricity_kwh: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Electricity Bill Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formData.electricity_bill_amount}
                    onChange={(e) => setFormData({ ...formData, electricity_bill_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 600"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generator Fuel Usage (liters/month) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formData.generator_usage_liters}
                    onChange={(e) => setFormData({ ...formData, generator_usage_liters: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0 if not applicable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generator Usage (hours/month) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formData.generator_usage_hours}
                    onChange={(e) => setFormData({ ...formData, generator_usage_hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0 if not applicable"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="has_solar"
                  checked={formData.has_solar}
                  onChange={(e) => setFormData({ ...formData, has_solar: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="has_solar" className="ml-2 block text-sm text-gray-700">
                  We have solar panels
                </label>
              </div>

              {formData.has_solar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solar Capacity (kW)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.solar_capacity_kw}
                    onChange={(e) => setFormData({ ...formData, solar_capacity_kw: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Source <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.water_source}
                  onChange={(e) => setFormData({ ...formData, water_source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="municipal">Municipal</option>
                  <option value="borehole">Borehole/Well</option>
                  <option value="both">Both</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Usage (liters/month) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={formData.water_usage_liters}
                  onChange={(e) => setFormData({ ...formData, water_usage_liters: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 10000"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="waste_recycling"
                  checked={formData.waste_recycling}
                  onChange={(e) => setFormData({ ...formData, waste_recycling: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="waste_recycling" className="ml-2 block text-sm text-gray-700">
                  We recycle waste
                </label>
              </div>

              {formData.waste_recycling && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recycling Frequency
                  </label>
                  <select
                    value={formData.waste_recycling_frequency}
                    onChange={(e) => setFormData({ ...formData, waste_recycling_frequency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="rarely">Rarely</option>
                  </select>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="waste_segregation"
                  checked={formData.waste_segregation}
                  onChange={(e) => setFormData({ ...formData, waste_segregation: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="waste_segregation" className="ml-2 block text-sm text-gray-700">
                  We segregate waste
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="carbon_footprint_tracking"
                    checked={formData.carbon_footprint_tracking}
                    onChange={(e) => setFormData({ ...formData, carbon_footprint_tracking: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="carbon_footprint_tracking" className="ml-2 block text-sm text-gray-700">
                    We track carbon footprint
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hazardous_waste_management"
                    checked={formData.hazardous_waste_management}
                    onChange={(e) => setFormData({ ...formData, hazardous_waste_management: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="hazardous_waste_management" className="ml-2 block text-sm text-gray-700">
                    We manage hazardous waste properly
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Renewable Energy Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.renewable_energy_percentage}
                    onChange={(e) => setFormData({ ...formData, renewable_energy_percentage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 25"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    id="paper_reduction_initiatives"
                    checked={formData.paper_reduction_initiatives}
                    onChange={(e) => setFormData({ ...formData, paper_reduction_initiatives: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="paper_reduction_initiatives" className="ml-2 block text-sm text-gray-700">
                    We have paper reduction initiatives
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="business_travel_policy"
                    checked={formData.business_travel_policy}
                    onChange={(e) => setFormData({ ...formData, business_travel_policy: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="business_travel_policy" className="ml-2 block text-sm text-gray-700">
                    We have a sustainable business travel policy
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remote_work_policy"
                    checked={formData.remote_work_policy}
                    onChange={(e) => setFormData({ ...formData, remote_work_policy: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="remote_work_policy" className="ml-2 block text-sm text-gray-700">
                    We have a remote work policy
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sustainable_procurement"
                    checked={formData.sustainable_procurement}
                    onChange={(e) => setFormData({ ...formData, sustainable_procurement: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="sustainable_procurement" className="ml-2 block text-sm text-gray-700">
                    We practice sustainable procurement
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="supplier_esg_requirements"
                    checked={formData.supplier_esg_requirements}
                    onChange={(e) => setFormData({ ...formData, supplier_esg_requirements: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="supplier_esg_requirements" className="ml-2 block text-sm text-gray-700">
                    We require ESG compliance from suppliers
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Social</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Employees <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.total_employees}
                  onChange={(e) => setFormData({ ...formData, total_employees: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-gray-500 mt-1">Required: Minimum 1 employee</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="safety_training_provided"
                  checked={formData.safety_training_provided}
                  onChange={(e) => setFormData({ ...formData, safety_training_provided: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="safety_training_provided" className="ml-2 block text-sm text-gray-700">
                  We provide safety training
                </label>
              </div>

              {formData.safety_training_provided && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safety Training Frequency
                  </label>
                  <select
                    value={formData.safety_training_frequency}
                    onChange={(e) => setFormData({ ...formData, safety_training_frequency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select frequency</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="rarely">Rarely</option>
                  </select>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="health_insurance"
                  checked={formData.health_insurance}
                  onChange={(e) => setFormData({ ...formData, health_insurance: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="health_insurance" className="ml-2 block text-sm text-gray-700">
                  We provide health insurance
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="diversity_policy"
                  checked={formData.diversity_policy}
                  onChange={(e) => setFormData({ ...formData, diversity_policy: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="diversity_policy" className="ml-2 block text-sm text-gray-700">
                  We have a diversity and inclusion policy
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Female Employees Percentage (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0"
                    max="100"
                    value={formData.female_employees_percentage}
                    onChange={(e) => setFormData({ ...formData, female_employees_percentage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workplace Accidents (Last Year) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.workplace_accidents_last_year}
                    onChange={(e) => setFormData({ ...formData, workplace_accidents_last_year: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 0"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Training Hours (per employee/month)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.employee_training_hours}
                    onChange={(e) => setFormData({ ...formData, employee_training_hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 40"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    id="mental_health_support"
                    checked={formData.mental_health_support}
                    onChange={(e) => setFormData({ ...formData, mental_health_support: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="mental_health_support" className="ml-2 block text-sm text-gray-700">
                    We provide mental health support
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="employee_satisfaction_survey"
                    checked={formData.employee_satisfaction_survey}
                    onChange={(e) => setFormData({ ...formData, employee_satisfaction_survey: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="employee_satisfaction_survey" className="ml-2 block text-sm text-gray-700">
                    We conduct employee satisfaction surveys
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="flexible_work_arrangements"
                    checked={formData.flexible_work_arrangements}
                    onChange={(e) => setFormData({ ...formData, flexible_work_arrangements: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="flexible_work_arrangements" className="ml-2 block text-sm text-gray-700">
                    We offer flexible work arrangements
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="community_engagement"
                    checked={formData.community_engagement}
                    onChange={(e) => setFormData({ ...formData, community_engagement: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="community_engagement" className="ml-2 block text-sm text-gray-700">
                    We engage with the local community
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="local_hiring_preference"
                    checked={formData.local_hiring_preference}
                    onChange={(e) => setFormData({ ...formData, local_hiring_preference: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="local_hiring_preference" className="ml-2 block text-sm text-gray-700">
                    We prefer hiring locally
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="charitable_contributions"
                    checked={formData.charitable_contributions}
                    onChange={(e) => setFormData({ ...formData, charitable_contributions: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="charitable_contributions" className="ml-2 block text-sm text-gray-700">
                    We make charitable contributions
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="customer_satisfaction_tracking"
                    checked={formData.customer_satisfaction_tracking}
                    onChange={(e) => setFormData({ ...formData, customer_satisfaction_tracking: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="customer_satisfaction_tracking" className="ml-2 block text-sm text-gray-700">
                    We track customer satisfaction
                  </label>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="product_safety_standards"
                  checked={formData.product_safety_standards}
                  onChange={(e) => setFormData({ ...formData, product_safety_standards: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="product_safety_standards" className="ml-2 block text-sm text-gray-700">
                  We maintain product safety standards
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governance</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Core Policies <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-3">At least one policy must be selected</p>
                {[
                  { id: 'code_of_conduct', label: 'Code of Conduct' },
                  { id: 'anti_corruption_policy', label: 'Anti-Corruption Policy' },
                  { id: 'data_privacy_policy', label: 'Data Privacy Policy' },
                  { id: 'whistleblower_policy', label: 'Whistleblower Policy' },
                  { id: 'board_oversight', label: 'Board Oversight Structure' },
                  { id: 'risk_management_policy', label: 'Risk Management Policy' },
                ].map((policy) => (
                  <div key={policy.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={policy.id}
                      checked={formData[policy.id]}
                      onChange={(e) => setFormData({ ...formData, [policy.id]: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor={policy.id} className="ml-2 block text-sm text-gray-700">
                      {policy.label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Compliance & Security</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cybersecurity_measures"
                      checked={formData.cybersecurity_measures}
                      onChange={(e) => setFormData({ ...formData, cybersecurity_measures: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="cybersecurity_measures" className="ml-2 block text-sm text-gray-700">
                      Cybersecurity Measures
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="regulatory_compliance_tracking"
                      checked={formData.regulatory_compliance_tracking}
                      onChange={(e) => setFormData({ ...formData, regulatory_compliance_tracking: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="regulatory_compliance_tracking" className="ml-2 block text-sm text-gray-700">
                      Regulatory Compliance Tracking
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Transparency & Reporting</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sustainability_reporting"
                      checked={formData.sustainability_reporting}
                      onChange={(e) => setFormData({ ...formData, sustainability_reporting: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="sustainability_reporting" className="ml-2 block text-sm text-gray-700">
                      Sustainability Reporting
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="stakeholder_engagement"
                      checked={formData.stakeholder_engagement}
                      onChange={(e) => setFormData({ ...formData, stakeholder_engagement: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="stakeholder_engagement" className="ml-2 block text-sm text-gray-700">
                      Stakeholder Engagement
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="esg_goals_set"
                      checked={formData.esg_goals_set}
                      onChange={(e) => setFormData({ ...formData, esg_goals_set: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="esg_goals_set" className="ml-2 block text-sm text-gray-700">
                      ESG Goals Set
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="third_party_audits"
                      checked={formData.third_party_audits}
                      onChange={(e) => setFormData({ ...formData, third_party_audits: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="third_party_audits" className="ml-2 block text-sm text-gray-700">
                      Third-Party Audits
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="public_esg_commitments"
                      checked={formData.public_esg_commitments}
                      onChange={(e) => setFormData({ ...formData, public_esg_commitments: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="public_esg_commitments" className="ml-2 block text-sm text-gray-700">
                      Public ESG Commitments
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

