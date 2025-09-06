"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-context"
import { createClient } from "@/lib/supabase/client"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Edit, Trash2, Users, Shield, Settings } from "lucide-react"

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

interface LeavePolicy {
  id: string
  company_id: string
  policy_name: string
  policy_type: string
  description: string
  max_days: number
  accrual_rate: number
  carry_over_days: number
  requires_approval: boolean
  notice_period_days: number
  medical_certificate_required: boolean
  medical_certificate_after_days: number
  max_consecutive_days: number
  paid_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface LeaveTypeApprover {
  id: string
  leave_type_id: string
  approver_role: string
  approval_level: number
  is_required: boolean
  created_at: string
}

interface LeaveTypeEligibility {
  id: string
  leave_type_id: string
  employee_type: string
  gender: string
  min_age: number
  max_age: number
  department_id: string
  location_id: string
  created_at: string
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
  company_id: string
  accrual_method: string
  accrual_rate: number
  min_service_months: number
  max_per_year: number
  max_carry_over_days: number
  carry_over_expiry_months: number
  medical_cert_after_days: number
  is_paid: boolean
  is_system_default: boolean
  created_by: string
  created_at: string
  updated_at: string
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
  is_active?: boolean
}

interface PayrollConfig {
  id?: number
  company_id?: number
  minimum_wage: number
  overtime_weekday_multiplier: number
  overtime_weekend_multiplier: number
  currency_code: string
  currency_symbol: string
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

interface SubsidiaryFormProps {
  subsidiary: Subsidiary | null
  onSave: (data: any) => void
  onCancel: () => void
}

const SubsidiaryForm: React.FC<SubsidiaryFormProps> = ({ subsidiary, onSave, onCancel }) => {
  const [name, setName] = useState(subsidiary?.name || "")
  const [taxId, setTaxId] = useState(subsidiary?.tax_id || "")
  const [ssnitNumber, setSsnitNumber] = useState(subsidiary?.ssnit_number || "")
  const [email, setEmail] = useState(subsidiary?.email_address || "")
  const [phone, setPhone] = useState(subsidiary?.phone_number || "")
  const [address, setAddress] = useState(subsidiary?.address || "")
  const [divisions, setDivisions] = useState(subsidiary?.divisions || [])
  const [departments, setDepartments] = useState(subsidiary?.departments || [])
  const [locations, setLocations] = useState(subsidiary?.locations || [])

  const handleSubmit = () => {
    const subsidiaryData = {
      name,
      tax_id: taxId,
      ssnit_number: ssnitNumber,
      email,
      phone,
      address,
      divisions,
      departments,
      locations,
    }
    onSave(subsidiaryData)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxId">Tax ID</Label>
        <Input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ssnitNumber">SSNIT Number</Label>
        <Input id="ssnitNumber" value={ssnitNumber} onChange={(e) => setSsnitNumber(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Divisions</Label>
        {divisions.map((division: string, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Input value={division} readOnly />
            <Button variant="ghost" size="sm" onClick={() => setDivisions(divisions.filter((_, i) => i !== index))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setDivisions([...divisions, "New Division"])}>
          Add Division
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Departments</Label>
        {departments.map((department: string, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Input value={department} readOnly />
            <Button variant="ghost" size="sm" onClick={() => setDepartments(departments.filter((_, i) => i !== index))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setDepartments([...departments, "New Department"])}>
          Add Department
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Locations</Label>
        {locations.map((location: string, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Input value={location} readOnly />
            <Button variant="ghost" size="sm" onClick={() => setLocations(locations.filter((_, i) => i !== index))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setLocations([...locations, "New Location"])}>
          Add Location
        </Button>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save</Button>
      </div>
    </div>
  )
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

  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig>({
    minimum_wage: 18.15,
    overtime_weekday_multiplier: 1.5,
    overtime_weekend_multiplier: 2,
    currency_code: "GHS",
    currency_symbol: "₵",
  })

  const [payrollSettings, setPayrollSettings] = useState({
    pay_frequency: "Monthly",
    cutoff_day: 25,
    processing_day: 28,
    auto_calculate_paye: true,
    auto_calculate_ssnit: true,
    auto_calculate_provident: true,
  })

  const [taxBands, setTaxBands] = useState([
    { rate: 0, threshold: 4380, description: "first GHS" },
    { rate: 5, threshold: 1000, description: "next GHS" },
    { rate: 10, threshold: 2000, description: "next GHS" },
    { rate: 17.5, threshold: 20000, description: "next GHS" },
    { rate: 25, threshold: 20000, description: "next GHS" },
    { rate: 30, threshold: 0, description: "remaining amount" },
  ])

  const [showAllowanceDialog, setShowAllowanceDialog] = useState(false)
  const [showDeductionDialog, setShowDeductionDialog] = useState(false)
  const [showLoanDialog, setShowLoanDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)

  const [ssnit, setSsnit] = useState({
    employee: 5.5,
    employer: 13,
    total: 18.5,
  })

  const [tier2, setTier2] = useState({
    employee: 5.5,
    employer: 5.5,
    total: 11.0,
  })

  const [tier3, setTier3] = useState({
    employee: 5,
    employer: 5,
    total: 10.0,
  })

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
  const [showSalaryGradeDialog, setShowSalaryGradeDialog] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string>("")

  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null)
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
    payrollAlerts: true,
    leaveAlerts: true,
    employeeUpdates: true,
    systemMaintenance: true,
    smsNotifications: false,
    email: "",
    webhookUrl: "",
  })

  const [payrollAllowances, setPayrollAllowancesState] = useState<any[]>([])
  const [payrollDeductions, setPayrollDeductionsState] = useState<any[]>([])
  const [loanSettings, setLoanSettingsState] = useState<any[]>([])
  const [salaryGrades, setSalaryGradesState] = useState<any[]>([])

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([])
  const [leaveApprovers, setLeaveTypeApprover] = useState<LeaveTypeApprover[]>([])
  const [leaveEligibility, setLeaveEligibility] = useState<LeaveTypeEligibility[]>([])
  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = useState(false)
  const [showLeavePolicyDialog, setShowLeavePolicyDialog] = useState(false)
  const [showApproverDialog, setShowApproverDialog] = useState(false)
  const [showEligibilityDialog, setShowEligibilityDialog] = useState(false)
  const [showAddApproverDialog, setShowAddEligibilityDialog] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)
  const [selectedLeavePolicy, setSelectedLeavePolicy] = useState<LeavePolicy | null>(null)
  const [currentLeaveType, setCurrentLeaveType] = useState<LeaveType | null>(null)
  const [currentLeaveTypeId, setCurrentLeaveTypeId] = useState<string | null>(null)
  const [currentLeavePolicy, setCurrentLeavePolicy] = useState<LeavePolicy | null>(null)
  const [selectedLeaveTypeForApprovers, setSelectedLeaveTypeForApprovers] = useState<string | null>(null)
  const [selectedLeaveTypeForEligibility, setSelectedLeaveTypeForEligibility] = useState<string | null>(null)
  const [newApprover, setNewApprover] = useState({
    approver_role: "",
    approval_level: 1,
    is_required: true,
  })
  const [newEligibility, setNewEligibility] = useState({
    employee_type: "",
    gender: "",
    min_age: 0,
    max_age: 0,
    department_id: "",
    location_id: "",
  })
  const [newLeaveType, setNewLeaveType] = useState<Partial<LeaveType>>({
    name: "",
    code: "",
    description: "",
    annual_entitlement: 0,
    max_consecutive_days: 0,
    pay_percentage: 100,
    min_notice_days: 1,
    requires_approval: true,
    requires_medical_certificate: false,
    allow_carry_over: false,
    is_active: true,
    accrual_method: "annual",
    accrual_rate: 0,
    min_service_months: 0,
    max_per_year: 0,
    max_carry_over_days: 0,
    carry_over_expiry_months: 12,
    medical_cert_after_days: 3,
    is_paid: true,
    is_system_default: false,
  })
  const [newLeavePolicy, setNewLeavePolicy] = useState<Partial<LeavePolicy>>({
    policy_name: "",
    policy_type: "",
    description: "",
    max_days: 0,
    accrual_rate: 0,
    carry_over_days: 0,
    requires_approval: true,
    notice_period_days: 1,
    medical_certificate_required: false,
    medical_certificate_after_days: 3,
    max_consecutive_days: 0,
    paid_percentage: 100,
    is_active: true,
  })

  const [leaveTypesState, setLeaveTypesState] = useState<any[]>([])
  const [newDeduction, setNewDeduction] = useState<any>(null)
  const [newLoan, setNewLoan] = useState<any>(null)

  const dateSSNITRates = (field: "employee" | "employer", value: number) => {
    const newSsnit = { ...ssnit, [field]: value }
    newSsnit.total = newSsnit.employee + newSsnit.employer
    setSsnit(newSsnit)
  }

  const updateTier2Rates = (field: "employee" | "employer", value: number) => {
    const newTier2 = { ...tier2, [field]: value }
    newTier2.total = newTier2.employee + newTier2.employer
    setTier2(newTier2)
  }

  const updateTier3Rates = (field: "employee" | "employer", value: number) => {
    const newTier3 = { ...tier3, [field]: value }
    newTier3.total = newTier3.employee + newTier3.employer
    setTier3(newTier3)
  }

  const handleCurrencyChange = (newCurrency: string) => {
    const currencyMap: Record<string, { symbol: string; name: string }> = {
      GHS: { symbol: "₵", name: "Ghana Cedis (GHS)" },
      USD: { symbol: "$", name: "US Dollar (USD)" },
      EUR: { symbol: "€", name: "Euro (EUR)" },
    }

    const currency = currencyMap[newCurrency]
    if (currency) {
      setPayrollConfig({
        ...payrollConfig,
        currency_code: newCurrency,
        currency_symbol: currency.symbol,
      })

      // Update tax bands currency display
      setTaxBands(
        taxBands.map((band) => ({
          ...band,
          currency: newCurrency,
        })),
      )

      toast({
        title: "Currency Updated",
        description: `System currency changed to ${currency.name}`,
      })
    }
  }

  const handleAddAllowance = () => {
    setEditingItem({
      code: "",
      description: "",
      taxable: false,
      recurring: false,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    })
    setEditingIndex(-1)
    setShowAllowanceDialog(true)
  }

  const handleAddDeduction = () => {
    setEditingItem({
      code: "",
      description: "",
      recurring: false,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    })
    setEditingIndex(-1)
    setShowDeductionDialog(true)
  }

  const handleAddLoan = () => {
    setEditingItem({
      code: "",
      description: "",
      maxAmount: 0,
      interestRate: 0,
      rateMethod: "Reducing Balance",
      adminCharge: 0,
      tenure: 12,
    })
    setEditingIndex(-1)
    setShowLoanDialog(true)
  }

  const handleEditAllowance = (index: number) => {
    setEditingItem({ ...payrollAllowances[index] })
    setEditingIndex(index)
    setShowAllowanceDialog(true)
  }

  const handleDeleteAllowance = async (index: number) => {
    try {
      const supabase = createClient()
      const allowance = payrollAllowances[index]
      if (allowance.id) {
        const { error } = await supabase.from("payroll_allowances").delete().eq("id", allowance.id)
        if (error) throw error
      }

      const newAllowances = payrollAllowances.filter((_, i) => i !== index)
      setPayrollAllowancesState(newAllowances)

      toast({
        title: "Success",
        description: "Allowance deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting allowance:", error)
      toast({
        title: "Error",
        description: "Failed to delete allowance",
        variant: "destructive",
      })
    }
  }

  const handleEditDeduction = (index: number) => {
    setEditingItem({ ...payrollDeductions[index] })
    setEditingIndex(index)
    setShowDeductionDialog(true)
  }

  const handleDeleteDeduction = async (index: number) => {
    try {
      const supabase = createClient()
      const deduction = payrollDeductions[index]
      if (deduction.id) {
        const { error } = await supabase.from("payroll_deductions").delete().eq("id", deduction.id)
        if (error) throw error
      }

      const newDeductions = payrollDeductions.filter((_, i) => i !== index)
      setPayrollDeductionsState(newDeductions)

      toast({
        title: "Success",
        description: "Deduction deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting deduction:", error)
      toast({
        title: "Error",
        description: "Failed to delete deduction",
        variant: "destructive",
      })
    }
  }

  const handleEditLoan = (index: number) => {
    setEditingItem({ ...loanSettings[index] })
    setEditingIndex(index)
    setShowLoanDialog(true)
  }

  const handleDeleteLoan = async (index: number) => {
    try {
      const supabase = createClient()
      const loan = loanSettings[index]
      if (loan.id) {
        const { error } = await supabase.from("loan_settings").delete().eq("id", loan.id)
        if (error) throw error
      }

      const newLoans = loanSettings.filter((_, i) => i !== index)
      setLoanSettingsState(newLoans)

      toast({
        title: "Success",
        description: "Loan setting deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting loan setting:", error)
      toast({
        title: "Error",
        description: "Failed to delete loan setting",
        variant: "destructive",
      })
    }
  }

  const handleSaveAllowance = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        })
        return
      }

      if (!companyData.id || companyData.id.trim() === "") {
        toast({
          title: "Error",
          description: "Company information not loaded. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Saving allowance with user:", user.id, "company:", companyData.id)

      if (editingIndex >= 0) {
        // Update existing
        if (editingItem.id) {
          const { error } = await supabase.from("payroll_allowances").update(editingItem).eq("id", editingItem.id)
          if (error) throw error
        }
        const newAllowances = [...payrollAllowances]
        newAllowances[editingIndex] = editingItem
        setPayrollAllowancesState(newAllowances)
      } else {
        // Add new - ensure all required fields are present
        const allowanceData = {
          ...editingItem,
          company_id: companyData.id,
          taxable: editingItem.taxable ?? false,
          recurring: editingItem.recurring ?? false,
          is_active: editingItem.is_active ?? true,
          amount: editingItem.amount ?? 0,
          percentage: editingItem.percentage ?? 0,
        }

        console.log("[v0] Inserting allowance data:", allowanceData)

        const { data, error } = await supabase.from("payroll_allowances").insert([allowanceData]).select().single()

        if (error) throw error

        if (data) {
          setPayrollAllowancesState([...payrollAllowances, data])
        }
      }

      setShowAllowanceDialog(false)
      toast({
        title: "Success",
        description: "Allowance saved successfully",
      })
    } catch (error) {
      console.error("Error saving allowance:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save allowance",
        variant: "destructive",
      })
    }
  }

  const handleSaveDeduction = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        })
        return
      }

      if (!companyData.id || companyData.id.trim() === "") {
        toast({
          title: "Error",
          description: "Company information not loaded. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Saving deduction with user:", user.id, "company:", companyData.id)

      if (editingIndex >= 0) {
        // Update existing
        if (editingItem.id) {
          const { error } = await supabase.from("payroll_deductions").update(editingItem).eq("id", editingItem.id)
          if (error) throw error
        }
        const newDeductions = [...payrollDeductions]
        newDeductions[editingIndex] = editingItem
        setPayrollDeductionsState(newDeductions)
      } else {
        const deductionData = {
          ...editingItem,
          company_id: companyData.id,
          taxable: editingItem.taxable ?? false,
          recurring: editingItem.recurring ?? false,
          is_active: editingItem.is_active ?? true,
          amount: editingItem.amount ?? 0,
          percentage: editingItem.percentage ?? 0,
        }

        console.log("[v0] Inserting deduction data:", deductionData)

        const { data, error } = await supabase.from("payroll_deductions").insert([deductionData]).select().single()

        if (error) throw error

        if (data) {
          setPayrollDeductionsState([...payrollDeductions, data])
        }
      }

      setShowDeductionDialog(false)
      toast({
        title: "Success",
        description: "Deduction saved successfully",
      })
    } catch (error) {
      console.error("Error saving deduction:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save deduction",
        variant: "destructive",
      })
    }
  }

  const handleSaveLoan = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        })
        return
      }

