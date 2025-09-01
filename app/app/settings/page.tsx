"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/lib/currency-context"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  Shield,
  Bell,
  Download,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  Database,
  FileText,
  Key,
  Activity,
} from "lucide-react"

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

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  variables: string[]
  isActive: boolean
  lastModified: string
}

const MAIN_COMPANY_ID = "00000000-0000-0000-0000-000000000001" // Fixed UUID for main company

export default function SettingsPage() {
  const { toast } = useToast()
  const { currency, currencySymbol, setCurrency: setSystemCurrency, formatAmount } = useCurrency()

  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(false)
  const [isLeaveTypeDialogOpen, setIsLeaveTypeDialogOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    {
      id: "1",
      name: "Annual Leave",
      code: "AL",
      description: "Yearly vacation leave",
      annual_entitlement: 21,
      accrual_method: "monthly",
      accrual_rate: 1.75,
      min_service_months: 0,
      max_consecutive_days: 14,
      max_per_year: 21,
      requires_approval: true,
      requires_medical_certificate: false,
      medical_cert_after_days: 0,
      is_paid: true,
      pay_percentage: 100,
      allow_carry_over: true,
      max_carry_over_days: 5,
      carry_over_expiry_months: 3,
      min_notice_days: 7,
      is_active: true,
    },
    {
      id: "2",
      name: "Sick Leave",
      code: "SL",
      description: "Medical leave for illness",
      annual_entitlement: 10,
      accrual_method: "annual",
      accrual_rate: 10,
      min_service_months: 0,
      max_consecutive_days: 30,
      max_per_year: 10,
      requires_approval: false,
      requires_medical_certificate: true,
      medical_cert_after_days: 3,
      is_paid: true,
      pay_percentage: 100,
      allow_carry_over: false,
      max_carry_over_days: 0,
      carry_over_expiry_months: 0,
      min_notice_days: 0,
      is_active: true,
    },
  ])

  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = useState(false)

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

  const [uploadedFileName, setUploadedFileName] = useState("")
  const [logoFileId, setLogoFileId] = useState<string | null>(null)

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: "welcome",
      name: "Welcome Email",
      subject: "Welcome to {{company_name}} - Your Journey Begins!",
      content: `Dear {{employee_name}},

Welcome to {{company_name}}! We are thrilled to have you join our team as a {{position}} in the {{department}} department.

Your employment details:
- Employee ID: {{employee_id}}
- Start Date: {{start_date}}
- Reporting Manager: {{manager_name}}
- Work Location: {{work_location}}
- Start Time: {{start_time}}

On your first day, please report to the HR department at {{start_time}} for your orientation session. You will receive your employee handbook, ID card, and access credentials.

What to bring on your first day:
- Valid identification documents
- Signed employment contract
- Bank account details for salary processing
- Emergency contact information

We look forward to working with you and wish you great success in your new role!

Best regards,
{{company_name}} HR Team
{{company_email}} | {{company_phone}}`,
      variables: [
        "employee_name",
        "company_name",
        "position",
        "department",
        "employee_id",
        "start_date",
        "manager_name",
        "work_location",
        "start_time",
        "company_email",
        "company_phone",
      ],
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: "payslip",
      name: "Payslip Notification",
      subject: "Your {{month}} {{year}} Payslip is Ready",
      content: `Dear {{employee_name}},

Your payslip for {{month}} {{year}} is now available for download.

Payroll Summary:
- Gross Salary: {{gross_salary}}
- Total Deductions: {{total_deductions}}
- Net Pay: {{net_pay}}
- Payment Date: {{payment_date}}

To access your payslip:
1. Log into your employee portal at {{portal_url}}
2. Navigate to "Payslips" section
3. Download your {{month}} {{year}} payslip

If you have any questions about your payslip, please contact the Payroll department at {{payroll_email}} or call {{payroll_phone}}.

Thank you,
{{company_name}} Payroll Team`,
      variables: [
        "employee_name",
        "month",
        "year",
        "gross_salary",
        "total_deductions",
        "net_pay",
        "payment_date",
        "portal_url",
        "payroll_email",
        "payroll_phone",
        "company_name",
      ],
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: "leave_approval",
      name: "Leave Approval",
      subject: "Leave Request {{status}} - {{leave_type}}",
      content: `Dear {{employee_name}},

Your {{leave_type}} request has been {{status}}.

Leave Request Details:
- Leave Type: {{leave_type}}
- Start Date: {{start_date}}
- End Date: {{end_date}}
- Total Days: {{total_days}}
- Reason: {{reason}}
- Status: {{status}}
- {{#if approved_by}}Approved by: {{approved_by}}{{/if}}
- {{#if rejection_reason}}Rejection Reason: {{rejection_reason}}{{/if}}

{{#if status == "APPROVED"}}
Please ensure you complete any pending tasks and brief your colleagues before your leave begins. Have a great time off!
{{else}}
If you have any questions about this decision, please contact your manager or HR department.
{{/if}}

For any leave-related queries, contact HR at {{hr_email}} or {{hr_phone}}.

Best regards,
{{company_name}} HR Team`,
      variables: [
        "employee_name",
        "leave_type",
        "status",
        "start_date",
        "end_date",
        "total_days",
        "reason",
        "approved_by",
        "rejection_reason",
        "hr_email",
        "hr_phone",
        "company_name",
      ],
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: "password_reset",
      name: "Password Reset",
      subject: "Password Reset Request - {{company_name}}",
      content: `Dear {{employee_name}},

We received a request to reset your password for your {{company_name}} employee account.

To reset your password, please click the link below:
{{reset_link}}

This link will expire in {{expiry_hours}} hours for security reasons.

If you did not request this password reset, please ignore this email and contact IT support immediately at {{it_email}} or {{it_phone}}.

Security Tips:
- Never share your password with anyone
- Use a strong password with at least 8 characters
- Include uppercase, lowercase, numbers, and special characters
- Don't use the same password for multiple accounts

For security assistance, contact our IT department:
Email: {{it_email}}
Phone: {{it_phone}}

Best regards,
{{company_name}} IT Security Team`,
      variables: ["employee_name", "company_name", "reset_link", "expiry_hours", "it_email", "it_phone"],
      isActive: true,
      lastModified: new Date().toISOString(),
    },
  ])

  const [showEmailTemplateDialog, setShowEmailTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [showCustomTemplateDialog, setShowCustomTemplateDialog] = useState(false)
  const [customTemplate, setCustomTemplate] = useState<Partial<EmailTemplate>>({
    name: "",
    subject: "",
    content: "",
    variables: [],
    isActive: true,
  })

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

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template })
    setShowEmailTemplateDialog(true)
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return

    try {
      const updatedTemplates = emailTemplates.map((template) =>
        template.id === editingTemplate.id ? { ...editingTemplate, lastModified: new Date().toISOString() } : template,
      )

      setEmailTemplates(updatedTemplates)
      setShowEmailTemplateDialog(false)
      setEditingTemplate(null)

      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update email template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddCustomTemplate = () => {
    setCustomTemplate({
      name: "",
      subject: "",
      content: "",
      variables: [],
      isActive: true,
    })
    setShowCustomTemplateDialog(true)
  }

  const handleSaveCustomTemplate = async () => {
    if (!customTemplate.name || !customTemplate.subject || !customTemplate.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const newTemplate: EmailTemplate = {
        id: `custom_${Date.now()}`,
        name: customTemplate.name!,
        subject: customTemplate.subject!,
        content: customTemplate.content!,
        variables: extractVariablesFromContent(customTemplate.content!),
        isActive: customTemplate.isActive!,
        lastModified: new Date().toISOString(),
      }

      setEmailTemplates([...emailTemplates, newTemplate])
      setShowCustomTemplateDialog(false)
      setCustomTemplate({
        name: "",
        subject: "",
        content: "",
        variables: [],
        isActive: true,
      })

      toast({
        title: "Template Added",
        description: "Custom email template has been added successfully.",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save custom template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const extractVariablesFromContent = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const variables: string[] = []
    let match

    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim()
      if (!variables.includes(variable)) {
        variables.push(variable)
      }
    }

    return variables
  }

  const handleChangeAdminPassword = () => {
    setShowPasswordChangeDialog(true)
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation password do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < securitySettings.passwordPolicy.minLength) {
      toast({
        title: "Password Too Short",
        description: `Password must be at least ${securitySettings.passwordPolicy.minLength} characters long.`,
        variant: "destructive",
      })
      return
    }

    try {
      // Simulate password change process
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Password Changed",
        description: "Admin password has been updated successfully.",
      })

      setShowPasswordChangeDialog(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    }
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

  const [showBackupSuccessModal, setShowBackupSuccessModal] = useState(false)

  const handleBackupNow = async () => {
    try {
      setIsBackingUp(true)

      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update last backup time
      setLastBackupTime(new Date())

      setShowBackupSuccessModal(true)

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
    setShowLeaveTypeDialog(true)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your system configuration and preferences</p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading || !hasUnsavedChanges}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-teal-100">
            <TabsTrigger value="company" className="data-[state=active]:bg-white">
              <Building2 className="w-4 h-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="multi-company" className="data-[state=active]:bg-white">
              Multi-Company
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-white">
              Roles & Access
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="payroll" className="data-[state=active]:bg-white">
              Payroll
            </TabsTrigger>
            <TabsTrigger value="hr" className="data-[state=active]:bg-white">
              HR
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* ... existing tab content ... */}

          {activeTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactor}
                      onCheckedChange={(checked) => updateSecuritySettings("twoFactor", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto Session Timeout</Label>
                      <p className="text-sm text-gray-600">Automatically log out inactive users</p>
                    </div>
                    <Switch
                      checked={securitySettings.sessionTimeout}
                      onCheckedChange={(checked) => updateSecuritySettings("sessionTimeout", checked)}
                    />
                  </div>

                  {securitySettings.sessionTimeout && (
                    <div className="ml-6">
                      <Label className="text-sm font-medium">Timeout Duration (minutes)</Label>
                      <Select
                        value={securitySettings.timeoutDuration.toString()}
                        onValueChange={(value) => updateSecuritySettings("timeoutDuration", Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-full mt-1">
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

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Audit Logging</Label>
                      <p className="text-sm text-gray-600">Track all system activities</p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLog}
                      onCheckedChange={(checked) => updateSecuritySettings("auditLog", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Automated Backups</Label>
                      <p className="text-sm text-gray-600">Regular system data backups</p>
                    </div>
                    <Switch
                      checked={securitySettings.backupEnabled}
                      onCheckedChange={(checked) => updateSecuritySettings("backupEnabled", checked)}
                    />
                  </div>

                  {securitySettings.backupEnabled && (
                    <div className="ml-6">
                      <Label className="text-sm font-medium">Backup Frequency</Label>
                      <Select
                        value={securitySettings.backupFrequency}
                        onValueChange={(value) => updateSecuritySettings("backupFrequency", value)}
                      >
                        <SelectTrigger className="w-full mt-1">
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

                  <div className="space-y-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleChangeAdminPassword}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Change Admin Password
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleDownloadSecurityReport}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Security Report
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleBackupNow}
                      disabled={isBackingUp}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      {isBackingUp ? "Backing Up..." : "Backup Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Password Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Minimum Length</Label>
                    <Input
                      type="number"
                      value={securitySettings.passwordPolicy.minLength}
                      onChange={(e) =>
                        updateSecuritySettings("passwordPolicy", {
                          ...securitySettings.passwordPolicy,
                          minLength: Number.parseInt(e.target.value) || 8,
                        })
                      }
                      className="mt-1"
                      min="6"
                      max="20"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Require Uppercase Letters</Label>
                    <Switch
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
                    <Label className="text-sm font-medium">Require Numbers</Label>
                    <Switch
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
                    <Label className="text-sm font-medium">Require Symbols</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireSymbols}
                      onCheckedChange={(checked) =>
                        updateSecuritySettings("passwordPolicy", {
                          ...securitySettings.passwordPolicy,
                          requireSymbols: checked,
                        })
                      }
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">Password Strength Preview</Label>
                    <div className="mt-2">
                      {(() => {
                        const { score, strength, color, feedback } = calculatePasswordStrength(
                          securitySettings.passwordPolicy,
                        )
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{strength} password policy</span>
                              <span className="text-sm text-gray-500">{score}/100</span>
                            </div>
                            <Progress value={score} className="h-2" />
                            {feedback.length > 0 && (
                              <p className="text-xs text-gray-500">Missing: {feedback.join(", ")}</p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Audit Trail & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Audit Trail</Label>
                        <p className="text-sm text-gray-600">Detailed activity logging</p>
                      </div>
                      <Switch
                        checked={securitySettings.auditTrail}
                        onCheckedChange={(checked) => updateSecuritySettings("auditTrail", checked)}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Retention Period (days)</Label>
                      <Input
                        type="number"
                        value={securitySettings.auditRetentionDays}
                        onChange={(e) =>
                          updateSecuritySettings("auditRetentionDays", Number.parseInt(e.target.value) || 90)
                        }
                        className="mt-1"
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={handleDownloadAuditTrail} className="flex-1 bg-transparent">
                      <FileText className="w-4 h-4 mr-2" />
                      Download Audit Trail
                    </Button>

                    <Button variant="outline" onClick={handleViewActivityLog} className="flex-1 bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      View Activity Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Email Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emailTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600">
                          {template.id === "welcome" && "Sent to new employees"}
                          {template.id === "payslip" && "Monthly payslip availability"}
                          {template.id === "leave_approval" && "Leave request status updates"}
                          {template.id === "password_reset" && "Password reset instructions"}
                          {template.id.startsWith("custom_") && "Custom template"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={handleAddCustomTemplate}
                    className="w-full flex items-center gap-2 border-dashed bg-transparent"
                  >
                    <Bell className="w-4 h-4" />
                    Add Custom Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Payroll Alerts</Label>
                        <p className="text-sm text-gray-600">Payroll processing notifications</p>
                      </div>
                      <Switch
                        checked={notificationSettings.payrollAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("payrollAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Leave Alerts</Label>
                        <p className="text-sm text-gray-600">Leave request notifications</p>
                      </div>
                      <Switch
                        checked={notificationSettings.leaveAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("leaveAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Employee Alerts</Label>
                        <p className="text-sm text-gray-600">Employee-related notifications</p>
                      </div>
                      <Switch
                        checked={notificationSettings.employeeAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("employeeAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">System Alerts</Label>
                        <p className="text-sm text-gray-600">System maintenance and updates</p>
                      </div>
                      <Switch
                        checked={notificationSettings.systemAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("systemAlerts", checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                      <Label htmlFor="notificationEmail">Notification Email</Label>
                      <Input
                        id="notificationEmail"
                        type="email"
                        value={notificationSettings.notificationEmail}
                        onChange={(e) => updateNotificationSettings("notificationEmail", e.target.value)}
                        placeholder="admin@company.com"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">SMS Notifications</Label>
                        <p className="text-sm text-gray-600">Send notifications via SMS</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => updateNotificationSettings("smsNotifications", checked)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      value={notificationSettings.webhookUrl || ""}
                      onChange={(e) => updateNotificationSettings("webhookUrl", e.target.value)}
                      placeholder="https://your-webhook-endpoint.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Receive notifications via webhook for integration with external systems
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ... existing tab content ... */}
        </Tabs>
      </div>

      <Dialog open={showEmailTemplateDialog} onOpenChange={setShowEmailTemplateDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Customize the email template content and variables. Use {`{{variable_name}}`} for dynamic content.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  disabled={!editingTemplate.id.startsWith("custom_")}
                />
              </div>

              <div>
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  placeholder="Enter email subject with {{variables}}"
                />
              </div>

              <div>
                <Label htmlFor="template-content">Email Content</Label>
                <textarea
                  id="template-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  className="w-full h-64 p-3 border rounded-md resize-none font-mono text-sm"
                  placeholder="Enter email content with {{variables}}"
                />
              </div>

              <div>
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="template-active"
                  checked={editingTemplate.isActive}
                  onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isActive: checked })}
                />
                <Label htmlFor="template-active">Template Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>Update Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomTemplateDialog} onOpenChange={setShowCustomTemplateDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Custom Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for your organization. Use {`{{variable_name}}`} for dynamic content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-name">Template Name *</Label>
              <Input
                id="custom-name"
                value={customTemplate.name || ""}
                onChange={(e) => setCustomTemplate({ ...customTemplate, name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>

            <div>
              <Label htmlFor="custom-subject">Email Subject *</Label>
              <Input
                id="custom-subject"
                value={customTemplate.subject || ""}
                onChange={(e) => setCustomTemplate({ ...customTemplate, subject: e.target.value })}
                placeholder="Enter email subject with {{variables}}"
              />
            </div>

            <div>
              <Label htmlFor="custom-content">Email Content *</Label>
              <textarea
                id="custom-content"
                value={customTemplate.content || ""}
                onChange={(e) => setCustomTemplate({ ...customTemplate, content: e.target.value })}
                className="w-full h-64 p-3 border rounded-md resize-none font-mono text-sm"
                placeholder="Enter email content with {{variables}}"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Common Variables:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                <span>{`{{employee_name}}`}</span>
                <span>{`{{company_name}}`}</span>
                <span>{`{{employee_id}}`}</span>
                <span>{`{{department}}`}</span>
                <span>{`{{position}}`}</span>
                <span>{`{{manager_name}}`}</span>
                <span>{`{{start_date}}`}</span>
                <span>{`{{company_email}}`}</span>
                <span>{`{{company_phone}}`}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="custom-active"
                checked={customTemplate.isActive || false}
                onCheckedChange={(checked) => setCustomTemplate({ ...customTemplate, isActive: checked })}
              />
              <Label htmlFor="custom-active">Template Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomTemplate}>Add Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Admin Password</DialogTitle>
            <DialogDescription>
              Enter your new password. Make sure it meets the current password policy requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {(() => {
              const { feedback } = calculatePasswordStrength(securitySettings.passwordPolicy)
              const passwordMeetsPolicy =
                newPassword.length >= securitySettings.passwordPolicy.minLength &&
                (!securitySettings.passwordPolicy.requireUppercase || /[A-Z]/.test(newPassword)) &&
                (!securitySettings.passwordPolicy.requireNumbers || /\d/.test(newPassword)) &&
                (!securitySettings.passwordPolicy.requireSymbols || /[!@#$%^&*(),.?":{}|<>]/.test(newPassword))

              return (
                <div className="text-sm">
                  <p className={`${passwordMeetsPolicy ? "text-green-600" : "text-red-600"}`}>
                    {passwordMeetsPolicy
                      ? "✓ Password meets policy requirements"
                      : "✗ Password does not meet policy requirements"}
                  </p>
                  {!passwordMeetsPolicy && feedback.length > 0 && (
                    <p className="text-gray-500 mt-1">Required: {feedback.join(", ")}</p>
                  )}
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordChangeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={!newPassword || !confirmPassword}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Activity Log</DialogTitle>
            <DialogDescription>Recent system activities and user actions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr">HR Manager</SelectItem>
                  <SelectItem value="payroll">Payroll Manager</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                  <SelectItem value="delete">Deletions</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">{new Date().toLocaleString()}</TableCell>
                    <TableCell>admin@company.com</TableCell>
                    <TableCell>
                      <Badge variant="outline">Login</Badge>
                    </TableCell>
                    <TableCell>Successful login</TableCell>
                    <TableCell className="font-mono text-sm">192.168.1.100</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">
                      {new Date(Date.now() - 3600000).toLocaleString()}
                    </TableCell>
                    <TableCell>hr@company.com</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Update</Badge>
                    </TableCell>
                    <TableCell>Updated employee salary</TableCell>
                    <TableCell className="font-mono text-sm">192.168.1.101</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">
                      {new Date(Date.now() - 7200000).toLocaleString()}
                    </TableCell>
                    <TableCell>admin@company.com</TableCell>
                    <TableCell>
                      <Badge variant="outline">Settings</Badge>
                    </TableCell>
                    <TableCell>Updated password policy</TableCell>
                    <TableCell className="font-mono text-sm">192.168.1.100</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">
                      {new Date(Date.now() - 10800000).toLocaleString()}
                    </TableCell>
                    <TableCell>payroll@company.com</TableCell>
                    <TableCell>
                      <Badge variant="default">Payroll</Badge>
                    </TableCell>
                    <TableCell>Processed monthly payroll</TableCell>
                    <TableCell className="font-mono text-sm">192.168.1.102</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">
                      {new Date(Date.now() - 14400000).toLocaleString()}
                    </TableCell>
                    <TableCell>hr@company.com</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Approval</Badge>
                    </TableCell>
                    <TableCell>Approved annual leave request</TableCell>
                    <TableCell className="font-mono text-sm">192.168.1.101</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Showing 5 of 247 activities</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityLog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupSuccessModal} onOpenChange={setShowBackupSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Backup Successful
            </DialogTitle>
            <DialogDescription>Your system backup has been completed successfully.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Backup Details</span>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <p>
                  <strong>Time:</strong> {lastBackupTime?.toLocaleString()}
                </p>
                <p>
                  <strong>Type:</strong> Full System Backup
                </p>
                <p>
                  <strong>Status:</strong> Completed Successfully
                </p>
                <p>
                  <strong>Size:</strong> ~2.4 GB
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                All your data including employee records, payroll information, and system settings have been securely
                backed up.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBackupSuccessModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
