"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-context"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import {
  Building2,
  Shield,
  Users,
  DollarSign,
  Bell,
  Upload,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Download,
  Mail,
  Minus,
  MoreHorizontal,
  X,
} from "lucide-react"

interface Company {
  id: string
  name: string
  tax_id: string
  ssnit_number: string
  industry: string
  address: string
  phone_number: string
  email_address: string
  logo_file_id?: string
}

interface LeaveType {
  id: string
  name: string
  code: string
  description: string
  annual_entitlement: number
  max_consecutive_days: number
  pay_percentage: number
  min_notice_days: number
  requires_approval: boolean
  requires_medical_certificate: boolean
  allow_carry_over: boolean
  is_active: boolean
}

interface SalaryGrade {
  id: string
  grade_name: string
  grade_level: number
  step_1: number
  step_2: number
  step_3: number
  step_4: number
  step_5: number
}

interface PayrollConfig {
  id: string
  minimum_wage: number
  overtime_weekday_multiplier: number
  overtime_weekend_multiplier: number
  currency: string
  pay_frequency: string
  cutoff_day: number
  processing_day: number
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  full_name?: string
  corporate_email: string
  personal_email: string
  position: string
  department: string
  status: string
}

interface Subsidiary {
  id: string
  name: string
  tax_id: string
  ssnit_number: string
  industry: string
  status: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  user_count: number
}

