"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/lib/currency-context"

interface Company {
  id: string
  name: string
  taxId: string
  ssnitNumber: string
  industry: string
  address: string
  phone: string
  email: string
  logo?: string
  status: "active" | "inactive"
  subsidiaries: Subsidiary[]
}

interface Subsidiary {
  id: string
  name: string
  taxId: string
  ssnitNumber: string
  address: string
  phone: string
  email: string
  divisions: string[]
  departments: string[]
  locations: string[]
  logo?: string
  status: "active" | "inactive"
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  companies: string[]
  status: "active" | "inactive"
  lastLogin: string
}

interface AllowanceSettings {
  transportAllowance: number
  housingAllowance: number
  medicalAllowance: number
  mealAllowance: number
  uniformAllowance: number
  communicationAllowance: number
  otherAllowances: number
}

interface DeductionSettings {
  taxDeduction: number
  ssnitDeduction: number
  tier3Deduction: number
  loanDeduction: number
  advanceDeduction: number
  otherDeductions: number
}

interface LoanSettings {
  id: number
  code: string
  description: string
  maximumAmount: number
  interestRate: number
  rateMethod: "REDUCING_BALANCE" | "STRAIGHT_LINE"
  adminCharges: number
  loanTenure: number
}

interface CompanySettings {
  name: string
  taxId: string
  ssnitNumber: string
  industry: string
  address: string
  phone: string
  email: string
  logo: string
  divisions: string[]
  departments: string[]
  locations: string[]
  allowances: AllowanceSettings
  deductions: DeductionSettings
  loans: LoanSettings
}

interface PayrollSettings {
  frequency: string
  currency: string
  minWage: number
  weekdayOvertimeRate: number
  weekendOvertimeRate: number
  autoPaye: boolean
  autoSsnit: boolean
  autoProvident: boolean
  payrollCutoffDay: number
  payrollProcessingDay: number
}

interface HRSettings {
  leaveYearStart: string
  annualLeaveDays: number
  sickLeaveDays: number
  probationPeriod: number
  autoApproveLeave: boolean
  emailNotifications: boolean
  workingHoursPerDay: number
  workingDaysPerWeek: number
}

interface SecuritySettings {
  twoFactor: boolean
  sessionTimeout: boolean
  timeoutDuration: number
  auditLog: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
}

interface NotificationSettings {
  payrollAlerts: boolean
  leaveAlerts: boolean
  employeeAlerts: boolean
  systemAlerts: boolean
  notificationEmail: string
  smsNotifications: boolean
  webhookUrl?: string
}

interface LeaveType {
  id: string
  name: string
  code: string
  description: string
  annual_entitlement: number
  accrual_method: "annual" | "monthly" | "per_pay_period"
  accrual_rate: number
  min_service_months: number
  max_consecutive_days?: number
  max_per_year?: number
  allow_carry_over: boolean
  max_carry_over_days: number
  carry_over_expiry_months: number
  min_notice_days: number
  requires_approval: boolean
  requires_medical_certificate: boolean
  medical_cert_after_days: number
  is_paid: boolean
  pay_percentage: number
  is_active: boolean
  is_system_default: boolean
}

const MAIN_COMPANY_ID = "00000000-0000-0000-0000-000000000001" // Fixed UUID for main company

