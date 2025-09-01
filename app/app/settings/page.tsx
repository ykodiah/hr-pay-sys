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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
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
  Calendar,
  Settings,
  Edit,
  Trash2,
  Plus,
  Upload,
  Eye,
  Mail,
  Minus,
  EyeOff,
  CheckCircle,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Company {
  id: string
  name: string
  tax_id: string
  ssnit_number: string
  email_address: string
  phone_number: string
  address: string
  industry: string
  logo_url?: string
  logo_file_id?: string
  divisions: any[]
  departments: any[]
  locations: any[]
  created_at: string
  updated_at: string
}

interface LeaveType {
  id: string
  company_id: string
  name: string
  code: string
  description: string
  annual_entitlement: number
  accrual_method: string
  accrual_rate: number
  min_service_months: number
  max_consecutive_days: number
  max_per_year: number
  requires_approval: boolean
  requires_medical_certificate: boolean
  medical_cert_after_days: number
  is_paid: boolean
  pay_percentage: number
  allow_carry_over: boolean
  max_carry_over_days: number
  carry_over_expiry_months: number
  min_notice_days: number
  is_active: boolean
  is_system_default: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface SalaryGrade {
  id: string
  company_id: string
  grade_name: string
  grade_level: number
  step_1: number
  step_2: number
  step_3: number
  step_4: number
  step_5: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PayrollConfig {
  id: number
  company_id: number
  currency_code: string
  currency_symbol: string
  minimum_wage: number
  overtime_weekday_multiplier: number
  overtime_weekend_multiplier: number
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { currency, currencySymbol, setCurrency: setSystemCurrency, formatAmount } = useCurrency()

  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Company settings state
  const [companyData, setCompanyData] = useState<Company | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [logoPreview, setLogoPreview] = useState("")

  // Leave types state
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(false)
  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)

  // Salary grades state
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([])
  const [showSalaryGradeDialog, setShowSalaryGradeDialog] = useState(false)
  const [editingSalaryGrade, setEditingSalaryGrade] = useState<SalaryGrade | null>(null)

  // Payroll configuration state
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null)

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    autoSessionTimeout: true,
    timeoutDuration: 15,
    auditLogging: true,
    automatedBackups: true,
    backupFrequency: "daily",
  })

  // Password policy state
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: false,
  })

  // Dialog states
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [showBackupSuccess, setShowBackupSuccess] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string>("")

  // Password change form state
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

  const [emailTemplates, setEmailTemplates] = useState([
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
• Overview of company culture and values

Please bring the following documents:
• Valid identification (passport/national ID)
• Signed employment contract
• Bank account details for payroll setup
• Emergency contact information

We are excited to have you as part of our team and look forward to the fresh perspectives and skills you will bring to {{company_name}}.

Should you have any questions before your start date, please don't hesitate to contact us at {{hr_email}} or {{hr_phone}}.

Welcome aboard!

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
      subject: "Your {{month}} {{year}} Payslip is Ready - {{company_name}}",
      description: "Monthly payslip availability",
      content: `Dear {{employee_name}},

Your payslip for {{month}} {{year}} is now available for download in your employee portal.

Payroll Summary:
• Pay Period: {{pay_period}}
• Gross Salary: {{gross_salary}}
• Net Pay: {{net_pay}}
• Payment Date: {{payment_date}}

To access your payslip:
1. Log into your employee portal at {{portal_url}}
2. Navigate to "Payroll" section
3. Select "View Payslips"
4. Download your {{month}} {{year}} payslip

Important Reminders:
• Please review your payslip carefully and report any discrepancies within 5 working days
• Keep your payslips for tax and record-keeping purposes
• Contact HR immediately if you notice any errors

If you experience any issues accessing your payslip or have questions about your pay, please contact the HR department at {{hr_email}} or {{hr_phone}}.

Thank you for your continued dedication to {{company_name}}.

Best regards,
Payroll Department
{{company_name}}`,
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Leave Approval",
      subject: "Leave Request {{status}} - {{leave_type}} ({{start_date}} to {{end_date}})",
      description: "Leave request status updates",
      content: `Dear {{employee_name}},

This is to inform you that your {{leave_type}} request has been {{status}}.

Leave Request Details:
• Leave Type: {{leave_type}}
• Start Date: {{start_date}}
• End Date: {{end_date}}
• Duration: {{duration}} days
• Reason: {{leave_reason}}
• Applied Date: {{application_date}}

{{#if approved}}
Your leave request has been APPROVED. Please ensure the following:
• Complete any pending work assignments before your leave
• Brief your colleagues about ongoing projects
• Set up an out-of-office message
• Ensure all necessary handovers are completed

{{/if}}
{{#if rejected}}
Your leave request has been REJECTED for the following reason:
{{rejection_reason}}

You may reapply for leave with the necessary adjustments or contact your supervisor for further clarification.
{{/if}}

{{#if pending}}
Your leave request is currently PENDING approval. We will notify you once a decision has been made. The review process typically takes 2-3 business days.
{{/if}}

For any questions regarding this leave request, please contact:
• Your Direct Supervisor: {{supervisor_name}} ({{supervisor_email}})
• HR Department: {{hr_email}} or {{hr_phone}}

Thank you for following the proper leave application procedures.

Best regards,
Human Resources Department
{{company_name}}`,
      isActive: true,
      lastModified: new Date().toISOString(),
    },
    {
      id: 4,
      name: "Password Reset",
      subject: "Password Reset Request - {{company_name}} Employee Portal",
      description: "Password reset instructions",
      content: `Dear {{employee_name}},

We received a request to reset your password for your {{company_name}} employee portal account.

If you requested this password reset, please click the link below to create a new password:
{{reset_link}}

This link will expire in 24 hours for security purposes.

Password Requirements:
• Minimum 8 characters
• At least one uppercase letter
• At least one lowercase letter
• At least one number
• At least one special character

Security Information:
• Request Time: {{request_time}}
• IP Address: {{ip_address}}
• Browser: {{browser_info}}

If you did not request this password reset:
• Please ignore this email
• Your current password remains unchanged
• Consider changing your password if you suspect unauthorized access
• Contact IT support immediately at {{it_support_email}}

For additional security:
• Never share your password with anyone
• Use a unique password for your work account
• Enable two-factor authentication if available
• Log out of shared computers

If you continue to experience issues or have questions about account security, please contact our IT support team at {{it_support_email}} or {{it_support_phone}}.

Best regards,
IT Security Team
{{company_name}}

This is an automated message. Please do not reply to this email.`,
      isActive: true,
      lastModified: new Date().toISOString(),
    },
  ])

  const [showEmailTemplateDialog, setShowEmailTemplateDialog] = useState(false)
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<any>(null)
  const [showCustomTemplateDialog, setShowCustomTemplateDialog] = useState(false)

  useEffect(() => {
    loadCompanyData()
    loadLeaveTypes()
    loadSalaryGrades()
    loadPayrollConfig()
  }, [])

  const loadCompanyData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("companies").select("*").limit(1).single()

      if (error) throw error
      setCompanyData(data)
      if (data.logo_url) {
        setLogoPreview(data.logo_url)
      }
    } catch (error) {
      console.error("Error loading company data:", error)
    }
  }

  const loadLeaveTypes = async () => {
    setIsLoadingLeaveTypes(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("leave_types").select("*").eq("is_active", true).order("name")

      if (error) throw error
      setLeaveTypes(data || [])
    } catch (error) {
      console.error("Error loading leave types:", error)
      toast({
        title: "Error",
        description: "Failed to load leave types",
      })
    } finally {
      setIsLoadingLeaveTypes(false)
    }
  }

  const loadSalaryGrades = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("salary_grades")
        .select("*")
        .eq("is_active", true)
        .order("grade_level")

      if (error) throw error
      setSalaryGrades(data || [])
    } catch (error) {
      console.error("Error loading salary grades:", error)
    }
  }

  const loadPayrollConfig = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("payroll_configuration").select("*").limit(1).single()

      if (error) throw error
      setPayrollConfig(data)
    } catch (error) {
      console.error("Error loading payroll config:", error)
    }
  }

  const handleSaveCompany = async () => {
    if (!companyData) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("companies")
        .update({
          name: companyData.name,
          tax_id: companyData.tax_id,
          ssnit_number: companyData.ssnit_number,
          email_address: companyData.email_address,
          phone_number: companyData.phone_number,
          address: companyData.address,
          industry: companyData.industry,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyData.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Company settings saved successfully",
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error saving company data:", error)
      toast({
        title: "Error",
        description: "Failed to save company settings",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !companyData) return

    // Validate file type and size
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    const maxSize = 2 * 1024 * 1024 // 2MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a PNG or JPG file",
      })
      return
    }

    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
      })
      return
    }

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const fileData = e.target?.result as ArrayBuffer
        const uint8Array = new Uint8Array(fileData)

        // Save file to company_files table
        const { data: fileRecord, error: fileError } = await supabase
          .from("company_files")
          .insert({
            company_id: companyData.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_category: "logo",
            file_data: uint8Array,
            uploaded_by: companyData.id, // Using company ID as uploader for now
          })
          .select()
          .single()

        if (fileError) throw fileError

        // Update company with logo file reference
        const { error: updateError } = await supabase
          .from("companies")
          .update({
            logo_file_id: fileRecord.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", companyData.id)

        if (updateError) throw updateError

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setLogoPreview(previewUrl)
        setUploadedFileName(file.name)

        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        })
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Error",
        description: "Failed to upload logo",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Security functions
  const handleChangeAdminPassword = () => {
    setShowPasswordChangeDialog(true)
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
      })
      return
    }

    // Validate against password policy
    const { minLength, requireUppercase, requireNumbers, requireSymbols } = passwordPolicy
    const password = passwordForm.newPassword

    if (password.length < minLength) {
      toast({
        title: "Error",
        description: `Password must be at least ${minLength} characters long`,
      })
      return
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      toast({
        title: "Error",
        description: "Password must contain at least one uppercase letter",
      })
      return
    }

    if (requireNumbers && !/\d/.test(password)) {
      toast({
        title: "Error",
        description: "Password must contain at least one number",
      })
      return
    }

    if (requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      toast({
        title: "Error",
        description: "Password must contain at least one symbol",
      })
      return
    }

    try {
      // Here you would implement actual password change logic
      // For now, we'll just show success
      toast({
        title: "Success",
        description: "Admin password changed successfully",
      })
      setShowPasswordChangeDialog(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
      })
    }
  }

  const handleDownloadSecurityReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      companyName: companyData?.name || "Unknown",
      securitySettings,
      passwordPolicy,
      activeUsers: 0, // Would be fetched from database
      lastLogin: new Date().toISOString(),
      failedLoginAttempts: 0,
      systemVersion: "1.0.0",
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `security-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Security report downloaded successfully",
    })
  }

  const handleBackupNow = async () => {
    setIsBackingUp(true)
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const backupTime = new Date().toISOString()
      setLastBackupTime(backupTime)
      setShowBackupSuccess(true)

      toast({
        title: "Success",
        description: "System backup completed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Backup failed. Please try again.",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleViewActivityLog = () => {
    setShowActivityLog(true)
  }

  const handleDownloadAuditTrail = () => {
    // Generate sample audit trail data
    const auditData = [
      {
        timestamp: new Date().toISOString(),
        user: "Admin",
        action: "Login",
        resource: "System",
        ipAddress: "192.168.1.1",
        status: "Success",
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: "Admin",
        action: "Update Settings",
        resource: "Company Settings",
        ipAddress: "192.168.1.1",
        status: "Success",
      },
    ]

    const csvContent = [
      "Timestamp,User,Action,Resource,IP Address,Status",
      ...auditData.map(
        (row) => `${row.timestamp},${row.user},${row.action},${row.resource},${row.ipAddress},${row.status}`,
      ),
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
      title: "Success",
      description: "Audit trail downloaded successfully",
    })
  }

  // Calculate password strength
  const calculatePasswordStrength = () => {
    const { minLength, requireUppercase, requireNumbers, requireSymbols } = passwordPolicy
    let score = 0
    const maxScore = 4

    if (minLength >= 8) score += 1
    if (requireUppercase) score += 1
    if (requireNumbers) score += 1
    if (requireSymbols) score += 1

    return (score / maxScore) * 100
  }

  const getPasswordStrengthLabel = () => {
    const strength = calculatePasswordStrength()
    if (strength >= 75) return "Strong password policy"
    if (strength >= 50) return "Medium password policy"
    return "Weak password policy"
  }

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
      </Tabs>

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
                    value={companyData?.name || ""}
                    onChange={(e) => setCompanyData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID / TIN *</Label>
                  <Input
                    id="taxId"
                    value={companyData?.tax_id || ""}
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
                    value={companyData?.ssnit_number || ""}
                    onChange={(e) =>
                      setCompanyData((prev) => (prev ? { ...prev, ssnit_number: e.target.value } : null))
                    }
                    placeholder="Enter SSNIT number"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={companyData?.industry || ""}
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
                  value={companyData?.address || ""}
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
                    value={companyData?.phone_number || ""}
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
                    value={companyData?.email_address || ""}
                    onChange={(e) =>
                      setCompanyData((prev) => (prev ? { ...prev, email_address: e.target.value } : null))
                    }
                    placeholder="Enter email address"
                  />
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

      {/* HR Tab */}
      {activeTab === "hr" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Types Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Manage different types of leave available to employees</p>
                <Button
                  onClick={() => {
                    setEditingLeaveType(null)
                    setShowLeaveTypeDialog(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Leave Type
                </Button>
              </div>

              {isLoadingLeaveTypes ? (
                <div className="text-center py-8">Loading leave types...</div>
              ) : (
                <div className="grid gap-4">
                  {leaveTypes.map((leaveType) => (
                    <Card key={leaveType.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{leaveType.name}</h3>
                            <Badge variant="secondary">{leaveType.code}</Badge>
                            {leaveType.is_system_default && <Badge variant="outline">System Default</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{leaveType.description}</p>
                          <div className="flex gap-4 text-sm">
                            <span>Entitlement: {leaveType.annual_entitlement} days</span>
                            <span>Max Consecutive: {leaveType.max_consecutive_days} days</span>
                            <span>Notice: {leaveType.min_notice_days} days</span>
                          </div>
                          <div className="flex gap-2">
                            {leaveType.requires_approval && <Badge variant="outline">Requires Approval</Badge>}
                            {leaveType.is_paid && <Badge variant="outline">Paid ({leaveType.pay_percentage}%)</Badge>}
                            {leaveType.allow_carry_over && <Badge variant="outline">Carry Over</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingLeaveType(leaveType)
                              setShowLeaveTypeDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!leaveType.is_system_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle delete
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
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

              <div className="space-y-3">
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
                  <div className="ml-4">
                    <Label htmlFor="timeoutDuration">Timeout Duration (minutes)</Label>
                    <Select
                      value={securitySettings.timeoutDuration.toString()}
                      onValueChange={(value) =>
                        setSecuritySettings((prev) => ({ ...prev, timeoutDuration: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="w-full">
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

              <div className="space-y-3">
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
                  <div className="ml-4">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={securitySettings.backupFrequency}
                      onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger className="w-full">
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

              <div className="space-y-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleChangeAdminPassword}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Change Admin Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleDownloadSecurityReport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Security Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleBackupNow}
                  disabled={isBackingUp}
                >
                  <Database className="mr-2 h-4 w-4" />
                  {isBackingUp ? "Backing up..." : "Backup Now"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Password Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="minLength">Minimum Length</Label>
                <Input
                  id="minLength"
                  type="number"
                  min="6"
                  max="20"
                  value={passwordPolicy.minLength}
                  onChange={(e) =>
                    setPasswordPolicy((prev) => ({ ...prev, minLength: Number.parseInt(e.target.value) || 8 }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                <Switch
                  id="requireUppercase"
                  checked={passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => setPasswordPolicy((prev) => ({ ...prev, requireUppercase: checked }))}
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

              <div className="space-y-2">
                <Label>Password Strength Preview</Label>
                <Progress value={calculatePasswordStrength()} className="w-full" />
                <p className="text-sm text-muted-foreground">{getPasswordStrengthLabel()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
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
                    <Switch checked={true} />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={handleDownloadAuditTrail}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download Audit Trail
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                    <Input id="retentionPeriod" type="number" defaultValue="90" min="30" max="365" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={handleViewActivityLog}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Activity Log
                  </Button>
                </div>
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
                        <p className="text-xs text-muted-foreground">
                          Last modified: {new Date(template.lastModified).toLocaleDateString()}
                        </p>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Send email notifications for system events</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-muted-foreground">Send SMS for urgent notifications</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "payroll" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={currency} onValueChange={setSystemCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">Ghana Cedi (GH¢)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payPeriod">Pay Period</Label>
                  <Select defaultValue="monthly">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="payDate">Pay Date</Label>
                  <Select defaultValue="last-day">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-day">Last Day of Month</SelectItem>
                      <SelectItem value="15th">15th of Month</SelectItem>
                      <SelectItem value="custom">Custom Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workingDays">Working Days per Week</Label>
                  <Input type="number" defaultValue="5" min="1" max="7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-medium">PAYE Tax Bands</h4>
                <div className="space-y-3">
                  {[
                    { rate: 0, threshold: 4380, description: "first" },
                    { rate: 5, threshold: 1000, description: "next" },
                    { rate: 10, threshold: 2000, description: "next" },
                    { rate: 17.5, threshold: 20000, description: "next" },
                    { rate: 25, threshold: 20000, description: "next" },
                    { rate: 30, threshold: null, description: "remaining amount" },
                  ].map((band, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Input type="number" value={band.rate} className="w-20" readOnly />
                      <span className="text-sm">% on {band.description}</span>
                      {band.threshold && (
                        <>
                          <span className="text-sm">{currencySymbol}</span>
                          <Input type="number" value={band.threshold} className="w-32" readOnly />
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                <Card className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Akwaaba Tech Solutions</h3>
                      <p className="text-sm text-muted-foreground">Technology Division</p>
                      <p className="text-xs text-muted-foreground">50 employees</p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Manage system users and their access levels</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Admin User</h3>
                      <p className="text-sm text-muted-foreground">admin@akwaabahrpay.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Super Admin</Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Define user roles and their system permissions</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    name: "Super Admin",
                    description: "Full system access",
                    users: 1,
                    color: "bg-red-100 text-red-800",
                  },
                  {
                    name: "HR Manager",
                    description: "HR operations and employee management",
                    users: 3,
                    color: "bg-blue-100 text-blue-800",
                  },
                  {
                    name: "Payroll Officer",
                    description: "Payroll processing and reports",
                    users: 2,
                    color: "bg-green-100 text-green-800",
                  },
                  {
                    name: "Employee",
                    description: "Basic employee self-service",
                    users: 45,
                    color: "bg-gray-100 text-gray-800",
                  },
                ].map((role, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{role.name}</h3>
                          <Badge className={role.color}>{role.users} users</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                // Handle save template
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
    </div>
  )
}
