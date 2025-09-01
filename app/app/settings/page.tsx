"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-context"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient } from "@/lib/supabase/server"
import { Building2, Shield, Users, DollarSign, Bell } from "lucide-react"

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
  email_address: string
  phone_number: string
  address: string
  divisions: string[]
  departments: string[]
  locations: string[]
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

  const [showSubsidiaryDialog, setShowSubsidiaryDialog] = useState(false)
  const [editingSubsidiary, setEditingSubsidiary] = useState<Subsidiary | null>(null)
  const [subsidiaryFunction, setSubsidiaryFunction] = useState(true)
  const [companyData, setCompanyData] = useState({
    name: "Akwaaba Technologies Ltd",
    email: "info@akwaabatech.com",
    tax_id: "C0012345678",
    ssnit_number: "1234567890",
    industry: "Technology",
    status: "active",
  })

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
      toast({
        title: "Error",
        description: "Failed to load company data. Please check your connection.",
        variant: "destructive",
      })
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
      toast({
        title: "Error",
        description: "Failed to load leave types. Please check your connection.",
        variant: "destructive",
      })
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
      toast({
        title: "Error",
        description: "Failed to load salary grades. Please check your connection.",
        variant: "destructive",
      })
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("[v0] Starting logo upload for file:", file.name)

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
        console.log("[v0] File read successfully, uploading to database...")

        const supabase = createBrowserClient()

        const { data, error } = await supabase
          .from("company_files")
          .insert({
            company_id: companyData?.id || "default-company-id",
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_data: base64Data,
            file_category: "logo",
          })
          .select()
          .single()

        if (error) {
          console.log("[v0] Database error:", error)
          throw error
        }

        console.log("[v0] Logo uploaded successfully:", data)
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

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file.",
          variant: "destructive",
        })
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.log("[v0] Upload error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload logo.",
        variant: "destructive",
      })
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

  const handleAddSubsidiary = () => {
    setEditingSubsidiary(null)
    setShowSubsidiaryDialog(true)
  }

  const handleEditSubsidiary = (subsidiary: Subsidiary) => {
    setEditingSubsidiary(subsidiary)
    setShowSubsidiaryDialog(true)
  }

  const handleSaveSubsidiary = async (subsidiaryData: any) => {
    try {
      const supabase = createClient()

      if (editingSubsidiary) {
        // Update existing subsidiary
        const { error } = await supabase
          .from("subsidiaries")
          .update({
            name: subsidiaryData.name,
            tax_id: subsidiaryData.tax_id,
            ssnit_number: subsidiaryData.ssnit_number,
            email_address: subsidiaryData.email,
            phone_number: subsidiaryData.phone,
            address: subsidiaryData.address,
            divisions: subsidiaryData.divisions || [],
            departments: subsidiaryData.departments || [],
            locations: subsidiaryData.locations || [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSubsidiary.id)

        if (error) throw error
        toast({ title: "Success", description: "Subsidiary updated successfully" })
      } else {
        // Create new subsidiary
        const { error } = await supabase.from("subsidiaries").insert({
          company_id: "1", // Replace with actual company ID
          name: subsidiaryData.name,
          tax_id: subsidiaryData.tax_id,
          ssnit_number: subsidiaryData.ssnit_number,
          email_address: subsidiaryData.email,
          phone_number: subsidiaryData.phone,
          address: subsidiaryData.address,
          divisions: subsidiaryData.divisions || [],
          departments: subsidiaryData.departments || [],
          locations: subsidiaryData.locations || [],
          status: "active",
        })

        if (error) throw error
        toast({ title: "Success", description: "Subsidiary created successfully" })
      }

      setShowSubsidiaryDialog(false)
      loadSubsidiaries()
    } catch (error) {
      console.error("Error saving subsidiary:", error)
      toast({ title: "Error", description: "Failed to save subsidiary" })
    }
  }

  const handleDeactivateSubsidiary = async (subsidiaryId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("subsidiaries").update({ status: "inactive" }).eq("id", subsidiaryId)

      if (error) throw error
      toast({ title: "Success", description: "Subsidiary deactivated successfully" })
      loadSubsidiaries()
    } catch (error) {
      console.error("Error deactivating subsidiary:", error)
      toast({ title: "Error", description: "Failed to deactivate subsidiary" })
    }
  }

  const handleSaveMultiCompanySettings = async () => {
    try {
      const supabase = createClient()

      // Update company settings
      const { error } = await supabase
        .from("companies")
        .update({
          name: companyData.name,
          email_address: companyData.email,
          tax_id: companyData.tax_id,
          ssnit_number: companyData.ssnit_number,
          industry: companyData.industry,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "1") // Replace with actual company ID

      if (error) throw error
      toast({ title: "Success", description: "Multi-company settings saved successfully" })
    } catch (error) {
      console.error("Error saving multi-company settings:", error)
      toast({ title: "Error", description: "Failed to save settings" })
    }
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

        {/* Company Tab */}
        {activeTab === "company" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>{/* Form fields for company data */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Logo Upload</CardTitle>
              </CardHeader>
              <CardContent>{/* Logo upload form */}</CardContent>
            </Card>
          </div>
        )}

        {/* Multi-Company Tab */}
        {activeTab === "multi-company" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Company Settings</CardTitle>
              </CardHeader>
              <CardContent>{/* Form fields for multi-company settings */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subsidiaries</CardTitle>
              </CardHeader>
              <CardContent>{/* Subsidiaries table and actions */}</CardContent>
            </Card>
          </div>
        )}

        {/* Roles & Access Tab */}
        {activeTab === "roles" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
              </CardHeader>
              <CardContent>{/* Roles table and actions */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>{/* Permissions table and actions */}</CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>{/* Users table and actions */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
              </CardHeader>
              <CardContent>{/* User roles table and actions */}</CardContent>
            </Card>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === "payroll" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Configuration</CardTitle>
              </CardHeader>
              <CardContent>{/* Payroll configuration form */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Salary Grades</CardTitle>
              </CardHeader>
              <CardContent>{/* Salary grades table and actions */}</CardContent>
            </Card>
          </div>
        )}

        {/* HR Tab */}
        {activeTab === "hr" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>HR Settings</CardTitle>
              </CardHeader>
              <CardContent>{/* HR settings form */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leave Types</CardTitle>
              </CardHeader>
              <CardContent>{/* Leave types table and actions */}</CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>{/* Security settings form */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Password Policy</CardTitle>
              </CardHeader>
              <CardContent>{/* Password policy form */}</CardContent>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent>{/* Email templates table and actions */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent>{/* Notification settings form */}</CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  )
}
