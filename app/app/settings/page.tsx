"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

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

interface AllowanceItem {
  id: string
  code: string
  description: string
  taxable: boolean
  recurring: boolean
  amountPercent: number
  fixedVariable: "FIXED" | "VARIABLE"
}

interface DeductionItem {
  id: string
  code: string
  description: string
  taxable: boolean
  recurring: boolean
  amountPercent: number
  fixedVariable: "FIXED" | "VARIABLE"
}

interface LoanItem {
  id: string
  code: string
  description: string
  taxable: boolean
  recurring: boolean
  amountPercent: number
  fixedVariable: "FIXED" | "VARIABLE"
}

interface AllowanceSettings {
  items: AllowanceItem[]
}

interface DeductionSettings {
  items: DeductionItem[]
}

interface LoanSettings {
  items: LoanItem[]
  maxLoanAmount: number
  interestRate: number
  maxRepaymentPeriod: number
  autoDeductFromSalary: boolean
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
  overtimeRate: number
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

const MAIN_COMPANY_ID = "00000000-0000-0000-0000-000000000001" // Fixed UUID for main company

export default function SettingsPage() {
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
    name: "",
    taxId: "",
    ssnitNumber: "",
    industry: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    divisions: [],
    departments: [],
    locations: [],
    allowances: {
      items: [],
    },
    deductions: {
      items: [],
    },
    loans: {
      items: [],
      maxLoanAmount: 0,
      interestRate: 0,
      maxRepaymentPeriod: 0,
      autoDeductFromSalary: false,
    },
  })

  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({
    frequency: "monthly",
    currency: "ghs",
    minWage: 18.15,
    overtimeRate: 1.5,
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

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { error: companyError } = await supabase.from("companies").upsert({
        id: MAIN_COMPANY_ID, // Use UUID instead of integer
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

      const { error: settingsError } = await supabase.from("company_settings").upsert({
        id: MAIN_COMPANY_ID,
        name: companySettings.name,
        tax_id: companySettings.taxId,
        ssnit_number: companySettings.ssnitNumber,
        industry: companySettings.industry,
        address: companySettings.address,
        phone: companySettings.phone, // Use 'phone' not 'phone_number'
        email: companySettings.email, // Use 'email' not 'email_address'
        logo: companySettings.logo, // Use 'logo' not 'logo_url'
        divisions: companySettings.divisions, // ARRAY type in company_settings
        departments: companySettings.departments, // ARRAY type in company_settings
        locations: companySettings.locations, // ARRAY type in company_settings
        updated_at: new Date().toISOString(),
      })

      if (settingsError) {
        console.error("[v0] Error saving company settings:", settingsError)
        throw settingsError
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

        // Check if user is authenticated
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error("[v0] Authentication required for logo upload")
          toast({
            title: "Authentication Required",
            description: "Please log in to upload company logo.",
            variant: "destructive",
          })
          return
        }

        // Create a unique filename
        const fileExt = file.name.split(".").pop()
        const fileName = `company-logo-${Date.now()}.${fileExt}`

        // Upload to Vercel Blob or similar storage (simulated)
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

  const updatePayrollSettings = (field: keyof PayrollSettings, value: any) => {
    setPayrollSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
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

  useEffect(() => {
    const loadSettingsFromDatabase = async () => {
      try {
        const supabase = createClient()

        // Load company settings
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", MAIN_COMPANY_ID) // Use UUID instead of integer
          .maybeSingle()

        if (companyData && !companyError) {
          setCompanySettings({
            name: companyData.name || "",
            taxId: companyData.tax_id || "",
            ssnitNumber: companyData.ssnit_number || "",
            industry: companyData.industry || "",
            address: companyData.address || "",
            phone: companyData.phone_number || "", // Fixed: was companyData.phone
            email: companyData.email_address || "", // Fixed: was companyData.email
            logo: companyData.logo_url || "",
            divisions: companyData.divisions || [],
            departments: companyData.departments || [],
            locations: companyData.locations || [],
            allowances: companyData.allowances || {
              items: [],
            },
            deductions: companyData.deductions || {
              items: [],
            },
            loans: companyData.loans || {
              items: [],
              maxLoanAmount: 0,
              interestRate: 0,
              maxRepaymentPeriod: 0,
              autoDeductFromSalary: false,
            },
          })
        }

        // Load subsidiaries
        await loadSubsidiaries()
      } catch (error) {
        console.error("[v0] Error loading settings from database:", error)
      }
    }

    loadSettingsFromDatabase()
  }, [])

  const addAllowanceItem = () => {
    const newItem: AllowanceItem = {
      id: Date.now().toString(),
      code: "",
      description: "",
      taxable: false,
      recurring: true,
      amountPercent: 0,
      fixedVariable: "FIXED",
    }
    setCompanySettings((prev) => ({
      ...prev,
      allowances: {
        ...prev.allowances,
        items: [...prev.allowances.items, newItem],
      },
    }))
  }

  const addDeductionItem = () => {
    const newItem: DeductionItem = {
      id: Date.now().toString(),
      code: "",
      description: "",
      taxable: false,
      recurring: true,
      amountPercent: 0,
      fixedVariable: "FIXED",
    }
    setCompanySettings((prev) => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        items: [...prev.deductions.items, newItem],
      },
    }))
  }

  const addLoanItem = () => {
    const newItem: LoanItem = {
      id: Date.now().toString(),
      code: "",
      description: "",
      taxable: false,
      recurring: true,
      amountPercent: 0,
      fixedVariable: "FIXED",
    }
    setCompanySettings((prev) => ({
      ...prev,
      loans: {
        ...prev.loans,
        items: [...prev.loans.items, newItem],
      },
    }))
  }

  const updateAllowanceItem = (id: string, field: keyof AllowanceItem, value: any) => {
    setCompanySettings((prev) => ({
      ...prev,
      allowances: {
        ...prev.allowances,
        items: prev.allowances.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }))
  }

  const updateDeductionItem = (id: string, field: keyof DeductionItem, value: any) => {
    setCompanySettings((prev) => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        items: prev.deductions.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }))
  }

  const updateLoanItem = (id: string, field: keyof LoanItem, value: any) => {
    setCompanySettings((prev) => ({
      ...prev,
      loans: {
        ...prev.loans,
        items: prev.loans.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }))
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companySettings.name}
                    onChange={(e) => updateCompanySettings("name", e.target.value)}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={companySettings.taxId}
                    onChange={(e) => updateCompanySettings("taxId", e.target.value)}
                    placeholder="Tax ID"
                  />
                </div>
                <div>
                  <Label htmlFor="ssnit-number">SSNIT Number</Label>
                  <Input
                    id="ssnit-number"
                    value={companySettings.ssnitNumber}
                    onChange={(e) => updateCompanySettings("ssnitNumber", e.target.value)}
                    placeholder="SSNIT Number"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={companySettings.industry}
                    onChange={(e) => updateCompanySettings("industry", e.target.value)}
                    placeholder="Industry"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => updateCompanySettings("address", e.target.value)}
                    placeholder="Address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => updateCompanySettings("phone", e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={companySettings.email}
                    onChange={(e) => updateCompanySettings("email", e.target.value)}
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <Label htmlFor="logo">Logo</Label>
                  <input
                    type="file"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Divisions</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Division</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companySettings.divisions.map((division, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <Input
                              value={division}
                              onChange={(e) => updateCompanyArrayField("divisions", index, e.target.value)}
                              placeholder="Division"
                              className="w-full"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button
                    onClick={() => addCompanyArrayField("divisions")}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    + Add Division
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Departments</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companySettings.departments.map((department, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <Input
                              value={department}
                              onChange={(e) => updateCompanyArrayField("departments", index, e.target.value)}
                              placeholder="Department"
                              className="w-full"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button
                    onClick={() => addCompanyArrayField("departments")}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    + Add Department
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Locations</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companySettings.locations.map((location, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <Input
                              value={location}
                              onChange={(e) => updateCompanyArrayField("locations", index, e.target.value)}
                              placeholder="Location"
                              className="w-full"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button
                    onClick={() => addCompanyArrayField("locations")}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    + Add Location
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Allowances</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Taxable</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Recurring</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">AMOUNT %</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">FIXED/VARIABLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companySettings.allowances.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <Input
                              value={item.code}
                              onChange={(e) => updateAllowanceItem(item.id, "code", e.target.value)}
                              placeholder="Code"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={item.description}
                              onChange={(e) => updateAllowanceItem(item.id, "description", e.target.value)}
                              placeholder="Description"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={item.taxable}
                              onChange={(e) => updateAllowanceItem(item.id, "taxable", e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={item.recurring}
                              onChange={(e) => updateAllowanceItem(item.id, "recurring", e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.amountPercent}
                              onChange={(e) =>
                                updateAllowanceItem(item.id, "amountPercent", Number.parseFloat(e.target.value) || 0)
                              }
                              placeholder="0"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.fixedVariable}
                              onChange={(e) =>
                                updateAllowanceItem(item.id, "fixedVariable", e.target.value as "FIXED" | "VARIABLE")
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="FIXED">FIXED</option>
                              <option value="VARIABLE">VARIABLE</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {companySettings.allowances.items.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No allowances configured. Click "+ Add" to add your first allowance.
                    </div>
                  )}
                </div>
                <Button onClick={addAllowanceItem} variant="outline" size="sm" className="mt-4 bg-transparent">
                  + Add Allowance
                </Button>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Deductions</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Taxable</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Recurring</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">AMOUNT %</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">FIXED/VARIABLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companySettings.deductions.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <Input
                              value={item.code}
                              onChange={(e) => updateDeductionItem(item.id, "code", e.target.value)}
                              placeholder="Code"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={item.description}
                              onChange={(e) => updateDeductionItem(item.id, "description", e.target.value)}
                              placeholder="Description"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={item.taxable}
                              onChange={(e) => updateDeductionItem(item.id, "taxable", e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={item.recurring}
                              onChange={(e) => updateDeductionItem(item.id, "recurring", e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.amountPercent}
                              onChange={(e) =>
                                updateDeductionItem(item.id, "amountPercent", Number.parseFloat(e.target.value) || 0)
                              }
                              placeholder="0"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.fixedVariable}
                              onChange={(e) =>
                                updateDeductionItem(item.id, "fixedVariable", e.target.value as "FIXED" | "VARIABLE")
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="FIXED">FIXED</option>
                              <option value="VARIABLE">VARIABLE</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {companySettings.deductions.items.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No deductions configured. Click "+ Add" to add your first deduction.
                    </div>
                  )}
                </div>
                <Button onClick={addDeductionItem} variant="outline" size="sm" className="mt-4 bg-transparent">
                  + Add Deduction
                </Button>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Loan Settings</h3>
                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Taxable</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Recurring</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">AMOUNT %</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">FIXED/VARIABLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companySettings.loans.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <Input
                              value={item.code}
                              onChange={(e) => updateLoanItem(item.id, "code", e.target.value)}
                              placeholder="Code"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={item.description}
                              onChange={(e) => updateLoanItem(item.id, "description", e.target.value)}
                              placeholder="Description"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={item.taxable}
                              onChange={(e) => updateLoanItem(item.id, "taxable", e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={item.recurring}
                              onChange={(e) => updateLoanItem(item.id, "recurring", e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.amountPercent}
                              onChange={(e) =>
                                updateLoanItem(item.id, "amountPercent", Number.parseFloat(e.target.value) || 0)
                              }
                              placeholder="0"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.fixedVariable}
                              onChange={(e) =>
                                updateLoanItem(item.id, "fixedVariable", e.target.value as "FIXED" | "VARIABLE")
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="FIXED">FIXED</option>
                              <option value="VARIABLE">VARIABLE</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {companySettings.loans.items.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No loan types configured. Click "+ Add" to add your first loan type.
                    </div>
                  )}
                </div>
                <Button onClick={addLoanItem} variant="outline" size="sm" className="mt-4 bg-transparent">
                  + Add Loan Type
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <Label htmlFor="max-loan-amount">Maximum Loan Amount (GHS)</Label>
                    <Input
                      id="max-loan-amount"
                      type="number"
                      value={companySettings.loans?.maxLoanAmount || 0}
                      onChange={(e) =>
                        setCompanySettings((prev) => ({
                          ...prev,
                          loans: {
                            ...prev.loans,
                            maxLoanAmount: Number.parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                    <Input
                      id="interest-rate"
                      type="number"
                      value={companySettings.loans?.interestRate || 0}
                      onChange={(e) =>
                        setCompanySettings((prev) => ({
                          ...prev,
                          loans: {
                            ...prev.loans,
                            interestRate: Number.parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-repayment-period">Max Repayment Period (months)</Label>
                    <Input
                      id="max-repayment-period"
                      type="number"
                      value={companySettings.loans?.maxRepaymentPeriod || 0}
                      onChange={(e) =>
                        setCompanySettings((prev) => ({
                          ...prev,
                          loans: {
                            ...prev.loans,
                            maxRepaymentPeriod: Number.parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      placeholder="12"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-deduct"
                      checked={companySettings.loans?.autoDeductFromSalary || false}
                      onChange={(e) =>
                        setCompanySettings((prev) => ({
                          ...prev,
                          loans: {
                            ...prev.loans,
                            autoDeductFromSalary: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <Label htmlFor="auto-deduct">Auto-deduct from salary</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Other tabs content here */}
      </Tabs>
    </div>
  )
}