      if (!companyData.id || companyData.id.trim() === "") {
        toast({
          title: "Error",
          description: "Company information not loaded. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Saving loan setting with user:", user.id, "company:", companyData.id)

      if (editingIndex >= 0) {
        // Update existing
        if (editingItem.id) {
          const { error } = await supabase.from("loan_settings").update(editingItem).eq("id", editingItem.id)
          if (error) throw error
        }
        const newLoans = [...loanSettings]
        newLoans[editingIndex] = editingItem
        setLoanSettingsState(newLoans)
      } else {
        const loanData = {
          code: editingItem.code || "",
          description: editingItem.description || "",
          type: editingItem.type || "PERSONAL",
          company_id: companyData.id,
          max_amount: editingItem.maxAmount ?? 0,
          interest_rate: editingItem.interestRate ?? 0,
          max_repayment_months: editingItem.tenure ?? 12,
          taxable: editingItem.taxable ?? false,
          recurring: editingItem.recurring ?? false,
          auto_deduct: editingItem.auto_deduct ?? true,
          is_active: editingItem.is_active ?? true,
        }

        console.log("[v0] Inserting loan data:", loanData)

        const { data, error } = await supabase.from("loan_settings").insert([loanData]).select().single()

        if (error) throw error

        if (data) {
          setLoanSettingsState([...loanSettings, data])
        }
      }

      setShowLoanDialog(false)
      toast({
        title: "Success",
        description: "Loan setting saved successfully",
      })
    } catch (error) {
      console.error("Error saving loan setting:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save loan setting",
        variant: "destructive",
      })
    }
  }

