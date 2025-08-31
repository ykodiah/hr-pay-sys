"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Upload,
  Save,
  Trash2,
  Shield,
  Bell,
  Building,
  UserCheck,
  Plus,
  Edit,
  MoreHorizontal,
  Calculator,
  FileText,
  Key,
  Download,
  Mail,
  SettingsIcon,
  CheckCircle,
  Database,
  AlertTriangle,
  RefreshCw,
  Globe,
  CreditCard,
  X,
  MoreVertical,
  Eye,
  Power,
  Minus,
  DollarSign,
  Users,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  category: "general" | "medical" | "family" | "emergency"
  entitlementType: "annual" | "monthly" | "fixed" | "unlimited"
  entitlementAmount: number
  maxDaysPerYear?: number
  maxConsecutiveDays?: number
  minServiceMonths: number
  requiresApproval: boolean
  approvalLevels: number
  autoApproveThreshold?: number
  minNoticeDays: number
  requiresDocumentation: boolean
  documentationRequiredAfter?: number
  isPaid: boolean
  paymentPercentage: number
  paymentCapDays?: number
  allowCarryOver: boolean
  maxCarryOverDays: number
  carryOverExpiryMonths: number
  isActive: boolean
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

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const [isLeaveTypeDialogOpen, setIsLeaveTypeDialogOpen] = useState(false)
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(false)

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

  const loadLeaveTypes = async () => {
    try {
      setIsLoadingLeaveTypes(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", "00000000-0000-0000-0000-000000000001")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("[v0] Error loading leave types:", error)
        throw error
      }

      const formattedLeaveTypes: LeaveType[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description || "",
        category: item.category,
        entitlementType: item.entitlement_type,
        entitlementAmount: item.entitlement_amount || 0,
        maxDaysPerYear: item.max_days_per_year,
        maxConsecutiveDays: item.max_consecutive_days,
        minServiceMonths: item.min_service_months || 0,
        requiresApproval: item.requires_approval,
        approvalLevels: item.approval_levels || 1,
        autoApproveThreshold: item.auto_approve_threshold,
        minNoticeDays: item.min_notice_days || 0,
        requiresDocumentation: item.requires_documentation,
        documentationRequiredAfter: item.documentation_required_after,
        isPaid: item.is_paid,
        paymentPercentage: item.payment_percentage || 100,
        paymentCapDays: item.payment_cap_days,
        allowCarryOver: item.allow_carry_over,
        maxCarryOverDays: item.max_carry_over_days || 0,
        carryOverExpiryMonths: item.carry_over_expiry_months || 12,
        isActive: item.is_active,
      }))

      setLeaveTypes(formattedLeaveTypes)
    } catch (error) {
      console.error("[v0] Error loading leave types:", error)
      toast({
        title: "Error",
        description: "Failed to load leave types. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLeaveTypes(false)
    }
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

  useEffect(() => {
    loadLeaveTypes()
  }, [])

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

  const handleAddLeaveType = () => {
    setEditingLeaveType(null)
    setIsLeaveTypeDialogOpen(true)
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

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType)
    setIsLeaveTypeDialogOpen(true)
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

  const handleSaveLeaveType = async (formData: any) => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const leaveTypeData = {
        company_id: "00000000-0000-0000-0000-000000000001",
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
        category: formData.category,
        entitlement_type: formData.entitlementType,
        entitlement_amount: Number.parseFloat(formData.entitlementAmount),
        max_days_per_year: formData.maxDaysPerYear ? Number.parseFloat(formData.maxDaysPerYear) : null,
        max_consecutive_days: formData.maxConsecutiveDays ? Number.parseInt(formData.maxConsecutiveDays) : null,
        min_service_months: Number.parseInt(formData.minServiceMonths) || 0,
        requires_approval: formData.requiresApproval,
        approval_levels: Number.parseInt(formData.approvalLevels) || 1,
        auto_approve_threshold: formData.autoApproveThreshold ? Number.parseInt(formData.autoApproveThreshold) : null,
        min_notice_days: Number.parseInt(formData.minNoticeDays) || 0,
        requires_documentation: formData.requiresDocumentation,
        documentation_required_after: formData.documentationRequiredAfter
          ? Number.parseInt(formData.documentationRequiredAfter)
          : null,
        is_paid: formData.isPaid,
        payment_percentage: Number.parseFloat(formData.paymentPercentage) || 100,
        payment_cap_days: formData.paymentCapDays ? Number.parseInt(formData.paymentCapDays) : null,
        allow_carry_over: formData.allowCarryOver,
        max_carry_over_days: Number.parseFloat(formData.maxCarryOverDays) || 0,
        carry_over_expiry_months: Number.parseInt(formData.carryOverExpiryMonths) || 12,
        updated_at: new Date().toISOString(),
      }

      let error
      if (editingLeaveType) {
        const { error: updateError } = await supabase
          .from("leave_types")
          .update(leaveTypeData)
          .eq("id", editingLeaveType.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from("leave_types").insert([leaveTypeData])
        error = insertError
      }

      if (error) {
        console.error("[v0] Error saving leave type:", error)
        throw error
      }

      toast({
        title: "Success",
        description: `Leave type ${editingLeaveType ? "updated" : "created"} successfully.`,
      })

      setIsLeaveTypeDialogOpen(false)
      setEditingLeaveType(null)
      await loadLeaveTypes()
    } catch (error) {
      console.error("[v0] Error saving leave type:", error)
      toast({
        title: "Error",
        description: "Failed to save leave type. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveLeaveType = async (id: string) => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { error } = await supabase
        .from("leave_types")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        console.error("[v0] Error removing leave type:", error)
        throw error
      }

      toast({
        title: "Success",
        description: "Leave type removed successfully.",
      })

      await loadLeaveTypes()
    } catch (error) {
      console.error("[v0] Error removing leave type:", error)
      toast({
        title: "Error",
        description: "Failed to remove leave type. Please try again.",
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
        return
      }

      try {
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
            phone: companyData.phone_number || "",
            email: companyData.email_address || "",
            logo: companyData.logo_url || "",
            divisions: companyData.divisions || [],
            departments: companyData.departments || [],
            locations: companyData.locations || [],
            allowances: companyData.allowances || {
              transportAllowance: 0,
              housingAllowance: 0,
              medicalAllowance: 0,
              mealAllowance: 0,
              uniformAllowance: 0,
              communicationAllowance: 0,
              otherAllowances: 0,
            },
            deductions: companyData.deductions || {
              taxDeduction: 0,
              ssnitDeduction: 0,
              tier3Deduction: 0,
              loanDeduction: 0,
              advanceDeduction: 0,
              otherDeductions: 0,
            },
            loans: companyData.loans || {
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
          console.log("[v0] Company settings loaded successfully")
        } else if (companyError) {
          console.error("[v0] Error loading company data:", companyError)
        }

        // Load subsidiaries
        await loadSubsidiaries()
      } catch (dbError) {
        console.error("[v0] Database operation error:", dbError)
        console.warn("[v0] Using default settings due to database error")
      }
    } catch (error) {
      console.error("[v0] Error loading settings from database:", error)
      console.warn("[v0] Using default settings due to unexpected error")
    }
  }

  useEffect(() => {
    loadSettingsFromDatabase()
  }, [])

  const handleSaveHRSettings = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { error } = await supabase.from("hr_settings").upsert({
        id: 1,
        leave_year_start: hrSettings.leaveYearStart,
        probation_period: hrSettings.probationPeriod,
        auto_approve_leave: hrSettings.autoApproveLeave,
        email_notifications: hrSettings.emailNotifications,
        working_hours_per_day: hrSettings.workingHoursPerDay,
        working_days_per_week: hrSettings.workingDaysPerWeek,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("[v0] Error saving HR settings:", error)
        throw error
      }

      toast({
        title: "HR Settings Saved",
        description: "Your HR configuration has been updated successfully.",
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("[v0] Error saving HR settings:", error)
      toast({
        title: "Error",
        description: "Failed to save HR settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const [leavePolicies, setLeavePolicies] = useState([
    {
      id: 1,
      name: "Annual Leave",
      accrual: "1.75 days per month",
      carryOver: "5 days",
      notice: "2 weeks",
    },
    {
      id: 2,
      name: "Sick Leave",
      accrual: "Medical certificate after 3 days",
      carryOver: "30 days max consecutive",
      notice: "100% paid for first 10 days",
    },
    {
      id: 3,
      name: "Maternity/Paternity",
      accrual: "Maternity: 12 weeks",
      carryOver: "Paternity: 2 weeks",
      notice: "4 weeks before",
    },
  ])

  const [salaryGrades, setSalaryGrades] = useState([
    { id: 1, grade: "Grade 1", minSalary: 1800, maxSalary: 2400, steps: 5 },
    { id: 2, grade: "Grade 2", minSalary: 2200, maxSalary: 2920, steps: 5 },
    { id: 3, grade: "Grade 3", minSalary: 2600, maxSalary: 3440, steps: 5 },
    { id: 4, grade: "Grade 4", minSalary: 3000, maxSalary: 3960, steps: 5 },
    { id: 5, grade: "Grade 5", minSalary: 3400, maxSalary: 4480, steps: 5 },
  ])

  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  const [editingGrade, setEditingGrade] = useState<any>(null)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false)
  const [showGradeDialog, setShowGradeDialog] = useState(false)

  const handleEditPolicy = (policy: any) => {
    setEditingPolicy(policy)
    setShowPolicyDialog(true)
  }

  const handleRemovePolicy = (policyId: number) => {
    setLeavePolicies((prev) => prev.filter((p) => p.id !== policyId))
    toast({
      title: "Success",
      description: "Leave policy removed successfully",
    })
  }

  const handleAddPolicy = () => {
    setEditingPolicy(null)
    setShowPolicyDialog(true)
  }

  const handleSavePolicy = (policyData: any) => {
    if (editingPolicy) {
      setLeavePolicies((prev) => prev.map((p) => (p.id === editingPolicy.id ? { ...p, ...policyData } : p)))
      toast({
        title: "Success",
        description: "Leave policy updated successfully",
      })
    } else {
      const newPolicy = {
        id: Date.now(),
        ...policyData,
      }
      setLeavePolicies((prev) => [...prev, newPolicy])
      toast({
        title: "Success",
        description: "Leave policy added successfully",
      })
    }
    setShowPolicyDialog(false)
    setEditingPolicy(null)
  }

  const handleEditGrade = (grade: any) => {
    setEditingGrade(grade)
    setShowGradeDialog(true)
  }

  const handleRemoveGrade = (gradeId: number) => {
    setSalaryGrades((prev) => prev.filter((g) => g.id !== gradeId))
    toast({
      title: "Success",
      description: "Salary grade removed successfully",
    })
  }

  const handleAddGrade = () => {
    setEditingGrade(null)
    setShowGradeDialog(true)
  }

  const handleSaveGrade = (gradeData: any) => {
    if (editingGrade) {
      setSalaryGrades((prev) => prev.map((g) => (g.id === editingGrade.id ? { ...g, ...gradeData } : g)))
      toast({
        title: "Success",
        description: "Salary grade updated successfully",
      })
    } else {
      const newGrade = {
        id: Date.now(),
        ...gradeData,
      }
      setSalaryGrades((prev) => [...prev, newGrade])
      toast({
        title: "Success",
        description: "Salary grade added successfully",
      })
    }
    setShowGradeDialog(false)
    setEditingGrade(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your system configuration and preferences</p>
        </div>
        {hasUnsavedChanges && (
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="multi-company">Multi-Company</TabsTrigger>
          <TabsTrigger value="rbac">Roles & Access</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="multi-company" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Multi-Company Management</h2>
              <p className="text-gray-600">Manage multiple companies and subsidiaries</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-emerald-600" />
                  <div>
                    <CardTitle>Akwaaba Technologies Ltd</CardTitle>
                    <p className="text-sm text-gray-600">info@akwaabatech.com</p>
                  </div>
                </div>
                <Badge variant="default">active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium">Tax ID</Label>
                  <p className="text-sm text-gray-600">C0012345678</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">SSNIT Number</Label>
                  <p className="text-sm text-gray-600">1234567890</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Industry</Label>
                  <p className="text-sm text-gray-600">Technology</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="subsidiary-enabled"
                    checked={subsidiaryEnabled}
                    onChange={(e) => handleSubsidiaryToggle(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <Label htmlFor="subsidiary-enabled" className="text-sm font-medium">
                    Activate Subsidiary Function
                  </Label>
                  {subsidiaryEnabled && (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                      Active
                    </Badge>
                  )}
                </div>

                {subsidiaryEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Subsidiaries ({subsidiaries.length})</Label>
                      <Dialog open={showSubsidiaryDialog} onOpenChange={setShowSubsidiaryDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Subsidiary
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add New Subsidiary</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Name of Subsidiary *</Label>
                                <Input
                                  placeholder="Enter subsidiary name"
                                  value={subsidiaryForm.name}
                                  onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, name: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tax ID / TIN *</Label>
                                <Input
                                  placeholder="Enter tax ID"
                                  value={subsidiaryForm.taxId}
                                  onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, taxId: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>SSNIT Employer Number *</Label>
                                <Input
                                  placeholder="Enter SSNIT number"
                                  value={subsidiaryForm.ssnitNumber}
                                  onChange={(e) =>
                                    setSubsidiaryForm((prev) => ({ ...prev, ssnitNumber: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone Number *</Label>
                                <Input
                                  placeholder="Enter phone number"
                                  value={subsidiaryForm.phone}
                                  onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, phone: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Email Address *</Label>
                                <Input
                                  type="email"
                                  placeholder="Enter email address"
                                  value={subsidiaryForm.email}
                                  onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, email: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Subsidiary Logo</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    setSubsidiaryForm((prev) => ({ ...prev, logo: e.target.files?.[0] || null }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Address *</Label>
                              <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                rows={3}
                                placeholder="Enter full address"
                                value={subsidiaryForm.address}
                                onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, address: e.target.value }))}
                              />
                            </div>

                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>Division / Branch</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addArrayField("divisions")}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Division
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {subsidiaryForm.divisions.map((division, index) => (
                                    <div key={index} className="flex gap-2">
                                      <Input
                                        placeholder="Enter division/branch name"
                                        value={division}
                                        onChange={(e) => updateArrayField("divisions", index, e.target.value)}
                                      />
                                      {subsidiaryForm.divisions.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeArrayField("divisions", index)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>Department</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addArrayField("departments")}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Department
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {subsidiaryForm.departments.map((department, index) => (
                                    <div key={index} className="flex gap-2">
                                      <Input
                                        placeholder="Enter department name"
                                        value={department}
                                        onChange={(e) => updateArrayField("departments", index, e.target.value)}
                                      />
                                      {subsidiaryForm.departments.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeArrayField("departments", index)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>Location</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addArrayField("locations")}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Location
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {subsidiaryForm.locations.map((location, index) => (
                                    <div key={index} className="flex gap-2">
                                      <Input
                                        placeholder="Enter location name"
                                        value={location}
                                        onChange={(e) => updateArrayField("locations", index, e.target.value)}
                                      />
                                      {subsidiaryForm.locations.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeArrayField("locations", index)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                              <Button variant="outline" onClick={() => setShowSubsidiaryDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddSubsidiary}>Save Subsidiary</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {subsidiaries.map((subsidiary) => (
                        <Card
                          key={subsidiary.id}
                          className={`border-l-4 ${
                            subsidiary.status === "active" ? "border-l-emerald-500" : "border-l-gray-400 opacity-60"
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">{subsidiary.name}</CardTitle>
                                <p className="text-xs text-gray-600">{subsidiary.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    subsidiary.status === "active"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-gray-50 text-gray-600"
                                  }`}
                                >
                                  {subsidiary.status}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditSubsidiary(subsidiary)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    {subsidiary.status === "active" && (
                                      <DropdownMenuItem onClick={() => handleEditSubsidiary(subsidiary)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDeactivateSubsidiary(subsidiary.id)}>
                                      <Power className="mr-2 h-4 w-4" />
                                      {subsidiary.status === "active" ? "Deactivate" : "Reactivate"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Tax ID:</span>
                                <span>{subsidiary.taxId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">SSNIT:</span>
                                <span>{subsidiary.ssnitNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Divisions:</span>
                                <span>{subsidiary.divisions.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Departments:</span>
                                <span>{subsidiary.departments.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Locations:</span>
                                <span>{subsidiary.locations.length}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Dialog
                      open={editingSubsidiary !== null}
                      onOpenChange={() => {
                        setEditingSubsidiary(null)
                        setEditForm(null)
                      }}
                    >
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Subsidiary</DialogTitle>
                        </DialogHeader>
                        {editForm && (
                          <div className="space-y-6">
                            {/* Fix controlled/uncontrolled input error by ensuring all input values are always strings */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Name of Subsidiary *</Label>
                                <Input
                                  placeholder="Enter subsidiary name"
                                  value={editForm?.name ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm!, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tax ID / TIN *</Label>
                                <Input
                                  placeholder="Enter tax ID"
                                  value={editForm?.taxId ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm!, taxId: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>SSNIT Employer Number *</Label>
                                <Input
                                  placeholder="Enter SSNIT number"
                                  value={editForm?.ssnitNumber ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm!, ssnitNumber: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone Number *</Label>
                                <Input
                                  placeholder="Enter phone number"
                                  value={editForm?.phone ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm!, phone: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Email Address *</Label>
                                <Input
                                  type="email"
                                  placeholder="Enter email address"
                                  value={editForm?.email ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm!, email: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Subsidiary Logo</Label>
                                <Input type="file" accept="image/*" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Address *</Label>
                              <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                rows={3}
                                placeholder="Enter full address"
                                value={editForm?.address ?? ""}
                                onChange={(e) => setEditForm({ ...editForm!, address: e.target.value })}
                              />
                            </div>

                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>Division / Branch</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addEditArrayField("divisions")}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Division
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {editForm.divisions.map((division, index) => (
                                    <div key={index} className="flex gap-2">
                                      <Input
                                        placeholder="Enter division/branch name"
                                        value={division}
                                        onChange={(e) => updateEditArrayField("divisions", index, e.target.value)}
                                      />
                                      {editForm.divisions.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeEditArrayField("divisions", index)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>Department</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addEditArrayField("departments")}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Department
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {editForm.departments.map((department, index) => (
                                    <div key={index} className="flex gap-2">
                                      <Input
                                        placeholder="Enter department name"
                                        value={department}
                                        onChange={(e) => updateEditArrayField("departments", index, e.target.value)}
                                      />
                                      {editForm.departments.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeEditArrayField("departments", index)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>Location</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addEditArrayField("locations")}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Location
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {editForm.locations.map((location, index) => (
                                    <div key={index} className="flex gap-2">
                                      <Input
                                        placeholder="Enter location name"
                                        value={location}
                                        onChange={(e) => updateEditArrayField("locations", index, e.target.value)}
                                      />
                                      {editForm.locations.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeEditArrayField("locations", index)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingSubsidiary(null)
                                  setEditForm(null)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleSaveEdit}>Save Changes</Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Save Multi-Company Settings" : null}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="rbac" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Roles & Access Control</h2>
              <p className="text-gray-600">Manage user roles and permissions</p>
            </div>
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role Name *</Label>
                      <Input placeholder="Enter role name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input placeholder="Enter role description" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium">Employee Management</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="emp-view" />
                            <Label htmlFor="emp-view" className="text-sm">
                              View Employees
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="emp-create" />
                            <Label htmlFor="emp-create" className="text-sm">
                              Create Employees
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="emp-edit" />
                            <Label htmlFor="emp-edit" className="text-sm">
                              Edit Employees
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Payroll Management</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="payroll-view" />
                            <Label htmlFor="payroll-view" className="text-sm">
                              View Payroll
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="payroll-process" />
                            <Label htmlFor="payroll-process" className="text-sm">
                              Process Payroll
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="payroll-approve" />
                            <Label htmlFor="payroll-approve" className="text-sm">
                              Approve Payroll
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create Role</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{role.name}</h3>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{role.userCount} users</p>
                        <p className="text-xs text-gray-600">{role.permissions.length} permissions</p>
                      </div>
                      {!role.isSystem && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-gray-600">Manage system users and their access</p>
            </div>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input placeholder="Enter full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input type="email" placeholder="Enter email address" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Access</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select companies" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create User</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.role}</p>
                        <p className="text-xs text-gray-600">Last login: {user.lastLogin}</p>
                      </div>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deactivate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      value={companySettings.name}
                      onChange={(e) => updateCompanySettings("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">Tax ID / TIN *</Label>
                    <Input
                      id="tax-id"
                      value={companySettings.taxId}
                      onChange={(e) => updateCompanySettings("taxId", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssnit-number">SSNIT Employer Number *</Label>
                    <Input
                      id="ssnit-number"
                      value={companySettings.ssnitNumber}
                      onChange={(e) => updateCompanySettings("ssnitNumber", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={companySettings.industry}
                      onValueChange={(value) => updateCompanySettings("industry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Company Address</Label>
                  <Textarea
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => updateCompanySettings("address", e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => updateCompanySettings("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => updateCompanySettings("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Division / Branch</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCompanyArrayField("divisions")}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Division
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {companySettings.divisions.map((division, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Enter division/branch name"
                            value={division}
                            onChange={(e) => updateCompanyArrayField("divisions", index, e.target.value)}
                          />
                          {companySettings.divisions.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCompanyArrayField("divisions", index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Department</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCompanyArrayField("departments")}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Department
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {companySettings.departments.map((department, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Enter department name"
                            value={department}
                            onChange={(e) => updateCompanyArrayField("departments", index, e.target.value)}
                          />
                          {companySettings.departments.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCompanyArrayField("departments", index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Location</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCompanyArrayField("locations")}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Location
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {companySettings.locations.map((location, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Enter location name"
                            value={location}
                            onChange={(e) => updateCompanyArrayField("locations", index, e.target.value)}
                          />
                          {companySettings.locations.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCompanyArrayField("locations", index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span>Company Logo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {companySettings.logo ? (
                    <div className="relative">
                      <img
                        src={companySettings.logo || "/placeholder.svg"}
                        alt="Company Logo"
                        className="w-32 h-32 object-contain border rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() => updateCompanySettings("logo", "")}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="text-center">
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" className="bg-transparent">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG up to 2MB
                      <br />
                      Recommended: 200x200px
                    </p>
                    {uploadedFileName && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">Uploaded: {uploadedFileName}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Save Company Settings" : null}
            </Button>
          </div>
        </TabsContent>

        {activeTab === "payroll" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Payroll Settings</h3>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-emerald-600" />
                      <span>Payroll Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pay-frequency">Pay Frequency</Label>
                        <Select
                          value={payrollSettings.frequency}
                          onValueChange={(value) => updatePayrollSettings("frequency", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={payrollSettings.currency}
                          onValueChange={(value) => updatePayrollSettings("currency", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ghs">Ghana Cedis (GHS)</SelectItem>
                            <SelectItem value="usd">US Dollar (USD)</SelectItem>
                            <SelectItem value="eur">Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min-wage">Minimum Wage ({currencySymbol})</Label>
                        <Input
                          id="min-wage"
                          type="number"
                          value={payrollSettings.minWage}
                          onChange={(e) => updatePayrollSettings("minWage", Number.parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weekday-overtime-rate">Weekday Overtime Rate Multiplier</Label>
                        <Input
                          id="weekday-overtime-rate"
                          type="number"
                          value={payrollSettings.weekdayOvertimeRate}
                          onChange={(e) =>
                            updatePayrollSettings("weekdayOvertimeRate", Number.parseFloat(e.target.value) || 0)
                          }
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weekend-overtime-rate">Weekend Overtime Rate Multiplier</Label>
                        <Input
                          id="weekend-overtime-rate"
                          type="number"
                          value={payrollSettings.weekendOvertimeRate}
                          onChange={(e) =>
                            updatePayrollSettings("weekendOvertimeRate", Number.parseFloat(e.target.value) || 0)
                          }
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cutoff-day">Payroll Cutoff Day</Label>
                        <Input
                          id="cutoff-day"
                          type="number"
                          value={payrollSettings.payrollCutoffDay}
                          onChange={(e) =>
                            updatePayrollSettings("payrollCutoffDay", Number.parseInt(e.target.value) || 1)
                          }
                          min="1"
                          max="31"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="processing-day">Processing Day</Label>
                        <Input
                          id="processing-day"
                          type="number"
                          value={payrollSettings.payrollProcessingDay}
                          onChange={(e) =>
                            updatePayrollSettings("payrollProcessingDay", Number.parseInt(e.target.value) || 1)
                          }
                          min="1"
                          max="31"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-paye">Auto-calculate PAYE</Label>
                        <Switch
                          id="auto-paye"
                          checked={payrollSettings.autoPaye}
                          onCheckedChange={(checked) => updatePayrollSettings("autoPaye", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-ssnit">Auto-calculate SSNIT</Label>
                        <Switch
                          id="auto-ssnit"
                          checked={payrollSettings.autoSsnit}
                          onCheckedChange={(checked) => updatePayrollSettings("autoSsnit", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-provident">Auto-calculate Provident Fund (Tier 3)</Label>
                        <Switch
                          id="auto-provident"
                          checked={payrollSettings.autoProvident}
                          onCheckedChange={(checked) => updatePayrollSettings("autoProvident", checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <span>Tax Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">PAYE Tax Bands</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTaxBand}
                            className="h-8 w-8 p-0 bg-transparent"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {taxConfig.payeTaxBands.map((band, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={band.rate}
                                onChange={(e) => updateTaxBand(index, "rate", Number.parseFloat(e.target.value) || 0)}
                                className="w-20"
                                placeholder="Rate %"
                              />
                              <span>% on</span>
                              {index === taxConfig.payeTaxBands.length - 1 ? (
                                <span>remaining amount</span>
                              ) : (
                                <>
                                  <span>
                                    {index === 0 ? "first" : "next"} {currencySymbol}
                                  </span>
                                  <Input
                                    type="number"
                                    value={band.threshold}
                                    onChange={(e) =>
                                      updateTaxBand(index, "threshold", Number.parseFloat(e.target.value) || 0)
                                    }
                                    className="w-24"
                                    placeholder="Amount"
                                  />
                                </>
                              )}
                              {index !== taxConfig.payeTaxBands.length - 1 && taxConfig.payeTaxBands.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeTaxBand(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <Label className="font-medium mb-2 block">SSNIT Rates</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Employee:</span>
                            <Input
                              type="number"
                              value={taxConfig.ssnitRates.employee}
                              onChange={(e) => updateSSNITRate("employee", Number.parseFloat(e.target.value) || 0)}
                              className="w-20"
                              step="0.1"
                            />
                            <span>%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Employer:</span>
                            <Input
                              type="number"
                              value={taxConfig.ssnitRates.employer}
                              onChange={(e) => updateSSNITRate("employer", Number.parseFloat(e.target.value) || 0)}
                              className="w-20"
                              step="0.1"
                            />
                            <span>%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Total:</span>
                            <span className="font-medium">
                              {(taxConfig.ssnitRates.employee + taxConfig.ssnitRates.employer).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <Label className="font-medium mb-2 block">Tier 2 Rates</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Employee:</span>
                            <Input
                              type="number"
                              value={taxConfig.tier2Rates.employee}
                              onChange={(e) => updateTier2Rate("employee", Number.parseFloat(e.target.value) || 0)}
                              className="w-20"
                              step="0.1"
                            />
                            <span>%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Employer:</span>
                            <Input
                              type="number"
                              value={taxConfig.tier2Rates.employer}
                              onChange={(e) => updateTier2Rate("employer", Number.parseFloat(e.target.value) || 0)}
                              className="w-20"
                              step="0.1"
                            />
                            <span>%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Total:</span>
                            <span className="font-medium">
                              {(taxConfig.tier2Rates.employee + taxConfig.tier2Rates.employer).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <Label className="font-medium mb-2 block">Tier 3 Rates</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Employee:</span>
                            <Input
                              type="number"
                              value={taxConfig.tier3Rates.employee}
                              onChange={(e) => updateTier3Rate("employee", Number.parseFloat(e.target.value) || 0)}
                              className="w-20"
                              step="0.1"
                            />
                            <span>%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Employer:</span>
                            <Input
                              type="number"
                              value={taxConfig.tier3Rates.employer}
                              onChange={(e) => updateTier3Rate("employer", Number.parseFloat(e.target.value) || 0)}
                              className="w-20"
                              step="0.1"
                            />
                            <span>%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-20">Total:</span>
                            <span className="font-medium">
                              {(taxConfig.tier3Rates.employee + taxConfig.tier3Rates.employer).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={handleSaveSettings}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Payroll Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Allowances</h3>
                <Button onClick={addAllowanceRow} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Taxable</TableHead>
                      <TableHead className="font-semibold">Recurring</TableHead>
                      <TableHead className="font-semibold">AMOUNT</TableHead>
                      <TableHead className="font-semibold">%</TableHead>
                      <TableHead className="font-semibold">FIXED/VARIABLE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allowancesData.map((allowance) => (
                      <TableRow key={allowance.id}>
                        <TableCell>
                          <Input
                            value={allowance.code}
                            onChange={(e) => updateAllowanceRow(allowance.id, "code", e.target.value)}
                            className="w-20"
                            placeholder="CODE"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={allowance.description}
                            onChange={(e) => updateAllowanceRow(allowance.id, "description", e.target.value)}
                            className="min-w-40"
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={allowance.taxable}
                            onCheckedChange={(checked) => updateAllowanceRow(allowance.id, "taxable", checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={allowance.recurring}
                            onCheckedChange={(checked) => updateAllowanceRow(allowance.id, "recurring", checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={allowance.amount}
                            onChange={(e) =>
                              updateAllowanceRow(allowance.id, "amount", Number.parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={allowance.percentage}
                            onChange={(e) =>
                              updateAllowanceRow(allowance.id, "percentage", Number.parseFloat(e.target.value) || 0)
                            }
                            className="w-20"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={allowance.type}
                            onValueChange={(value) => updateAllowanceRow(allowance.id, "type", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FIXED">FIXED</SelectItem>
                              <SelectItem value="VARIABLE">VARIABLE</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Deductions</h3>
                <Button onClick={addDeductionRow} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Recurring</TableHead>
                      <TableHead className="font-semibold">AMOUNT</TableHead>
                      <TableHead className="font-semibold">%</TableHead>
                      <TableHead className="font-semibold">FIXED/VARIABLE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductionsData.map((deduction) => (
                      <TableRow key={deduction.id}>
                        <TableCell>
                          <Input
                            value={deduction.code}
                            onChange={(e) => updateDeductionRow(deduction.id, "code", e.target.value)}
                            className="w-20"
                            placeholder="CODE"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={deduction.description}
                            onChange={(e) => updateDeductionRow(deduction.id, "description", e.target.value)}
                            className="min-w-40"
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={deduction.recurring}
                            onCheckedChange={(checked) => updateDeductionRow(deduction.id, "recurring", checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={deduction.amount}
                            onChange={(e) =>
                              updateDeductionRow(deduction.id, "amount", Number.parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={deduction.percentage}
                            onChange={(e) =>
                              updateDeductionRow(deduction.id, "percentage", Number.parseFloat(e.target.value) || 0)
                            }
                            className="w-20"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={deduction.type}
                            onValueChange={(value) => updateDeductionRow(deduction.id, "type", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FIXED">FIXED</SelectItem>
                              <SelectItem value="VARIABLE">VARIABLE</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Loan Settings</h3>
                <Button onClick={addLoanSettingRow} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Maximum Amount</TableHead>
                      <TableHead className="font-semibold">Interest Rate (%)</TableHead>
                      <TableHead className="font-semibold">Rate Method</TableHead>
                      <TableHead className="font-semibold">Admin Charges</TableHead>
                      <TableHead className="font-semibold">Loan Tenure (months)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanSettingsData.map((loanSetting) => (
                      <TableRow key={loanSetting.id}>
                        <TableCell>
                          <Input
                            value={loanSetting.code}
                            onChange={(e) => updateLoanSettingRow(loanSetting.id, "code", e.target.value)}
                            className="w-20"
                            placeholder="CODE"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={loanSetting.description}
                            onChange={(e) => updateLoanSettingRow(loanSetting.id, "description", e.target.value)}
                            className="min-w-40"
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={loanSetting.maximumAmount}
                            onChange={(e) =>
                              updateLoanSettingRow(
                                loanSetting.id,
                                "maximumAmount",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-28"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={loanSetting.interestRate}
                            onChange={(e) =>
                              updateLoanSettingRow(
                                loanSetting.id,
                                "interestRate",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-20"
                            placeholder="0"
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={loanSetting.rateMethod}
                            onChange={(e) => updateLoanSettingRow(loanSetting.id, "rateMethod", e.target.value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REDUCING_BALANCE">Reducing Balance Method</SelectItem>
                              <SelectItem value="STRAIGHT_LINE">Straight Line Method</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={loanSetting.adminCharges}
                            onChange={(e) =>
                              updateLoanSettingRow(
                                loanSetting.id,
                                "adminCharges",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-24"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={loanSetting.loanTenure}
                            onChange={(e) =>
                              updateLoanSettingRow(loanSetting.id, "loanTenure", Number.parseInt(e.target.value) || 12)
                            }
                            className="w-20"
                            placeholder="12"
                            min="1"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Save Payroll Settings"}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <span>Leave Types</span>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddLeaveType}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Leave Type
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingLeaveTypes ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaveTypes.map((leaveType) => (
                        <div key={leaveType.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  leaveType.category === "medical"
                                    ? "bg-red-500"
                                    : leaveType.category === "family"
                                      ? "bg-pink-500"
                                      : leaveType.category === "emergency"
                                        ? "bg-orange-500"
                                        : "bg-emerald-500"
                                }`}
                              />
                              <div>
                                <Label className="font-medium text-base">{leaveType.name}</Label>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">{leaveType.code}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditLeaveType(leaveType)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Leave Type
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleRemoveLeaveType(leaveType.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove Leave Type
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Entitlement:</span> {leaveType.entitlementAmount} days{" "}
                              {leaveType.entitlementType}
                            </div>
                            <div>
                              <span className="font-medium">Notice:</span> {leaveType.minNoticeDays} days
                            </div>
                            <div>
                              <span className="font-medium">Paid:</span>{" "}
                              {leaveType.isPaid ? `${leaveType.paymentPercentage}%` : "Unpaid"}
                            </div>
                            <div>
                              <span className="font-medium">Carry Over:</span>{" "}
                              {leaveType.allowCarryOver ? `${leaveType.maxCarryOverDays} days` : "No"}
                            </div>
                          </div>
                          {leaveType.description && (
                            <p className="text-sm text-gray-600 mt-2 italic">{leaveType.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span>Salary Grades & Notches</span>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddGrade}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Grade
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {salaryGrades.map((grade) => (
                      <div key={grade.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">{grade.grade}</Label>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditGrade(grade)}>
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 bg-transparent"
                              onClick={() => handleRemoveGrade(grade.id)}
                            >
                              <Minus className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>
                            Salary Range: {formatAmount(grade.minSalary)} - {formatAmount(grade.maxSalary)}
                          </div>
                          <div>Steps: {grade.steps}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Dialog open={isLeaveTypeDialogOpen} onOpenChange={setIsLeaveTypeDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLeaveType ? "Edit Leave Type" : "Add New Leave Type"}</DialogTitle>
                  <DialogDescription>Configure leave type settings, entitlements, and policies.</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const data = Object.fromEntries(formData.entries())
                    data.requiresApproval = formData.has("requiresApproval")
                    data.requiresDocumentation = formData.has("requiresDocumentation")
                    data.isPaid = formData.has("isPaid")
                    data.allowCarryOver = formData.has("allowCarryOver")
                    handleSaveLeaveType(data)
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">Basic Information</h4>

                      <div className="space-y-2">
                        <Label htmlFor="name">Leave Type Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={editingLeaveType?.name || ""}
                          placeholder="e.g., Annual Leave"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="code">Code *</Label>
                        <Input
                          id="code"
                          name="code"
                          defaultValue={editingLeaveType?.code || ""}
                          placeholder="e.g., AL"
                          maxLength={10}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={editingLeaveType?.description || ""}
                          placeholder="Brief description of this leave type"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" defaultValue={editingLeaveType?.category || "general"}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Entitlement Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                        Entitlement Settings
                      </h4>

                      <div className="space-y-2">
                        <Label htmlFor="entitlementType">Entitlement Type</Label>
                        <Select name="entitlementType" defaultValue={editingLeaveType?.entitlementType || "annual"}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="annual">Annual</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="entitlementAmount">Entitlement Amount (days)</Label>
                        <Input
                          id="entitlementAmount"
                          name="entitlementAmount"
                          type="number"
                          step="0.5"
                          min="0"
                          defaultValue={editingLeaveType?.entitlementAmount || ""}
                          placeholder="e.g., 21"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxDaysPerYear">Max Days Per Year</Label>
                        <Input
                          id="maxDaysPerYear"
                          name="maxDaysPerYear"
                          type="number"
                          step="0.5"
                          min="0"
                          defaultValue={editingLeaveType?.maxDaysPerYear || ""}
                          placeholder="Optional limit"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxConsecutiveDays">Max Consecutive Days</Label>
                        <Input
                          id="maxConsecutiveDays"
                          name="maxConsecutiveDays"
                          type="number"
                          min="1"
                          defaultValue={editingLeaveType?.maxConsecutiveDays || ""}
                          placeholder="Optional limit"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minServiceMonths">Min Service (months)</Label>
                        <Input
                          id="minServiceMonths"
                          name="minServiceMonths"
                          type="number"
                          min="0"
                          defaultValue={editingLeaveType?.minServiceMonths || "0"}
                        />
                      </div>
                    </div>

                    {/* Approval & Notice */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">Approval & Notice</h4>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="requiresApproval"
                          name="requiresApproval"
                          defaultChecked={editingLeaveType?.requiresApproval ?? true}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="requiresApproval">Requires Approval</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="approvalLevels">Approval Levels</Label>
                        <Input
                          id="approvalLevels"
                          name="approvalLevels"
                          type="number"
                          min="1"
                          max="5"
                          defaultValue={editingLeaveType?.approvalLevels || "1"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="autoApproveThreshold">Auto-approve if ≤ days</Label>
                        <Input
                          id="autoApproveThreshold"
                          name="autoApproveThreshold"
                          type="number"
                          min="0"
                          defaultValue={editingLeaveType?.autoApproveThreshold || ""}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minNoticeDays">Minimum Notice (days)</Label>
                        <Input
                          id="minNoticeDays"
                          name="minNoticeDays"
                          type="number"
                          min="0"
                          defaultValue={editingLeaveType?.minNoticeDays || "0"}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="requiresDocumentation"
                          name="requiresDocumentation"
                          defaultChecked={editingLeaveType?.requiresDocumentation || false}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="requiresDocumentation">Requires Documentation</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentationRequiredAfter">Documentation required after (days)</Label>
                        <Input
                          id="documentationRequiredAfter"
                          name="documentationRequiredAfter"
                          type="number"
                          min="1"
                          defaultValue={editingLeaveType?.documentationRequiredAfter || ""}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {/* Payment & Carry Over */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                        Payment & Carry Over
                      </h4>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPaid"
                          name="isPaid"
                          defaultChecked={editingLeaveType?.isPaid ?? true}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="isPaid">Paid Leave</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentPercentage">Payment Percentage</Label>
                        <Input
                          id="paymentPercentage"
                          name="paymentPercentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          defaultValue={editingLeaveType?.paymentPercentage || "100"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentCapDays">Payment Cap (days)</Label>
                        <Input
                          id="paymentCapDays"
                          name="paymentCapDays"
                          type="number"
                          min="1"
                          defaultValue={editingLeaveType?.paymentCapDays || ""}
                          placeholder="Optional limit"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="allowCarryOver"
                          name="allowCarryOver"
                          defaultChecked={editingLeaveType?.allowCarryOver || false}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="allowCarryOver">Allow Carry Over</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxCarryOverDays">Max Carry Over (days)</Label>
                        <Input
                          id="maxCarryOverDays"
                          name="maxCarryOverDays"
                          type="number"
                          step="0.5"
                          min="0"
                          defaultValue={editingLeaveType?.maxCarryOverDays || "0"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="carryOverExpiryMonths">Carry Over Expiry (months)</Label>
                        <Input
                          id="carryOverExpiryMonths"
                          name="carryOverExpiryMonths"
                          type="number"
                          min="1"
                          max="24"
                          defaultValue={editingLeaveType?.carryOverExpiryMonths || "12"}
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setIsLeaveTypeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                      {isLoading ? "Saving..." : editingLeaveType ? "Update Leave Type" : "Create Leave Type"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>HR Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveYearStart">Leave Year Start</Label>
                    <Select
                      value={hrSettings.leaveYearStart}
                      onValueChange={(value) => updateHRSettings("leaveYearStart", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="february">February</SelectItem>
                        <SelectItem value="march">March</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="may">May</SelectItem>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                        <SelectItem value="august">August</SelectItem>
                        <SelectItem value="september">September</SelectItem>
                        <SelectItem value="october">October</SelectItem>
                        <SelectItem value="november">November</SelectItem>
                        <SelectItem value="december">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="probationPeriod">Probation Period (months)</Label>
                    <Input
                      type="number"
                      id="probationPeriod"
                      value={hrSettings.probationPeriod}
                      onChange={(e) => updateHRSettings("probationPeriod", Number.parseInt(e.target.value))}
                      min="1"
                      max="12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingHoursPerDay">Working Hours/Day</Label>
                    <Input
                      type="number"
                      id="workingHoursPerDay"
                      value={hrSettings.workingHoursPerDay}
                      onChange={(e) => updateHRSettings("workingHoursPerDay", Number.parseInt(e.target.value))}
                      min="1"
                      max="24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingDaysPerWeek">Working Days/Week</Label>
                    <Input
                      type="number"
                      id="workingDaysPerWeek"
                      value={hrSettings.workingDaysPerWeek}
                      onChange={(e) => updateHRSettings("workingDaysPerWeek", Number.parseInt(e.target.value))}
                      min="1"
                      max="7"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-approve leave requests</Label>
                      <p className="text-sm text-gray-600">Automatically approve requests within policy</p>
                    </div>
                    <Switch
                      checked={hrSettings.autoApproveLeave}
                      onCheckedChange={(checked) => updateHRSettings("autoApproveLeave", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email notifications</Label>
                      <p className="text-sm text-gray-600">Send email updates for HR activities</p>
                    </div>
                    <Switch
                      checked={hrSettings.emailNotifications}
                      onCheckedChange={(checked) => updateHRSettings("emailNotifications", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSaveHRSettings}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Save HR Settings"}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={securitySettings.twoFactor}
                      onCheckedChange={(checked) => updateSecuritySettings("twoFactor", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                      <p className="text-sm text-gray-500">Automatically log out inactive users</p>
                    </div>
                    <Switch
                      id="session-timeout"
                      checked={securitySettings.sessionTimeout}
                      onCheckedChange={(checked) => updateSecuritySettings("sessionTimeout", checked)}
                    />
                  </div>
                  {securitySettings.sessionTimeout && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
                      <Select
                        value={securitySettings.timeoutDuration.toString()}
                        onValueChange={(value) => updateSecuritySettings("timeoutDuration", Number.parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit-log">Audit Logging</Label>
                      <p className="text-sm text-gray-500">Track all system activities</p>
                    </div>
                    <Switch
                      id="audit-log"
                      checked={securitySettings.auditLog}
                      onCheckedChange={(checked) => updateSecuritySettings("auditLog", checked)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Key className="w-4 h-4 mr-2" />
                      Change Admin Password
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download Security Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-emerald-600" />
                    <span>Password Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      value={securitySettings.passwordPolicy.minLength}
                      onChange={(e) =>
                        updateSecuritySettings("passwordPolicy", {
                          ...securitySettings.passwordPolicy,
                          minLength: Number.parseInt(e.target.value) || 8,
                        })
                      }
                      min="6"
                      max="20"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="require-uppercase">Require Uppercase Letters</Label>
                      <Switch
                        id="require-uppercase"
                        checked={securitySettings.passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) =>
                          updateSecuritySettings("passwordPolicy", {
                            ...securitySettings.passwordPolicy,
                            requireUppercase: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="require-numbers">Require Numbers</Label>
                      <Switch
                        id="require-numbers"
                        checked={securitySettings.passwordPolicy.requireNumbers}
                        onCheckedChange={(checked) =>
                          updateSecuritySettings("passwordPolicy", {
                            ...securitySettings.passwordPolicy,
                            requireNumbers: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="require-symbols">Require Symbols</Label>
                      <Switch
                        id="require-symbols"
                        checked={securitySettings.passwordPolicy.requireSymbols}
                        onCheckedChange={(checked) =>
                          updateSecuritySettings("passwordPolicy", {
                            ...securitySettings.passwordPolicy,
                            requireSymbols: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium">Password Strength Preview</Label>
                    <div className="mt-2">
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">Strong password policy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Save Security Settings" : null}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-emerald-600" />
                    <span>Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="payroll-alerts">Payroll Processing Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about payroll status</p>
                    </div>
                    <Switch
                      id="payroll-alerts"
                      checked={notificationSettings.payrollAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("payrollAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="leave-alerts">Leave Request Alerts</Label>
                      <p className="text-sm text-gray-500">New leave requests and approvals</p>
                    </div>
                    <Switch
                      id="leave-alerts"
                      checked={notificationSettings.leaveAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("leaveAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="employee-alerts">Employee Updates</Label>
                      <p className="text-sm text-gray-500">New employees and profile changes</p>
                    </div>
                    <Switch
                      id="employee-alerts"
                      checked={notificationSettings.employeeAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("employeeAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="system-alerts">System Maintenance</Label>
                      <p className="text-sm text-gray-500">Scheduled maintenance and updates</p>
                    </div>
                    <Switch
                      id="system-alerts"
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("systemAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Send critical alerts via SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => updateNotificationSettings("smsNotifications", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-email">Notification Email</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      value={notificationSettings.notificationEmail}
                      onChange={(e) => updateNotificationSettings("notificationEmail", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      value={notificationSettings.webhookUrl || ""}
                      onChange={(e) => updateNotificationSettings("webhookUrl", e.target.value)}
                      placeholder="https://your-app.com/webhook"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    <span>Email Templates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">Welcome Email</Label>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Sent to new employees</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">Payslip Notification</Label>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Monthly payslip availability</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">Leave Approval</Label>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Leave request status updates</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">Password Reset</Label>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Password reset instructions</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Template
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Save Notification Settings" : null}
              </Button>
            </div>
          </div>
        )}

        <TabsContent value="system" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5 text-emerald-600" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">System Health</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Excellent
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Backup</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    2 days ago
                  </Badge>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run System Check
                </Button>
              </CardContent>
            </Card>

            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span>Integrations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Email Service</p>
                      <p className="text-sm text-gray-500">SMTP configuration</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Payment Gateway</p>
                      <p className="text-sm text-gray-500">For salary payments</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-gray-600">
                    Not Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Document Storage</p>
                      <p className="text-sm text-gray-500">Cloud file storage</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  Manage Integrations
                </Button>
              </CardContent>
            </Card>

            {/* Backup & Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Backup & Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backup">Automatic Backups</Label>
                    <p className="text-sm text-gray-500">Daily system backups</p>
                  </div>
                  <Switch id="auto-backup" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-time">Backup Time</Label>
                  <Select defaultValue="02:00">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00:00">12:00 AM</SelectItem>
                      <SelectItem value="02:00">2:00 AM</SelectItem>
                      <SelectItem value="04:00">4:00 AM</SelectItem>
                      <SelectItem value="06:00">6:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Backup Retention (days)</Label>
                  <Input id="retention" type="number" defaultValue="30" />
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Database className="w-4 h-4 mr-2" />
                    Create Manual Backup
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restore from Backup
                  </Button>
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Database className="w-4 h-4 mr-2" />
                    Create Manual Backup
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restore from Backup
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Last Backup:</strong> January 13, 2025 at 2:00 AM
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Size: 2.4 GB • Status: Successful</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Subsidiary Function</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate the subsidiary function? This will hide all subsidiary management
              features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivateSubsidiary}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
