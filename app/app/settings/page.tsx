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
import { Edit } from "lucide-react"

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
  const [showAddApproverDialog, setShowAddApproverDialog] = useState(false)
  const [showAddEligibilityDialog, setShowAddEligibilityDialog] = useState(false)
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

  const loadLoanSettings = async () => {
    try {
      // Get the latest company data from state
      const currentCompanyId = companyData?.id
      if (!currentCompanyId || currentCompanyId.trim() === "") {
        console.log("[v0] Skipping loan settings load - no company ID available")
        return
      }

      console.log("[v0] Loading loan settings for company:", currentCompanyId)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("loan_settings")
        .select("*")
        .eq("company_id", currentCompanyId)
        .order("code")

      if (error) {
        console.error("Error loading loan settings:", error)
        return
      }

      setLoanSettingsState(data || [])
    } catch (error) {
      console.error("Error loading loan settings:", error)
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

  const loadSecuritySettings = async () => {
    try {
      // Get the latest company data from state
      const currentCompanyId = companyData?.id
      if (!currentCompanyId || currentCompanyId === "") {
        console.log("[v0] Skipping security settings load - no company ID available")
        return
      }

      console.log("[v0] Loading security settings for company:", currentCompanyId)
      const supabase = createClient()

      // Since there's no security_settings table in the schema, we'll use company_settings
      const { data: companySettings, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("id", currentCompanyId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading security settings:", error)
        return
      }

      // Set default security settings if none exist
      if (!companySettings?.security_settings) {
        setSecuritySettings({
          twoFactorAuth: false,
          sessionTimeout: 15,
          auditLogging: true,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false,
          },
        })
      } else {
        setSecuritySettings(companySettings.security_settings)
      }
    } catch (error) {
      console.error("Error loading security settings:", error)
    }
  }

  const loadNotificationSettings = async () => {
    try {
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

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      // Load company data first
      await loadCompanyData()

      // Wait for company data to be available
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Load all other data in parallel after company data is available
      await Promise.all([
        loadPayrollConfig(),
        loadPayrollAllowances(),
        loadPayrollDeductions(),
        loadLoanSettings(),
        loadSalaryGrades(),
        loadLeaveManagementData(),
        loadSecuritySettings(),
        loadNotificationSettings(),
        loadEmployees(),
        loadSubsidiaries(),
      ])

      console.log("[v0] All data loaded successfully")
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load some data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompanyData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("companies").select("*").single()

      if (error) {
        console.error("Company data error:", error)
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
          const tempId = crypto.randomUUID()
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

      console.log("[v0] Company data loaded, ID:", data.id)
      await loadLoanSettings()
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
          subject: "Your Leave Request {{status}} - {{leave_type}}",
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

  const loadPayrollConfig = async () => {
    try {
      const supabase = createClient()

      // Load payroll configuration
      const { data: configData, error: configError } = await supabase.from("payroll_configuration").select("*").single()

      if (configData) {
        setPayrollConfig(configData)
      }

      // Load allowances
      const { data: allowancesData, error: allowancesError } = await supabase.from("payroll_allowances").select("*")

      if (allowancesData) {
        setPayrollAllowancesState(allowancesData)
      }

      // Load deductions
      const { data: deductionsData, error: deductionsError } = await supabase.from("payroll_deductions").select("*")

      if (deductionsData) {
        setPayrollDeductionsState(deductionsData)
      }
    } catch (error) {
      console.error("Error loading payroll config:", error)
    }
  }

  const loadLeaveTypes = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("leave_types").select("*").order("name")

      if (error) throw error
      setLeaveTypesState(data || [])
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
      setSalaryGradesState(data || [])
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
      setPayrollAllowancesState(data || [])
    } catch (error) {
      console.error("Error loading payroll allowances:", error)
    }
  }

  const loadPayrollDeductions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("payroll_deductions").select("*").order("type")

      if (error) throw error
      setPayrollDeductionsState(data || [])
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

  return (
    
      {/* Leave Types Section */}

  \
                Leave Types
              
              
                Manage different types of leave available to employees
              
            
          
          
            Add Leave Type
  leaveTypes.length === 0 ? (
    <>No leave types found. Add leave types to get started.</>
  ) : (
    (
      leaveTypes.map((leaveType) => (
                
                  
                    \
                      {leaveType.name} ({leaveType.code})
                    
                    \
                      {leaveType.description}
                    
                    
                      \
                        Annual Entitlement: {leaveType.annual_entitlement} days\
                        Pay: {leaveType.pay_percentage}%\
                        Max Consecutive: {leaveType.max_consecutive_days} days
                      
                    
                  
                  
                    
                      
                        
                          Edit\
                        
                        \
                          Manage Approvers
                        
                        \
                          Manage Eligibility
                        
                        \
                          Deactivate
                        
                      
                    
                  
                
              )
    )
  )
  )
  \
          

  
                Leave Policies
              
              
                Manage company leave policies and entitlements
              
            
          
          
            Add Leave Policy
  leavePolicies.length === 0 ? (
    <>No leave policies found. Add policies to get started.</>
  ) : (
    (
      leavePolicies.map((policy) => (
                
                  
                    \
                      {policy.policy_name}
                    
                    \
                      {policy.description}
                    
                    
                      \
                        Max Days: {policy.max_days}\
                        Carry Over: {policy.carry_over_days} days\
                        Notice: {policy.notice_period_days} days
                      
                    
                  
                  
                    
                      
                        
                          Edit\
                        
                        \
                          Deactivate
                        
                      
                    
                  
                
              )
    )
  )
  )
  \
          

  
                Leave Approvers
              
              \
                Manage approval workflows
  for different leave types
  \
              
            
          
          
            Add Approver
  leaveApprovers.length === 0 ? (
    <>No approvers configured. Set up approval workflows.</>
  ) : (
    (
      leaveApprovers.map((approver) => (
                
                  
                    \
                      Level {approver.approval_level}: {approver.approver_role}
                    
                    \
                      {approver.is_required ? 'Required' : \'Optional\'} approval step
                    
                  
                  
                    
                      
                        
                          Edit\
                        
                        \
                          Remove
                        
                      
                    
                  
                
              )
    )
  )
  )
  \
          

  Leave Eligibility Rules
\
  Define who is eligible
  for different leave types
  \
              
            
          
          
            Add Eligibility Rule
  leaveEligibility.length === 0 ? (
              <>No eligibility rules configured. Set up eligibility criteria.</>
            ) : (
              leaveEligibility.map((rule) => (
                
                  Eligibility Rule
                  
                    Type: {rule.employee_type}
                    Gender: {rule.gender}
                    Age: {rule.min_age}-{rule.max_age}
                  
                  
                    
                      
                        
                          Edit
                        
                        
                          Remove
                        
                      
                    
                  
                
              ))
  )

  Salary
  Grades & Notches

  Manage
  salary
  grades
  and
  step
  progressions

  Add
  Grade
  salaryGrades.length === 0 ? (
              <>No salary grades found. Add grades to get started.</>
            ) : (
              salaryGrades.map((grade) => (
                
                  
                    
                      {grade.grade_name}
                    
                    
                      Salary Range: GH¢{grade.step_1?.toLocaleString()} - GH¢{grade.step_5?.toLocaleString()}
                    
                    Steps: 5
                  
                  
                    
                      
                        
                          Edit
                        
                        
                          Remove
                        
                      
                    
                  
                
              ))
  )

  )

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType)
    setShowLeaveTypeDialog(true)
  }

  const handleEditLeavePolicy = (policy: LeavePolicy) => {
    setSelectedLeavePolicy(policy)
    setShowLeavePolicyDialog(true)
  }

  const handleEditApprover = (approver: LeaveTypeApprover) => {
    // Implementation for editing approver
    setShowApproverDialog(true)
  }

  const handleEditEligibility = (rule: LeaveTypeEligibility) => {
    // Implementation for editing eligibility rule
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

  const handleRemoveSalaryGrade = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("salary_grades").update({ is_active: false }).eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Salary grade removed successfully",
      })

      loadSalaryGrades()
    } catch (error) {
      console.error("Error removing salary grade:", error)
      toast({
        title: "Error",
        description: "Failed to remove salary grade",
        variant: "destructive",
      })
    }
  }
}