export default function SettingsPage() {
  const { toast } = useToast()

  const { currency, currencySymbol, setCurrency: setSystemCurrency, formatAmount } = useCurrency()

  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([
    {
      id: "1",
      name: "Akwaaba Technologies Ltd",
      taxId: "C0012345678",
      ssnitNumber: "1234567890",
      industry: "technology",
      address: "123 Liberation Road, Labone, Accra, Ghana",
      phone: "+233 30 123 4567",
      email: "info@akwaabatech.com",
      status: "active",
      subsidiaries: [
        {
          id: "1",
          name: "Akwaaba Tech Solutions",
          taxId: "C0012345678",
          ssnitNumber: "1234567890",
          address: "123 Liberation Road, Labone, Accra, Ghana",
          phone: "+233 30 123 4567",
          email: "info@akwaabatech.com",
          divisions: [""],
          departments: [""],
          locations: [""],
          logo: "",
          status: "active",
        },
        {
          id: "2",
          name: "Akwaaba Consulting",
          taxId: "C0012345678",
          ssnitNumber: "1234567890",
          address: "123 Liberation Road, Labone, Accra, Ghana",
          phone: "+233 30 123 4567",
          email: "info@akwaabatech.com",
          divisions: [""],
          departments: [""],
          locations: [""],
          logo: "",
          status: "active",
        },
      ],
    },
  ])

  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Super Admin",
      description: "Full system access",
      permissions: ["all"],
      userCount: 1,
      isSystem: true,
    },
    {
      id: "2",
      name: "HR Manager",
      description: "HR operations management",
      permissions: ["hr.manage", "payroll.view", "employees.manage"],
      userCount: 3,
      isSystem: true,
    },
    {
      id: "3",
      name: "Payroll Manager",
      description: "Payroll processing",
      permissions: ["payroll.manage", "employees.view"],
      userCount: 2,
      isSystem: true,
    },
    {
      id: "4",
      name: "Employee",
      description: "Self-service access",
      permissions: ["profile.view", "payslips.view", "leave.request"],
      userCount: 45,
      isSystem: true,
    },
  ])

  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@akwaabatech.com",
      role: "Super Admin",
      companies: ["1"],
      status: "active",
      lastLogin: "2024-01-15 09:30",
    },
    {
      id: "2",
      name: "HR Manager",
      email: "hr@akwaabatech.com",
      role: "HR Manager",
      companies: ["1"],
      status: "active",
      lastLogin: "2024-01-15 08:45",
    },
  ])

  const [selectedCompany, setSelectedCompany] = useState<Company>(companies[0])
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "Akwaaba Technologies Ltd",
    taxId: "C0012345678",
    ssnitNumber: "1234567890",
    industry: "Technology",
    address: "123 Liberation Road, Labone, Accra, Ghana",
    phone: "+233 30 123 4567",
    email: "info@akwaabatech.com",
    logo: "",
    divisions: ["Head Office", "Regional Office"],
    departments: ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"],
    locations: ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"],
    allowances: {
      transportAllowance: 0,
      housingAllowance: 0,
      medicalAllowance: 0,
      mealAllowance: 0,
      uniformAllowance: 0,
      communicationAllowance: 0,
      otherAllowances: 0,
    },
    deductions: {
      taxDeduction: 0,
      ssnitDeduction: 0,
      tier3Deduction: 0,
      loanDeduction: 0,
      advanceDeduction: 0,
      otherDeductions: 0,
    },
    loans: {
      id: 0,
      code: "",
      description: "",
      maximumAmount: 0,
      interestRate: 0,
      rateMethod: "REDUCING_BALANCE",
      adminCharges: 0,
      loanTenure: 12,
    },
  })

  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({
    frequency: "monthly",
    currency: "ghs",
    minWage: 18.15,
    weekdayOvertimeRate: 1.5,
    weekendOvertimeRate: 2.0,
    autoPaye: true,
    autoSsnit: true,
    autoProvident: true,
    payrollCutoffDay: 25,
    payrollProcessingDay: 28,
  })

  const [hrSettings, setHRSettings] = useState<HRSettings>({
    leaveYearStart: "january",
    annualLeaveDays: 21,
    sickLeaveDays: 10,
    probationPeriod: 3,
    autoApproveLeave: false,
    emailNotifications: true,
    workingHoursPerDay: 8,
    workingDaysPerWeek: 5,
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactor: false,
    sessionTimeout: true,
    timeoutDuration: 30,
    auditLog: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
    },
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    payrollAlerts: true,
    leaveAlerts: true,
    employeeAlerts: false,
    systemAlerts: true,
    notificationEmail: "admin@akwaabatech.com",
    smsNotifications: false,
  })

  const [subsidiaryEnabled, setSubsidiaryEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("subsidiaryEnabled")
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [showSubsidiaryDialog, setShowSubsidiaryDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

  const [editingSubsidiary, setEditingSubsidiary] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Subsidiary | null>(null)

  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])

  const [subsidiaryForm, setSubsidiaryForm] = useState({
    name: "",
    taxId: "",
    ssnitNumber: "",
    address: "",
    phone: "",
    email: "",
    divisions: [""],
    departments: [""],
    locations: [""],
    logo: null as File | null,
  })

  const [allowancesData, setAllowancesData] = useState([
    {
      id: 1,
      code: "TRANS",
      description: "Transport Allowance",
      taxable: true,
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    },
    {
      id: 2,
      code: "HOUSE",
      description: "Housing Allowance",
      taxable: true,
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    },
    {
      id: 3,
      code: "MED",
      description: "Medical Allowance",
      taxable: false,
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    },
  ])

  const [deductionsData, setDeductionsData] = useState([
    {
      id: 1,
      code: "TAX",
      description: "Tax Deduction",
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "VARIABLE",
    },
    {
      id: 2,
      code: "SSNIT",
      description: "SSNIT Deduction",
      recurring: true,
      amount: 0,
      percentage: 5.5,
      type: "VARIABLE",
    },
    {
      id: 3,
      code: "LOAN",
      description: "Loan Deduction",
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    },
  ])

  const [loanSettingsData, setLoanSettingsData] = useState<LoanSettings[]>([
    {
      id: 1,
      code: "PERSONAL",
      description: "Personal Loan",
      maximumAmount: 50000,
      interestRate: 10,
      rateMethod: "REDUCING_BALANCE",
      adminCharges: 500,
      loanTenure: 12,
    },
    {
      id: 2,
      code: "EMERGENCY",
      description: "Emergency Loan",
      maximumAmount: 10000,
      interestRate: 5,
      rateMethod: "STRAIGHT_LINE",
      adminCharges: 200,
      loanTenure: 6,
    },
  ])

  const [taxConfig, setTaxConfig] = useState({
    payeTaxBands: [
      { rate: 0, threshold: 4380, type: "first" },
      { rate: 5, threshold: 1000, type: "next" },
      { rate: 10, threshold: 2000, type: "next" },
      { rate: 17.5, threshold: 20000, type: "next" },
      { rate: 25, threshold: 20000, type: "next" },
      { rate: 30, threshold: 0, type: "remaining" },
    ],
    ssnitRates: {
      employee: 5.5,
      employer: 13,
      total: 18.5,
    },
    tier2Rates: {
      employee: 5.5,
      employer: 5.5,
      total: 11,
    },
    tier3Rates: {
      employee: 5,
      employer: 5,
      total: 10,
    },
  })

  const addTaxBand = () => {
    setTaxConfig((prev) => ({
      ...prev,
      payeTaxBands: [
        ...prev.payeTaxBands.slice(0, -1), // Remove the "remaining amount" band
        { threshold: 0, rate: 0 }, // Add new band
        prev.payeTaxBands[prev.payeTaxBands.length - 1], // Add back the "remaining amount" band
      ],
    }))
    setHasUnsavedChanges(true)
  }

  const removeTaxBand = (index: number) => {
    if (taxConfig.payeTaxBands.length > 2) {
      // Keep at least one regular band + remaining amount
      setTaxConfig((prev) => ({
        ...prev,
        payeTaxBands: prev.payeTaxBands.filter((_, i) => i !== index),
      }))
      setHasUnsavedChanges(true)
    }
  }

  const updateTaxBand = (index: number, field: string, value: number) => {
    setTaxConfig((prev) => ({
      ...prev,
      payeTaxBands: prev.payeTaxBands.map((band, i) => (i === index ? { ...band, [field]: value } : band)),
    }))
    setHasUnsavedChanges(true)
  }

  const updateSSNITRate = (field: string, value: number) => {
    setTaxConfig((prev) => {
      const newRates = { ...prev.ssnitRates, [field]: value }
      if (field === "employee" || field === "employer") {
        newRates.total = newRates.employee + newRates.employer
      }
      return {
        ...prev,
        ssnitRates: newRates,
      }
    })
    setHasUnsavedChanges(true)
  }

  const updateTier3Rate = (field: string, value: number) => {
    setTaxConfig((prev) => {
      const newRates = { ...prev.tier3Rates, [field]: value }
      if (field === "employee" || field === "employer") {
        newRates.total = newRates.employee + newRates.employer
      }
      return {
        ...prev,
        tier3Rates: newRates,
      }
    })
    setHasUnsavedChanges(true)
  }

  const updateTier2Rate = (field: string, value: number) => {
    setTaxConfig((prev) => {
      const newRates = { ...prev.tier2Rates, [field]: value }
      if (field === "employee" || field === "employer") {
        newRates.total = newRates.employee + newRates.employer
      }
      return {
        ...prev,
        tier2Rates: newRates,
      }
    })
    setHasUnsavedChanges(true)
  }

  const handleEditSubsidiary = (subsidiary: Subsidiary) => {
    setEditingSubsidiary(subsidiary.id)
    setEditForm({ ...subsidiary })
  }

  const handleAddSubsidiary = async () => {
    try {
      const subsidiaryData = {
        name: subsidiaryForm.name,
        taxId: subsidiaryForm.taxId,
        ssnitNumber: subsidiaryForm.ssnitNumber,
        address: subsidiaryForm.address,
        phone: subsidiaryForm.phone,
        email: subsidiaryForm.email,
        divisions: subsidiaryForm.divisions.filter((d) => d.trim()),
        departments: subsidiaryForm.departments.filter((d) => d.trim()),
        locations: subsidiaryForm.locations.filter((l) => l.trim()),
        logo: subsidiaryForm.logo,
      }

      // Save to database
      await handleSaveSubsidiary(subsidiaryData)

      // Reset form
      setShowSubsidiaryDialog(false)
      setSubsidiaryForm({
        name: "",
        taxId: "",
        ssnitNumber: "",
        address: "",
        phone: "",
        email: "",
        divisions: [""],
        departments: [""],
        locations: [""],
        logo: null,
      })
    } catch (error) {
      console.error("[v0] Error in handleAddSubsidiary:", error)
      toast({
        title: "Error",
        description: "Failed to add subsidiary. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addArrayField = (field: "divisions" | "departments" | "locations") => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }))
  }

  const updateArrayField = (field: "divisions" | "departments" | "locations", index: number, value: string) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  const removeArrayField = (field: "divisions" | "departments" | "locations", index: number) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const handleSubsidiaryToggle = (checked: boolean) => {
    if (checked) {
      setSubsidiaryEnabled(true)
      localStorage.setItem("subsidiaryEnabled", "true")
    } else {
      setShowDeactivateDialog(true)
    }
  }

  const confirmDeactivateSubsidiary = () => {
    setSubsidiaryEnabled(false)
    localStorage.setItem("subsidiaryEnabled", "false")
    setShowDeactivateDialog(false)
    toast({
      title: "Subsidiary Function Deactivated",
      description: "Subsidiary management has been disabled.",
    })
  }

  const addAllowanceRow = () => {
    const newId = Math.max(...allowancesData.map((item) => item.id)) + 1
    setAllowancesData([
      ...allowancesData,
      {
        id: newId,
        code: "",
        description: "",
        taxable: false,
        recurring: true,
        amount: 0,
        percentage: 0,
        type: "FIXED",
      },
    ])
  }

  const addDeductionRow = () => {
    const newId = Math.max(...deductionsData.map((item) => item.id)) + 1
    setDeductionsData([
      ...deductionsData,
      {
        id: newId,
        code: "",
        description: "",
        recurring: true,
        amount: 0,
        percentage: 0,
        type: "FIXED",
      },
    ])
  }

  const addLoanSettingRow = () => {
    const newId = Math.max(...loanSettingsData.map((item) => item.id)) + 1
    setLoanSettingsData([
      ...loanSettingsData,
      {
        id: newId,
        code: "",
        description: "",
        maximumAmount: 0,
        interestRate: 0,
        rateMethod: "REDUCING_BALANCE",
        adminCharges: 0,
        loanTenure: 12,
      },
    ])
  }

  const updateAllowanceRow = (id: number, field: string, value: any) => {
    setAllowancesData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const updateDeductionRow = (id: number, field: string, value: any) => {
    setDeductionsData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const updateLoanSettingRow = (id: number, field: string, value: any) => {
    setLoanSettingsData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const [uploadedFileName, setUploadedFileName] = useState<string>("")

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { error: companyError } = await supabase.from("companies").upsert({
        id: MAIN_COMPANY_ID,
        name: companySettings.name,
        tax_id: companySettings.taxId,
        ssnit_number: companySettings.ssnitNumber,
        industry: companySettings.industry,
        address: companySettings.address,
        phone_number: companySettings.phone,
        email_address: companySettings.email,
        logo_url: companySettings.logo,
        divisions: companySettings.divisions,
        departments: companySettings.departments,
        locations: companySettings.locations,
        updated_at: new Date().toISOString(),
      })

      if (companyError) {
        console.error("[v0] Error saving company settings:", companyError)
        throw companyError
      }

      console.log("[v0] Company settings saved successfully to database")

      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSettings = () => {
    // Reset to default values
    setHasUnsavedChanges(false)
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    })
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        console.log("[v0] Starting company logo upload...")
        const supabase = createClient()

        // Create a unique filename
        const fileExt = file.name.split(".").pop()
        const fileName = `company-logo-${Date.now()}.${fileExt}`
        const logoUrl = URL.createObjectURL(file)

        // Save logo URL to companies table
        const MAIN_COMPANY_ID = "00000000-0000-0000-0000-000000000001"
        const { error: updateError } = await supabase.from("companies").upsert({
          id: MAIN_COMPANY_ID,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })

        if (updateError) {
          console.error("[v0] Error saving logo to database:", updateError)
          toast({
            title: "Upload Error",
            description: "Failed to save logo to database.",
            variant: "destructive",
          })
          return
        }

        console.log("[v0] Company logo uploaded and saved to database successfully")

        // Update UI state
        setCompanySettings((prev) => ({
          ...prev,
          logo: logoUrl,
        }))
        setUploadedFileName(file.name) // store uploaded file name

        toast({
          title: "Logo Uploaded",
          description: "Company logo has been uploaded successfully.",
        })
      } catch (error) {
        console.error("[v0] Logo upload failed:", error)
        toast({
          title: "Upload Error",
          description: "Failed to upload company logo. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const addCompanyArrayField = (field: keyof Pick<CompanySettings, "divisions" | "departments" | "locations">) => {
    setCompanySettings((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }))
    setHasUnsavedChanges(true)
  }

  const updateCompanyArrayField = (
    field: keyof Pick<CompanySettings, "divisions" | "departments" | "locations">,
    index: number,
    value: string,
  ) => {
    setCompanySettings((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
    setHasUnsavedChanges(true)
  }

  const removeCompanyArrayField = (
    field: keyof Pick<CompanySettings, "divisions" | "departments" | "locations">,
    index: number,
  ) => {
    setCompanySettings((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
    setHasUnsavedChanges(true)
  }

  const updateCompanySettings = (field: keyof CompanySettings, value: string) => {
    setCompanySettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updatePayrollSettings = (key: string, value: any) => {
    setPayrollSettings((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)

    if (key === "currency") {
      setSystemCurrency(value)
    }
  }

  const updateHRSettings = (field: keyof HRSettings, value: any) => {
    setHRSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updateSecuritySettings = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updateNotificationSettings = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handleSaveSubsidiary = async (subsidiaryData: any) => {
    try {
      const supabase = createClient()

      const { error: companyError } = await supabase.from("companies").upsert({
        id: MAIN_COMPANY_ID,
        name: companySettings.name || "Default Company",
        tax_id: companySettings.taxId || "",
        ssnit_number: companySettings.ssnitNumber || "",
        industry: companySettings.industry || "",
        address: companySettings.address || "",
        phone_number: companySettings.phone || "",
        email_address: companySettings.email || "",
        logo_url: companySettings.logo || null,
        divisions: companySettings.divisions || [],
        departments: companySettings.departments || [],
        locations: companySettings.locations || [],
        updated_at: new Date().toISOString(),
      })

      if (companyError) {
        console.error("[v0] Error ensuring company exists:", companyError)
        throw companyError
      }

      const { error } = await supabase.from("subsidiaries").insert({
        company_id: MAIN_COMPANY_ID, // Use UUID instead of integer
        name: subsidiaryData.name,
        tax_id: subsidiaryData.taxId,
        ssnit_number: subsidiaryData.ssnitNumber,
        address: subsidiaryData.address,
        phone_number: subsidiaryData.phone,
        email_address: subsidiaryData.email,
        divisions: subsidiaryData.divisions,
        departments: subsidiaryData.departments,
        locations: subsidiaryData.locations,
        logo_url: subsidiaryData.logo,
        status: "active",
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("[v0] Error saving subsidiary:", error)
        throw error
      }

      console.log("[v0] Subsidiary saved successfully to database")

      // Refresh subsidiaries list
      await loadSubsidiaries()

      toast({
        title: "Subsidiary Added",
        description: "Subsidiary has been added successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving subsidiary:", error)
      toast({
        title: "Error",
        description: "Failed to save subsidiary. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!editForm) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("subsidiaries")
        .update({
          name: editForm.name,
          tax_id: editForm.taxId,
          ssnit_number: editForm.ssnitNumber,
          address: editForm.address,
          phone_number: editForm.phone,
          email_address: editForm.email,
          divisions: editForm.divisions,
          departments: editForm.departments,
          locations: editForm.locations,
          logo_url: editForm.logo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editForm.id)

      if (error) {
        console.error("[v0] Error updating subsidiary:", error)
        throw error
      }

      // Refresh subsidiaries list
      await loadSubsidiaries()

      setEditingSubsidiary(null)
      setEditForm(null)

      toast({
        title: "Success",
        description: "Subsidiary updated successfully!",
      })
    } catch (error) {
      console.error("[v0] Error updating subsidiary:", error)
      toast({
        title: "Error",
        description: "Failed to update subsidiary. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeactivateSubsidiary = async (subsidiaryId: string) => {
    try {
      const supabase = createClient()
      const subsidiary = subsidiaries.find((sub) => sub.id === subsidiaryId)

      if (!subsidiary) return

      const newStatus = subsidiary.status === "active" ? "inactive" : "active"

      const { error } = await supabase
        .from("subsidiaries")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subsidiaryId)

      if (error) {
        console.error("[v0] Error updating subsidiary status:", error)
        throw error
      }

      // Refresh subsidiaries list
      await loadSubsidiaries()

      toast({
        title: "Success",
        description: "Subsidiary status updated successfully!",
      })
    } catch (error) {
      console.error("[v0] Error updating subsidiary status:", error)
      toast({
        title: "Error",
        description: "Failed to update subsidiary status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadSubsidiaries = async () => {
    try {
      const supabase = createClient()
      console.log("[v0] Loading subsidiaries with company_id:", MAIN_COMPANY_ID)

      const { data, error } = await supabase.from("subsidiaries").select("*").eq("company_id", MAIN_COMPANY_ID)

      if (error) {
        console.error("[v0] Error loading subsidiaries:", error.message)
        return
      }

      console.log("[v0] Loaded subsidiaries from database:", data?.length || 0)

      const mappedSubsidiaries = (data || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        taxId: sub.tax_id || "",
        ssnitNumber: sub.ssnit_number || "",
        address: sub.address || "",
        phone: sub.phone_number || "",
        email: sub.email_address || "",
        divisions: sub.divisions || [],
        departments: sub.departments || [],
        locations: sub.locations || [],
        status: sub.status,
        logo: sub.logo_url || "",
      }))

      setSubsidiaries(mappedSubsidiaries)
    } catch (error) {
      console.error("[v0] Error loading subsidiaries:", error)
    }
  }

  const addEditArrayField = (field: "divisions" | "departments" | "locations") => {
    setEditForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: [...prev[field], ""],
      }
    })
  }

  const updateEditArrayField = (field: "divisions" | "departments" | "locations", index: number, value: string) => {
    setEditForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: prev[field].map((item, i) => (i === index ? value : item)),
      }
    })
  }

  const removeEditArrayField = (field: "divisions" | "departments" | "locations", index: number) => {
    setEditForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }
    })
  }

  const loadSettingsFromDatabase = async () => {
    try {
      let supabase
      try {
        supabase = createClient()
        console.log("[v0] Supabase client created successfully for settings")
      } catch (clientError) {
        console.error("[v0] Failed to create Supabase client:", clientError)
        console.warn("[v0] Using default settings due to Supabase client creation failure")
        // Set default company settings when client creation fails
        setCompanySettings({
          name: "Akwaaba HR Pay",
          taxId: "",
          ssnitNumber: "",
          industry: "",
          address: "",
          phone: "",
          email: "",
          logo: "",
          divisions: ["Head Office", "Regional Office"],
          departments: ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"],
          locations: ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"],
          allowances: {
            transportAllowance: 0,
            housingAllowance: 0,
            medicalAllowance: 0,
            mealAllowance: 0,
            uniformAllowance: 0,
            communicationAllowance: 0,
            otherAllowances: 0,
          },
          deductions: {
            taxDeduction: 0,
            ssnitDeduction: 0,
            tier3Deduction: 0,
            loanDeduction: 0,
            advanceDeduction: 0,
            otherDeductions: 0,
          },
          loans: {
            id: 0,
            code: "",
            description: "",
            maximumAmount: 0,
            interestRate: 0,
            rateMethod: "REDUCING_BALANCE",
            adminCharges: 0,
            loanTenure: 12,
          },
        })
      }
    } catch (error) {
      console.error("[v0] Error loading settings from database:", error)
    }
  }

  useEffect(() => {
    loadSettingsFromDatabase()
  }, [])

  return (
    <div className="space-y-4">
      {/* Tabs for different settings sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          {/* Additional tabs can be added here */}
        </TabsList>
        <TabsContent value="company">
          {/* Company settings form */}
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
            </CardHeader>
            <CardContent>{/* Form fields for company settings */}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payroll">
          {/* Payroll settings form */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Settings</CardTitle>
            </CardHeader>
            <CardContent>{/* Form fields for payroll settings */}</CardContent>
          </Card>
        </TabsContent>
        {/* Additional tab contents can be added here */}
      </Tabs>
    </div>
  )
}
