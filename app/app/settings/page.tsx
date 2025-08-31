"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/lib/currency-context"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Shield, Key, Download, Database, FileText, Eye } from "lucide-react"

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
  backupEnabled: boolean
  backupFrequency: string
  auditTrail: boolean
  auditRetentionDays: number
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
  accrual_method: "annual" | "monthly" | "fixed" | "unlimited"
  accrual_rate: number
  annual_entitlement: number
  max_per_year?: number
  max_consecutive_days?: number
  min_service_months: number
  requires_approval: boolean
  min_notice_days: number
  requires_medical_certificate: boolean
  medical_cert_after_days?: number
  is_paid: boolean
  pay_percentage: number
  allow_carry_over: boolean
  max_carry_over_days: number
  carry_over_expiry_months: number
  is_active: boolean
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
    timeoutDuration: 15,
    auditLog: true,
    backupEnabled: true,
    backupFrequency: "daily",
    auditTrail: true,
    auditRetentionDays: 90,
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

  const [uploadedFileName, setUploadedFileName] = useState("")
  const [logoFileId, setLogoFileId] = useState<string | null>(null)

  const calculatePasswordStrength = (policy: SecuritySettings["passwordPolicy"]) => {
    let score = 0
    const feedback = []

    if (policy.minLength >= 8) score += 25
    else feedback.push("At least 8 characters")

    if (policy.requireUppercase) score += 25
    else feedback.push("Uppercase letters")

    if (policy.requireNumbers) score += 25
    else feedback.push("Numbers")

    if (policy.requireSymbols) score += 25
    else feedback.push("Special symbols")

    let strength = "Weak"
    let color = "bg-red-500"

    if (score >= 75) {
      strength = "Strong"
      color = "bg-green-500"
    } else if (score >= 50) {
      strength = "Medium"
      color = "bg-yellow-500"
    }

    return { score, strength, color, feedback }
  }

  const handleChangeAdminPassword = () => {
    setShowPasswordChangeDialog(true)
  }

  const handleDownloadSecurityReport = async () => {
    try {
      // Generate security report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        twoFactorEnabled: securitySettings.twoFactor,
        sessionTimeoutEnabled: securitySettings.sessionTimeout,
        timeoutDuration: securitySettings.timeoutDuration,
        auditLoggingEnabled: securitySettings.auditLog,
        backupEnabled: securitySettings.backupEnabled,
        backupFrequency: securitySettings.backupFrequency,
        passwordPolicy: securitySettings.passwordPolicy,
        lastBackup: new Date().toISOString(),
        activeUsers: 15,
        failedLoginAttempts: 3,
        securityScore: calculatePasswordStrength(securitySettings.passwordPolicy).score,
      }

      // Create and download PDF-like report
      const reportContent = `
SECURITY REPORT
Generated: ${new Date().toLocaleString()}

AUTHENTICATION SETTINGS:
- Two-Factor Authentication: ${securitySettings.twoFactor ? "Enabled" : "Disabled"}
- Session Timeout: ${securitySettings.sessionTimeout ? "Enabled" : "Disabled"}
- Timeout Duration: ${securitySettings.timeoutDuration} minutes

AUDIT & COMPLIANCE:
- Audit Logging: ${securitySettings.auditLog ? "Enabled" : "Disabled"}
- Audit Trail: ${securitySettings.auditTrail ? "Enabled" : "Disabled"}
- Retention Period: ${securitySettings.auditRetentionDays} days

BACKUP SETTINGS:
- Automated Backups: ${securitySettings.backupEnabled ? "Enabled" : "Disabled"}
- Backup Frequency: ${securitySettings.backupFrequency}

PASSWORD POLICY:
- Minimum Length: ${securitySettings.passwordPolicy.minLength} characters
- Require Uppercase: ${securitySettings.passwordPolicy.requireUppercase ? "Yes" : "No"}
- Require Numbers: ${securitySettings.passwordPolicy.requireNumbers ? "Yes" : "No"}
- Require Symbols: ${securitySettings.passwordPolicy.requireSymbols ? "Yes" : "No"}
- Policy Strength: ${calculatePasswordStrength(securitySettings.passwordPolicy).strength}

SYSTEM METRICS:
- Active Users: 15
- Failed Login Attempts (24h): 3
- Security Score: ${calculatePasswordStrength(securitySettings.passwordPolicy).score}/100
      `

      const blob = new Blob([reportContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `security-report-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Security Report Downloaded",
        description: "Security report has been generated and downloaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate security report. Please try again.",
      })
    }
  }

  const handleBackupNow = async () => {
    try {
      setIsBackingUp(true)

      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update last backup time
      setLastBackupTime(new Date())

      toast({
        title: "Backup Successful",
        description: "System backup completed successfully. All data has been backed up securely.",
      })
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to complete backup. Please try again.",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleDownloadAuditTrail = async () => {
    try {
      // Generate audit trail data
      const auditData = [
        {
          timestamp: new Date().toISOString(),
          user: "admin@company.com",
          action: "Login",
          details: "Successful login from 192.168.1.100",
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: "hr@company.com",
          action: "Employee Update",
          details: "Updated employee salary for John Doe",
        },
        {
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: "admin@company.com",
          action: "Settings Change",
          details: "Updated password policy requirements",
        },
        {
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          user: "payroll@company.com",
          action: "Payroll Process",
          details: "Processed monthly payroll for 50 employees",
        },
        {
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          user: "hr@company.com",
          action: "Leave Approval",
          details: "Approved annual leave for Jane Smith",
        },
      ]

      // Create CSV content for audit trail
      const csvContent = [
        "Timestamp,User,Action,Details",
        ...auditData.map((entry) => `"${entry.timestamp}","${entry.user}","${entry.action}","${entry.details}"`),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Audit Trail Downloaded",
        description: "Audit trail has been exported and downloaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to export audit trail. Please try again.",
      })
    }
  }

  const handleViewActivityLog = () => {
    setShowActivityLog(true)
  }

  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

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
        accrual_method: item.accrual_method || "annual",
        accrual_rate: item.accrual_rate || 0,
        annual_entitlement: item.annual_entitlement || 0,
        max_per_year: item.max_per_year,
        max_consecutive_days: item.max_consecutive_days,
        min_service_months: item.min_service_months || 0,
        requires_approval: item.requires_approval,
        min_notice_days: item.min_notice_days || 0,
        requires_medical_certificate: item.requires_medical_certificate,
        medical_cert_after_days: item.medical_cert_after_days,
        is_paid: item.is_paid,
        pay_percentage: item.pay_percentage || 100,
        allow_carry_over: item.allow_carry_over,
        max_carry_over_days: item.max_carry_over_days || 0,
        carry_over_expiry_months: item.carry_over_expiry_months || 12,
        is_active: item.is_active,
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
    loadCompanyLogo()
  }, [])

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
        accrual_method: formData.accrualMethod || "annual",
        accrual_rate: Number.parseFloat(formData.accrualRate) || 0,
        annual_entitlement: Number.parseFloat(formData.annualEntitlement) || 0,
        max_per_year: formData.maxPerYear ? Number.parseFloat(formData.maxPerYear) : null,
        max_consecutive_days: formData.maxConsecutiveDays ? Number.parseInt(formData.maxConsecutiveDays) : null,
        min_service_months: Number.parseInt(formData.minServiceMonths) || 0,
        requires_approval: formData.requiresApproval,
        min_notice_days: Number.parseInt(formData.minNoticeDays) || 0,
        requires_medical_certificate: formData.requiresMedicalCertificate,
        medical_cert_after_days: formData.medicalCertAfterDays ? Number.parseInt(formData.medicalCertAfterDays) : null,
        is_paid: formData.isPaid,
        pay_percentage: Number.parseFloat(formData.payPercentage) || 100,
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

        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please select a file smaller than 2MB.",
            variant: "destructive",
          })
          return
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid File Type",
            description: "Please select a valid image file (PNG, JPG, etc.).",
            variant: "destructive",
          })
          return
        }

        const supabase = createClient()

        // Convert file to base64 for database storage
        const fileBuffer = await file.arrayBuffer()
        const fileData = new Uint8Array(fileBuffer)

        // Create file record in database
        const { data: fileRecord, error: fileError } = await supabase
          .from("company_files")
          .insert({
            company_id: MAIN_COMPANY_ID,
            file_name: file.name, // Use original filename
            file_type: file.type,
            file_size: file.size,
            file_data: Array.from(fileData), // Convert to array for JSON storage
            file_category: "logo",
          })
          .select()
          .single()

        if (fileError) {
          console.error("[v0] Error saving file to database:", fileError)
          toast({
            title: "Upload Error",
            description: "Failed to save logo file to database.",
            variant: "destructive",
          })
          return
        }

        // Update company record with logo file reference
        const { error: companyError } = await supabase
          .from("companies")
          .update({
            logo_file_id: fileRecord.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", MAIN_COMPANY_ID)

        if (companyError) {
          console.error("[v0] Error updating company logo reference:", companyError)
          toast({
            title: "Upload Error",
            description: "Failed to update company logo reference.",
            variant: "destructive",
          })
          return
        }

        console.log("[v0] Company logo uploaded and saved to database successfully")

        // Create blob URL for immediate display
        const logoUrl = URL.createObjectURL(file)

        // Update UI state
        setCompanySettings((prev) => ({
          ...prev,
          logo: logoUrl,
        }))
        setUploadedFileName(file.name)
        setLogoFileId(fileRecord.id)

        toast({
          title: "Logo Uploaded",
          description: `Company logo "${file.name}" has been uploaded successfully.`,
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

  const loadCompanyLogo = async () => {
    try {
      const supabase = createClient()

      // Get company with logo file reference using explicit foreign key relationship
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select(`
          *,
          logo_file:company_files!logo_file_id(*)
        `)
        .eq("id", MAIN_COMPANY_ID)
        .single()

      if (companyError) {
        console.error("[v0] Error loading company data:", companyError)
        return
      }

      if (company?.logo_file) {
        const logoFile = company.logo_file
        // Convert array back to Uint8Array and create blob
        const fileData = new Uint8Array(logoFile.file_data)
        const blob = new Blob([fileData], { type: logoFile.file_type })
        const logoUrl = URL.createObjectURL(blob)

        setCompanySettings((prev) => ({
          ...prev,
          logo: logoUrl,
        }))
        setUploadedFileName(logoFile.file_name)
        setLogoFileId(logoFile.id)
      }
    } catch (error) {
      console.error("[v0] Error loading company logo:", error)
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

  return (
    <div className="container relative pb-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your company settings and preferences.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab("company")}
            className={activeTab === "company" ? "bg-secondary" : ""}
          >
            Company
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("payroll")}
            className={activeTab === "payroll" ? "bg-secondary" : ""}
          >
            Payroll
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("hr")}
            className={activeTab === "hr" ? "bg-secondary" : ""}
          >
            HR
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("security")}
            className={activeTab === "security" ? "bg-secondary" : ""}
          >
            Security
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("notifications")}
            className={activeTab === "notifications" ? "bg-secondary" : ""}
          >
            Notifications
          </Button>
        </div>
        {activeTab === "company" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <Building className="h-5 w-5" /> */}
                  Company Information
                </CardTitle>
                <CardDescription>Update your company details and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={companySettings.name}
                      onChange={(e) => updateCompanySettings("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-id">Tax ID</Label>
                    <Input
                      id="tax-id"
                      value={companySettings.taxId}
                      onChange={(e) => updateCompanySettings("taxId", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssnit-number">SSNIT Number</Label>
                    <Input
                      id="ssnit-number"
                      value={companySettings.ssnitNumber}
                      onChange={(e) => updateCompanySettings("ssnitNumber", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={companySettings.industry}
                      onChange={(e) => updateCompanySettings("industry", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={companySettings.address}
                      onChange={(e) => updateCompanySettings("address", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => updateCompanySettings("phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => updateCompanySettings("email", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <Image className="h-5 w-5" /> */}
                  Company Logo
                </CardTitle>
                <CardDescription>Upload your company logo to personalize your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  {companySettings.logo ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                      <img
                        src={companySettings.logo || "/placeholder.svg"}
                        alt="Company Logo"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">No Logo</span>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      Upload Logo
                    </Label>
                    <Input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    {uploadedFileName && (
                      <p className="text-sm text-muted-foreground mt-2">Uploaded: {uploadedFileName}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <List className="h-5 w-5" /> */}
                  Divisions
                </CardTitle>
                <CardDescription>Manage your company divisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companySettings.divisions.map((division, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={division}
                      onChange={(e) => updateCompanyArrayField("divisions", index, e.target.value)}
                      placeholder="Division Name"
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeCompanyArrayField("divisions", index)}
                    >
                      {/* <Trash className="h-4 w-4" /> */}
                      Delete
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => addCompanyArrayField("divisions")}>
                  Add Division
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <List className="h-5 w-5" /> */}
                  Departments
                </CardTitle>
                <CardDescription>Manage your company departments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companySettings.departments.map((department, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={department}
                      onChange={(e) => updateCompanyArrayField("departments", index, e.target.value)}
                      placeholder="Department Name"
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeCompanyArrayField("departments", index)}
                    >
                      {/* <Trash className="h-4 w-4" /> */}
                      Delete
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => addCompanyArrayField("departments")}>
                  Add Department
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <List className="h-5 w-5" /> */}
                  Locations
                </CardTitle>
                <CardDescription>Manage your company locations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companySettings.locations.map((location, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => updateCompanyArrayField("locations", index, e.target.value)}
                      placeholder="Location Name"
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeCompanyArrayField("locations", index)}
                    >
                      {/* <Trash className="h-4 w-4" /> */}
                      Delete
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => addCompanyArrayField("locations")}>
                  Add Location
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <Wallet className="h-5 w-5" /> */}
                  Payroll Settings
                </CardTitle>
                <CardDescription>Configure your payroll frequency, currency, and other settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payroll-frequency">Payroll Frequency</Label>
                    <Select
                      value={payrollSettings.frequency}
                      onValueChange={(value) => updatePayrollSettings("frequency", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payroll-currency">Currency</Label>
                    <Select
                      value={payrollSettings.currency}
                      onValueChange={(value) => updatePayrollSettings("currency", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghs">GHS</SelectItem>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="min-wage">Minimum Wage ({currencySymbol})</Label>
                    <Input
                      id="min-wage"
                      type="number"
                      value={payrollSettings.minWage}
                      onChange={(e) => updatePayrollSettings("minWage", Number.parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekday-overtime-rate">Weekday Overtime Rate</Label>
                    <Input
                      id="weekday-overtime-rate"
                      type="number"
                      value={payrollSettings.weekdayOvertimeRate}
                      onChange={(e) => updatePayrollSettings("weekdayOvertimeRate", Number.parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekend-overtime-rate">Weekend Overtime Rate</Label>
                    <Input
                      id="weekend-overtime-rate"
                      type="number"
                      value={payrollSettings.weekendOvertimeRate}
                      onChange={(e) => updatePayrollSettings("weekendOvertimeRate", Number.parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-paye">Auto PAYE Calculation</Label>
                    <Switch
                      id="auto-paye"
                      checked={payrollSettings.autoPaye}
                      onCheckedChange={(checked) => updatePayrollSettings("autoPaye", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-ssnit">Auto SSNIT Calculation</Label>
                    <Switch
                      id="auto-ssnit"
                      checked={payrollSettings.autoSsnit}
                      onCheckedChange={(checked) => updatePayrollSettings("autoSsnit", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-provident">Auto Provident Fund Calculation</Label>
                    <Switch
                      id="auto-provident"
                      checked={payrollSettings.autoProvident}
                      onCheckedChange={(checked) => updatePayrollSettings("autoProvident", checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payroll-cutoff-day">Payroll Cutoff Day</Label>
                    <Input
                      id="payroll-cutoff-day"
                      type="number"
                      min="1"
                      max="31"
                      value={payrollSettings.payrollCutoffDay}
                      onChange={(e) => updatePayrollSettings("payrollCutoffDay", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payroll-processing-day">Payroll Processing Day</Label>
                    <Input
                      id="payroll-processing-day"
                      type="number"
                      min="1"
                      max="31"
                      value={payrollSettings.payrollProcessingDay}
                      onChange={(e) => updatePayrollSettings("payrollProcessingDay", Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <Users className="h-5 w-5" /> */}
                  HR Settings
                </CardTitle>
                <CardDescription>
                  Configure your HR settings, including leave policies and working hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="leave-year-start">Leave Year Start</Label>
                    <Select
                      value={hrSettings.leaveYearStart}
                      onValueChange={(value) => updateHRSettings("leaveYearStart", value)}
                    >
                      <SelectTrigger className="w-32">
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
                  <div>
                    <Label htmlFor="annual-leave-days">Annual Leave Days</Label>
                    <Input
                      id="annual-leave-days"
                      type="number"
                      value={hrSettings.annualLeaveDays}
                      onChange={(e) => updateHRSettings("annualLeaveDays", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sick-leave-days">Sick Leave Days</Label>
                    <Input
                      id="sick-leave-days"
                      type="number"
                      value={hrSettings.sickLeaveDays}
                      onChange={(e) => updateHRSettings("sickLeaveDays", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="probation-period">Probation Period (months)</Label>
                    <Input
                      id="probation-period"
                      type="number"
                      value={hrSettings.probationPeriod}
                      onChange={(e) => updateHRSettings("probationPeriod", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-approve-leave">Auto Approve Leave Requests</Label>
                    <Switch
                      id="auto-approve-leave"
                      checked={hrSettings.autoApproveLeave}
                      onCheckedChange={(checked) => updateHRSettings("autoApproveLeave", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Send Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={hrSettings.emailNotifications}
                      onCheckedChange={(checked) => updateHRSettings("emailNotifications", checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="working-hours-per-day">Working Hours Per Day</Label>
                    <Input
                      id="working-hours-per-day"
                      type="number"
                      value={hrSettings.workingHoursPerDay}
                      onChange={(e) => updateHRSettings("workingHoursPerDay", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="working-days-per-week">Working Days Per Week</Label>
                    <Input
                      id="working-days-per-week"
                      type="number"
                      value={hrSettings.workingDaysPerWeek}
                      onChange={(e) => updateHRSettings("workingDaysPerWeek", Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactor}
                    onCheckedChange={(checked) => updateSecuritySettings("twoFactor", checked)}
                  />
                </div>

                {/* Auto Session Timeout */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto Session Timeout</h4>
                      <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                    </div>
                    <Switch
                      checked={securitySettings.sessionTimeout}
                      onCheckedChange={(checked) => updateSecuritySettings("sessionTimeout", checked)}
                    />
                  </div>

                  {securitySettings.sessionTimeout && (
                    <div className="ml-4">
                      <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
                      <Select
                        value={securitySettings.timeoutDuration.toString()}
                        onValueChange={(value) => updateSecuritySettings("timeoutDuration", Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minute</SelectItem>
                          <SelectItem value="3">3 minutes</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Audit Logging */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Audit Logging</h4>
                    <p className="text-sm text-muted-foreground">Track all system activities</p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLog}
                    onCheckedChange={(checked) => updateSecuritySettings("auditLog", checked)}
                  />
                </div>

                {/* Automated Backups */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Automated Backups</h4>
                      <p className="text-sm text-muted-foreground">Regular system data backups</p>
                    </div>
                    <Switch
                      checked={securitySettings.backupEnabled}
                      onCheckedChange={(checked) => updateSecuritySettings("backupEnabled", checked)}
                    />
                  </div>

                  {securitySettings.backupEnabled && (
                    <div className="ml-4">
                      <Label htmlFor="backup-frequency">Backup Frequency</Label>
                      <Select
                        value={securitySettings.backupFrequency}
                        onValueChange={(value) => updateSecuritySettings("backupFrequency", value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={handleChangeAdminPassword}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Admin Password
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={handleDownloadSecurityReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Security Report
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={handleBackupNow}
                    disabled={isBackingUp}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {isBackingUp ? "Backing Up..." : "Backup Now"}
                  </Button>

                  {lastBackupTime && (
                    <p className="text-xs text-muted-foreground">Last backup: {lastBackupTime.toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Policy Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Minimum Length */}
                <div>
                  <Label htmlFor="min-length">Minimum Length</Label>
                  <Input
                    id="min-length"
                    type="number"
                    min="4"
                    max="32"
                    value={securitySettings.passwordPolicy.minLength}
                    onChange={(e) =>
                      updateSecuritySettings("passwordPolicy", {
                        ...securitySettings.passwordPolicy,
                        minLength: Number.parseInt(e.target.value) || 8,
                      })
                    }
                    className="w-20"
                  />
                </div>

                {/* Password Requirements */}
                <div className="space-y-4">
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

                <div className="space-y-2">
                  <Label>Password Strength Preview</Label>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${calculatePasswordStrength(securitySettings.passwordPolicy).color}`}
                        style={{ width: `${calculatePasswordStrength(securitySettings.passwordPolicy).score}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {calculatePasswordStrength(securitySettings.passwordPolicy).strength} password policy
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {calculatePasswordStrength(securitySettings.passwordPolicy).score}/100
                      </span>
                    </div>
                    {calculatePasswordStrength(securitySettings.passwordPolicy).feedback.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Missing: {calculatePasswordStrength(securitySettings.passwordPolicy).feedback.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail & Compliance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit Trail & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Audit Trail</h4>
                        <p className="text-sm text-muted-foreground">Detailed activity logging</p>
                      </div>
                      <Switch
                        checked={securitySettings.auditTrail}
                        onCheckedChange={(checked) => updateSecuritySettings("auditTrail", checked)}
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleDownloadAuditTrail}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Audit Trail
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="retention-period">Retention Period (days)</Label>
                      <Input
                        id="retention-period"
                        type="number"
                        min="30"
                        max="365"
                        value={securitySettings.auditRetentionDays}
                        onChange={(e) =>
                          updateSecuritySettings("auditRetentionDays", Number.parseInt(e.target.value) || 90)
                        }
                        className="w-24"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleViewActivityLog}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Activity Log
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Admin Password</DialogTitle>
              <DialogDescription>
                Enter a new password for the admin account. Make sure it meets the current password policy requirements.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordChangeDialog(false)
                  setNewPassword("")
                  setConfirmPassword("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (
                    newPassword === confirmPassword &&
                    newPassword.length >= securitySettings.passwordPolicy.minLength
                  ) {
                    toast({
                      title: "Password Updated",
                      description: "Admin password has been changed successfully.",
                    })
                    setShowPasswordChangeDialog(false)
                    setNewPassword("")
                    setConfirmPassword("")
                  } else {
                    toast({
                      title: "Password Update Failed",
                      description: "Passwords don't match or don't meet policy requirements.",
                    })
                  }
                }}
                disabled={!newPassword || !confirmPassword}
              >
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Activity Log</DialogTitle>
              <DialogDescription>Recent system activities and user actions</DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {[
                  {
                    time: "2 minutes ago",
                    user: "admin@company.com",
                    action: "Login",
                    details: "Successful login from 192.168.1.100",
                  },
                  {
                    time: "1 hour ago",
                    user: "hr@company.com",
                    action: "Employee Update",
                    details: "Updated employee salary for John Doe",
                  },
                  {
                    time: "2 hours ago",
                    user: "admin@company.com",
                    action: "Settings Change",
                    details: "Updated password policy requirements",
                  },
                  {
                    time: "3 hours ago",
                    user: "payroll@company.com",
                    action: "Payroll Process",
                    details: "Processed monthly payroll for 50 employees",
                  },
                  {
                    time: "4 hours ago",
                    user: "hr@company.com",
                    action: "Leave Approval",
                    details: "Approved annual leave for Jane Smith",
                  },
                ].map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-xs text-muted-foreground">{entry.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.user}</p>
                      <p className="text-sm">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivityLog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <Bell className="h-5 w-5" /> */}
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure your notification preferences and alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payroll-alerts">Payroll Alerts</Label>
                    <Switch
                      id="payroll-alerts"
                      checked={notificationSettings.payrollAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("payrollAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="leave-alerts">Leave Alerts</Label>
                    <Switch
                      id="leave-alerts"
                      checked={notificationSettings.leaveAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("leaveAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="employee-alerts">Employee Alerts</Label>
                    <Switch
                      id="employee-alerts"
                      checked={notificationSettings.employeeAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("employeeAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-alerts">System Alerts</Label>
                    <Switch
                      id="system-alerts"
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => updateNotificationSettings("systemAlerts", checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notification-email">Notification Email</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      value={notificationSettings.notificationEmail}
                      onChange={(e) => updateNotificationSettings("notificationEmail", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => updateNotificationSettings("smsNotifications", checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      value={notificationSettings.webhookUrl || ""}
                      onChange={(e) => updateNotificationSettings("webhookUrl", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 right-0 flex justify-end space-x-2">
        <Button variant="ghost" onClick={handleResetSettings}>
          Reset Settings
        </Button>
        <Button onClick={handleSaveSettings} disabled={!hasUnsavedChanges || isLoading} isLoading={isLoading}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
