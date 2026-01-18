import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../utils/api";

export default function ESGFormPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Environmental
    electricity_kwh: "",
    electricity_bill_amount: "",
    generator_usage_liters: "",
    generator_usage_hours: "",
    has_solar: false,
    solar_capacity_kw: "",
    water_source: "municipal",
    water_usage_liters: "",
    waste_recycling: false,
    waste_recycling_frequency: "",
    waste_segregation: false,
    carbon_footprint_tracking: false,
    renewable_energy_percentage: "",
    hazardous_waste_management: false,
    paper_reduction_initiatives: false,
    business_travel_policy: false,
    remote_work_policy: false,
    sustainable_procurement: false,
    supplier_esg_requirements: false,
    // Social
    total_employees: "",
    female_employees_percentage: "",
    safety_training_provided: false,
    safety_training_frequency: "",
    workplace_accidents_last_year: "",
    employee_benefits: [],
    diversity_policy: false,
    health_insurance: false,
    mental_health_support: false,
    employee_training_hours: "",
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
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      const response = await api.getBusinessProfile();
      if (response.data.results && response.data.results.length > 0) {
        const profile = response.data.results[0];
        setFormData((prev) => ({
          ...prev,
          total_employees: profile.employee_count,
        }));
      }
    } catch (error) {
      console.error("Failed to load business profile");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow submission on step 3
    if (step !== 3) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Validate required fields
      const errors = [];

      // Total employees is required
      const totalEmployees = parseInt(formData.total_employees);
      if (!totalEmployees || totalEmployees < 1) {
        errors.push("Total number of employees is required (minimum 1)");
      }

      // Environmental required fields
      if (
        formData.electricity_kwh === "" ||
        formData.electricity_kwh === null
      ) {
        errors.push(
          "Monthly Electricity (kWh) is required (enter 0 if not applicable)"
        );
      } else if (parseFloat(formData.electricity_kwh) < 0) {
        errors.push("Monthly Electricity (kWh) cannot be negative");
      }
      if (
        formData.electricity_bill_amount === "" ||
        formData.electricity_bill_amount === null
      ) {
        errors.push(
          "Monthly Electricity Bill Amount is required (enter 0 if not applicable)"
        );
      } else if (parseFloat(formData.electricity_bill_amount) < 0) {
        errors.push("Monthly Electricity Bill Amount cannot be negative");
      }
      if (
        formData.generator_usage_liters === "" ||
        formData.generator_usage_liters === null
      ) {
        errors.push(
          "Generator Fuel Usage is required (enter 0 if not applicable)"
        );
      } else if (parseFloat(formData.generator_usage_liters) < 0) {
        errors.push("Generator Fuel Usage cannot be negative");
      }
      if (
        formData.generator_usage_hours === "" ||
        formData.generator_usage_hours === null
      ) {
        errors.push(
          "Generator Usage (hours/month) is required (enter 0 if not applicable)"
        );
      } else if (parseFloat(formData.generator_usage_hours) < 0) {
        errors.push("Generator Usage (hours/month) cannot be negative");
      }
      if (!formData.water_source) {
        errors.push("Water Source is required");
      }
      if (
        formData.water_usage_liters === "" ||
        formData.water_usage_liters === null
      ) {
        errors.push(
          "Water Usage (liters/month) is required (enter 0 if not applicable)"
        );
      } else if (parseFloat(formData.water_usage_liters) < 0) {
        errors.push("Water Usage (liters/month) cannot be negative");
      }

      // Social required fields
      if (
        formData.female_employees_percentage === "" ||
        formData.female_employees_percentage === null
      ) {
        errors.push("Female Employees Percentage is required");
      } else {
        const femalePercent = parseFloat(formData.female_employees_percentage);
        if (femalePercent < 0 || femalePercent > 100) {
          errors.push("Female Employees Percentage must be between 0 and 100");
        }
      }
      if (
        formData.workplace_accidents_last_year === "" ||
        formData.workplace_accidents_last_year === null
      ) {
        errors.push(
          "Workplace Accidents (Last Year) is required (enter 0 if none)"
        );
      } else {
        const accidents = parseInt(formData.workplace_accidents_last_year);
        if (accidents < 0) {
          errors.push("Workplace Accidents cannot be negative");
        }
      }

      // Governance required - at least one core policy
      const corePolicies = [
        formData.code_of_conduct,
        formData.anti_corruption_policy,
        formData.data_privacy_policy,
        formData.whistleblower_policy,
        formData.board_oversight,
        formData.risk_management_policy,
      ];
      if (!corePolicies.some((policy) => policy === true)) {
        errors.push("At least one Core Policy must be selected");
      }

      if (errors.length > 0) {
        setError(errors.join(". "));
        setLoading(false);
        return;
      }

      const data = {
        ...formData,
        electricity_kwh: formData.electricity_kwh
          ? parseFloat(formData.electricity_kwh)
          : null,
        electricity_bill_amount: formData.electricity_bill_amount
          ? parseFloat(formData.electricity_bill_amount)
          : null,
        generator_usage_liters: formData.generator_usage_liters
          ? parseFloat(formData.generator_usage_liters)
          : null,
        generator_usage_hours: formData.generator_usage_hours
          ? parseFloat(formData.generator_usage_hours)
          : null,
        solar_capacity_kw:
          formData.has_solar && formData.solar_capacity_kw
            ? parseFloat(formData.solar_capacity_kw)
            : null,
        water_usage_liters: formData.water_usage_liters
          ? parseFloat(formData.water_usage_liters)
          : null,
        renewable_energy_percentage: formData.renewable_energy_percentage
          ? parseFloat(formData.renewable_energy_percentage)
          : null,
        total_employees: totalEmployees,
        female_employees_percentage: formData.female_employees_percentage
          ? parseFloat(formData.female_employees_percentage)
          : null,
        workplace_accidents_last_year: formData.workplace_accidents_last_year
          ? parseInt(formData.workplace_accidents_last_year)
          : null,
        employee_training_hours: formData.employee_training_hours
          ? parseFloat(formData.employee_training_hours)
          : null,
        waste_recycling_frequency: formData.waste_recycling
          ? formData.waste_recycling_frequency
          : null,
        safety_training_frequency: formData.safety_training_provided
          ? formData.safety_training_frequency
          : null,
        employee_benefits: Array.isArray(formData.employee_benefits)
          ? formData.employee_benefits
          : [],
        energy_efficiency_measures: [],
        water_conservation_measures: [],
      };

      const response = await api.createESGInput(data);
      const esgInputId = response.data.id;

      // Process the ESG input
      await api.processESGInput(esgInputId);

      navigate("/dashboard");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to submit ESG assessment";
      setError(errorMessage);
      console.error("ESG Form Error:", error.response?.data || error);
    }
    setLoading(false);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const progress = (step / 3) * 100;

  // Style constants
  const inputClassName =
    "w-full px-4 py-3 bg-[#F1F3E0] border-2 border-black rounded-sm focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder-gray-500 font-medium";
  const labelClassName =
    "block text-sm font-bold text-black uppercase tracking-wider mb-2";
  const checkboxClassName =
    "h-5 w-5 appearance-none border-2 border-black rounded-sm bg-[#F1F3E0] checked:bg-[#778873] checked:border-black transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:top-[1px] checked:after:left-[3px]";
  const selectClassName =
    "w-full px-4 py-3 bg-[#F1F3E0] border-2 border-black rounded-sm focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-medium appearance-none";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-sm p-8 mb-8">
          <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-4">
            ESG Assessment
          </h1>
          <p className="text-lg font-medium text-[#778873] mb-6 border-l-4 border-[#A1BC98] pl-4">
            Provide information about your business operations. Fields marked
            with <span className="text-red-500">*</span> are required.
          </p>

          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-bold text-black uppercase tracking-wider">
                Step {step} of 3
              </span>
              <span className="text-sm font-bold text-black">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-[#F1F3E0] border-2 border-black rounded-full h-4 p-0.5">
              <div
                className="bg-[#778873] h-full rounded-full transition-all duration-500 ease-out border border-black"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-700 px-6 py-4 rounded-sm mb-8 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.2)]">
              <p className="font-bold flex items-center">
                <span className="text-2xl mr-2">!</span> {error}
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from auto-submitting form on step 3
              if (e.key === "Enter") {
                const target = e.target;
                const isButton = target.tagName === "BUTTON";
                const isSubmitButton = target.type === "submit";

                if (!isSubmitButton) {
                  const inputType = target.type || "";
                  const isInteractiveInput =
                    ["text", "number", "email", "tel", ""].includes(
                      inputType
                    ) ||
                    target.tagName === "TEXTAREA" ||
                    target.tagName === "SELECT";

                  if (step === 3 && isInteractiveInput && !isButton) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }

                  if (step < 3 && isInteractiveInput && !isButton) {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                    return false;
                  }
                }
              }
            }}
            className="space-y-8"
          >
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-black uppercase border-b-4 border-[#D2DCB6] pb-2 inline-block">
                  Environmental Impact
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClassName}>
                      Monthly Electricity (kWh){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.electricity_kwh}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          electricity_kwh: e.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="e.g., 5000"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Monthly Bill Amount ($){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.electricity_bill_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          electricity_bill_amount: e.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="e.g., 600"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClassName}>
                      Generator Fuel (Liters){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.generator_usage_liters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          generator_usage_liters: e.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="0 if not applicable"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Generator Usage (Hours){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.generator_usage_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          generator_usage_hours: e.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="0 if not applicable"
                    />
                  </div>
                </div>

                <div className="bg-[#F1F3E0] p-6 border-2 border-black rounded-sm">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="has_solar"
                      checked={formData.has_solar}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          has_solar: e.target.checked,
                        })
                      }
                      className={checkboxClassName}
                    />
                    <label
                      htmlFor="has_solar"
                      className="ml-3 text-lg font-bold text-black cursor-pointer"
                    >
                      We have solar panels installed
                    </label>
                  </div>

                  {formData.has_solar && (
                    <div className="ml-8 mt-4 animate-slideDown">
                      <label className={labelClassName}>
                        Solar Capacity (kW)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.solar_capacity_kw}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            solar_capacity_kw: e.target.value,
                          })
                        }
                        className={inputClassName}
                      />
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClassName}>
                      Water Source <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.water_source}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            water_source: e.target.value,
                          })
                        }
                        className={selectClassName}
                      >
                        <option value="municipal">Municipal</option>
                        <option value="borehole">Borehole/Well</option>
                        <option value="both">Both</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                        ▼
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Water Usage (Liters){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.water_usage_liters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          water_usage_liters: e.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="e.g., 10000"
                    />
                  </div>
                </div>

                <div className="bg-[#F1F3E0] p-6 border-2 border-black rounded-sm">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="waste_recycling"
                      checked={formData.waste_recycling}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          waste_recycling: e.target.checked,
                        })
                      }
                      className={checkboxClassName}
                    />
                    <label
                      htmlFor="waste_recycling"
                      className="ml-3 text-lg font-bold text-black cursor-pointer"
                    >
                      We actively recycle waste
                    </label>
                  </div>

                  {formData.waste_recycling && (
                    <div className="ml-8 mt-4 animate-slideDown">
                      <label className={labelClassName}>
                        Recycling Frequency
                      </label>
                      <div className="relative">
                        <select
                          value={formData.waste_recycling_frequency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              waste_recycling_frequency: e.target.value,
                            })
                          }
                          className={selectClassName}
                        >
                          <option value="">Select frequency</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="rarely">Rarely</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                          ▼
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <label className={labelClassName}>
                    Renewable Energy Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.renewable_energy_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        renewable_energy_percentage: e.target.value,
                      })
                    }
                    className={inputClassName}
                    placeholder="e.g., 25"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { id: "waste_segregation", label: "We segregate waste" },
                    {
                      id: "carbon_footprint_tracking",
                      label: "We track carbon footprint",
                    },
                    {
                      id: "hazardous_waste_management",
                      label: "Hazardous waste management",
                    },
                    {
                      id: "paper_reduction_initiatives",
                      label: "Paper reduction initiatives",
                    },
                    {
                      id: "business_travel_policy",
                      label: "Eco-friendly travel policy",
                    },
                    { id: "remote_work_policy", label: "Remote work policy" },
                    {
                      id: "sustainable_procurement",
                      label: "Sustainable procurement",
                    },
                    {
                      id: "supplier_esg_requirements",
                      label: "Supplier ESG requirements",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center p-3 border-2 border-transparent hover:border-[#D2DCB6] rounded-sm transition-all"
                    >
                      <input
                        type="checkbox"
                        id={item.id}
                        checked={formData[item.id]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [item.id]: e.target.checked,
                          })
                        }
                        className={checkboxClassName}
                      />
                      <label
                        htmlFor={item.id}
                        className="ml-3 text-sm font-bold text-black cursor-pointer"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-black uppercase border-b-4 border-[#D2DCB6] pb-2 inline-block">
                  Social Impact
                </h2>

                <div>
                  <label className={labelClassName}>
                    Total Employees <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.total_employees}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_employees: e.target.value,
                      })
                    }
                    className={inputClassName}
                    placeholder="e.g., 10"
                  />
                  <p className="text-xs font-bold text-[#778873] mt-2 uppercase tracking-wide">
                    Required: Minimum 1 employee
                  </p>
                </div>

                <div className="bg-[#F1F3E0] p-6 border-2 border-black rounded-sm">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="safety_training_provided"
                      checked={formData.safety_training_provided}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          safety_training_provided: e.target.checked,
                        })
                      }
                      className={checkboxClassName}
                    />
                    <label
                      htmlFor="safety_training_provided"
                      className="ml-3 text-lg font-bold text-black cursor-pointer"
                    >
                      We provide safety training
                    </label>
                  </div>

                  {formData.safety_training_provided && (
                    <div className="ml-8 mt-4 animate-slideDown">
                      <label className={labelClassName}>
                        Safety Training Frequency
                      </label>
                      <div className="relative">
                        <select
                          value={formData.safety_training_frequency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              safety_training_frequency: e.target.value,
                            })
                          }
                          className={selectClassName}
                        >
                          <option value="">Select frequency</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                          <option value="rarely">Rarely</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                          ▼
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      id: "health_insurance",
                      label: "We provide health insurance",
                    },
                    {
                      id: "diversity_policy",
                      label: "We have a diversity and inclusion policy",
                    },
                    {
                      id: "mental_health_support",
                      label: "We provide mental health support",
                    },
                    {
                      id: "employee_satisfaction_survey",
                      label: "We conduct employee satisfaction surveys",
                    },
                    {
                      id: "flexible_work_arrangements",
                      label: "We offer flexible work arrangements",
                    },
                    {
                      id: "community_engagement",
                      label: "We engage with the local community",
                    },
                    {
                      id: "local_hiring_preference",
                      label: "We prefer hiring locally",
                    },
                    {
                      id: "charitable_contributions",
                      label: "We make charitable contributions",
                    },
                    {
                      id: "customer_satisfaction_tracking",
                      label: "We track customer satisfaction",
                    },
                    {
                      id: "product_safety_standards",
                      label: "We maintain product safety standards",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center p-3 border-2 border-transparent hover:border-[#D2DCB6] rounded-sm transition-all"
                    >
                      <input
                        type="checkbox"
                        id={item.id}
                        checked={formData[item.id]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [item.id]: e.target.checked,
                          })
                        }
                        className={checkboxClassName}
                      />
                      <label
                        htmlFor={item.id}
                        className="ml-3 text-sm font-bold text-black cursor-pointer"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClassName}>
                      Female Employees Percentage (%){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      min="0"
                      max="100"
                      value={formData.female_employees_percentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          female_employees_percentage: e.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="e.g., 45"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Workplace Accidents (Last Year){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.workplace_accidents_last_year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workplace_accidents_last_year: e.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="e.g., 0"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>
                    Employee Training Hours (per employee/month)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.employee_training_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employee_training_hours: e.target.value,
                      })
                    }
                    className={inputClassName}
                    placeholder="e.g., 40"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-black uppercase border-b-4 border-[#D2DCB6] pb-2 inline-block">
                  Governance
                </h2>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-wider mb-2">
                    Core Policies <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm font-bold text-[#778873] mb-3 uppercase tracking-wide">
                    At least one policy must be selected
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { id: "code_of_conduct", label: "Code of Conduct" },
                      {
                        id: "anti_corruption_policy",
                        label: "Anti-Corruption Policy",
                      },
                      {
                        id: "data_privacy_policy",
                        label: "Data Privacy Policy",
                      },
                      {
                        id: "whistleblower_policy",
                        label: "Whistleblower Policy",
                      },
                      {
                        id: "board_oversight",
                        label: "Board Oversight Structure",
                      },
                      {
                        id: "risk_management_policy",
                        label: "Risk Management Policy",
                      },
                    ].map((policy) => (
                      <div
                        key={policy.id}
                        className="flex items-center p-3 border-2 border-transparent hover:border-[#D2DCB6] rounded-sm transition-all"
                      >
                        <input
                          type="checkbox"
                          id={policy.id}
                          checked={formData[policy.id]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [policy.id]: e.target.checked,
                            })
                          }
                          className={checkboxClassName}
                        />
                        <label
                          htmlFor={policy.id}
                          className="ml-3 text-sm font-bold text-black cursor-pointer"
                        >
                          {policy.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-black">
                  <h3 className="text-lg font-bold text-black uppercase tracking-wider mb-2">
                    Compliance & Security
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "cybersecurity_measures",
                        label: "Cybersecurity Measures",
                      },
                      {
                        id: "regulatory_compliance_tracking",
                        label: "Regulatory Compliance Tracking",
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center p-3 border-2 border-transparent hover:border-[#D2DCB6] rounded-sm transition-all"
                      >
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={formData[item.id]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [item.id]: e.target.checked,
                            })
                          }
                          className={checkboxClassName}
                        />
                        <label
                          htmlFor={item.id}
                          className="ml-3 text-sm font-bold text-black cursor-pointer"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-black">
                  <h3 className="text-lg font-bold text-black uppercase tracking-wider mb-2">
                    Transparency & Reporting
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "sustainability_reporting",
                        label: "Sustainability Reporting",
                      },
                      {
                        id: "stakeholder_engagement",
                        label: "Stakeholder Engagement",
                      },
                      { id: "esg_goals_set", label: "ESG Goals Set" },
                      { id: "third_party_audits", label: "Third-Party Audits" },
                      {
                        id: "public_esg_commitments",
                        label: "Public ESG Commitments",
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center p-3 border-2 border-transparent hover:border-[#D2DCB6] rounded-sm transition-all"
                      >
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={formData[item.id]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [item.id]: e.target.checked,
                            })
                          }
                          className={checkboxClassName}
                        />
                        <label
                          htmlFor={item.id}
                          className="ml-3 text-sm font-bold text-black cursor-pointer"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t-4 border-black">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-3 bg-[#F1F3E0] border-2 border-black text-black font-bold uppercase tracking-wider rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Previous
                </button>
              )}
              <div className="ml-auto">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#778873] border-2 border-black text-white font-bold uppercase tracking-wider rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-[#778873] border-2 border-black text-white font-bold uppercase tracking-wider rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Submit Assessment"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