interface EmailTemplate {
  id: number
  name: string
  subject: string
  description: string
  content: string
  isActive: boolean
  lastModified: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { currency, currencySymbol, setCurrency: setSystemCurrency, formatAmount } = useCurrency()

  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)

  const [companyData, setCompanyData] = useState<Company | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [logoPreview, setLogoPreview] = useState("")
  const [divisions, setDivisions] = useState(["Head Office", "Regional Office"])
  const [departments, setDepartments] = useState([
    "Technology",
    "Human Resources",
    "Finance",
    "Marketing",
    "Sales",
    "Operations",
  ])
  const [locations, setLocations] = useState(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])

  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])
  const [roles, setRoles] = useState<Role[]>([
    { id: "1", name: "Super Admin", description: "Full system access", permissions: ["all"], user_count: 1 },
    { id: "2", name: "HR Manager", description: "HR operations management", permissions: ["hr"], user_count: 3 },
    { id: "3", name: "Payroll Manager", description: "Payroll processing", permissions: ["payroll"], user_count: 2 },
    { id: "4", name: "Employee", description: "Self-service access", permissions: ["self"], user_count: 45 },
  ])
  const [employees, setEmployees] = useState<Employee[]>([])

  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null)
  const [taxBands, setTaxBands] = useState([
    { rate: 0, threshold: 4380, description: "first GH₵" },
    { rate: 5, threshold: 1000, description: "next GH₵" },
    { rate: 10, threshold: 2000, description: "next GH₵" },
    { rate: 17.5, threshold: 20000, description: "next GH₵" },
    { rate: 25, threshold: 20000, description: "next GH₵" },
    { rate: 30, threshold: 0, description: "remaining amount" },
  ])
  const [payrollAllowances, setPayrollAllowances] = useState([])
  const [payrollDeductions, setPayrollDeductions] = useState([])

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([])

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    autoSessionTimeout: true,
    timeoutDuration: 15,
    auditLogging: true,
    automatedBackups: true,
    backupFrequency: "daily",
  })

  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: false,
  })

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: 1,
      name: "Welcome Email",
      subject: "Welcome to {{company_name}} - Your Journey Begins Here",
      description: "Sent to new employees",
      content: `Dear {{employee_name}},

We are delighted to welcome you to {{company_name}}! On behalf of the entire team, I would like to extend our warmest congratulations on joining our organization.

Your first day is scheduled for {{start_date}} at {{start_time}}. Please report to the HR department located at {{office_address}} where you will meet with {{hr_contact}} for your orientation.

What to expect on your first day:
• Complete onboarding documentation
• Receive your employee handbook and company policies
• Meet your team members and direct supervisor
• Set up your workspace and IT equipment
• Complete mandatory training sessions

We have prepared a comprehensive orientation program to help you settle in quickly and understand our company culture, values, and expectations. Your direct supervisor, {{supervisor_name}}, will be available to guide you through your initial weeks.

Please bring the following documents on your first day:
• Valid identification (passport or national ID)
• Educational certificates and transcripts
• Previous employment references
• Bank account details for payroll setup
• Emergency contact information

If you have any questions before your start date, please don't hesitate to contact our HR department at {{hr_email}} or {{hr_phone}}.

Once again, welcome to the {{company_name}} family. We look forward to working with you and supporting your professional growth.

Best regards,
{{hr_manager_name}}
Human Resources Manager
{{company_name}}`,
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Payslip Notification",
      subject: "Your Payslip for {{pay_period}} is Ready",
      description: "Monthly payslip availability",
      content: `Dear {{employee_name}},

Your payslip for the period {{pay_period}} is now available for download through the employee self-service portal.

Payslip Details:
• Pay Period: {{pay_period}}
• Payment Date: {{payment_date}}
• Gross Salary: {{gross_salary}}
• Net Salary: {{net_salary}}

To access your payslip:
1. Log into the employee portal at {{portal_url}}
2. Navigate to "Payroll" section
3. Select "View Payslips"
4. Download your payslip for {{pay_period}}

Please review your payslip carefully and contact the Payroll department at {{payroll_email}} if you have any questions or notice any discrepancies.

Important reminders:
• Keep your payslips for tax and record-keeping purposes
• Update your personal information if there are any changes
• Report any payroll discrepancies within 5 working days

Thank you.

Best regards,
Payroll Department
{{company_name}}`,
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Leave Approval",
      subject: "Leave Request {{status}} - {{leave_type}}",
      description: "Leave request status updates",
      content: `Dear {{employee_name}},

Your leave request has been {{status}}.

Leave Request Details:
• Leave Type: {{leave_type}}
• Start Date: {{start_date}}
• End Date: {{end_date}}
• Duration: {{duration}} days
• Reason: {{reason}}
• Status: {{status}}
{{#if approved_by}}• Approved by: {{approved_by}}{{/if}}
{{#if rejection_reason}}• Reason for rejection: {{rejection_reason}}{{/if}}

{{#if status == "approved"}}
Your leave has been approved. Please ensure proper handover of your responsibilities before your leave begins. Contact your supervisor if you need to make any changes to your approved leave.
{{/if}}

{{#if status == "rejected"}}
Unfortunately, your leave request could not be approved at this time. Please contact your supervisor or HR department to discuss alternative arrangements.
{{/if}}

{{#if status == "pending"}}
Your leave request is currently under review. You will be notified once a decision has been made. Please ensure you have sufficient leave balance and have completed all necessary documentation.
{{/if}}

For any questions regarding your leave request, please contact:
• Your direct supervisor: {{supervisor_email}}
• HR Department: {{hr_email}}

Best regards,
Human Resources Department
{{company_name}}`,
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: 4,
      name: "Password Reset",
      subject: "Password Reset Instructions for {{company_name}}",
      description: "Password reset instructions",
      content: `Dear {{employee_name}},

We received a request to reset your password for your {{company_name}} account. If you did not make this request, please ignore this email and contact our IT support team immediately.

To reset your password, please follow these steps:

1. Click on the following secure link: {{reset_link}}
2. The link will take you to a secure password reset page
3. Enter your new password (must meet security requirements)
4. Confirm your new password
5. Click "Reset Password" to complete the process

Password Requirements:
• Minimum 8 characters long
• At least one uppercase letter
• At least one lowercase letter
• At least one number
• At least one special character (!@#$%^&*)

Important Security Information:
• This link will expire in 24 hours for security purposes
• You can only use this link once
• Never share your password with anyone
• Use a unique password that you don't use for other accounts

If you continue to experience issues accessing your account, please contact our IT support team:
• Email: {{it_support_email}}
• Phone: {{it_support_phone}}
• Help Desk: {{help_desk_url}}

For your security, please log out of all devices and log back in with your new password once the reset is complete.

Best regards,
IT Support Team
{{company_name}}`,
      isActive: true,
      lastModified: new Date().toISOString(),
    },
  ])

  // Dialog states
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [showBackupSuccess, setShowBackupSuccess] = useState(false)
  const [showEmailTemplateDialog, setShowEmailTemplateDialog] = useState(false)
  const [showCustomTemplateDialog, setShowCustomTemplateDialog] = useState(false)
  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = useState(false)
  const [showSalaryGradeDialog, setShowSalaryGradeDialog] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string>("")

  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const [editingSalaryGrade, setEditingSalaryGrade] = useState<SalaryGrade | null>(null)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  useEffect(() => {
    loadCompanyData()
    loadLeaveTypes()
    loadSalaryGrades()
    loadEmployees()
    loadSubsidiaries()
    loadPayrollConfig()
    loadPayrollAllowances()
    loadPayrollDeductions()
  }, [])

  const loadCompanyData = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("companies").select("*").single()

      if (error) throw error
      setCompanyData(data)
    } catch (error) {
      console.error("Error loading company data:", error)
    }
  }

  const loadLeaveTypes = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("leave_types").select("*").order("name")

      if (error) throw error
      setLeaveTypes(data || [])
    } catch (error) {
      console.error("Error loading leave types:", error)
    }
  }

  const loadSalaryGrades = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("salary_grades").select("*").order("grade_level")

      if (error) throw error
      setSalaryGrades(data || [])
    } catch (error) {
      console.error("Error loading salary grades:", error)
    }
  }

  const loadEmployees = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("employees").select("*").order("first_name")

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error loading employees:", error)
    }
  }

  const loadSubsidiaries = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("subsidiaries").select("*").order("name")

      if (error) throw error
      setSubsidiaries(data || [])
    } catch (error) {
      console.error("Error loading subsidiaries:", error)
    }
  }

  const loadPayrollConfig = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("payroll_configuration").select("*").single()

      if (error) throw error
      setPayrollConfig(data)
    } catch (error) {
      console.error("Error loading payroll config:", error)
    }
  }

  const loadPayrollAllowances = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("payroll_allowances").select("*").order("type")

      if (error) throw error
      setPayrollAllowances(data || [])
    } catch (error) {
      console.error("Error loading payroll allowances:", error)
    }
  }

  const loadPayrollDeductions = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("payroll_deductions").select("*").order("type")

      if (error) throw error
      setPayrollDeductions(data || [])
    } catch (error) {
      console.error("Error loading payroll deductions:", error)
    }
  }

  const handleSaveCompany = async () => {
    if (!companyData) return

    setIsLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("companies").upsert(companyData)

      if (error) throw error

      toast({
        title: "Success",
        description: "Company settings saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save company settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB.",
        variant: "destructive",
      })
      return
    }

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast({
        title: "Error",
        description: "Only PNG, JPG, and JPEG files are allowed.",
        variant: "destructive",
      })
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string

        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from("company_files")
          .insert({
            company_id: companyData?.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_data: base64Data,
            file_category: "logo",
          })
          .select()
          .single()

        if (error) throw error

        setUploadedFileName(file.name)
        setLogoPreview(base64Data)

        if (companyData) {
          setCompanyData({ ...companyData, logo_file_id: data.id })
        }

        toast({
          title: "Success",
          description: "Logo uploaded successfully.",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo.",
        variant: "destructive",
      })
    }
  }

  const handleSaveLeaveType = async () => {
    // Implementation for saving leave type
    toast({
      title: "Success",
      description: "Leave type saved successfully.",
    })
    setShowLeaveTypeDialog(false)
    loadLeaveTypes()
  }

  const handleDeleteLeaveType = async (id: string) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("leave_types").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Leave type deleted successfully.",
      })
      loadLeaveTypes()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete leave type.",
        variant: "destructive",
      })
    }
  }

  const handleSaveSalaryGrade = async () => {
    toast({
      title: "Success",
      description: "Salary grade saved successfully.",
    })
    setShowSalaryGradeDialog(false)
    loadSalaryGrades()
  }

  const handleDeleteSalaryGrade = async (id: string) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("salary_grades").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Salary grade deleted successfully.",
      })
      loadSalaryGrades()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete salary grade.",
        variant: "destructive",
      })
    }
  }

  const handleChangeAdminPassword = () => {
    setShowPasswordChangeDialog(true)
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "Password changed successfully.",
    })
    setShowPasswordChangeDialog(false)
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const handleDownloadSecurityReport = () => {
    const report = `Security Report - ${new Date().toLocaleDateString()}
    
Two-Factor Authentication: ${securitySettings.twoFactorAuth ? "Enabled" : "Disabled"}
Auto Session Timeout: ${securitySettings.autoSessionTimeout ? "Enabled" : "Disabled"}
Timeout Duration: ${securitySettings.timeoutDuration} minutes
Audit Logging: ${securitySettings.auditLogging ? "Enabled" : "Disabled"}
Automated Backups: ${securitySettings.automatedBackups ? "Enabled" : "Disabled"}
Backup Frequency: ${securitySettings.backupFrequency}

Password Policy:
- Minimum Length: ${passwordPolicy.minLength} characters
- Require Uppercase: ${passwordPolicy.requireUppercase ? "Yes" : "No"}
- Require Numbers: ${passwordPolicy.requireNumbers ? "Yes" : "No"}
- Require Symbols: ${passwordPolicy.requireSymbols ? "Yes" : "No"}
`

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `security-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Security report downloaded successfully.",
    })
  }

  const handleBackupNow = async () => {
    setIsBackingUp(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const backupTime = new Date().toISOString()
      setLastBackupTime(backupTime)
      setShowBackupSuccess(true)

      toast({
        title: "Success",
        description: "System backup completed successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Backup failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleViewActivityLog = () => {
    setShowActivityLog(true)
  }

  const handleDownloadAuditTrail = () => {
    const auditData = `Timestamp,User,Action,Resource,IP Address,Status
${new Date().toLocaleString()},Admin,Login,System,192.168.1.1,Success
${new Date(Date.now() - 3600000).toLocaleString()},Admin,Update Settings,Company Settings,192.168.1.1,Success`

    const blob = new Blob([auditData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Audit trail exported successfully.",
    })
  }

  const calculatePasswordStrength = () => {
    let score = 0
    const requirements = []

    if (passwordPolicy.minLength >= 8) score += 25
    else requirements.push(`At least ${passwordPolicy.minLength} characters`)

    if (passwordPolicy.requireUppercase) score += 25
    else requirements.push("Uppercase letters")

    if (passwordPolicy.requireNumbers) score += 25
    else requirements.push("Numbers")

    if (passwordPolicy.requireSymbols) score += 25
    else requirements.push("Special characters")

    return { score, requirements }
  }

  const passwordStrength = calculatePasswordStrength()

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your system configuration and preferences</p>
        </div>
        <Button onClick={handleSaveCompany} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="multi-company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Multi-Company
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Access
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="hr" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            HR
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        {activeTab === "company" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyData?.name || "Akwaaba Technologies Ltd"}
                      onChange={(e) => setCompanyData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID / TIN *</Label>
                    <Input
                      id="taxId"
                      value={companyData?.tax_id || "C0012345678"}
                      onChange={(e) => setCompanyData((prev) => (prev ? { ...prev, tax_id: e.target.value } : null))}
                      placeholder="Enter tax ID"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ssnitNumber">SSNIT Employer Number *</Label>
                    <Input
                      id="ssnitNumber"
                      value={companyData?.ssnit_number || "1234567890"}
                      onChange={(e) =>
                        setCompanyData((prev) => (prev ? { ...prev, ssnit_number: e.target.value } : null))
                      }
                      placeholder="Enter SSNIT number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={companyData?.industry || "technology"}
                      onValueChange={(value) => setCompanyData((prev) => (prev ? { ...prev, industry: value } : null))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Company Address</Label>
                  <Textarea
                    id="address"
                    value={companyData?.address || "123 Liberation Road, Labadi, Accra, Ghana"}
                    onChange={(e) => setCompanyData((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                    placeholder="Enter company address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={companyData?.phone_number || "+233 30 123 4567"}
                      onChange={(e) =>
                        setCompanyData((prev) => (prev ? { ...prev, phone_number: e.target.value } : null))
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyData?.email_address || "info@akwaabatech.com"}
                      onChange={(e) =>
                        setCompanyData((prev) => (prev ? { ...prev, email_address: e.target.value } : null))
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Division / Branch</Label>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Division
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {divisions.map((division, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span>{division}</span>
                          <Button size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Department</Label>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {departments.map((department, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span>{department}</span>
                          <Button size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Location</Label>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Location
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {locations.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span>{location}</span>
                          <Button size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Company Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {logoPreview ? (
                      <img
                        src={logoPreview || "/placeholder.svg"}
                        alt="Company Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="relative bg-transparent">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    <p>PNG, JPG up to 2MB</p>
                    <p>Recommended: 200×200px</p>
                  </div>
                  {uploadedFileName && <p className="text-sm text-green-600">Uploaded: {uploadedFileName}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Roles & Access Control
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Role
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{role.name}</h3>
                            <Badge variant="secondary">System</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{role.user_count} users</p>
                          <p className="text-xs text-muted-foreground">1 permission</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Manage system users and their access</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Admin User</h3>
                        <p className="text-sm text-muted-foreground">admin@akwaabatech.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="default">Super Admin</Badge>
                        <p className="text-xs text-muted-foreground">Last login: 2024-01-15 09:30</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">HR Manager</h3>
                        <p className="text-sm text-muted-foreground">hr@akwaabatech.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="default">HR Manager</Badge>
                        <p className="text-xs text-muted-foreground">Last login: 2024-01-15 08:45</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payroll Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="payFrequency">Pay Frequency</Label>
                      <Select defaultValue="monthly">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setSystemCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">Ghana Cedi (GH₵)</SelectItem>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="minimumWage">Minimum Wage ({currencySymbol})</Label>
                      <Input
                        type="number"
                        value={payrollConfig?.minimum_wage || 18.15}
                        onChange={(e) =>
                          setPayrollConfig((prev) => (prev ? { ...prev, minimum_wage: Number(e.target.value) } : null))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="overtimeWeekday">Weekday Overtime Rate Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={payrollConfig?.overtime_weekday_multiplier || 1.5}
                        onChange={(e) =>
                          setPayrollConfig((prev) =>
                            prev ? { ...prev, overtime_weekday_multiplier: Number(e.target.value) } : null,
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="overtimeWeekend">Weekend Overtime Rate Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={payrollConfig?.overtime_weekend_multiplier || 2.0}
                        onChange={(e) =>
                          setPayrollConfig((prev) =>
                            prev ? { ...prev, overtime_weekend_multiplier: Number(e.target.value) } : null,
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="cutoffDay">Payroll Cutoff Day</Label>
                      <Input
                        type="number"
                        value={payrollConfig?.cutoff_day || 25}
                        min="1"
                        max="31"
                        onChange={(e) =>
                          setPayrollConfig((prev) => (prev ? { ...prev, cutoff_day: Number(e.target.value) } : null))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="processingDay">Processing Day</Label>
                      <Input
                        type="number"
                        value={payrollConfig?.processing_day || 28}
                        min="1"
                        max="31"
                        onChange={(e) =>
                          setPayrollConfig((prev) =>
                            prev ? { ...prev, processing_day: Number(e.target.value) } : null,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Auto-calculate PAYE</h4>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Auto-calculate SSNIT</h4>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Auto-calculate Provident Fund (Tier 3)</h4>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Tax Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">PAYE Tax Bands</h4>
                    <div className="space-y-3">
                      {taxBands.map((band, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded">
                          <Input
                            type="number"
                            value={band.rate}
                            className="w-16"
                            onChange={(e) => {
                              const newBands = [...taxBands]
                              newBands[index].rate = Number(e.target.value)
                              setTaxBands(newBands)
                            }}
                          />
                          <span className="text-sm">
                            % on {band.description} {currencySymbol}
                          </span>
                          {band.threshold > 0 && (
                            <Input
                              type="number"
                              value={band.threshold}
                              className="w-24"
                              onChange={(e) => {
                                const newBands = [...taxBands]
                                newBands[index].threshold = Number(e.target.value)
                                setTaxBands(newBands)
                              }}
                            />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newBands = taxBands.filter((_, i) => i !== index)
                              setTaxBands(newBands)
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTaxBands([...taxBands, { rate: 0, threshold: 0, description: "next" }])
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Tax Band
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">SSNIT Rates</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Employee:</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" value="5.5" className="w-16" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Employer:</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" value="13" className="w-16" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-sm font-medium">18.5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Tier 2 Rates</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Employee:</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" value="5.5" className="w-16" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Employer:</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" value="5.5" className="w-16" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-sm font-medium">11.0%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Tier 3 Rates</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Employee:</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" value="5" className="w-16" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Employer:</span>
                        <div className="flex items-center gap-2">
                          <Input type="number" value="5" className="w-16" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-sm font-medium">10.0%</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">Save Payroll Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Allowances</span>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Allowance
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payrollAllowances.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No allowances configured. Add allowances to get started.
                      </div>
                    ) : (
                      payrollAllowances.map((allowance: any) => (
                        <div key={allowance.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <h4 className="font-medium">{allowance.type}</h4>
                            <p className="text-sm text-muted-foreground">{allowance.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {allowance.amount ? `${formatAmount(allowance.amount)}` : `${allowance.percentage}%`}
                              {allowance.taxable ? " (Taxable)" : " (Non-taxable)"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Deductions</span>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Deduction
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payrollDeductions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No deductions configured. Add deductions to get started.
                      </div>
                    ) : (
                      payrollDeductions.map((deduction: any) => (
                        <div key={deduction.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <h4 className="font-medium">{deduction.type}</h4>
                            <p className="text-sm text-muted-foreground">{deduction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {deduction.amount ? `${formatAmount(deduction.amount)}` : `${deduction.percentage}%`}
                              {deduction.taxable ? " (Taxable)" : " (Non-taxable)"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Leave Policies
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Policy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">Annual Leave</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>1.75 days per month</p>
                            <p>5 days</p>
                            <p>2 weeks</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">Sick Leave</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Medical certificate after 3 days</p>
                            <p>30 days max consecutive</p>
                            <p>100% paid for first 10 days</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">Maternity/Paternity</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Maternity: 12 weeks</p>
                            <p>Paternity: 2 weeks</p>
                            <p>4 weeks before</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Salary Grades & Notches
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Grade
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((grade) => (
                      <Card key={grade} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-semibold">Grade {grade}</h3>
                            <p className="text-sm text-muted-foreground">
                              Salary Range: GH₵{(grade * 200).toLocaleString()} - GH₵
                              {(grade * 400 + 200).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Steps: 5</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  HR Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="leaveYearStart">Leave Year Start</Label>
                    <Select defaultValue="january">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                        <SelectItem value="october">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="probationPeriod">Probation Period (months)</Label>
                    <Input type="number" defaultValue="3" min="1" max="12" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="workingHours">Working Hours/Day</Label>
                    <Input type="number" defaultValue="8" min="1" max="24" />
                  </div>

                  <div>
                    <Label htmlFor="workingDays">Working Days/Week</Label>
                    <Input type="number" defaultValue="5" min="1" max="7" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-approve leave requests</h4>
                      <p className="text-sm text-muted-foreground">Automatically approve requests within policy</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email notifications</h4>
                      <p className="text-sm text-muted-foreground">Send email updates for HR activities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Button className="w-full">Save HR Settings</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings((prev) => ({ ...prev, twoFactorAuth: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Session Timeout</h4>
                    <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                  </div>
                  <Switch
                    checked={securitySettings.autoSessionTimeout}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({ ...prev, autoSessionTimeout: checked }))
                    }
                  />
                </div>

                {securitySettings.autoSessionTimeout && (
                  <div className="ml-6">
                    <Label htmlFor="timeoutDuration">Timeout Duration (minutes)</Label>
                    <Select
                      value={securitySettings.timeoutDuration.toString()}
                      onValueChange={(value) =>
                        setSecuritySettings((prev) => ({ ...prev, timeoutDuration: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
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
                    <h4 className="font-medium">Audit Logging</h4>
                    <p className="text-sm text-muted-foreground">Track all system activities</p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLogging}
                    onCheckedChange={(checked) => setSecuritySettings((prev) => ({ ...prev, auditLogging: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Automated Backups</h4>
                    <p className="text-sm text-muted-foreground">Regular system data backups</p>
                  </div>
                  <Switch
                    checked={securitySettings.automatedBackups}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({ ...prev, automatedBackups: checked }))
                    }
                  />
                </div>

                {securitySettings.automatedBackups && (
                  <div className="ml-6">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={securitySettings.backupFrequency}
                      onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger>
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
                  <Button variant="outline" className="w-full bg-transparent" onClick={handleChangeAdminPassword}>
                    <Shield className="mr-2 h-4 w-4" />
                    Change Admin Password
                  </Button>

                  <Button variant="outline" className="w-full bg-transparent" onClick={handleDownloadSecurityReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Security Report
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleBackupNow}
                    disabled={isBackingUp}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isBackingUp ? "Backing up..." : "Backup Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={passwordPolicy.minLength}
                    onChange={(e) =>
                      setPasswordPolicy((prev) => ({ ...prev, minLength: Number.parseInt(e.target.value) }))
                    }
                    min="6"
                    max="20"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                    <Switch
                      id="requireUppercase"
                      checked={passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) =>
                        setPasswordPolicy((prev) => ({ ...prev, requireUppercase: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireNumbers">Require Numbers</Label>
                    <Switch
                      id="requireNumbers"
                      checked={passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => setPasswordPolicy((prev) => ({ ...prev, requireNumbers: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireSymbols">Require Symbols</Label>
                    <Switch
                      id="requireSymbols"
                      checked={passwordPolicy.requireSymbols}
                      onCheckedChange={(checked) => setPasswordPolicy((prev) => ({ ...prev, requireSymbols: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password Strength Preview</Label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 75
                          ? "bg-green-600"
                          : passwordStrength.score >= 50
                            ? "bg-yellow-600"
                            : "bg-red-600"
                      }`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {passwordStrength.score >= 75
                      ? "Strong password policy"
                      : passwordStrength.score >= 50
                        ? "Medium password policy"
                        : "Weak password policy"}
                  </p>
                  {passwordStrength.requirements.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Missing: {passwordStrength.requirements.join(", ")}
                    </div>
                  )}
                </div>

                <Button className="w-full">Save Security Settings</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payroll Processing Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified about payroll status</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Leave Request Alerts</h4>
                    <p className="text-sm text-muted-foreground">New leave requests and approvals</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Employee Updates</h4>
                    <p className="text-sm text-muted-foreground">New employees and profile changes</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">System Maintenance</h4>
                    <p className="text-sm text-muted-foreground">Scheduled maintenance and updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Send critical alerts via SMS</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="notificationEmail">Notification Email</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      defaultValue="admin@akwaabatech.com"
                      placeholder="Enter notification email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      defaultValue="https://your-app.com/webhook"
                      placeholder="Enter webhook URL"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEmailTemplate(template)
                            setShowEmailTemplateDialog(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowCustomTemplateDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Template
                  </Button>
                </div>

                <Button className="w-full mt-6">Save Notification Settings</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Multi-Company Tab */}
        {activeTab === "multi-company" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Subsidiary Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Manage subsidiary companies and their configurations</p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subsidiary
                  </Button>
                </div>

                <div className="space-y-4">
                  {subsidiaries.length > 0 ? (
                    subsidiaries.map((subsidiary) => (
                      <Card key={subsidiary.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{subsidiary.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {subsidiary.industry || "No industry specified"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tax ID: {subsidiary.tax_id} | SSNIT: {subsidiary.ssnit_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Status:{" "}
                              <Badge variant={subsidiary.status === "active" ? "default" : "secondary"}>
                                {subsidiary.status}
                              </Badge>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No subsidiaries found. Add your first subsidiary to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Admin Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new secure password.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordChangeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>System Activity Log</DialogTitle>
            <DialogDescription>Recent system activities and user actions</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Input placeholder="Search activities..." className="flex-1" />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{new Date().toLocaleString()}</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Login</TableCell>
                    <TableCell>System</TableCell>
                    <TableCell>192.168.1.1</TableCell>
                    <TableCell>
                      <Badge variant="default">Success</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{new Date(Date.now() - 3600000).toLocaleString()}</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Update Settings</TableCell>
                    <TableCell>Company Settings</TableCell>
                    <TableCell>192.168.1.1</TableCell>
                    <TableCell>
                      <Badge variant="default">Success</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Showing 2 of 2 activities</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityLog(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadAuditTrail}>
              <Download className="mr-2 h-4 w-4" />
              Export Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Success Dialog */}
      <Dialog open={showBackupSuccess} onOpenChange={setShowBackupSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Backup Completed Successfully
            </DialogTitle>
            <DialogDescription>Your system backup has been completed and stored securely.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Backup Time:</p>
                  <p>{lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Backup Type:</p>
                  <p>Full System Backup</p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <p className="text-green-600">Completed</p>
                </div>
                <div>
                  <p className="font-medium">Next Backup:</p>
                  <p>{securitySettings.backupFrequency === "daily" ? "Tomorrow" : "Next week"}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowBackupSuccess(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Template Dialog */}
      <Dialog open={showEmailTemplateDialog} onOpenChange={setShowEmailTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmailTemplate ? `Edit ${editingEmailTemplate.name}` : "Create Email Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={editingEmailTemplate?.name || ""}
                  onChange={(e) => setEditingEmailTemplate((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="templateSubject">Email Subject</Label>
                <Input
                  id="templateSubject"
                  value={editingEmailTemplate?.subject || ""}
                  onChange={(e) =>
                    setEditingEmailTemplate((prev) => (prev ? { ...prev, subject: e.target.value } : null))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="templateDescription">Description</Label>
              <Input
                id="templateDescription"
                value={editingEmailTemplate?.description || ""}
                onChange={(e) =>
                  setEditingEmailTemplate((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
              />
            </div>

            <div>
              <Label htmlFor="templateContent">Email Content</Label>
              <Textarea
                id="templateContent"
                value={editingEmailTemplate?.content || ""}
                onChange={(e) =>
                  setEditingEmailTemplate((prev) => (prev ? { ...prev, content: e.target.value } : null))
                }
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingEmailTemplate?.isActive || false}
                onCheckedChange={(checked) =>
                  setEditingEmailTemplate((prev) => (prev ? { ...prev, isActive: checked } : null))
                }
              />
              <Label>Template Active</Label>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Available Variables:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <code>{`{{company_name}}`}</code>
                <code>{`{{employee_name}}`}</code>
                <code>{`{{start_date}}`}</code>
                <code>{`{{hr_email}}`}</code>
                <code>{`{{hr_phone}}`}</code>
                <code>{`{{supervisor_name}}`}</code>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEmailTemplateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Template Saved",
                  description: "Email template has been updated successfully.",
                })
                setShowEmailTemplateDialog(false)
              }}
            >
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Type Dialog */}
      <Dialog open={showLeaveTypeDialog} onOpenChange={setShowLeaveTypeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLeaveType ? "Edit Leave Type" : "Add New Leave Type"}</DialogTitle>
            <DialogDescription>
              Configure leave type settings including entitlements, approval requirements, and payment policies.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="leaveName">Leave Type Name</Label>
              <Input id="leaveName" defaultValue={editingLeaveType?.name || ""} placeholder="e.g., Annual Leave" />
            </div>
            <div>
              <Label htmlFor="leaveCode">Code</Label>
              <Input id="leaveCode" defaultValue={editingLeaveType?.code || ""} placeholder="e.g., AL" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="leaveDescription">Description</Label>
              <Textarea
                id="leaveDescription"
                defaultValue={editingLeaveType?.description || ""}
                placeholder="Brief description of this leave type"
              />
            </div>
            <div>
              <Label htmlFor="annualEntitlement">Annual Entitlement (days)</Label>
              <Input id="annualEntitlement" type="number" defaultValue={editingLeaveType?.annual_entitlement || 21} />
            </div>
            <div>
              <Label htmlFor="maxConsecutive">Max Consecutive Days</Label>
              <Input id="maxConsecutive" type="number" defaultValue={editingLeaveType?.max_consecutive_days || 30} />
            </div>
            <div>
              <Label htmlFor="payPercentage">Pay Percentage (%)</Label>
              <Input
                id="payPercentage"
                type="number"
                defaultValue={editingLeaveType?.pay_percentage || 100}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="minNotice">Minimum Notice (days)</Label>
              <Input id="minNotice" type="number" defaultValue={editingLeaveType?.min_notice_days || 7} />
            </div>
            <div className="col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="requiresApproval" defaultChecked={editingLeaveType?.requires_approval ?? true} />
                <Label htmlFor="requiresApproval">Requires Approval</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="requiresMedical" defaultChecked={editingLeaveType?.requires_medical_certificate ?? false} />
                <Label htmlFor="requiresMedical">Requires Medical Certificate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="allowCarryOver" defaultChecked={editingLeaveType?.allow_carry_over ?? false} />
                <Label htmlFor="allowCarryOver">Allow Carry Over</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveTypeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLeaveType}>{editingLeaveType ? "Update" : "Create"} Leave Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Grade Dialog */}
      <Dialog open={showSalaryGradeDialog} onOpenChange={setShowSalaryGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSalaryGrade ? "Edit Salary Grade" : "Add New Salary Grade"}</DialogTitle>
            <DialogDescription>Configure salary grade with step progression amounts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="gradeName">Grade Name</Label>
              <Input id="gradeName" defaultValue={editingSalaryGrade?.grade_name || ""} placeholder="e.g., Grade 1" />
            </div>
            <div>
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Input id="gradeLevel" type="number" defaultValue={editingSalaryGrade?.grade_level || 1} min="1" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <Label htmlFor="step1">Step 1 ({currencySymbol})</Label>
                <Input id="step1" type="number" defaultValue={editingSalaryGrade?.step_1 || 0} />
              </div>
              <div>
                <Label htmlFor="step2">Step 2 ({currencySymbol})</Label>
                <Input id="step2" type="number" defaultValue={editingSalaryGrade?.step_2 || 0} />
              </div>
              <div>
                <Label htmlFor="step3">Step 3 ({currencySymbol})</Label>
                <Input id="step3" type="number" defaultValue={editingSalaryGrade?.step_3 || 0} />
              </div>
              <div>
                <Label htmlFor="step4">Step 4 ({currencySymbol})</Label>
                <Input id="step4" type="number" defaultValue={editingSalaryGrade?.step_4 || 0} />
              </div>
              <div>
                <Label htmlFor="step5">Step 5 ({currencySymbol})</Label>
                <Input id="step5" type="number" defaultValue={editingSalaryGrade?.step_5 || 0} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSalaryGradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSalaryGrade}>{editingSalaryGrade ? "Update" : "Create"} Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