  const [orgCharts, setOrgCharts] = useState<any[]>([])

  const loadHRSettings = async () => {
    try {
      const supabase = createClient()

      // Load leave policies
      const { data: leavePolicies, error: leavePoliciesError } = await supabase
        .from("leave_policies")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)

      if (leavePoliciesError) throw leavePoliciesError

      // Load organizational charts
      const { data: orgCharts, error: orgChartsError } = await supabase
        .from("organizational_charts")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)

      if (orgChartsError) throw orgChartsError

      console.log("[v0] HR settings loaded:", { leavePolicies, orgCharts })

      // Update state with loaded data
      setLeavePolicies(leavePolicies || [])
      setOrgCharts(orgCharts || [])
    } catch (error) {
      console.error("Error loading HR settings:", error)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      if (!companyData.id || companyData.id === "") {
        console.log("[v0] Skipping notification settings load - no company ID available")
        return
      }

      const supabase = createClient()

      // Load AI knowledge base for notification templates
      const { data: knowledgeBase, error: kbError } = await supabase
        .from("ai_knowledge_base")
        .select("*")
        .eq("category", "email_templates")
        .eq("is_active", true)

      if (kbError) throw kbError

      // Load communication groups for notification settings
      const { data: commGroups, error: groupsError } = await supabase
        .from("communication_groups")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)

      if (groupsError) throw groupsError

      console.log("[v0] Notification settings loaded:", { knowledgeBase, commGroups })

      // Update email templates from knowledge base
      if (knowledgeBase) {
        const templates = knowledgeBase.map((kb) => ({
          id: kb.id,
          name: kb.topic,
          subject: kb.topic,
          content: kb.content,
          type: kb.category,
        }))
        setEmailTemplates(templates)
      }
    } catch (error) {
      console.error("Error loading notification settings:", error)
    }
  }

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      try {
        await loadCompanyData()

        await Promise.all([
          loadLeaveTypes(),
          loadSalaryGrades(),
          loadEmployees(),
          loadSubsidiaries(),
          loadPayrollConfig(),
          loadPayrollAllowances(),
          loadPayrollDeductions(),
          // loadLoanSettings() is now called from loadCompanyData()
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

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      await loadAllData()
    }

    initializeData()
  }, [])

  const loadCompanyData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("companies").select("*").single()

      if (error) {
        console.error("Company data error:", error)
        const { data: newCompany, error: createError } = await supabase
          .from("companies")
          .insert({
            id: crypto.randomUUID(),
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
          const tempId = "00000000-0000-0000-0000-000000000001"
          setCompanyData({
            id: tempId,
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

      const companyInfo = {
        id: data.id || "",
        name: data.name || "",
        email: data.email_address || "",
        tax_id: data.tax_id || "",
        ssnit_number: data.ssnit_number || "",
        industry: data.industry || "",
        status: "active",
        address: data.address || "",
        phone: data.phone_number || "",
      }

      setCompanyData(companyInfo)

      // Load company structure data
      if (data.divisions) setDivisions(Array.isArray(data.divisions) ? data.divisions : [])
      if (data.departments) setDepartments(Array.isArray(data.departments) ? data.departments : [])
      if (data.locations) setLocations(Array.isArray(data.locations) ? data.locations : [])

      // Load logo if exists
      if (data.logo_url) setLogoPreview(data.logo_url)

      console.log("[v0] Company data loaded, ID:", data.id)
    } catch (error) {
      console.error("Error loading company data:", error)
    }
  }

  const loadLoanSettings = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping loan settings load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("loan_settings")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)
        .order("code")

      if (error) {
        console.error("Error loading loan settings:", error)
        return
      }

      setLoanSettingsState(data || [])
      console.log("[v0] Loan settings loaded successfully")
    } catch (error) {
      console.error("Error loading loan settings:", error)
    }
  }

  const loadSecuritySettings = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping security settings load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.from("company_settings").select("*").eq("id", companyData.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading security settings:", error)
        return
      }

      if (data) {
        setSecuritySettings({
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordPolicy: "medium",
          loginAttempts: 5,
          auditLog: true,
        })
      }
      console.log("[v0] Security settings loaded successfully")
    } catch (error) {
      console.error("Error loading security settings:", error)
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

  const loadLeaveManagementData = async () => {
    if (!companyData.id) {
      console.log("[v0] Skipping leave management load - no company ID available")
      return
    }

    try {
      const supabase = createClient()

      // Load leave types
      const { data: leaveTypesData, error: leaveTypesError } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", companyData.id)
        .order("name")

      if (leaveTypesError) throw leaveTypesError

      // Load leave policies
      const { data: leavePoliciesData, error: leavePoliciesError } = await supabase
        .from("leave_policies")
        .select("*")
        .eq("company_id", companyData.id)
        .order("policy_name")

      if (leavePoliciesError) throw leavePoliciesError

      // Load leave type approvers
      const { data: approversData, error: approversError } = await supabase
        .from("leave_type_approvers")
        .select("*")
        .order("approval_level")

      if (approversError) throw approversError

      // Load leave type eligibility
      const { data: eligibilityData, error: eligibilityError } = await supabase
        .from("leave_type_eligibility")
        .select("*")

      if (eligibilityError) throw eligibilityError

      console.log("[v0] Leave management data loaded:", {
        leaveTypes: leaveTypesData?.length,
        policies: leavePoliciesData?.length,
        approvers: approversData?.length,
        eligibility: eligibilityData?.length,
      })

      setLeaveTypes(leaveTypesData || [])
      setLeavePolicies(leavePoliciesData || [])
      setLeaveTypeApprover(approversData || [])
      setLeaveEligibility(eligibilityData || [])
    } catch (error) {
      console.error("Error loading leave management data:", error)
    }
  }

  const loadLeaveTypes = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping leave types load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error loading leave types:", error)
        return
      }

      setLeaveTypes(data || [])
      console.log("[v0] Leave types loaded successfully")
    } catch (error) {
      console.error("Error loading leave types:", error)
    }
  }

  const loadSalaryGrades = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping salary grades load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("salary_grades")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)
        .order("grade_level")

      if (error) {
        console.error("Error loading salary grades:", error)
        return
      }

      setSalaryGradesState(data || [])
      console.log("[v0] Salary grades loaded successfully")
    } catch (error) {
      console.error("Error loading salary grades:", error)
    }
  }

  const loadEmployees = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping employees load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", companyData.id)
        .order("full_name")

      if (error) {
        console.error("Error loading employees:", error)
        return
      }

      setEmployees(data || [])
      console.log("[v0] Employees loaded successfully")
    } catch (error) {
      console.error("Error loading employees:", error)
    }
  }

  const loadSubsidiaries = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping subsidiaries load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("subsidiaries")
        .select("*")
        .eq("company_id", companyData.id)
        .order("name")

      if (error) {
        console.error("Error loading subsidiaries:", error)
        return
      }

      setSubsidiaries(data || [])
      console.log("[v0] Subsidiaries loaded successfully")
    } catch (error) {
      console.error("Error loading subsidiaries:", error)
    }
  }

  const loadPayrollConfig = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping payroll config load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("payroll_configuration")
        .select("*")
        .eq("company_id", companyData.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading payroll config:", error)
        return
      }

      if (data) {
        setPayrollConfig({
          minimum_wage: data.minimum_wage || 18.15,
          overtime_weekday_multiplier: data.overtime_weekday_multiplier || 1.5,
          overtime_weekend_multiplier: data.overtime_weekend_multiplier || 2,
          currency_code: data.currency_code || "GHS",
          currency_symbol: data.currency_symbol || "₵",
        })
      }
      console.log("[v0] Payroll config loaded successfully")
    } catch (error) {
      console.error("Error loading payroll config:", error)
    }
  }

  const loadPayrollAllowances = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping payroll allowances load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("payroll_allowances")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)
        .order("code")

      if (error) {
        console.error("Error loading payroll allowances:", error)
        return
      }

      setPayrollAllowancesState(data || [])
      console.log("[v0] Payroll allowances loaded successfully")
    } catch (error) {
      console.error("Error loading payroll allowances:", error)
    }
  }

  const loadPayrollDeductions = async () => {
    try {
      if (!companyData?.id || companyData.id.trim() === "") {
        console.log("[v0] Skipping payroll deductions load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("payroll_deductions")
        .select("*")
        .eq("company_id", companyData.id)
        .eq("is_active", true)
        .order("code")

      if (error) {
        console.error("Error loading payroll deductions:", error)
        return
      }

      setPayrollDeductionsState(data || [])
      console.log("[v0] Payroll deductions loaded successfully")
    } catch (error) {
      console.error("Error loading payroll deductions:", error)
    }
  }

  const loadRoles = async () => {
    try {
      const supabase = createClient()
      // Since there's no roles table in the schema, we'll create default roles
      const defaultRoles = [
        { id: "1", name: "Admin", permissions: ["all"] },
        { id: "2", name: "HR Manager", permissions: ["hr", "payroll"] },
        { id: "3", name: "Employee", permissions: ["view"] },
      ]

      setRoles(defaultRoles)
      console.log("[v0] Roles loaded successfully")
    } catch (error) {
      console.error("Error loading roles:", error)
    }
  }

  const loadEmailTemplates = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ai_knowledge_base")
        .select("*")
        .eq("category", "email_templates")
        .eq("is_active", true)
        .order("topic")

      if (error) {
        console.error("Error loading email templates:", error)
        return
      }

      const templates = (data || []).map((item) => ({
        id: item.id,
        name: item.topic,
        subject: item.topic,
        content: item.content,
        type: "email",
      }))

      setEmailTemplates(templates)
      console.log("[v0] Email templates loaded successfully")
    } catch (error) {
      console.error("Error loading email templates:", error)
    }
  }

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      // Load company data first and wait for it to complete
      await loadCompanyData()

      // Small delay to ensure company state is updated
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Load all other data in parallel after company data is confirmed
      await Promise.all([
        loadPayrollConfig(),
        loadPayrollAllowances(),
        loadPayrollDeductions(),
        loadSalaryGrades(),
        loadLeaveManagementData(),
        loadNotificationSettings(),
        loadEmployees(),
        loadSubsidiaries(),
        loadRoles(),
        loadEmailTemplates(),
      ])

      // Load settings that depend on company ID after other data
      if (companyData?.id && companyData.id.trim() !== "") {
        await Promise.all([loadLoanSettings(), loadSecuritySettings()])
      }

      console.log("[v0] All data loaded successfully")

      toast({
        title: "Success",
        description: "All data refreshed successfully",
      })
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

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType)
    setShowLeaveTypeDialog(true)
  }

  const handleEditLeavePolicy = (policy: LeavePolicy) => {
    setSelectedLeavePolicy(policy)
    setShowLeavePolicyDialog(true)
  }

  const handleEditApprover = (approver: LeaveTypeApprover) => {
    setShowApproverDialog(true)
  }

  const handleEditEligibility = (rule: LeaveTypeEligibility) => {
    setShowEligibilityDialog(true)
  }

  const handleEditSalaryGrade = (grade: SalaryGrade) => {
    setEditingSalaryGrade(grade)
    setShowSalaryGradeDialog(true)
  }

  const handleDeactivateLeaveType = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("leave_types").update({ is_active: false }).eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Leave type deactivated successfully",
      })

      loadLeaveManagementData()
    } catch (error) {
      console.error("Error deactivating leave type:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate leave type",
        variant: "destructive",
      })
    }
  }

  const handleDeactivateLeavePolicy = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("leave_policies").update({ is_active: false }).eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Leave policy deactivated successfully",
      })

      loadLeaveManagementData()
    } catch (error) {
      console.error("Error deactivating leave policy:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate leave policy",
        variant: "destructive",
      })
    }
  }

  const handleRemoveApprover = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("leave_type_approvers").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Approver removed successfully",
      })

      loadLeaveManagementData()
    } catch (error) {
      console.error("Error removing approver:", error)
      toast({
        title: "Error",
        description: "Failed to remove approver",
        variant: "destructive",
      })
    }
  }

  const handleRemoveEligibility = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("leave_type_eligibility").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Eligibility rule removed successfully",
      })

      loadLeaveManagementData()
    } catch (error) {
      console.error("Error removing eligibility rule:", error)
      toast({
        title: "Error",
        description: "Failed to remove eligibility rule",
        variant: "destructive",
      })
    }
  }

  const handleRemoveSalaryGrade = async (gradeId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("salary_grades").delete().eq("id", gradeId)

      if (error) throw error

      setSalaryGradesState((prev) => prev.filter((grade) => grade.id !== gradeId))
      toast({
        title: "Success",
        description: "Salary grade removed successfully",
      })
    } catch (error) {
      console.error("Error removing salary grade:", error)
      toast({
        title: "Error",
        description: "Failed to remove salary grade",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your configuration and preferences</p>
        </div>
        <Button onClick={loadAllData} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="multi-company">Multi-Company</TabsTrigger>
          <TabsTrigger value="roles">Roles & Access</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="hr" className="space-y-6">
          {/* Leave Types Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Leave Types
                  </CardTitle>
                  <CardDescription>Manage different types of leave available to employees</CardDescription>
                </div>
                <Button onClick={() => setShowLeaveTypeDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leave Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {leaveTypes.length === 0 ? (
                <p className="text-muted-foreground">No leave types found. Add leave types to get started.</p>
              ) : (
                <div className="space-y-4">
                  {leaveTypes.map((leaveType) => (
                    <div key={leaveType.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {leaveType.name} ({leaveType.code})
                        </h4>
                        <p className="text-sm text-muted-foreground">{leaveType.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Annual Entitlement: {leaveType.annual_entitlement} days</span>
                          <span>Pay: {leaveType.pay_percentage}%</span>
                          <span>Max Consecutive: {leaveType.max_consecutive_days} days</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditLeaveType(leaveType)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Approvers
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Eligibility
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeactivateLeaveType(leaveType.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Policies Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Leave Policies</CardTitle>
                  <CardDescription>Manage company leave policies and entitlements</CardDescription>
                </div>
                <Button onClick={() => setShowLeavePolicyDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leave Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {leavePolicies.length === 0 ? (
                <p className="text-muted-foreground">No leave policies found. Add policies to get started.</p>
              ) : (
                <div className="space-y-4">
                  {leavePolicies.map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{policy.policy_name}</h4>
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Max Days: {policy.max_days}</span>
                          <span>Carry Over: {policy.carry_over_days} days</span>
                          <span>Notice: {policy.notice_period_days} days</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditLeavePolicy(policy)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeactivateLeavePolicy(policy.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary Grades Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Salary Grades & Notches</CardTitle>
                  <CardDescription>Manage salary grades and step progressions</CardDescription>
                </div>
                <Button onClick={() => setShowSalaryGradeDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grade
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salaryGrades.length === 0 ? (
                <p className="text-muted-foreground">No salary grades found. Add grades to get started.</p>
              ) : (
                <div className="space-y-4">
                  {salaryGrades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{grade.grade_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Salary Range: GH¢{grade.step_1?.toLocaleString()} - GH¢{grade.step_5?.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Steps: 5</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSalaryGrade(grade)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveSalaryGrade(grade.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-32 shrink-0">
                  <Label htmlFor="logo">Company Logo</Label>
                </div>
                <div className="space-y-2">
                  {logoPreview ? (
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Company Logo"
                      className="h-20 w-auto rounded-md"
                    />
                  ) : (
                    <div className="h-20 w-32 rounded-md bg-muted" />
                  )}
                  <Input type="file" id="logo" onChange={handleLogoUpload} accept="image/*" />
                  {uploadedFileName && <p className="text-sm text-muted-foreground">Uploaded: {uploadedFileName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={companyData.tax_id}
                    onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                  <Input
                    id="ssnitNumber"
                    value={companyData.ssnit_number}
                    onChange={(e) => setCompanyData({ ...companyData, ssnit_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={companyData.industry}
                    onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveCompany} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi-company" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Subsidiaries</h2>
              <p className="text-muted-foreground">Manage your company subsidiaries and branches</p>
            </div>
            <Button
              onClick={() => {
                setShowSubsidiaryDialog(true)
                setEditingSubsidiary(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subsidiary
            </Button>
          </div>

          {subsidiaries.length === 0 ? (
            <p className="text-muted-foreground">No subsidiaries found. Add subsidiaries to get started.</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {subsidiaries.map((subsidiary) => (
                <Card key={subsidiary.id}>
                  <CardHeader>
                    <CardTitle>{subsidiary.name}</CardTitle>
                    <CardDescription>{subsidiary.industry}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">Email: {subsidiary.email_address}</p>
                    <p className="text-sm text-muted-foreground">Phone: {subsidiary.phone_number}</p>
                    <p className="text-sm text-muted-foreground">Divisions: {subsidiary.divisions?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Departments: {subsidiary.departments?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Locations: {subsidiary.locations?.length || 0}</p>
                  </CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setViewingSubsidiary(subsidiary)
                          setShowViewSubsidiaryDialog(true)
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingSubsidiary(subsidiary)
                          setShowSubsidiaryDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h2>
              <p className="text-muted-foreground">Manage user roles and access permissions</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>

          {roles.length === 0 ? (
            <p className="text-muted-foreground">No roles found. Add roles to get started.</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">Users: {role.user_count}</p>
                    <p className="text-sm text-muted-foreground">Permissions: {role.permissions.join(", ")}</p>
                  </CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
              <p className="text-muted-foreground">Manage user accounts and access</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {employees.length === 0 ? (
            <p className="text-muted-foreground">No users found. Add users to get started.</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => (
                <Card key={employee.id}>
                  <CardHeader>
                    <CardTitle>{employee.full_name}</CardTitle>
                    <CardDescription>{employee.position}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">Email: {employee.corporate_email}</p>
                    <p className="text-sm text-muted-foreground">Department: {employee.department}</p>
                    <p className="text-sm text-muted-foreground">Status: {employee.status}</p>
                  </CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Configuration</CardTitle>
              <CardDescription>Configure payroll settings and parameters</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fix toString() calls on potentially undefined values by adding null checks and default values */}
                <div className="space-y-2">
                  <Label htmlFor="minimumWage">Minimum Wage ({payrollConfig.currency_code})</Label>
                  <Input
                    id="minimumWage"
                    type="number"
                    value={(payrollConfig.minimum_wage || 0).toString()}
                    onChange={(e) =>
                      setPayrollConfig({ ...payrollConfig, minimum_wage: Number.parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-[200px] justify-between bg-transparent">
                        {payrollConfig.currency_code} <MoreHorizontal className="w-4 h-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCurrencyChange("GHS")}>GHS</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCurrencyChange("USD")}>USD</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCurrencyChange("EUR")}>EUR</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fix toString() calls on potentially undefined values by adding null checks and default values */}
                <div className="space-y-2">
                  <Label htmlFor="weekdayOvertime">Weekday Overtime Multiplier</Label>
                  <Input
                    id="weekdayOvertime"
                    type="number"
                    value={(payrollConfig.overtime_weekday_multiplier || 0).toString()}
                    onChange={(e) =>
                      setPayrollConfig({
                        ...payrollConfig,
                        overtime_weekday_multiplier: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekendOvertime">Weekend Overtime Multiplier</Label>
                  <Input
                    id="weekendOvertime"
                    type="number"
                    value={(payrollConfig.overtime_weekend_multiplier || 0).toString()}
                    onChange={(e) =>
                      setPayrollConfig({
                        ...payrollConfig,
                        overtime_weekend_multiplier: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allowances Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Allowances</CardTitle>
                  <CardDescription>Manage payroll allowances</CardDescription>
                </div>
                <Button onClick={handleAddAllowance}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allowance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payrollAllowances.length === 0 ? (
                <p className="text-muted-foreground">No allowances found. Add allowances to get started.</p>
              ) : (
                <div className="space-y-4">
                  {payrollAllowances.map((allowance, index) => (
                    <div key={allowance.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{allowance.code}</h4>
                        <p className="text-sm text-muted-foreground">{allowance.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Amount: {formatCurrency(allowance.amount)}</span>
                          <span>Taxable: {allowance.taxable ? "Yes" : "No"}</span>
                          <span>Recurring: {allowance.recurring ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAllowance(index)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAllowance(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deductions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Deductions</CardTitle>
                  <CardDescription>Manage payroll deductions</CardDescription>
                </div>
                <Button onClick={handleAddDeduction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deduction
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payrollDeductions.length === 0 ? (
                <p className="text-muted-foreground">No deductions found. Add deductions to get started.</p>
              ) : (
                <div className="space-y-4">
                  {payrollDeductions.map((deduction, index) => (
                    <div key={deduction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deduction.code}</h4>
                        <p className="text-sm text-muted-foreground">{deduction.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Amount: {formatCurrency(deduction.amount)}</span>
                          <span>Recurring: {deduction.recurring ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDeduction(index)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteDeduction(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Settings Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Loan Settings</CardTitle>
                  <CardDescription>Manage loan settings</CardDescription>
                </div>
                <Button onClick={handleAddLoan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Loan Setting
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loanSettings.length === 0 ? (
                <p className="text-muted-foreground">No loan settings found. Add loan settings to get started.</p>
              ) : (
                <div className="space-y-4">
                  {loanSettings.map((loan, index) => (
                    <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{loan.code}</h4>
                        <p className="text-sm text-muted-foreground">{loan.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Max Amount: {formatCurrency(loan.max_amount)}</span>
                          <span>Interest Rate: {loan.interest_rate}%</span>
                          <span>Tenure: {loan.max_repayment_months} months</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditLoan(index)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteLoan(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security settings and policies</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Fix toString() calls on potentially undefined values by adding null checks and default values */}
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={(securitySettings.sessionTimeout || 0).toString()}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, sessionTimeout: Number.parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordPolicy">Password Policy</Label>
                <Input
                  id="passwordPolicy"
                  type="text"
                  value={securitySettings.passwordPolicy || ""}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, passwordPolicy: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginAttempts">Maximum Login Attempts</Label>
                <Input
                  id="loginAttempts"
                  type="number"
                  value={(securitySettings.loginAttempts || 0).toString()}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, loginAttempts: Number.parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditLog">Audit Logging</Label>
                <Input
                  id="auditLog"
                  type="checkbox"
                  checked={securitySettings.auditLog}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, auditLog: e.target.checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="payrollAlerts">Payroll Alerts</Label>
                <Input
                  id="payrollAlerts"
                  type="checkbox"
                  checked={notificationSettings.payrollAlerts}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, payrollAlerts: e.target.checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveAlerts">Leave Alerts</Label>
                <Input
                  id="leaveAlerts"
                  type="checkbox"
                  checked={notificationSettings.leaveAlerts}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, leaveAlerts: e.target.checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeUpdates">Employee Updates</Label>
                <Input
                  id="employeeUpdates"
                  type="checkbox"
                  checked={notificationSettings.employeeUpdates}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, employeeUpdates: e.target.checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemMaintenance">System Maintenance</Label>
                <Input
                  id="systemMaintenance"
                  type="checkbox"
                  checked={notificationSettings.systemMaintenance}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, systemMaintenance: e.target.checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <Input
                  id="smsNotifications"
                  type="checkbox"
                  checked={notificationSettings.smsNotifications}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={notificationSettings.webhookUrl}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookUrl: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showSubsidiaryDialog && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-auto h-fit w-full max-w-lg rounded-md bg-white p-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-4">
              {editingSubsidiary ? "Edit Subsidiary" : "Add Subsidiary"}
            </h2>
            <SubsidiaryForm
              subsidiary={editingSubsidiary}
              onSave={(data) => {
                if (editingSubsidiary) {
                  // Update existing subsidiary
                  const updatedSubsidiaries = subsidiaries.map((s) =>
                    s.id === editingSubsidiary.id ? { ...s, ...data } : s,
                  )
                  setSubsidiaries(updatedSubsidiaries)
                } else {
                  // Add new subsidiary
                  setSubsidiaries([...subsidiaries, { id: crypto.randomUUID(), ...data }])
                }
                setShowSubsidiaryDialog(false)
              }}
              onCancel={() => setShowSubsidiaryDialog(false)}
            />
          </div>
        </div>
      )}

      {showViewSubsidiaryDialog && viewingSubsidiary && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-auto h-fit w-full max-w-lg rounded-md bg-white p-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-4">View Subsidiary</h2>
            <Card>
              <CardHeader>
                <CardTitle>{viewingSubsidiary.name}</CardTitle>
                <CardDescription>{viewingSubsidiary.industry}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Email: {viewingSubsidiary.email_address}</p>
                <p className="text-sm text-muted-foreground">Phone: {viewingSubsidiary.phone_number}</p>
                <p className="text-sm text-muted-foreground">Divisions: {viewingSubsidiary.divisions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">
                  Departments: {viewingSubsidiary.departments?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Locations: {viewingSubsidiary.locations?.length || 0}</p>
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowViewSubsidiaryDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
