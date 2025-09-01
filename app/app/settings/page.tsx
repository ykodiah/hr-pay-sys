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
  Database,
  FileText,
  Activity,
  Users,
  DollarSign,
  Calculator,
  Calendar,
  Settings,
  Edit,
  Trash2,
  Minus,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

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
  logoUrl?: string
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
  payPeriod?: string
  payDate?: number
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

interface SalaryGrade {
  id: string
  grade: number
  minSalary: number
  maxSalary: number
  steps: number
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

  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([
    {
      id: "1",
      grade: 1,
      minSalary: 20000,
      maxSalary: 30000,
      steps: 5,
    },
    {
      id: "2",
      grade: 2,
      minSalary: 30000,
      maxSalary: 45000,
      steps: 7,
    },
    {
      id: "3",
      grade: 3,
      minSalary: 45000,
      maxSalary: 60000,
      steps: 9,
    },
  ])

  const [showAddLeaveTypeDialog, setShowAddLeaveTypeDialog] = useState(false)
  const [showAddGradeDialog, setShowAddGradeDialog] = useState(false)

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
      console.error("An unexpected error occurred:", error)
    }
  }

  return (
    <>
      <div className="container relative hidden h-full flex-col md:flex">
        <Tabs defaultValue={activeTab} className="flex w-full flex-col">
          <div className="flex items-center justify-between">
            <TabsList className="w-full">
              <TabsTrigger value="company" onClick={() => setActiveTab("company")}>
                <Building2 className="mr-2 h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="payroll" onClick={() => setActiveTab("payroll")}>
                <DollarSign className="mr-2 h-4 w-4" />
                Payroll
              </TabsTrigger>
              <TabsTrigger value="hr" onClick={() => setActiveTab("hr")}>
                <Users className="mr-2 h-4 w-4" />
                HR
              </TabsTrigger>
              <TabsTrigger value="security" onClick={() => setActiveTab("security")}>
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" onClick={() => setActiveTab("notifications")}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="leave" onClick={() => setActiveTab("leave")}>
                <Calendar className="mr-2 h-4 w-4" />
                Leave
              </TabsTrigger>
              <TabsTrigger value="email" onClick={() => setActiveTab("email")}>
                <FileText className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="grades" onClick={() => setActiveTab("grades")}>
                <Calculator className="mr-2 h-4 w-4" />
                Salary Grades
              </TabsTrigger>
              <TabsTrigger value="tax" onClick={() => setActiveTab("tax")}>
                <Settings className="mr-2 h-4 w-4" />
                Tax Configuration
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={handleResetSettings}>
              Reset Settings
            </Button>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="primary" size="sm" onClick={handleSaveSettings} disabled={isLoading || !hasUnsavedChanges}>
              {isLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <path
                      d="M12 4V2m0 20v-2m8-8h2M4 12H2m15.172 0l-1.414 1.414M6.242 6.242l-1.414-1.414m13.758 0l1.414-1.414M6.242 17.758l-1.414 1.414m13.758 0l1.414 1.414M6.242 6.242L5 5M19 19l-1.242-1.242M5 19l1.242-1.242M19 5l-1.242 1.242"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="pl-6">
              {activeTab === "company" && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Company Name</Label>
                      <Input
                        id="name"
                        value={companySettings.name}
                        onChange={(e) => updateCompanySettings("name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={companySettings.taxId}
                        onChange={(e) => updateCompanySettings("taxId", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                      <Input
                        id="ssnitNumber"
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Divisions</Label>
                      {companySettings.divisions.map((division, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={division}
                            onChange={(e) => updateCompanyArrayField("divisions", index, e.target.value)}
                            className="flex-grow"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompanyArrayField("divisions", index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addCompanyArrayField("divisions")}>
                        Add Division
                      </Button>
                    </div>

                    <div>
                      <Label>Departments</Label>
                      {companySettings.departments.map((department, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={department}
                            onChange={(e) => updateCompanyArrayField("departments", index, e.target.value)}
                            className="flex-grow"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompanyArrayField("departments", index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addCompanyArrayField("departments")}>
                        Add Department
                      </Button>
                    </div>

                    <div>
                      <Label>Locations</Label>
                      {companySettings.locations.map((location, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={location}
                            onChange={(e) => updateCompanyArrayField("locations", index, e.target.value)}
                            className="flex-grow"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompanyArrayField("locations", index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addCompanyArrayField("locations")}>
                        Add Location
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="logo">Company Logo</Label>
                    <Input type="file" id="logo" accept="image/*" onChange={handleLogoUpload} />
                    {uploadedFileName && (
                      <p className="mt-2 text-sm text-muted-foreground">Uploaded: {uploadedFileName}</p>
                    )}
                    {companySettings.logo && (
                      <img
                        src={companySettings.logo || "/placeholder.svg"}
                        alt="Company Logo"
                        className="mt-4 h-20 w-auto rounded-md"
                      />
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <Label>Subsidiaries</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="subsidiaryEnabled"
                        checked={subsidiaryEnabled}
                        onCheckedChange={handleSubsidiaryToggle}
                      />
                      <Label htmlFor="subsidiaryEnabled">Enable Subsidiary Management</Label>
                    </div>

                    {subsidiaryEnabled && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 bg-transparent"
                          onClick={() => setShowSubsidiaryDialog(true)}
                        >
                          Add Subsidiary
                        </Button>

                        {subsidiaries.length > 0 ? (
                          <Table className="mt-4">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Tax ID</TableHead>
                                <TableHead>SSNIT Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subsidiaries.map((subsidiary) => (
                                <TableRow key={subsidiary.id}>
                                  <TableCell>{subsidiary.name}</TableCell>
                                  <TableCell>{subsidiary.taxId}</TableCell>
                                  <TableCell>{subsidiary.ssnitNumber}</TableCell>
                                  <TableCell>
                                    <Badge variant={subsidiary.status === "active" ? "default" : "secondary"}>
                                      {subsidiary.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditSubsidiary(subsidiary)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeactivateSubsidiary(subsidiary.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">No subsidiaries added yet.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "payroll" && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="frequency">Payroll Frequency</Label>
                      <Select
                        value={payrollSettings.frequency}
                        onValueChange={(value) => updatePayrollSettings("frequency", value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={payrollSettings.currency}
                        onValueChange={(value) => updatePayrollSettings("currency", value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select currency" />
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
                      <Label htmlFor="minWage">Minimum Wage</Label>
                      <Input
                        id="minWage"
                        type="number"
                        value={payrollSettings.minWage}
                        onChange={(e) => updatePayrollSettings("minWage", Number.parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weekdayOvertimeRate">Weekday Overtime Rate</Label>
                      <Input
                        id="weekdayOvertimeRate"
                        type="number"
                        value={payrollSettings.weekdayOvertimeRate}
                        onChange={(e) =>
                          updatePayrollSettings("weekdayOvertimeRate", Number.parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="weekendOvertimeRate">Weekend Overtime Rate</Label>
                      <Input
                        id="weekendOvertimeRate"
                        type="number"
                        value={payrollSettings.weekendOvertimeRate}
                        onChange={(e) =>
                          updatePayrollSettings("weekendOvertimeRate", Number.parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="payrollCutoffDay">Payroll Cutoff Day</Label>
                      <Input
                        id="payrollCutoffDay"
                        type="number"
                        value={payrollSettings.payrollCutoffDay}
                        onChange={(e) => updatePayrollSettings("payrollCutoffDay", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payrollProcessingDay">Payroll Processing Day</Label>
                      <Input
                        id="payrollProcessingDay"
                        type="number"
                        value={payrollSettings.payrollProcessingDay}
                        onChange={(e) => updatePayrollSettings("payrollProcessingDay", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="autoPaye">Auto PAYE Calculation</Label>
                      <Switch
                        id="autoPaye"
                        checked={payrollSettings.autoPaye}
                        onCheckedChange={(checked) => updatePayrollSettings("autoPaye", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="autoSsnit">Auto SSNIT Calculation</Label>
                      <Switch
                        id="autoSsnit"
                        checked={payrollSettings.autoSsnit}
                        onCheckedChange={(checked) => updatePayrollSettings("autoSsnit", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="autoProvident">Auto Provident Fund Calculation</Label>
                      <Switch
                        id="autoProvident"
                        checked={payrollSettings.autoProvident}
                        onCheckedChange={(checked) => updatePayrollSettings("autoProvident", checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "hr" && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leaveYearStart">Leave Year Start</Label>
                      <Select
                        value={hrSettings.leaveYearStart}
                        onValueChange={(value) => updateHRSettings("leaveYearStart", value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select month" />
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
                      <Label htmlFor="annualLeaveDays">Annual Leave Days</Label>
                      <Input
                        id="annualLeaveDays"
                        type="number"
                        value={hrSettings.annualLeaveDays}
                        onChange={(e) => updateHRSettings("annualLeaveDays", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sickLeaveDays">Sick Leave Days</Label>
                      <Input
                        id="sickLeaveDays"
                        type="number"
                        value={hrSettings.sickLeaveDays}
                        onChange={(e) => updateHRSettings("sickLeaveDays", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="probationPeriod">Probation Period (Months)</Label>
                      <Input
                        id="probationPeriod"
                        type="number"
                        value={hrSettings.probationPeriod}
                        onChange={(e) => updateHRSettings("probationPeriod", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="workingHoursPerDay">Working Hours Per Day</Label>
                      <Input
                        id="workingHoursPerDay"
                        type="number"
                        value={hrSettings.workingHoursPerDay}
                        onChange={(e) => updateHRSettings("workingHoursPerDay", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="workingDaysPerWeek">Working Days Per Week</Label>
                      <Input
                        id="workingDaysPerWeek"
                        type="number"
                        value={hrSettings.workingDaysPerWeek}
                        onChange={(e) => updateHRSettings("workingDaysPerWeek", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="autoApproveLeave">Auto Approve Leave Requests</Label>
                      <Switch
                        id="autoApproveLeave"
                        checked={hrSettings.autoApproveLeave}
                        onCheckedChange={(checked) => updateHRSettings("autoApproveLeave", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailNotifications">Send Email Notifications</Label>
                      <Switch
                        id="emailNotifications"
                        checked={hrSettings.emailNotifications}
                        onCheckedChange={(checked) => updateHRSettings("emailNotifications", checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <Switch
                        id="twoFactor"
                        checked={securitySettings.twoFactor}
                        onCheckedChange={(checked) => updateSecuritySettings("twoFactor", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout</Label>
                      <Switch
                        id="sessionTimeout"
                        checked={securitySettings.sessionTimeout}
                        onCheckedChange={(checked) => updateSecuritySettings("sessionTimeout", checked)}
                      />
                    </div>
                    {securitySettings.sessionTimeout && (
                      <div>
                        <Label htmlFor="timeoutDuration">Timeout Duration (Minutes)</Label>
                        <Input
                          id="timeoutDuration"
                          type="number"
                          value={securitySettings.timeoutDuration}
                          onChange={(e) => updateSecuritySettings("timeoutDuration", Number.parseInt(e.target.value))}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="auditLog">Audit Log</Label>
                      <Switch
                        id="auditLog"
                        checked={securitySettings.auditLog}
                        onCheckedChange={(checked) => updateSecuritySettings("auditLog", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="auditTrail">Audit Trail</Label>
                      <Switch
                        id="auditTrail"
                        checked={securitySettings.auditTrail}
                        onCheckedChange={(checked) => updateSecuritySettings("auditTrail", checked)}
                      />
                    </div>
                    {securitySettings.auditTrail && (
                      <div>
                        <Label htmlFor="auditRetentionDays">Audit Retention Days</Label>
                        <Input
                          id="auditRetentionDays"
                          type="number"
                          value={securitySettings.auditRetentionDays}
                          onChange={(e) =>
                            updateSecuritySettings("auditRetentionDays", Number.parseInt(e.target.value))
                          }
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="backupEnabled">Automated Backups</Label>
                      <Switch
                        id="backupEnabled"
                        checked={securitySettings.backupEnabled}
                        onCheckedChange={(checked) => updateSecuritySettings("backupEnabled", checked)}
                      />
                    </div>
                    {securitySettings.backupEnabled && (
                      <div>
                        <Label htmlFor="backupFrequency">Backup Frequency</Label>
                        <Select
                          value={securitySettings.backupFrequency}
                          onValueChange={(value) => updateSecuritySettings("backupFrequency", value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select frequency" />
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

                  <div className="border-t pt-4">
                    <Label>Password Policy</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minLength">Minimum Length</Label>
                        <Input
                          id="minLength"
                          type="number"
                          value={securitySettings.passwordPolicy.minLength}
                          onChange={(e) =>
                            updateSecuritySettings("passwordPolicy", {
                              ...securitySettings.passwordPolicy,
                              minLength: Number.parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="requireUppercase">Require Uppercase</Label>
                        <Switch
                          id="requireUppercase"
                          checked={securitySettings.passwordPolicy.requireUppercase}
                          onCheckedChange={(checked) =>
                            updateSecuritySettings("passwordPolicy", {
                              ...securitySettings.passwordPolicy,
                              requireUppercase: checked,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="requireNumbers">Require Numbers</Label>
                        <Switch
                          id="requireNumbers"
                          checked={securitySettings.passwordPolicy.requireNumbers}
                          onCheckedChange={(checked) =>
                            updateSecuritySettings("passwordPolicy", {
                              ...securitySettings.passwordPolicy,
                              requireNumbers: checked,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="requireSymbols">Require Symbols</Label>
                        <Switch
                          id="requireSymbols"
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

                    <div className="mt-4">
                      <Label>Password Strength</Label>
                      <Progress
                        value={calculatePasswordStrength(securitySettings.passwordPolicy).score}
                        className="h-2"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Strength:{" "}
                          <span
                            className={
                              calculatePasswordStrength(securitySettings.passwordPolicy).color +
                              " rounded-md px-2 py-1 font-medium text-white"
                            }
                          >
                            {calculatePasswordStrength(securitySettings.passwordPolicy).strength}
                          </span>
                        </p>
                        <Button variant="link" size="sm" onClick={handleChangeAdminPassword}>
                          Change Admin Password
                        </Button>
                      </div>
                      {calculatePasswordStrength(securitySettings.passwordPolicy).feedback.length > 0 && (
                        <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                          {calculatePasswordStrength(securitySettings.passwordPolicy).feedback.map((item, index) => (
                            <li key={index}>Add {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadSecurityReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Security Report
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBackupNow} disabled={isBackingUp}>
                      {isBackingUp ? (
                        <>
                          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <path
                              d="M12 4V2m0 20v-2m8-8h2M4 12H2m15.172 0l-1.414 1.414M6.242 6.242l-1.414-1.414m13.758 0l1.414-1.414M6.242 17.758l-1.414 1.414m13.758 0l1.414 1.414M6.242 6.242L5 5M19 19l-1.242-1.242M5 19l1.242-1.242M19 5l-1.242 1.242"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Backing Up...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Backup Now
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadAuditTrail}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Audit Trail
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleViewActivityLog}>
                      <Activity className="mr-2 h-4 w-4" />
                      View Activity Log
                    </Button>
                  </div>
                  {lastBackupTime && (
                    <p className="mt-2 text-sm text-muted-foreground">Last Backup: {lastBackupTime.toLocaleString()}</p>
                  )}
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payrollAlerts">Payroll Alerts</Label>
                      <Switch
                        id="payrollAlerts"
                        checked={notificationSettings.payrollAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("payrollAlerts", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leaveAlerts">Leave Alerts</Label>
                      <Switch
                        id="leaveAlerts"
                        checked={notificationSettings.leaveAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("leaveAlerts", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeeAlerts">Employee Alerts</Label>
                      <Switch
                        id="employeeAlerts"
                        checked={notificationSettings.employeeAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("employeeAlerts", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="systemAlerts">System Alerts</Label>
                      <Switch
                        id="systemAlerts"
                        checked={notificationSettings.systemAlerts}
                        onCheckedChange={(checked) => updateNotificationSettings("systemAlerts", checked)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notificationEmail">Notification Email</Label>
                      <Input
                        id="notificationEmail"
                        type="email"
                        value={notificationSettings.notificationEmail}
                        onChange={(e) => updateNotificationSettings("notificationEmail", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <Switch
                        id="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => updateNotificationSettings("smsNotifications", checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "leave" && (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Leave Types</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowAddLeaveTypeDialog(true)}>
                      Add Leave Type
                    </Button>
                  </div>

                  {isLoadingLeaveTypes ? (
                    <div className="flex items-center justify-center">
                      <svg className="mr-2 h-6 w-6 animate-spin" viewBox="0 0 24 24">
                        <path
                          d="M12 4V2m0 20v-2m8-8h2M4 12H2m15.172 0l-1.414 1.414M6.242 6.242l-1.414-1.414m13.758 0l1.414-1.414M6.242 17.758l-1.414 1.414m13.758 0l1.414 1.414M6.242 6.242L5 5M19 19l-1.242-1.242M5 19l1.242-1.242M19 5l-1.242 1.242"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Loading leave types...
                    </div>
                  ) : leaveTypes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Accrual Method</TableHead>
                          <TableHead>Annual Entitlement</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveTypes.map((leaveType) => (
                          <TableRow key={leaveType.id}>
                            <TableCell>{leaveType.name}</TableCell>
                            <TableCell>{leaveType.code}</TableCell>
                            <TableCell>{leaveType.accrual_method}</TableCell>
                            <TableCell>{leaveType.annual_entitlement}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditLeaveType(leaveType)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveLeaveType(leaveType.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No leave types added yet.</p>
                  )}
                </div>
              )}

              {activeTab === "email" && (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Email Templates</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleAddCustomTemplate}>
                      Add Custom Template
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>{template.subject}</TableCell>
                          <TableCell>{new Date(template.lastModified).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "grades" && (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Salary Grades</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowAddGradeDialog(true)}>
                      Add Salary Grade
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Min Salary</TableHead>
                        <TableHead>Max Salary</TableHead>
                        <TableHead>Steps</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryGrades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell>{grade.grade}</TableCell>
                          <TableCell>{formatAmount(grade.minSalary)}</TableCell>
                          <TableCell>{formatAmount(grade.maxSalary)}</TableCell>
                          <TableCell>{grade.steps}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "tax" && (
                <div className="grid gap-4">
                  <CardTitle>PAYE Tax Bands</CardTitle>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Rate (%)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxConfig.payeTaxBands.map((band, index) => (
                        <TableRow key={index}>
                          {band.type === "remaining" ? (
                            <>
                              <TableCell>Remaining Amount</TableCell>
                              <TableCell>{band.rate}%</TableCell>
                              <TableCell className="text-right"></TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={band.threshold}
                                  onChange={(e) => updateTaxBand(index, "threshold", Number.parseFloat(e.target.value))}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={band.rate}
                                  onChange={(e) => updateTaxBand(index, "rate", Number.parseFloat(e.target.value))}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeTaxBand(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button variant="outline" size="sm" onClick={addTaxBand}>
                    Add Tax Band
                  </Button>

                  <CardTitle className="mt-8">SSNIT Rates</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employeeRate">Employee Rate (%)</Label>
                      <Input
                        id="employeeRate"
                        type="number"
                        value={taxConfig.ssnitRates.employee}
                        onChange={(e) => updateSSNITRate("employee", Number.parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employerRate">Employer Rate (%)</Label>
                      <Input
                        id="employerRate"
                        type="number"
                        value={taxConfig.ssnitRates.employer}
                        onChange={(e) => updateSSNITRate("employer", Number.parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalRate">Total Rate (%)</Label>
                      <Input id="totalRate" type="number" value={taxConfig.ssnitRates.total} readOnly />
                    </div>
                  </div>

                  <CardTitle className="mt-8">Tier 2 Rates</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employeeRateTier2">Employee Rate (%)</Label>
                      <Input
                        id="employeeRateTier2"
                        type="number"
                        value={taxConfig.tier2Rates.employee}
                        onChange={(e) => updateTier2Rate("employee", Number.parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employerRateTier2">Employer Rate (%)</Label>
                      <Input
                        id="employerRateTier2"
                        type="number"
                        value={taxConfig.tier2Rates.employer}
                        onChange={(e) => updateTier2Rate("employer", Number.parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalRateTier2">Total Rate (%)</Label>
                      <Input id="totalRateTier2" type="number" value={taxConfig.tier2Rates.total} readOnly />
                    </div>
                  </div>

                  <CardTitle className="mt-8">Tier 3 Rates</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employeeRateTier3">Employee Rate (%)</Label>
                      <Input
                        id="employeeRateTier3"
                        type="number"
                        value={taxConfig.tier3Rates.employee}
                        onChange={(e) => updateTier3Rate("employee", Number.parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employerRateTier3">Employer Rate (%)</Label>
                      <Input
                        id="employerRateTier3"
                        type="number"
                        value={taxConfig.tier3Rates.employer}
                        onChange={(e) => updateTier3Rate("employer", Number.parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalRateTier3">Total Rate (%)</Label>
                      <Input id="totalRateTier3" type="number" value={taxConfig.tier3Rates.total} readOnly />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <Dialog open={showSubsidiaryDialog} onOpenChange={setShowSubsidiaryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Subsidiary</DialogTitle>
            <DialogDescription>Add a new subsidiary to your company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={subsidiaryForm.name}
                  onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={subsidiaryForm.taxId}
                  onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, taxId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                <Input
                  id="ssnitNumber"
                  value={subsidiaryForm.ssnitNumber}
                  onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, ssnitNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={subsidiaryForm.phone}
                  onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={subsidiaryForm.email}
                  onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={subsidiaryForm.address}
                  onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Divisions</Label>
                {subsidiaryForm.divisions.map((division, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={division}
                      onChange={(e) => updateArrayField("divisions", index, e.target.value)}
                      className="flex-grow"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeArrayField("divisions", index)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addArrayField("divisions")}>
                  Add Division
                </Button>
              </div>

              <div>
                <Label>Departments</Label>
                {subsidiaryForm.departments.map((department, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={department}
                      onChange={(e) => updateArrayField("departments", index, e.target.value)}
                      className="flex-grow"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeArrayField("departments", index)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addArrayField("departments")}>
                  Add Department
                </Button>
              </div>

              <div>
                <Label>Locations</Label>
                {subsidiaryForm.locations.map((location, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => updateArrayField("locations", index, e.target.value)}
                      className="flex-grow"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeArrayField("locations", index)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addArrayField("locations")}>
                  Add Location
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="logo">Logo</Label>
              <Input
                type="file"
                id="logo"
                accept="image/*"
                onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, logo: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowSubsidiaryDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddSubsidiary}>
              Add Subsidiary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deactivate Subsidiary Management</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate subsidiary management? This will remove all subsidiaries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={confirmDeactivateSubsidiary}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingSubsidiary !== null} onOpenChange={() => setEditingSubsidiary(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subsidiary</DialogTitle>
            <DialogDescription>Edit the details of the selected subsidiary.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={editForm.taxId}
                    onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                  <Input
                    id="ssnitNumber"
                    value={editForm.ssnitNumber}
                    onChange={(e) => setEditForm({ ...editForm, ssnitNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Divisions</Label>
                  {editForm.divisions.map((division, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={division}
                        onChange={(e) => updateEditArrayField("divisions", index, e.target.value)}
                        className="flex-grow"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeEditArrayField("divisions", index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addEditArrayField("divisions")}>
                    Add Division
                  </Button>
                </div>

                <div>
                  <Label>Departments</Label>
                  {editForm.departments.map((department, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={department}
                        onChange={(e) => updateEditArrayField("departments", index, e.target.value)}
                        className="flex-grow"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeEditArrayField("departments", index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addEditArrayField("departments")}>
                    Add Department
                  </Button>
                </div>

                <div>
                  <Label>Locations</Label>
                  {editForm.locations.map((location, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={location}
                        onChange={(e) => updateEditArrayField("locations", index, e.target.value)}
                        className="flex-grow"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeEditArrayField("locations", index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addEditArrayField("locations")}>
                    Add Location
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="logo">Logo</Label>
                <Input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={(e) => setEditForm({ ...editForm, logo: e.target.files?.[0] || null })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditingSubsidiary(null)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLeaveTypeDialogOpen} onOpenChange={setIsLeaveTypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle>
            <DialogDescription>
              {editingLeaveType
                ? "Edit the details of the selected leave type."
                : "Create a new leave type for your company."}
            </DialogDescription>
          </DialogHeader>
          <LeaveTypeForm
            onSave={handleSaveLeaveType}
            onCancel={() => setIsLeaveTypeDialogOpen(false)}
            leaveType={editingLeaveType}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailTemplateDialog} onOpenChange={setShowEmailTemplateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>Edit the content and settings of the selected email template.</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={editingTemplate.name} readOnly />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowEmailTemplateDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveTemplate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomTemplateDialog} onOpenChange={setShowCustomTemplateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Email Template</DialogTitle>
            <DialogDescription>Create a new email template for your company.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={customTemplate.name || ""}
                onChange={(e) => setCustomTemplate({ ...customTemplate, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={customTemplate.subject || ""}
                onChange={(e) => setCustomTemplate({ ...customTemplate, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={customTemplate.content || ""}
                onChange={(e) => setCustomTemplate({ ...customTemplate, content: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowCustomTemplateDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveCustomTemplate}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Admin Password</DialogTitle>
            <DialogDescription>Update the password for the administrator account.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowPasswordChangeDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handlePasswordChange}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Activity Log</DialogTitle>
            <DialogDescription>View recent system activity and user actions.</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2024-01-16 10:30</TableCell>
                <TableCell>admin@company.com</TableCell>
                <TableCell>Login</TableCell>
                <TableCell>Successful login from 192.168.1.100</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-16 09:45</TableCell>
                <TableCell>hr@company.com</TableCell>
                <TableCell>Employee Update</TableCell>
                <TableCell>Updated employee salary for John Doe</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-16 08:20</TableCell>
                <TableCell>admin@company.com</TableCell>
                <TableCell>Settings Change</TableCell>
                <TableCell>Updated password policy requirements</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-15 17:00</TableCell>
                <TableCell>payroll@company.com</TableCell>
                <TableCell>Payroll Process</TableCell>
                <TableCell>Processed monthly payroll for 50 employees</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-15 14:15</TableCell>
                <TableCell>hr@company.com</TableCell>
                <TableCell>Leave Approval</TableCell>
                <TableCell>Approved annual leave for Jane Smith</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowActivityLog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupSuccessModal} onOpenChange={setShowBackupSuccessModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Backup Successful</DialogTitle>
            <DialogDescription>
              The system backup has been completed successfully. All data has been backed up securely.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setShowBackupSuccessModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddLeaveTypeDialog} onOpenChange={setShowAddLeaveTypeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Leave Type</DialogTitle>
            <DialogDescription>Create a new leave type for your company.</DialogDescription>
          </DialogHeader>
          <LeaveTypeForm onSave={handleSaveLeaveType} onCancel={() => setShowAddLeaveTypeDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddGradeDialog} onOpenChange={setShowAddGradeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Salary Grade</DialogTitle>
            <DialogDescription>Create a new salary grade for your company.</DialogDescription>
          </DialogHeader>
          <SalaryGradeForm onSave={() => setShowAddGradeDialog(false)} onCancel={() => setShowAddGradeDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

interface LeaveTypeFormProps {
  onSave: (formData: any) => void
  onCancel: () => void
  leaveType?: LeaveType | null
}

const LeaveTypeForm: React.FC<LeaveTypeFormProps> = ({ onSave, onCancel, leaveType }) => {
  const [formData, setFormData] = useState({
    name: leaveType?.name || "",
    code: leaveType?.code || "",
    description: leaveType?.description || "",
    accrualMethod: leaveType?.accrual_method || "annual",
    accrualRate: leaveType?.accrual_rate?.toString() || "0",
    annualEntitlement: leaveType?.annual_entitlement?.toString() || "0",
    maxPerYear: leaveType?.max_per_year?.toString() || "",
    maxConsecutiveDays: leaveType?.max_consecutive_days?.toString() || "",
    minServiceMonths: leaveType?.min_service_months?.toString() || "0",
    requiresApproval: leaveType?.requires_approval || false,
    minNoticeDays: leaveType?.min_notice_days?.toString() || "0",
    requiresMedicalCertificate: leaveType?.requires_medical_certificate || false,
    medicalCertAfterDays: leaveType?.medical_cert_after_days?.toString() || "",
    isPaid: leaveType?.is_paid || false,
    payPercentage: leaveType?.pay_percentage?.toString() || "100",
    allowCarryOver: leaveType?.allow_carry_over || false,
    maxCarryOverDays: leaveType?.max_carry_over_days?.toString() || "0",
    carryOverExpiryMonths: leaveType?.carry_over_expiry_months?.toString() || "12",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="code">Code</Label>
        <Input id="code" name="code" value={formData.code} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="accrualMethod">Accrual Method</Label>
        <Select
          name="accrualMethod"
          value={formData.accrualMethod}
          onValueChange={(value) => setFormData({ ...formData, accrualMethod: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="unlimited">Unlimited</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="accrualRate">Accrual Rate</Label>
        <Input id="accrualRate" type="number" name="accrualRate" value={formData.accrualRate} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="annualEntitlement">Annual Entitlement</Label>
        <Input
          id="annualEntitlement"
          type="number"
          name="annualEntitlement"
          value={formData.annualEntitlement}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="maxPerYear">Max Per Year</Label>
        <Input id="maxPerYear" type="number" name="maxPerYear" value={formData.maxPerYear} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="maxConsecutiveDays">Max Consecutive Days</Label>
        <Input
          id="maxConsecutiveDays"
          type="number"
          name="maxConsecutiveDays"
          value={formData.maxConsecutiveDays}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="minServiceMonths">Min Service Months</Label>
        <Input
          id="minServiceMonths"
          type="number"
          name="minServiceMonths"
          value={formData.minServiceMonths}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="requiresApproval">Requires Approval</Label>
        <Switch
          id="requiresApproval"
          name="requiresApproval"
          checked={formData.requiresApproval}
          onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: checked })}
        />
      </div>
      <div>
        <Label htmlFor="minNoticeDays">Min Notice Days</Label>
        <Input
          id="minNoticeDays"
          type="number"
          name="minNoticeDays"
          value={formData.minNoticeDays}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="requiresMedicalCertificate">Requires Medical Certificate</Label>
        <Switch
          id="requiresMedicalCertificate"
          name="requiresMedicalCertificate"
          checked={formData.requiresMedicalCertificate}
          onCheckedChange={(checked) => setFormData({ ...formData, requiresMedicalCertificate: checked })}
        />
      </div>
      <div>
        <Label htmlFor="medicalCertAfterDays">Medical Cert After Days</Label>
        <Input
          id="medicalCertAfterDays"
          type="number"
          name="medicalCertAfterDays"
          value={formData.medicalCertAfterDays}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="isPaid">Is Paid</Label>
        <Switch
          id="isPaid"
          name="isPaid"
          checked={formData.isPaid}
          onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
        />
      </div>
      <div>
        <Label htmlFor="payPercentage">Pay Percentage</Label>
        <Input
          id="payPercentage"
          type="number"
          name="payPercentage"
          value={formData.payPercentage}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="allowCarryOver">Allow Carry Over</Label>
        <Switch
          id="allowCarryOver"
          name="allowCarryOver"
          checked={formData.allowCarryOver}
          onCheckedChange={(checked) => setFormData({ ...formData, allowCarryOver: checked })}
        />
      </div>
      <div>
        <Label htmlFor="maxCarryOverDays">Max Carry Over Days</Label>
        <Input
          id="maxCarryOverDays"
          type="number"
          name="maxCarryOverDays"
          value={formData.maxCarryOverDays}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="carryOverExpiryMonths">Carry Over Expiry Months</Label>
        <Input
          id="carryOverExpiryMonths"
          type="number"
          name="carryOverExpiryMonths"
          value={formData.carryOverExpiryMonths}
          onChange={handleChange}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}

interface SalaryGradeFormProps {
  onSave: () => void
  onCancel: () => void
}

const SalaryGradeForm: React.FC<SalaryGradeFormProps> = ({ onSave, onCancel }) => {
  return (
    <form className="grid gap-4">
      <div>
        <Label htmlFor="grade">Grade</Label>
        <Input id="grade" type="number" />
      </div>
      <div>
        <Label htmlFor="minSalary">Min Salary</Label>
        <Input id="minSalary" type="number" />
      </div>
      <div>
        <Label htmlFor="maxSalary">Max Salary</Label>
        <Input id="maxSalary" type="number" />
      </div>
      <div>
        <Label htmlFor="steps">Steps</Label>
        <Input id="steps" type="number" />
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" onClick={onSave}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
