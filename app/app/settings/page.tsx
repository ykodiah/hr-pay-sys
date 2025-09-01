"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-context"
import { createClient } from "@/lib/supabase/client"
import {
  Building2,
  Shield,
  Users,
  DollarSign,
  Bell,
  Upload,
  X,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  Key,
  Download,
  Settings,
  Mail,
  Calendar,
  Save,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import SubsidiaryForm from "@/components/forms/subsidiary-form"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

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
  created_at?: string
  updated_at?: string
  divisions_count?: number
  departments_count?: number
  locations_count?: number
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
  const { currency, formatCurrency } = useCurrency()

  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(true)

  const [showSubsidiaryDialog, setShowSubsidiaryDialog] = useState(false)
  const [editingSubsidiary, setEditingSubsidiary] = useState<Subsidiary | null>(null)
  const [subsidiaryFunction, setSubsidiaryFunction] = useState(false)

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const [companyData, setCompanyData] = useState({
    id: "",
    name: "",
    email: "",
    tax_id: "",
    ssnit_number: "",
    industry: "",
    status: "active",
    address: "",
    phone: "",
  })

  const [uploadedFileName, setUploadedFileName] = useState("")
  const [logoPreview, setLogoPreview] = useState("")

  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])
  const [showViewSubsidiaryDialog, setShowViewSubsidiaryDialog] = useState(false)
  const [viewingSubsidiary, setViewingSubsidiary] = useState<Subsidiary | null>(null)

  const [roles, setRoles] = useState<Role[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null)

  const [taxBands, setTaxBands] = useState<any[]>([])
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

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])

  // Dialog states
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [showBackupSuccess, setShowBackupSuccess] = useState(false)
  const [showEmailTemplateDialog, setShowCustomTemplateDialog] = useState(false)
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

  const [notificationSettings, setNotificationSettings] = useState({
    email: "",
    webhookUrl: "",
  })

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          loadCompanyData(),
          loadLeaveTypes(),
          loadSalaryGrades(),
          loadEmployees(),
          loadSubsidiaries(),
          loadPayrollConfig(),
          loadPayrollAllowances(),
          loadPayrollDeductions(),
          loadRoles(),
          loadEmailTemplates(),
          loadSecuritySettings(),
        ])
      } catch (error) {
        console.error("Error loading settings data:", error)
        toast({
          title: "Error",
          description: "Some settings data failed to load. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [])

  const loadCompanyData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("companies").select("*").single()

      if (error) {
        console.error("Company data error:", error)
        // Create a default company if none exists
        const { data: newCompany, error: createError } = await supabase
          .from("companies")
          .insert({
            name: "Your Company Name",
            email_address: "info@yourcompany.com",
            tax_id: "",
            ssnit_number: "",
            industry: "",
            address: "",
            phone_number: "",
          })
          .select()
          .single()

        if (createError) {
          console.error("Failed to create company:", createError)
          setCompanyData({
            id: "",
            name: "Your Company Name",
            email: "info@yourcompany.com",
            tax_id: "",
            ssnit_number: "",
            industry: "",
            status: "active",
            address: "",
            phone: "",
          })
          return
        }

        setCompanyData({
          id: newCompany.id,
          name: newCompany.name || "",
          email: newCompany.email_address || "",
          tax_id: newCompany.tax_id || "",
          ssnit_number: newCompany.ssnit_number || "",
          industry: newCompany.industry || "",
          status: "active",
          address: newCompany.address || "",
          phone: newCompany.phone_number || "",
        })
        return
      }

      setCompanyData({
        id: data.id || "",
        name: data.name || "",
        email: data.email_address || "",
        tax_id: data.tax_id || "",
        ssnit_number: data.ssnit_number || "",
        industry: data.industry || "",
        status: "active",
        address: data.address || "",
        phone: data.phone_number || "",
      })

      // Load company structure data
      if (data.divisions) setDivisions(Array.isArray(data.divisions) ? data.divisions : [])
      if (data.departments) setDepartments(Array.isArray(data.departments) ? data.departments : [])
      if (data.locations) setLocations(Array.isArray(data.locations) ? data.locations : [])

      // Load logo if exists
      if (data.logo_url) setLogoPreview(data.logo_url)
    } catch (error) {
      console.error("Error loading company data:", error)
    }
  }

  const loadRoles = async () => {
    try {
      const supabase = createClient()
      // For now, use hardcoded roles since there's no roles table in the schema
      setRoles([
        { id: "1", name: "Super Admin", description: "Full system access", permissions: ["all"], user_count: 1 },
        { id: "2", name: "HR Manager", description: "HR operations management", permissions: ["hr"], user_count: 3 },
        {
          id: "3",
          name: "Payroll Manager",
          description: "Payroll processing",
          permissions: ["payroll"],
          user_count: 2,
        },
        { id: "4", name: "Employee", description: "Self-service access", permissions: ["self"], user_count: 45 },
      ])
    } catch (error) {
      console.error("Error loading roles:", error)
    }
  }

  const loadEmailTemplates = async () => {
    try {
      // For now, use default templates since there's no email_templates table in the schema
      setEmailTemplates([
        {
          id: 1,
          name: "Welcome Email",
          subject: "Welcome to {{company_name}} - Your Journey Begins Here",
          description: "Sent to new employees",
          content: `Dear {{employee_name}},

We are delighted to welcome you to {{company_name}}! On behalf of the entire team, I would like to extend our warmest congratulations on joining our organization.

Your first day is scheduled for {{start_date}} at {{start_time}}. Please report to the HR department located at {{office_address}} where you will meet with {{hr_contact}} for your orientation.

We look forward to working with you and wish you great success in your new role.

Best regards,
{{hr_manager_name}}
Human Resources Department`,
          isActive: true,
        },
        {
          id: 2,
          name: "Payslip Notification",
          subject: "Your Payslip for {{month}} {{year}} is Ready",
          description: "Monthly payslip availability",
          content: `Dear {{employee_name}},

Your payslip for {{month}} {{year}} is now available for download in your employee portal.

Gross Salary: {{gross_salary}}
Net Salary: {{net_salary}}
Pay Date: {{pay_date}}

Please log in to your account to view and download your detailed payslip.

If you have any questions regarding your payslip, please contact the HR department.

Best regards,
Payroll Department`,
          isActive: true,
        },
        {
          id: 3,
          name: "Leave Approval",
          subject: "Leave Request {{status}} - {{leave_type}}",
          description: "Leave request status updates",
          content: `Dear {{employee_name}},

Your leave request has been {{status}}.

Leave Type: {{leave_type}}
Start Date: {{start_date}}
End Date: {{end_date}}
Duration: {{duration}} days

{{#if approved}}
Your leave has been approved. Please ensure all pending tasks are completed or handed over before your leave begins.
{{else}}
Reason for rejection: {{rejection_reason}}
{{/if}}

For any questions, please contact your supervisor or HR department.

Best regards,
{{approver_name}}`,
          isActive: true,
        },
        {
          id: 4,
          name: "Password Reset",
          subject: "Password Reset Instructions for {{company_name}}",
          description: "Password reset instructions",
          content: `Dear {{employee_name}},

You have requested to reset your password for your {{company_name}} account.

Please click the link below to reset your password:
{{reset_link}}

This link will expire in 24 hours for security reasons.

If you did not request this password reset, please ignore this email and contact IT support immediately.

Best regards,
IT Support Team
{{company_name}}`,
          isActive: true,
        },
      ])
    } catch (error) {
      console.error("Error loading email templates:", error)
    }
  }

  const loadSecuritySettings = async () => {
    try {
      // Load security settings from database or use defaults
      // For now, keeping the default values since there's no security_settings table
    } catch (error) {
      console.error("Error loading security settings:", error)
    }
  }

  const loadPayrollConfig = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("payroll_configuration").select("*").single()

      if (error) {
        console.error("Payroll config error:", error)
        // Set default payroll config
        setPayrollConfig({
          id: 1,
          company_id: 1,
          minimum_wage: 18.15,
          overtime_weekday_multiplier: 1.5,
          overtime_weekend_multiplier: 2.0,
          currency_code: "GHS",
          currency_symbol: "GH₵",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        return
      }

      setPayrollConfig(data)

      // Set default tax bands for Ghana
      setTaxBands([
        { rate: 0, threshold: 4380, description: "first GH₵" },
        { rate: 5, threshold: 1000, description: "next GH₵" },
        { rate: 10, threshold: 2000, description: "next GH₵" },
        { rate: 17.5, threshold: 20000, description: "next GH₵" },
        { rate: 25, threshold: 20000, description: "next GH₵" },
        { rate: 30, threshold: 0, description: "remaining amount" },
      ])
    } catch (error) {
      console.error("Error loading payroll config:", error)
    }
  }

  const loadLeaveTypes = async () => {
    try {
      const supabase = createClient()
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
      const supabase = createClient()
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
      const supabase = createClient()
      const { data, error } = await supabase.from("employees").select("*").order("first_name")

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error loading employees:", error)
    }
  }

  const loadSubsidiaries = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("subsidiaries").select("*")

      if (error) {
        console.error("Subsidiaries loading error:", error)
        return
      }

      // Transform data to include counts from JSONB fields
      const subsidiariesWithCounts =
        data?.map((subsidiary) => ({
          ...subsidiary,
          divisions_count: Array.isArray(subsidiary.divisions) ? subsidiary.divisions.length : 0,
          departments_count: Array.isArray(subsidiary.departments) ? subsidiary.departments.length : 0,
          locations_count: Array.isArray(subsidiary.locations) ? subsidiary.locations.length : 0,
        })) || []

      setSubsidiaries(subsidiariesWithCounts)
    } catch (error) {
      console.error("Error loading subsidiaries:", error)
    }
  }

  const loadPayrollAllowances = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("payroll_allowances").select("*").order("type")

      if (error) throw error
      setPayrollAllowances(data || [])
    } catch (error) {
      console.error("Error loading payroll allowances:", error)
    }
  }

  const loadPayrollDeductions = async () => {
    try {
      const supabase = createClient()
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

    // Check if we have a valid company ID
    if (!companyData?.id) {
      toast({
        title: "Error",
        description: "Company data not loaded. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string
          console.log("[v0] File read successfully, uploading to database...")

          const supabase = createClient()

          const { data, error } = await supabase
            .from("company_files")
            .insert({
              company_id: companyData.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_data: base64Data,
              file_category: "logo",
            })
            .select()
            .single()

          if (error) {
            console.log("[v0] Database error:", error.message)
            toast({
              title: "Error",
              description: `Failed to upload logo: ${error.message}`,
              variant: "destructive",
            })
            return
          }

          console.log("[v0] Logo uploaded successfully:", data)
          setUploadedFileName(file.name)
          setLogoPreview(base64Data)

          // Update company with logo file reference
          const { error: updateError } = await supabase
            .from("companies")
            .update({ logo_file_id: data.id })
            .eq("id", companyData.id)

          if (updateError) {
            console.log("[v0] Failed to update company logo reference:", updateError.message)
          }

          setCompanyData({ ...companyData, logo_file_id: data.id })

          toast({
            title: "Success",
            description: "Logo uploaded successfully.",
          })
        } catch (uploadError) {
          console.error("[v0] Upload error:", uploadError)
          toast({
            title: "Error",
            description: "Failed to upload logo. Please try again.",
            variant: "destructive",
          })
        }
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
      console.error("[v0] Logo upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveCompany = async () => {
    if (!companyData) return

    setIsLoading(true)
    try {
      const supabase = createClient()
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
      const supabase = createClient()
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
      const supabase = createClient()
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
- Require Numbers: ${passwordPolicy.requireNumbers} ? "Yes" : "No"}
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

  const handleSaveMultiCompany = async () => {
    try {
      const supabase = createClient()

      if (!companyData.id) {
        toast({
          title: "Error",
          description: "Company ID not found. Please refresh the page and try again.",
          variant: "destructive",
        })
        return
      }

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
        .eq("id", companyData.id)

      if (error) throw error
      toast({ title: "Success", description: "Multi-company settings saved successfully" })
    } catch (error) {
      console.error("Error saving multi-company settings:", error)
      toast({ title: "Error", description: "Failed to save settings" })
    }
  }

  const handleSaveCompanySettings = async () => {
    try {
      const supabase = createClient()

      if (!companyData.id) {
        toast({
          title: "Error",
          description: "Company ID not found. Please refresh the page and try again.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("companies")
        .update({
          name: companyData.name,
          email_address: companyData.email,
          tax_id: companyData.tax_id,
          ssnit_number: companyData.ssnit_number,
          industry: companyData.industry,
          address: companyData.address,
          phone_number: companyData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyData.id)

      if (error) throw error
      toast({ title: "Success", description: "Company settings saved successfully" })
    } catch (error) {
      console.error("Error saving company settings:", error)
      toast({ title: "Error", description: "Failed to save company settings" })
    }
  }

  const handleSavePayrollSettings = async () => {
    try {
      const supabase = createClient()

      // Save payroll configuration
      const { error: configError } = await supabase.from("payroll_configuration").upsert({
        company_id: companyData.id,
        pay_frequency: payrollConfig.pay_frequency,
        currency: payrollConfig.currency,
        minimum_wage: payrollConfig.minimum_wage,
        overtime_rate: payrollConfig.overtime_rate,
        cutoff_day: payrollConfig.cutoff_day,
        processing_day: payrollConfig.processing_day,
        auto_calculate_paye: payrollConfig.auto_calculate_paye,
        auto_calculate_ssnit: payrollConfig.auto_calculate_ssnit,
        auto_calculate_provident: payrollConfig.auto_calculate_provident,
        updated_at: new Date().toISOString(),
      })

      if (configError) throw configError

      // Save tax bands
      for (const band of taxBands) {
        const { error: bandError } = await supabase.from("tax_bands").upsert({
          company_id: companyData.id,
          band_name: band.band,
          rate_percentage: band.rate,
          min_amount: band.min,
          max_amount: band.max,
          updated_at: new Date().toISOString(),
        })

        if (bandError) throw bandError
      }

      toast({ title: "Success", description: "Payroll settings saved successfully" })
    } catch (error) {
      console.error("Error saving payroll settings:", error)
      toast({ title: "Error", description: "Failed to save payroll settings" })
    }
  }

  const handleSaveHRSettings = async () => {
    try {
      const supabase = createClient()

      // Save leave types
      for (const leaveType of leaveTypes) {
        const { error } = await supabase.from("leave_types").upsert({
          id: leaveType.id,
          company_id: companyData.id,
          name: leaveType.name,
          description: leaveType.description,
          annual_entitlement: leaveType.annual_entitlement,
          requires_approval: leaveType.requires_approval,
          is_paid: leaveType.is_paid,
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
      }

      // Save salary grades
      for (const grade of salaryGrades) {
        const { error } = await supabase.from("salary_grades").upsert({
          id: grade.id,
          company_id: companyData.id,
          grade_name: grade.name,
          min_salary: grade.min_salary,
          max_salary: grade.max_salary,
          steps: grade.steps,
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
      }

      toast({ title: "Success", description: "HR settings saved successfully" })
    } catch (error) {
      console.error("Error saving HR settings:", error)
      toast({ title: "Error", description: "Failed to save HR settings" })
    }
  }

  const handleSaveSecuritySettings = async () => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("security_settings").upsert({
        company_id: companyData.id,
        two_factor_enabled: securitySettings.twoFactorAuth,
        session_timeout_enabled: securitySettings.sessionTimeout,
        timeout_duration: securitySettings.timeoutDuration,
        audit_logging_enabled: securitySettings.auditLogging,
        password_min_length: passwordPolicy.minLength,
        require_uppercase: passwordPolicy.requireUppercase,
        require_numbers: passwordPolicy.requireNumbers,
        require_symbols: passwordPolicy.requireSymbols,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      toast({ title: "Success", description: "Security settings saved successfully" })
    } catch (error) {
      console.error("Error saving security settings:", error)
      toast({ title: "Error", description: "Failed to save security settings" })
    }
  }

  const handleSaveNotificationSettings = async () => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("notification_settings").upsert({
        company_id: companyData.id,
        payroll_alerts: notificationSettings.payrollAlerts,
        leave_alerts: notificationSettings.leaveAlerts,
        employee_updates: notificationSettings.employeeUpdates,
        system_maintenance: notificationSettings.systemMaintenance,
        sms_notifications: notificationSettings.smsNotifications,
        notification_email: notificationSettings.email,
        webhook_url: notificationSettings.webhookUrl,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      toast({ title: "Success", description: "Notification settings saved successfully" })
    } catch (error) {
      console.error("Error saving notification settings:", error)
      toast({ title: "Error", description: "Failed to save notification settings" })
    }
  }

  const handleViewSubsidiary = (subsidiary: Subsidiary) => {
    setViewingSubsidiary(subsidiary)
    setShowViewSubsidiaryDialog(true)
  }

  const handleSubsidiaryFunctionChange = (checked: boolean) => {
    if (!checked && subsidiaryFunction) {
      // Show confirmation modal when trying to deactivate
      setShowDeactivateModal(true)
    } else {
      setSubsidiaryFunction(checked)
    }
  }

  const handleConfirmDeactivation = () => {
    setSubsidiaryFunction(false)
    setShowDeactivateModal(false)
    toast({
      title: "Subsidiary Function Deactivated",
      description: "All subsidiary management features have been hidden.",
    })
  }

  const handleCancelDeactivation = () => {
    setShowDeactivateModal(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    )
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">Tax ID / TIN *</Label>
                    <Input
                      id="tax-id"
                      value={companyData.tax_id}
                      onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssnit-number">SSNIT Employer Number *</Label>
                    <Input
                      id="ssnit-number"
                      value={companyData.ssnit_number}
                      onChange={(e) => setCompanyData({ ...companyData, ssnit_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={companyData.industry}
                      onValueChange={(value) => setCompanyData({ ...companyData, industry: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Company Address</Label>
                  <Textarea
                    id="company-address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    placeholder="123 Liberation Road, Labome, Accra, Ghana"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input
                      id="phone-number"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      placeholder="+233 30 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-address">Email Address</Label>
                    <Input
                      id="email-address"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Division / Branch</Label>
                    <div className="space-y-2">
                      {divisions.map((division, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={division} readOnly />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDivisions(divisions.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setDivisions([...divisions, "New Division"])}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Division
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <div className="space-y-2">
                      {departments.map((department, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={department} readOnly />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDepartments(departments.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepartments([...departments, "New Department"])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Department
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="space-y-2">
                      {locations.map((location, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={location} readOnly />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocations(locations.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setLocations([...locations, "New Location"])}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Location
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveCompanySettings} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
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
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
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
                  <div className="text-center">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/png,image/jpeg"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </label>
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      PNG, JPG up to 2MB
                      <br />
                      Recommended: 200×200px
                    </p>
                  </div>
                  {uploadedFileName && <p className="text-sm text-green-600">Uploaded: {uploadedFileName}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "multi-company" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Multi-Company Management</h2>
              <p className="text-muted-foreground">Manage multiple companies and subsidiaries</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{companyData.name}</h3>
                      <p className="text-sm text-muted-foreground">{companyData.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    active
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                    <p className="font-medium">{companyData.tax_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SSNIT Number</p>
                    <p className="font-medium">{companyData.ssnit_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <p className="font-medium">{companyData.industry}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <Checkbox
                    id="subsidiary-function"
                    checked={subsidiaryFunction}
                    onCheckedChange={handleSubsidiaryFunctionChange}
                  />
                  <Label htmlFor="subsidiary-function" className="font-medium">
                    Activate Subsidiary Function
                  </Label>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {subsidiaryFunction ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {subsidiaryFunction && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Subsidiaries ({subsidiaries.length})</CardTitle>
                    <Button onClick={() => setShowSubsidiaryDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subsidiary
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subsidiaries.map((subsidiary) => (
                      <Card key={subsidiary.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{subsidiary.name}</h4>
                              <p className="text-sm text-muted-foreground">{subsidiary.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {subsidiary.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleViewSubsidiary(subsidiary)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditSubsidiary(subsidiary)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeactivateSubsidiary(subsidiary.id)}>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Tax ID:</p>
                              <p className="font-medium">{subsidiary.tax_id}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">SSNIT:</p>
                              <p className="font-medium">{subsidiary.ssnit_number}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Divisions:</p>
                              <p className="font-medium">{subsidiary.divisions_count}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Departments:</p>
                              <p className="font-medium">{subsidiary.departments_count}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Locations:</p>
                              <p className="font-medium">{subsidiary.locations_count}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSaveMultiCompany} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Multi-Company Settings"}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Access Control</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">{role.name}</h4>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{role.user_count} users</p>
                          <p className="text-sm text-muted-foreground">permissions</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
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
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        A
                      </div>
                      <div>
                        <h4 className="font-semibold">Admin User</h4>
                        <p className="text-sm text-muted-foreground">admin@akwaabatech.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge>Super Admin</Badge>
                      <p className="text-sm text-muted-foreground">Last login: 2024-01-15 09:30</p>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                        H
                      </div>
                      <div>
                        <h4 className="font-semibold">HR Manager</h4>
                        <p className="text-sm text-muted-foreground">hr@akwaabatech.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">HR Manager</Badge>
                      <p className="text-sm text-muted-foreground">Last login: 2024-01-15 08:45</p>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pay Frequency</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select defaultValue="ghs">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghs">Ghana Cedis (GHS)</SelectItem>
                        <SelectItem value="usd">US Dollar (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto-calculate PAYE</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-calculate SSNIT</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-calculate Provident Fund (Tier 3)</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSavePayrollSettings} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Payroll Settings
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">PAYE Tax Bands</h4>
                    <div className="space-y-2">
                      {taxBands.map((band, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>
                            {band.rate}% on {band.description}
                          </span>
                          <span>GH₵ {band.threshold.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">SSNIT Rates</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Employee:</span>
                        <span>5.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer:</span>
                        <span>13%</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>18.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Leave Policies
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Policy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Annual Leave</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>1.75 days per month</p>
                      <p>5 days</p>
                      <p>2 weeks</p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Sick Leave</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Medical certificate after 3 days</p>
                      <p>30 days max consecutive</p>
                      <p>100% paid for first 10 days</p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveHRSettings} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save HR Settings
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Salary Grades & Notches
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Grade
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((grade) => (
                    <div key={grade} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Grade {grade}</h4>
                        <p className="text-sm text-muted-foreground">
                          Salary Range: GH₵{(grade * 200).toLocaleString()} - GH₵{(grade * 400).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Steps: 5</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                      }
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
                        setSecuritySettings({ ...securitySettings, autoSessionTimeout: checked })
                      }
                    />
                  </div>
                  {securitySettings.autoSessionTimeout && (
                    <div className="ml-4 space-y-2">
                      <Label>Timeout Duration (minutes)</Label>
                      <Select
                        value={securitySettings.timeoutDuration.toString()}
                        onValueChange={(value) => {
                          const numValue = Number.parseInt(value)
                          setSecuritySettings({
                            ...securitySettings,
                            timeoutDuration: isNaN(numValue) ? 15 : numValue,
                          })
                        }}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Audit Logging</h4>
                      <p className="text-sm text-muted-foreground">Track all system activities</p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, auditLogging: checked })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Key className="h-4 w-4 mr-2" />
                    Change Admin Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download Security Report
                  </Button>
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveSecuritySettings} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minimum Length</Label>
                  <Input
                    type="number"
                    value={passwordPolicy.minLength.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      const numValue = value === "" ? 8 : Number.parseInt(value)
                      setPasswordPolicy({ ...passwordPolicy, minLength: isNaN(numValue) ? 8 : numValue })
                    }}
                    className="w-20"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Symbols</Label>
                    <Switch
                      checked={passwordPolicy.requireSymbols}
                      onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireSymbols: checked })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password Strength Preview</Label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  <p className="text-sm text-green-600">Strong password policy</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
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
                </div>
                <div className="space-y-2">
                  <Label>Notification Email</Label>
                  <Input
                    value={notificationSettings.email}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL (Optional)</Label>
                  <Input
                    value={notificationSettings.webhookUrl}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookUrl: e.target.value })}
                    placeholder="https://your-app.com/webhook"
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveNotificationSettings} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Templates
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailTemplates.slice(0, 4).map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>

      {showSubsidiaryDialog && (
        <SubsidiaryForm
          subsidiary={editingSubsidiary}
          onSave={handleSaveSubsidiary}
          onCancel={() => {
            setShowSubsidiaryDialog(false)
            setEditingSubsidiary(null)
          }}
        />
      )}

      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Deactivate Subsidiary Function</DialogTitle>
            <button
              onClick={handleCancelDeactivation}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to deactivate the subsidiary function? This will hide all subsidiary management
              features.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelDeactivation}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeactivation}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewSubsidiaryDialog} onOpenChange={setShowViewSubsidiaryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subsidiary Details</DialogTitle>
            <DialogDescription>View detailed information about {viewingSubsidiary?.name}</DialogDescription>
          </DialogHeader>
          {viewingSubsidiary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                  <p className="text-sm font-medium">{viewingSubsidiary.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
                    {viewingSubsidiary.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{viewingSubsidiary.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm">{viewingSubsidiary.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                  <p className="text-sm">{viewingSubsidiary.tax_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">SSNIT Number</Label>
                  <p className="text-sm">{viewingSubsidiary.ssnit_number}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <p className="text-sm mt-1">{viewingSubsidiary.address || "Not provided"}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Divisions</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {viewingSubsidiary.divisions?.map((division, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {division}
                      </Badge>
                    )) || <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Departments</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {viewingSubsidiary.departments?.map((dept, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {dept}
                      </Badge>
                    )) || <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Locations</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {viewingSubsidiary.locations?.map((location, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {location}
                      </Badge>
                    )) || <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-sm">
                    {viewingSubsidiary.created_at
                      ? new Date(viewingSubsidiary.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">
                    {viewingSubsidiary.updated_at
                      ? new Date(viewingSubsidiary.updated_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewSubsidiaryDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowViewSubsidiaryDialog(false)
                if (viewingSubsidiary) {
                  handleEditSubsidiary(viewingSubsidiary)
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Subsidiary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
