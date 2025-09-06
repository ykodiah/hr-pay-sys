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
  Save,
  Calculator,
  Receipt,
  Minus,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
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
    { rate: 0, threshold: 4380, description: "first" },
    { rate: 5, threshold: 1000, description: "next" },
    { rate: 10, threshold: 2000, description: "next" },
    { rate: 17.5, threshold: 20000, description: "next" },
    { rate: 25, threshold: 20000, description: "next" },
    { rate: 30, threshold: 0, description: "remaining amount", isFixed: true },
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

  const [payrollAllowances, setPayrollAllowancesState] = useState<any[]>([])
  const [payrollDeductions, setPayrollDeductionsState] = useState<any[]>([])
  const [loanSettings, setLoanSettingsState] = useState<any[]>([])
  const [leaveTypes, setLeaveTypesState] = useState<any[]>([])
  const [salaryGrades, setSalaryGradesState] = useState<any[]>([])

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
      NGN: { symbol: "₦", name: "Nigerian Naira (NGN)" },
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

      let newTaxBands = []

      if (newCurrency === "GHS") {
        // Ghana PAYE Tax Bands (Monthly Schedule 2024)
        newTaxBands = [
          { rate: 0, description: "first", threshold: 490 },
          { rate: 5, description: "next", threshold: 110 },
          { rate: 10, description: "next", threshold: 130 },
          { rate: 17.5, description: "next", threshold: 3167 },
          { rate: 25, description: "next", threshold: 16000 },
          { rate: 30, description: "next", threshold: 30520 },
          { rate: 35, description: "next", threshold: 50000 },
          { rate: 0, description: "remaining amount", threshold: 0 },
        ]
      } else if (newCurrency === "NGN") {
        // Nigeria PAYE Tax Bands (Monthly Schedule 2024)
        newTaxBands = [
          { rate: 7, description: "first", threshold: 25000 },
          { rate: 11, description: "next", threshold: 25000 },
          { rate: 15, description: "next", threshold: 41667 },
          { rate: 19, description: "next", threshold: 41667 },
          { rate: 21, description: "next", threshold: 133333 },
          { rate: 24, description: "remaining amount", threshold: 0 },
        ]
      } else {
        // Default tax bands for other currencies
        newTaxBands = [
          { rate: 0, description: "first", threshold: 1000 },
          { rate: 10, description: "next", threshold: 2000 },
          { rate: 20, description: "next", threshold: 5000 },
          { rate: 30, description: "remaining amount", threshold: 0 },
        ]
      }

      setTaxBands(newTaxBands)

      toast({
        title: "Currency Updated",
        description: `System currency changed to ${currency.name} with updated tax bands`,
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
      // Don't attempt to load if company ID is not available
      if (!companyData.id) {
        console.log("[v0] Skipping loan settings load - no company ID available")
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("loan_settings")
        .select("*")
        .eq("company_id", companyData.id)
        .order("type")

      if (error) throw error
      setLoanSettingsState(data || [])
    } catch (error) {
      console.error("Error loading loan settings:", error)
    }
  }

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      try {
        await loadCompanyData()

        // Load all other data that depends on company data
        await Promise.all([
          loadLeaveTypes(),
          loadSalaryGrades(),
          loadEmployees(),
          loadSubsidiaries(),
          loadPayrollConfig(),
          loadPayrollAllowances(),
          loadPayrollDeductions(),
          loadLoanSettings(), // Now safe to load after company data is available
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

      console.log("[v0] Saving payroll settings with user:", user.id, "company:", companyData.id)

      // Save payroll configuration with only fields that exist in the database
      const configData = {
        company_id: Number.parseInt(companyData.id) || 1,
        minimum_wage: payrollConfig.minimum_wage,
        overtime_weekday_multiplier: payrollConfig.overtime_weekday_multiplier,
        currency_code: payrollConfig.currency_code,
        currency_symbol: payrollConfig.currency_symbol,
        updated_at: new Date().toISOString(),
      }

      const { error: configError } = await supabase.from("payroll_configuration").upsert(configData)

      if (configError) throw configError

      // Save allowances
      for (const allowance of payrollAllowances) {
        const { error: allowanceError } = await supabase.from("payroll_allowances").upsert({
          ...allowance,
          company_id: companyData.id,
          updated_at: new Date().toISOString(),
        })

        if (allowanceError) throw allowanceError
      }

      // Save deductions
      for (const deduction of payrollDeductions) {
        const { error: deductionError } = await supabase.from("payroll_deductions").upsert({
          ...deduction,
          company_id: companyData.id,
          updated_at: new Date().toISOString(),
        })

        if (deductionError) throw deductionError
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Payroll Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pay Frequency</Label>
                      <Select
                        value={payrollSettings.pay_frequency}
                        onValueChange={(value) => setPayrollSettings({ ...payrollSettings, pay_frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={payrollConfig.currency_code} onValueChange={handleCurrencyChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">Ghana Cedis (GHS)</SelectItem>
                          <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Wage ({payrollConfig.currency_code})</Label>
                      <Input
                        type="number"
                        value={payrollConfig.minimum_wage}
                        onChange={(e) =>
                          setPayrollConfig({ ...payrollConfig, minimum_wage: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weekday Overtime Rate Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={payrollConfig.overtime_weekday_multiplier}
                        onChange={(e) =>
                          setPayrollConfig({
                            ...payrollConfig,
                            overtime_weekday_multiplier: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Weekend Overtime Rate Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={payrollConfig.overtime_weekend_multiplier}
                        onChange={(e) =>
                          setPayrollConfig({
                            ...payrollConfig,
                            overtime_weekend_multiplier: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payroll Cutoff Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={payrollSettings.cutoff_day}
                        onChange={(e) =>
                          setPayrollSettings({ ...payrollSettings, cutoff_day: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Processing Day</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={payrollSettings.processing_day}
                      onChange={(e) =>
                        setPayrollSettings({ ...payrollSettings, processing_day: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Auto-calculate PAYE</Label>
                      <Switch
                        checked={payrollSettings.auto_calculate_paye}
                        onCheckedChange={(checked) =>
                          setPayrollSettings({ ...payrollSettings, auto_calculate_paye: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-calculate SSNIT</Label>
                      <Switch
                        checked={payrollSettings.auto_calculate_ssnit}
                        onCheckedChange={(checked) =>
                          setPayrollSettings({ ...payrollSettings, auto_calculate_ssnit: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-calculate Provident Fund (Tier 3)</Label>
                      <Switch
                        checked={payrollSettings.auto_calculate_provident}
                        onCheckedChange={(checked) =>
                          setPayrollSettings({ ...payrollSettings, auto_calculate_provident: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Tax Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">PAYE Tax Bands</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const remainingBand = taxBands.find((band) => band.description === "remaining amount")
                          const otherBands = taxBands.filter((band) => band.description !== "remaining amount")
                          const newBand = {
                            rate: 0,
                            description: "next",
                            threshold: 0,
                          }
                          const newBands = [...otherBands, newBand]
                          if (remainingBand) {
                            newBands.push(remainingBand)
                          }
                          setTaxBands(newBands)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {taxBands.map((band, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Input
                            className="w-16"
                            value={band.rate}
                            onChange={(e) => {
                              const newBands = [...taxBands]
                              newBands[index].rate = Number.parseFloat(e.target.value) || 0
                              setTaxBands(newBands)
                            }}
                          />
                          <span>% on</span>
                          <span className="text-blue-600">{band.description}</span>
                          <span>{payrollConfig.currency_code}</span>
                          <Input
                            className="w-20"
                            value={band.threshold}
                            onChange={(e) => {
                              const newBands = [...taxBands]
                              newBands[index].threshold = Number.parseFloat(e.target.value) || 0
                              setTaxBands(newBands)
                            }}
                            disabled={band.description === "remaining amount"}
                          />
                          {band.description !== "remaining amount" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => {
                                const newBands = taxBands.filter((_, i) => i !== index)
                                setTaxBands(newBands)
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">SSNIT Rates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Employee:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            className="w-16 h-6 text-xs"
                            type="number"
                            step="0.1"
                            value={ssnit.employee}
                            onChange={(e) => dateSSNITRates("employee", Number.parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Employer:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            className="w-16 h-6 text-xs"
                            type="number"
                            step="0.1"
                            value={ssnit.employer}
                            onChange={(e) => dateSSNITRates("employer", Number.parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{ssnit.total.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Tier 2 Rates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Employee:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            className="w-16 h-6 text-xs"
                            type="number"
                            step="0.1"
                            value={tier2.employee}
                            onChange={(e) => updateTier2Rates("employee", Number.parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Employer:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            className="w-16 h-6 text-xs"
                            type="number"
                            step="0.1"
                            value={tier2.employer}
                            onChange={(e) => updateTier2Rates("employer", Number.parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{tier2.total.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Tier 3 Rates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Employee:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            className="w-16 h-6 text-xs"
                            type="number"
                            step="0.1"
                            value={tier3.employee}
                            onChange={(e) => updateTier3Rates("employee", Number.parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Employer:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            className="w-16 h-6 text-xs"
                            type="number"
                            step="0.1"
                            value={tier3.employer}
                            onChange={(e) => updateTier3Rates("employer", Number.parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{tier3.total.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Allowances</span>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleAddAllowance}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-center p-2">Taxable</th>
                        <th className="text-center p-2">Recurring</th>
                        <th className="text-center p-2">AMOUNT</th>
                        <th className="text-center p-2">%</th>
                        <th className="text-center p-2">FIXED/VARIABLE</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollAllowances.map((allowance, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{allowance.code}</td>
                          <td className="p-2">{allowance.description}</td>
                          <td className="p-2 text-center">
                            <Switch checked={allowance.taxable} size="sm" />
                          </td>
                          <td className="p-2 text-center">
                            <Switch checked={allowance.recurring} size="sm" />
                          </td>
                          <td className="p-2 text-center">{allowance.amount}</td>
                          <td className="p-2 text-center">{allowance.percentage}</td>
                          <td className="p-2 text-center">{allowance.type}</td>
                          <td className="p-2 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditAllowance(index)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteAllowance(index)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Deductions</span>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleAddDeduction}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-center p-2">Recurring</th>
                        <th className="text-center p-2">AMOUNT</th>
                        <th className="text-center p-2">%</th>
                        <th className="text-center p-2">FIXED/VARIABLE</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollDeductions.map((deduction, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{deduction.code}</td>
                          <td className="p-2">{deduction.description}</td>
                          <td className="p-2 text-center">
                            <Switch checked={deduction.recurring} size="sm" />
                          </td>
                          <td className="p-2 text-center">{deduction.amount}</td>
                          <td className="p-2 text-center">{deduction.percentage}</td>
                          <td className="p-2 text-center">{deduction.type}</td>
                          <td className="p-2 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditDeduction(index)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteDeduction(index)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Loan Settings</span>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleAddLoan}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-center p-2">Maximum Amount</th>
                        <th className="text-center p-2">Interest Rate (%)</th>
                        <th className="text-center p-2">Rate Method</th>
                        <th className="text-center p-2">Admin Charge</th>
                        <th className="text-center p-2">Loan Tenure (months)</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanSettings.map((loan, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{loan.code}</td>
                          <td className="p-2">{loan.description}</td>
                          <td className="p-2 text-center">{loan.maxAmount}</td>
                          <td className="p-2 text-center">{loan.interestRate}</td>
                          <td className="p-2 text-center">{loan.rateMethod}</td>
                          <td className="p-2 text-center">{loan.adminCharge}</td>
                          <td className="p-2 text-center">{loan.tenure}</td>
                          <td className="p-2 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditLoan(index)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteLoan(index)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSavePayrollSettings} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Payroll Settings
              </Button>
            </div>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>HR Settings</CardTitle>
                <CardDescription>Manage leave types, salary grades, and HR policies</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">HR settings content will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security policies and access controls</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security settings content will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email templates and notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings content will be implemented here.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>

      <Dialog open={showSubsidiaryDialog} onOpenChange={setShowSubsidiaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubsidiary ? "Edit Subsidiary" : "Add Subsidiary"}</DialogTitle>
          </DialogHeader>
          <SubsidiaryForm
            subsidiary={editingSubsidiary}
            onSave={handleSaveSubsidiary}
            onCancel={() => setShowSubsidiaryDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showViewSubsidiaryDialog} onOpenChange={setShowViewSubsidiaryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subsidiary Details</DialogTitle>
          </DialogHeader>
          {viewingSubsidiary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="font-medium">{viewingSubsidiary.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {viewingSubsidiary.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                  <p className="font-medium">{viewingSubsidiary.tax_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">SSNIT Number</Label>
                  <p className="font-medium">{viewingSubsidiary.ssnit_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewingSubsidiary.email_address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="font-medium">{viewingSubsidiary.phone_number}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <p className="font-medium">{viewingSubsidiary.address}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Divisions</Label>
                  <p className="font-medium">{viewingSubsidiary.divisions_count || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Departments</Label>
                  <p className="font-medium">{viewingSubsidiary.departments_count || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Locations</Label>
                  <p className="font-medium">{viewingSubsidiary.locations_count || 0}</p>
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
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Subsidiary Function</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate the subsidiary function? This will hide all subsidiary management
              features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDeactivation}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeactivation}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAllowanceDialog} onOpenChange={setShowAllowanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex >= 0 ? "Edit Allowance" : "Add Allowance"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={editingItem?.code || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingItem?.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingItem?.taxable || false}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, taxable: checked })}
                />
                <Label>Taxable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingItem?.recurring || false}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, recurring: checked })}
                />
                <Label>Recurring</Label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={editingItem?.amount || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, amount: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Percentage</Label>
                <Input
                  type="number"
                  value={editingItem?.percentage || 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, percentage: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingItem?.type || "FIXED"}
                  onValueChange={(value) => setEditingItem({ ...editingItem, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">FIXED</SelectItem>
                    <SelectItem value="VARIABLE">VARIABLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllowanceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAllowance}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex >= 0 ? "Edit Deduction" : "Add Deduction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={editingItem?.code || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingItem?.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingItem?.recurring || false}
                onCheckedChange={(checked) => setEditingItem({ ...editingItem, recurring: checked })}
              />
              <Label>Recurring</Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={editingItem?.amount || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, amount: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Percentage</Label>
                <Input
                  type="number"
                  value={editingItem?.percentage || 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, percentage: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingItem?.type || "FIXED"}
                  onValueChange={(value) => setEditingItem({ ...editingItem, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">FIXED</SelectItem>
                    <SelectItem value="VARIABLE">VARIABLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeductionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDeduction}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex >= 0 ? "Edit Loan Setting" : "Add Loan Setting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={editingItem?.code || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingItem?.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maximum Amount</Label>
                <Input
                  type="number"
                  value={editingItem?.maxAmount || 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, maxAmount: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingItem?.interestRate || 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, interestRate: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate Method</Label>
                <Select
                  value={editingItem?.rateMethod || "Reducing Balance"}
                  onValueChange={(value) => setEditingItem({ ...editingItem, rateMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reducing Balance">Reducing Balance</SelectItem>
                    <SelectItem value="Straight Line Meet">Straight Line Meet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Charge</Label>
                <Input
                  type="number"
                  value={editingItem?.adminCharge || 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, adminCharge: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Loan Tenure (months)</Label>
              <Input
                type="number"
                value={editingItem?.tenure || 12}
                onChange={(e) => setEditingItem({ ...editingItem, tenure: Number.parseInt(e.target.value) || 12 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLoan}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
