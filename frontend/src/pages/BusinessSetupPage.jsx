import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../utils/api'

export default function BusinessSetupPage() {
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    employee_count: '',
    office_area_sqm: '',
    location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingProfile, setExistingProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await api.getBusinessProfile()
      if (response.data.results && response.data.results.length > 0) {
        const profile = response.data.results[0]
        setExistingProfile(profile)
        setFormData({
          business_name: profile.business_name || '',
          industry: profile.industry || '',
          employee_count: profile.employee_count || '',
          office_area_sqm: profile.office_area_sqm || '',
          location: profile.location || '',
        })
      }
    } catch (error) {
      // No existing profile
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        ...formData,
        employee_count: parseInt(formData.employee_count),
        office_area_sqm: formData.office_area_sqm ? parseFloat(formData.office_area_sqm) : null,
      }

      if (existingProfile) {
        await api.updateBusinessProfile(existingProfile.id, data)
      } else {
        await api.createBusinessProfile(data)
      }
      navigate('/esg-form')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save business profile')
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-2 border-moss rounded-sm p-8 shadow-[8px_8px_0px_0px_#D2DCB6]">
          <h1 className="text-3xl font-black text-moss mb-2 uppercase tracking-tight">Business Setup</h1>
          <p className="text-moss/80 mb-8 font-medium">
            Tell us about your business to get started with your ESG assessment.
          </p>

          {error && (
            <div className="bg-red-50 border-2 border-red-700 text-red-700 px-4 py-3 rounded-sm mb-6 font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="business_name" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
                Business Name *
              </label>
              <input
                id="business_name"
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#A1BC98] transition-all"
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
                Industry *
              </label>
              <input
                id="industry"
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Manufacturing, Retail, Services"
                className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#A1BC98] transition-all"
              />
            </div>

            <div>
              <label htmlFor="employee_count" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
                Number of Employees *
              </label>
              <input
                id="employee_count"
                type="number"
                required
                min="1"
                value={formData.employee_count}
                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#A1BC98] transition-all"
              />
            </div>

            <div>
              <label htmlFor="office_area_sqm" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
                Office Area (square meters)
              </label>
              <input
                id="office_area_sqm"
                type="number"
                min="0"
                value={formData.office_area_sqm}
                onChange={(e) => setFormData({ ...formData, office_area_sqm: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#A1BC98] transition-all"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-bold uppercase tracking-wider text-moss mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="w-full px-4 py-2 bg-white border-2 border-moss rounded-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_#A1BC98] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-moss text-white border-2 border-moss py-3 px-4 rounded-sm hover:bg-leaf hover:text-moss hover:shadow-[4px_4px_0px_0px_#A1BC98] disabled:opacity-50 font-bold uppercase tracking-wider transition-all mt-8"
            >
              {loading ? 'Saving...' : 'Continue to ESG Assessment'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}

