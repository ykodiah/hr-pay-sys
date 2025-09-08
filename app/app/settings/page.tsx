"use client"

import type React from "react"

import type { FunctionComponent } from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Building2,
  Shield,
  Users,
  DollarSign,
  Bell,
  Upload,
  X,
  Eye,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Calendar,
  Download,
  ExternalLink,
  MoreVertical,
  Loader2,
  Power,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  logo_url?: string
  divisions?: string[]
  departments?: string[]
  locations?: string[]
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
  is_paid: boolean
}

interface LeavePolicy {
  id: string
  policy_name: string
  policy_type: string
  max_days: number
  notice_period_days: number
  requires_approval: boolean
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

const SubsidiaryForm: FunctionComponent<SubsidiaryFormProps> = ({ subsidiary, onSave, onCancel }) => {
  const { toast } = useToast()
  const [companyData, setCompanyData] = useState<Company>({
    id: "",
    name: "",
    email_address: "",
    tax_id: "",
    ssnit_number: "",
    industry: "",
    status: "active",
    address: "",
    phone_number: "",
    divisions: [],
    departments: [],
    locations: [],
  })

  const [name, setName] = useState(subsidiary?.name || "")
  const [taxId, setTaxId] = useState(subsidiary?.tax_id || "")
  const [ssnitNumber, setSsnitNumber] = useState(subsidiary?.ssnit_number || "")
  const [email, setEmail] = useState(subsidiary?.email_address || "")
  const [phone, setPhone] = useState(subsidiary?.phone_number || "")
  const [address, setAddress] = useState(subsidiary?.address || "")
  const [divisions, setDivisions] = useState(subsidiary?.divisions || [])
  const [departments, setDepartments] = useState(subsidiary?.departments || [])
  const [locations, setLocations] = useState(subsidiary?.locations || [])
  const [logoPreview, setLogoPreview] = useState(subsidiary?.logo_url || "")
  const [logoFileName, setLogoFileName] = useState("")
  const [logoFileId, setLogoFileId] = useState(subsidiary?.logo_file_id || null)

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("[v0] Starting subsidiary logo upload for file:", file.name)

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
        try {
          const base64Data = e.target?.result as string
          console.log("[v0] File read successfully, preparing for upload...")

          const supabase = createClient()

          // Upload to company_files table
          const { data, error } = await supabase
            .from("company_files")
            .insert({
              company_id: companyData?.id || "00000000-0000-0000-0000-000000000001",
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_data: base64Data,
              file_category: "subsidiary_logo",
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

          console.log("[v0] Subsidiary logo uploaded successfully:", data)
          setLogoFileName(file.name)
          setLogoPreview(base64Data)
          setLogoFileId(data.id)

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
      logo_file_id: logoFileId,
      logo_url: logoPreview,
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
        <Label>Subsidiary Logo</Label>
        <div className="flex items-center space-x-4">
          <div className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-dashed border-muted-foreground/25">
            {logoPreview ? (
              <img
                src={logoPreview || "/placeholder.svg"}
                alt="Subsidiary Logo"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Input
              type="file"
              id="subsidiary-logo-upload"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleLogoUpload}
            />
            <Label
              htmlFor="subsidiary-logo-upload"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Logo
            </Label>
            {logoFileName && (
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">File:</span> {logoFileName}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG up to 2MB</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Divisions</Label>
        {divisions.map((division: string, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={division}
              onChange={(e) => {
                const newDivisions = [...divisions]
                newDivisions[index] = e.target.value
                setDivisions(newDivisions)
              }}
              placeholder="Enter division name"
            />
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
            <Input
              value={department}
              onChange={(e) => {
                const newDepartments = [...departments]
                newDepartments[index] = e.target.value
                setDepartments(newDepartments)
              }}
              placeholder="Enter department name"
            />
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
            <Input
              value={location}
              onChange={(e) => {
                const newLocations = [...locations]
                newLocations[index] = e.target.value
                setLocations(newLocations)
              }}
              placeholder="Enter location name"
            />
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

const formatCurrency = (amount: number, currencyCode = "GHS") => {
  const currencySymbols: { [key: string]: string } = {
    GHS: "₵",
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  }

  const symbol = currencySymbols[currencyCode] || currencyCode
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function SettingsPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(true)

  const [showSubsidiaryDialog, setShowSubsidiaryDialog] = useState(false)
  const [editingSubsidiary, setEditingSubsidiary] = useState<Subsidiary | null>(null)
  const [subsidiaryFunction, setSubsidiaryFunction] = useState(false)

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const [showActivateSubsidiaryModal, setShowActivateSubsidiaryModal] = useState(false)
  const [showDeactivateSubsidiaryModal, setShowDeactivateSubsidiaryModal] = useState(false)
  const [subsidiaryToToggle, setSubsidiaryToToggle] = useState<any>(null)

  const [companyData, setCompanyData] = useState<Company>({
    id: "",
    name: "",
    email_address: "",
    tax_id: "",
    ssnit_number: "",
    industry: "",
    status: "active",
    address: "",
    phone_number: "",
    divisions: [],
    departments: [],
    locations: [],
  })

  const [uploadedFileName, setUploadedFileName] = useState("")
  const [logoPreview, setLogoPreview] = useState("")

  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const [subsidiaries, setSubsidiaries] = useState<any[]>([])
  const [currencyRates, setCurrencyRates] = useState<any[]>([])
  const [organizationalCharts, setOrganizationalCharts] = useState<any[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [employeeDocuments, setEmployeeDocuments] = useState<any[]>([])
  const [communicationGroups, setCommunicationGroups] = useState<any[]>([])
  const [onlineMeetings, setOnlineMeetings] = useState<any[]>([])
  const [payrollConfigDetailed, setPayrollConfigDetailed] = useState<any>({})

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

  // Dialog states
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [showBackupSuccess, setShowBackupSuccess] = useState(false)
  const [showEmailTemplateDialog, setShowCustomTemplateDialog] = useState(false)
  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = useState(false)
  const [showSalaryGradeDialog, setShowSalaryGradeDialog] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string>("")

  const [showAllowanceDialog, setShowAllowanceDialog] = useState(false)
  const [showDeductionDialog, setShowDeductionDialog] = useState(false)
  const [showLoanDialog, setShowLoanDialog] = useState(false)

  const [showAddCurrencyRateDialog, setShowAddOrgChartDialog] = useState(false)
  const [showAddPromotionDialog, setShowAddPromotionDialog] = useState(false)
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false)
  const [showAddCommGroupDialog, setShowAddCommGroupDialog] = useState(false)
  const [showAddMeetingDialog, setShowAddMeetingDialog] = useState(false)
  const [showLeavePolicyDialog, setShowLeavePolicyDialog] = useState(false)

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
  const [leavePolicies, setLeavePoliciesState] = useState<LeavePolicy[]>([])

  const [editingSalaryGradeState, setEditingSalaryGradeState] = useState<SalaryGrade>({
    id: "",
    grade_name: "",
    grade_level: 0,
    step_1: 0,
    step_2: 0,
    step_3: 0,
    step_4: 0,
    step_5: 0,
  })

  const [showAddCurrencyRateDialogFunc, setShowAddCurrencyRateDialogFunc] = useState(false)

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
    setLoanSettingsState((prev) => [
      ...prev,
      {
        code: "",
        description: "",
        maxAmount: 0,
        interestRate: 0,
        rateMethod: "Reducing Balance",
        adminCharge: 0,
        tenure: 12,
        id: null,
      },
    ])
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

  const handleLoanInputChange = (index, field, value) => {
    const updatedLoans = [...loanSettings]
    updatedLoans[index] = {
      ...updatedLoans[index],
      [field]: value,
    }
    setLoanSettingsState(updatedLoans)
  }

  const handleSaveLoan = async (index) => {
    try {
      const loan = loanSettings[index]
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save loan settings",
          variant: "destructive",
        })
        return
      }

      if (!companyData.id) {
        toast({
          title: "Error",
          description: "Company data not available",
          variant: "destructive",
        })
        return
      }

      const loanData = {
        company_id: companyData.id,
        code: loan.code,
        description: loan.description,
        type: loan.code,
        max_amount: loan.maxAmount,
        interest_rate: loan.interestRate,
        max_repayment_months: loan.tenure,
        is_active: true,
        auto_deduct: true,
        recurring: false,
        taxable: false,
      }

      let result
      if (loan.id) {
        // Update existing loan
        result = await supabase.from("loan_settings").update(loanData).eq("id", loan.id).select()
      } else {
        // Insert new loan
        result = await supabase.from("loan_settings").insert(loanData).select()
      }

      if (result.error) throw result.error

      // Update local state with saved data
      const updatedLoans = [...loanSettings]
      updatedLoans[index] = {
        ...loan,
        id: result.data[0].id,
      }
      setLoanSettingsState(updatedLoans)

      toast({
        title: "Success",
        description: "Loan settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving loan:", error)
      toast({
        title: "Error",
        description: `Failed to save loan settings: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteLoan = async (index) => {
    try {
      const loan = loanSettings[index]

      if (loan.id) {
        const supabase = createClient()
        const { error } = await supabase.from("loan_settings").delete().eq("id", loan.id)

        if (error) throw error
      }

      // Remove from local state
      const updatedLoans = loanSettings.filter((_, i) => i !== index)
      setLoanSettingsState(updatedLoans)

      toast({
        title: "Success",
        description: "Loan deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting loan:", error)
      toast({
        title: "Error",
        description: "Failed to delete loan",
        variant: "destructive",
      })
    }
  }

  const loadLoanSettings = async () => {
    try {
      // Wait for company data to be available with retry logic
      let retries = 0
      while (!companyData.id && retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        retries++
      }

      if (!companyData.id) {
        console.log("[v0] Skipping loan settings load - no company ID available after retries")
        return
      }

      console.log("[v0] Loading loan settings for company:", companyData.id)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("loan_settings")
        .select("*")
        .eq("company_id", companyData.id)
        .order("type")

      if (error) throw error

      // Transform database data to match UI expectations
      const transformedData = (data || []).map((loan) => ({
        code: loan.code || "",
        description: loan.description || "",
        maxAmount: loan.max_amount || 0,
        interestRate: loan.interest_rate || 0,
        rateMethod: "Reducing Balance", // Default method
        adminCharge: 0, // Not in current schema, can be added later
        tenure: loan.max_repayment_months || 12,
        id: loan.id,
      }))

      setLoanSettingsState(transformedData)
      console.log("[v0] Loaded loan settings:", transformedData.length, "records")
    } catch (error) {
      console.error("Error loading loan settings:", error)
    }
  }

  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userFilterRole, setUserFilterRole] = useState("all")
  const [userFilterStatus, setUserFilterStatus] = useState("all")
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)

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
          loadLeavePolicies(),
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

  const loadCompanyData = async (retryCount = 0) => {
    try {
      console.log("[v0] Loading company data, attempt:", retryCount + 1)
      const supabase = createClient()

      // Test connection first
      const { data: testData, error: testError } = await supabase.from("companies").select("count").limit(1)
      if (testError) {
        console.error("[v0] Database connection test failed:", testError)
        throw testError
      }

      const { data, error } = await supabase.from("companies").select("*").limit(1).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("[v0] Company data error:", error)
        throw error
      }

      if (!data || error?.code === "PGRST116") {
        console.log("[v0] No company found, creating default company")
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
          console.error("[v0] Failed to create company:", createError)
          if (retryCount < 2) {
            console.log("[v0] Retrying company creation...")
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return loadCompanyData(retryCount + 1)
          }

          // Set fallback data
          setCompanyData({
            id: "00000000-0000-0000-0000-000000000001",
            name: "Your Company Name",
            email_address: "info@yourcompany.com",
            tax_id: "",
            ssnit_number: "",
            industry: "",
            status: "active",
            address: "",
            phone_number: "",
            divisions: [],
            departments: [],
            locations: [],
          })
          return
        }

        console.log("[v0] Company created successfully:", newCompany.id)
        setCompanyData({
          id: newCompany.id,
          name: newCompany.name || "",
          email_address: newCompany.email_address || "",
          tax_id: newCompany.tax_id || "",
          ssnit_number: newCompany.ssnit_number || "",
          industry: newCompany.industry || "",
          status: "active",
          address: newCompany.address || "",
          phone_number: newCompany.phone_number || "",
          divisions: [],
          departments: [],
          locations: [],
        })
        return
      }

      console.log("[v0] Company data loaded successfully:", data.id)
      setCompanyData({
        id: data.id || "",
        name: data.name || "",
        email_address: data.email_address || "",
        tax_id: data.tax_id || "",
        ssnit_number: data.ssnit_number || "",
        industry: data.industry || "",
        status: "active",
        address: data.address || "",
        phone_number: data.phone_number || "",
        divisions: data.divisions || [],
        departments: data.departments || [],
        locations: data.locations || [],
        logo_url: data.logo_url || "",
      })

      // Load company structure data
      if (data.divisions) setDivisions(Array.isArray(data.divisions) ? data.divisions : [])
      if (data.departments) setDepartments(Array.isArray(data.departments) ? data.departments : [])
      if (data.locations) setLocations(Array.isArray(data.locations) ? data.locations : [])

      // Load logo if exists
      if (data.logo_url) setLogoPreview(data.logo_url)
    } catch (error) {
      console.error("[v0] Error loading company data:", error)

      if (retryCount < 2) {
        console.log("[v0] Retrying company data load...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return loadCompanyData(retryCount + 1)
      }

      // Set fallback data after all retries failed
      setCompanyData({
        id: "00000000-0000-0000-0000-000000000001",
        name: "Your Company Name",
        email_address: "info@yourcompany.com",
        tax_id: "",
        ssnit_number: "",
        industry: "",
        status: "active",
        address: "",
        phone_number: "",
        divisions: [],
        departments: [],
        locations: [],
      })
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

  const loadLeaveManagementData = async () => {
    try {
      await Promise.all([loadLeaveTypes(), loadLeavePolicies()])
    } catch (error) {
      console.error("Error loading leave management data:", error)
    }
  }

  const loadLeavePolicies = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("leave_policies").select("*").order("policy_name")

      if (error) throw error
      setLeavePoliciesState(data || [])
    } catch (error) {
      console.error("Error loading leave policies:", error)
      toast({
        title: "Error",
        description: "Failed to load leave policies. Please check your connection.",
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

  const loadCurrencyRates = async () => {
    try {
      console.log("[v0] Loading currency rates")
      const supabase = createClient()
      const { data, error } = await supabase
        .from("currency_rates")
        .select("*")
        .order("effective_date", { ascending: false })

      if (error) {
        console.error("[v0] Error loading currency rates:", error)
        return
      }

      console.log("[v0] Currency rates loaded:", data?.length || 0)
      setCurrencyRates(data || [])
    } catch (error) {
      console.error("[v0] Error loading currency rates:", error)
    }
  }

  const loadOrganizationalCharts = async () => {
    if (!companyData.id || companyData.id === "") {
      console.log("[v0] Skipping organizational charts load - no company ID available")
      return
    }

    try {
      console.log("[v0] Loading organizational charts for company:", companyData.id)
      const supabase = createClient()
      const { data, error } = await supabase.from("organizational_charts").select("*").eq("company_id", companyData.id)

      if (error) {
        console.error("[v0] Error loading organizational charts:", error)
        return
      }

      console.log("[v0] Organizational charts loaded:", data?.length || 0)
      setOrganizationalCharts(data || [])
    } catch (error) {
      console.error("[v0] Error loading organizational charts:", error)
    }
  }

  const loadPromotions = async () => {
    if (!companyData.id || companyData.id === "") {
      console.log("[v0] Skipping promotions load - no company ID available")
      return
    }

    try {
      console.log("[v0] Loading promotions for company:", companyData.id)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading promotions:", error)
        return
      }

      console.log("[v0] Promotions loaded:", data?.length || 0)
      setPromotions(data || [])
    } catch (error) {
      console.error("[v0] Error loading promotions:", error)
    }
  }

  const loadEmployeeDocuments = async () => {
    try {
      console.log("[v0] Loading employee documents")
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .order("upload_date", { ascending: false })

      if (error) {
        console.error("[v0] Error loading employee documents:", error)
        return
      }

      console.log("[v0] Employee documents loaded:", data?.length || 0)
      setEmployeeDocuments(data || [])
    } catch (error) {
      console.error("[v0] Error loading employee documents:", error)
    }
  }

  const loadCommunicationGroups = async () => {
    if (!companyData.id || companyData.id === "") {
      console.log("[v0] Skipping communication groups load - no company ID available")
      return
    }

    try {
      console.log("[v0] Loading communication groups for company:", companyData.id)
      const supabase = createClient()
      const { data, error } = await supabase.from("communication_groups").select("*").eq("company_id", companyData.id)

      if (error) {
        console.error("[v0] Error loading communication groups:", error)
        return
      }

      console.log("[v0] Communication groups loaded:", data?.length || 0)
      setCommunicationGroups(data || [])
    } catch (error) {
      console.error("[v0] Error loading communication groups:", error)
    }
  }

  const loadOnlineMeetings = async () => {
    if (!companyData.id || companyData.id === "") {
      console.log("[v0] Skipping online meetings load - no company ID available")
      return
    }

    try {
      console.log("[v0] Loading online meetings for company:", companyData.id)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("online_meetings")
        .select("*")
        .eq("company_id", companyData.id)
        .order("scheduled_start", { ascending: false })

      if (error) {
        console.error("[v0] Error loading online meetings:", error)
        return
      }

      console.log("[v0] Online meetings loaded:", data?.length || 0)
      setOnlineMeetings(data || [])
    } catch (error) {
      console.error("[v0] Error loading online meetings:", error)
    }
  }

  const loadPayrollConfigDetailed = async () => {
    if (!companyData.id || companyData.id === "") {
      console.log("[v0] Skipping detailed payroll config load - no company ID available")
      return
    }

    try {
      console.log("[v0] Loading detailed payroll configuration for company:", companyData.id)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payroll_configuration")
        .select("*")
        .eq("company_id", companyData.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("[v0] Error loading detailed payroll config:", error)
        return
      }

      console.log("[v0] Detailed payroll config loaded:", data)
      setPayrollConfigDetailed(data || {})
    } catch (error) {
      console.error("[v0] Error loading detailed payroll config:", error)
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
            // Added logo data to update
            logo_file_id: subsidiaryData.logo_file_id,
            logo_url: subsidiaryData.logo_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSubsidiary.id)

        if (error) throw error
        toast({ title: "Success", description: "Subsidiary updated successfully" })
      } else {
        // Create new subsidiary
        const { error } = await supabase.from("subsidiaries").insert({
          company_id: companyData?.id || "00000000-0000-0000-0000-000000000001", // Replace with actual company ID
          name: subsidiaryData.name,
          tax_id: subsidiaryData.tax_id,
          ssnit_number: subsidiaryData.ssnit_number,
          email_address: subsidiaryData.email,
          phone_number: subsidiaryData.phone,
          address: subsidiaryData.address,
          divisions: subsidiaryData.divisions || [],
          departments: subsidiaryData.departments || [],
          locations: subsidiaryData.locations || [],
          // Added logo data to insert
          logo_file_id: subsidiaryData.logo_file_id,
          logo_url: subsidiaryData.logo_url,
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

  const handleActivateSubsidiary = async (subsidiaryId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("subsidiaries").update({ status: "active" }).eq("id", subsidiaryId)

      if (error) throw error
      toast({ title: "Success", description: "Subsidiary activated successfully" })
      loadSubsidiaries()
    } catch (error) {
      console.error("Error activating subsidiary:", error)
      toast({ title: "Error", description: "Failed to activate subsidiary", variant: "destructive" })
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
      toast({ title: "Error", description: "Failed to deactivate subsidiary", variant: "destructive" })
    }
  }

  const handleDeleteSubsidiary = async (subsidiaryId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("subsidiaries").delete().eq("id", subsidiaryId)

      if (error) throw error
      toast({ title: "Success", description: "Subsidiary deleted successfully" })
      loadSubsidiaries()
    } catch (error) {
      console.error("Error deleting subsidiary:", error)
      toast({ title: "Error", description: "Failed to delete subsidiary", variant: "destructive" })
    }
  }

  const handleEditCurrencyRate = (rate: any) => {
    // Implementation for editing currency rate
    console.log("Edit currency rate:", rate)
  }

  const handleDeleteCurrencyRate = async (rateId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("currency_rates").delete().eq("id", rateId)

      if (error) throw error
      toast({ title: "Success", description: "Currency rate deleted successfully" })
      loadCurrencyRates()
    } catch (error) {
      console.error("Error deleting currency rate:", error)
      toast({ title: "Error", description: "Failed to delete currency rate", variant: "destructive" })
    }
  }

  const handleViewOrgChart = (chart: any) => {
    console.log("View org chart:", chart)
  }

  const handleEditOrgChart = (chart: any) => {
    console.log("Edit org chart:", chart)
  }

  const handleDeleteOrgChart = async (chartId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("organizational_charts").delete().eq("id", chartId)

      if (error) throw error
      toast({ title: "Success", description: "Organizational chart deleted successfully" })
      loadOrganizationalCharts()
    } catch (error) {
      console.error("Error deleting organizational chart:", error)
      toast({ title: "Error", description: "Failed to delete organizational chart", variant: "destructive" })
    }
  }

  const handleViewPromotion = (promotion: any) => {
    console.log("View promotion:", promotion)
  }

  const handleEditPromotion = (promotion: any) => {
    console.log("Edit promotion:", promotion)
  }

  const handleViewDocument = (document: any) => {
    console.log("View document:", document)
  }

  const handleDownloadDocument = (document: any) => {
    console.log("Download document:", document)
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("employee_documents").delete().eq("id", documentId)

      if (error) throw error
      toast({ title: "Success", description: "Document deleted successfully" })
      loadEmployeeDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" })
    }
  }

  const handleViewCommGroup = (group: any) => {
    console.log("View communication group:", group)
  }

  const handleEditCommGroup = (group: any) => {
    console.log("Edit communication group:", group)
  }

  const handleDeleteCommGroup = async (groupId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("communication_groups").delete().eq("id", groupId)

      if (error) throw error
      toast({ title: "Success", description: "Communication group deleted successfully" })
      loadCommunicationGroups()
    } catch (error) {
      console.error("Error deleting communication group:", error)
      toast({ title: "Error", description: "Failed to delete communication group", variant: "destructive" })
    }
  }

  const handleViewMeeting = (meeting: any) => {
    console.log("View meeting:", meeting)
  }

  const handleSaveMultiCompanySettings = async () => {
    try {
      setIsBackingUp(true)
      const supabase = createClient()

      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({ title: "Error", description: "Authentication required", variant: "destructive" })
        return
      }

      // Update company settings with subsidiary function status
      const { error: companyError } = await supabase
        .from("companies")
        .update({
          name: companyData.name,
          email_address: companyData.email_address,
          tax_id: companyData.tax_id,
          ssnit_number: companyData.ssnit_number,
          industry: companyData.industry,
          address: companyData.address,
          phone_number: companyData.phone_number,
          divisions: companyData.divisions,
          departments: companyData.departments,
          locations: companyData.locations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyData.id)

      if (companyError) {
        console.error("Company update error:", companyError)
        throw companyError
      }

      // Save subsidiary function status to company_settings
      const { error: settingsError } = await supabase.from("company_settings").upsert({
        id: companyData.id,
        name: companyData.name,
        subsidiary_function_active: subsidiaryFunction,
        updated_at: new Date().toISOString(),
      })

      if (settingsError) {
        console.error("Settings update error:", settingsError)
        // Don't throw here as this might be a new field
      }

      toast({ title: "Success", description: "Multi-company settings saved successfully" })
    } catch (error) {
      console.error("Error saving multi-company settings:", error)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleSaveCompanySettings = async () => {
    try {
      const supabase = createClient()

      if (!companyData.id) {
        toast({
          title: "Error",
          description: "Company ID not found. Please refresh the page.",
        })
        return
      }

      const { error } = await supabase
        .from("companies")
        .update({
          name: companyData.name,
          email_address: companyData.email_address,
          tax_id: companyData.tax_id,
          ssnit_number: companyData.ssnit_number,
          industry: companyData.industry,
          address: companyData.address,
          phone_number: companyData.phone_number,
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

  const [isSavingPayroll, setIsSavingPayroll] = useState(false)

  const handleSavePayrollSettings = async () => {
    setIsSavingPayroll(true)

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

      const configData = {
        company_id: companyData.id,
        minimum_wage: payrollConfig.minimum_wage,
        overtime_weekday_multiplier: payrollConfig.overtime_weekday_multiplier,
        currency_code: payrollConfig.currency_code,
        currency_symbol: payrollConfig.currency_symbol,
        pay_frequency: payrollSettings.pay_frequency,
        cutoff_day: payrollSettings.cutoff_day,
        processing_day: payrollSettings.processing_day,
        auto_calculate_paye: payrollSettings.auto_calculate_paye,
        auto_calculate_ssnit: payrollSettings.auto_calculate_ssnit,
        auto_calculate_provident: payrollSettings.auto_calculate_provident,
        updated_at: new Date().toISOString(),
      }

      const { error: configError } = await supabase
        .from("payroll_configuration")
        .upsert(configData, { onConflict: "company_id" })

      if (configError) throw configError

      if (taxBands && taxBands.length > 0) {
        // Delete existing tax bands for this company
        await supabase.from("paye_tax_bands").delete().eq("company_id", companyData.id)

        // Insert new tax bands
        const taxBandData = taxBands.map((band, index) => ({
          company_id: companyData.id,
          band_order: index + 1,
          percentage: Number.parseFloat(band.rate) || 0,
          threshold: Number.parseFloat(band.threshold) || 0,
          description: band.description || `Band ${index + 1}`,
          is_remaining: band.description?.toLowerCase().includes("remaining") || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: taxBandError } = await supabase.from("paye_tax_bands").insert(taxBandData)

        if (taxBandError) throw taxBandError
      }

      const ssnitData = {
        company_id: companyData.id,
        employee_rate: Number.parseFloat(ssnit.employee) || 5.5,
        employer_rate: Number.parseFloat(ssnit.employer) || 13.0,
        tier_2_rate: Number.parseFloat(tier2.employee) || 5.0,
        tier_3_rate: Number.parseFloat(tier3.employee) || 0.0,
        updated_at: new Date().toISOString(),
      }

      const { error: ssnitError } = await supabase.from("ssnit_rates").upsert(ssnitData, { onConflict: "company_id" })

      if (ssnitError) throw ssnitError

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

      // Save loan settings
      for (const loan of loanSettings) {
        const { error: loanError } = await supabase.from("loan_settings").upsert({
          ...loan,
          company_id: companyData.id,
          updated_at: new Date().toISOString(),
        })

        if (loanError) throw loanError
      }

      toast({
        title: "Success",
        description: "Payroll settings and tax configuration saved successfully",
      })

      await loadAllDataFunc()
    } catch (error) {
      console.error("Error saving payroll settings:", error)
      toast({
        title: "Error",
        description: `Failed to save payroll settings: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSavingPayroll(false)
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

  const addDivision = () => {
    setCompanyData({
      ...companyData,
      divisions: [...(companyData.divisions || []), "New Division"],
    })
  }

  const removeDivision = (index: number) => {
    setCompanyData({
      ...companyData,
      divisions: companyData.divisions?.filter((_, i) => i !== index),
    })
  }

  const addDepartment = () => {
    setCompanyData({
      ...companyData,
      departments: [...(companyData.departments || []), "New Department"],
    })
  }

  const removeDepartment = (index: number) => {
    setCompanyData({
      ...companyData,
      departments: companyData.departments?.filter((_, i) => i !== index),
    })
  }

  const addLocation = () => {
    setCompanyData({
      ...companyData,
      locations: [...(companyData.locations || []), "New Location"],
    })
  }

  const removeLocation = (index: number) => {
    setCompanyData({
      ...companyData,
      locations: companyData.locations?.filter((_, i) => i !== index),
    })
  }

  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType>({
    id: "",
    name: "",
    code: "",
    description: "",
    annual_entitlement: 0,
    max_consecutive_days: 0,
    pay_percentage: 0,
    min_notice_days: 0,
    requires_approval: false,
    requires_medical_certificate: false,
    allow_carry_over: false,
    is_active: true,
    is_paid: true,
  })

  const handleAddLeaveType = () => {
    setEditingLeaveType({
      id: "",
      name: "",
      code: "",
      description: "",
      annual_entitlement: 0,
      max_consecutive_days: 0,
      pay_percentage: 0,
      min_notice_days: 0,
      requires_approval: false,
      requires_medical_certificate: false,
      allow_carry_over: false,
      is_active: true,
      is_paid: true,
    })
    setShowLeaveTypeDialog(true)
  }

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType)
    setShowLeaveTypeDialog(true)
  }

  const [editingLeavePolicy, setEditingLeavePolicy] = useState<LeavePolicy>({
    id: "",
    policy_name: "",
    policy_type: "",
    max_days: 0,
    notice_period_days: 0,
    requires_approval: false,
    is_active: true,
  })

  const [showLeavePolicyDialogFunc, setShowLeavePolicyDialogFunc] = useState(false)

  const handleAddLeavePolicy = () => {
    setEditingLeavePolicy({
      id: "",
      policy_name: "",
      policy_type: "",
      max_days: 0,
      notice_period_days: 0,
      requires_approval: false,
      is_active: true,
    })
    setShowLeavePolicyDialogFunc(true)
  }

  const handleEditLeavePolicy = (leavePolicy: LeavePolicy) => {
    setEditingLeavePolicy(leavePolicy)
    setShowLeavePolicyDialogFunc(true)
  }

  const handleAddSalaryGrade = () => {
    setEditingSalaryGradeState({
      id: "",
      grade_name: "",
      grade_level: 0,
      step_1: 0,
      step_2: 0,
      step_3: 0,
      step_4: 0,
      step_5: 0,
    })
    setShowSalaryGradeDialog(true)
  }

  const handleEditSalaryGrade = (salaryGrade: SalaryGrade) => {
    setEditingSalaryGradeState(salaryGrade)
    setShowSalaryGradeDialog(true)
  }

  const handleDeleteLeavePolicy = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("leave_policies").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Leave policy deleted successfully.",
      })
      loadLeavePolicies()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete leave policy.",
        variant: "destructive",
      })
    }
  }

  const handleSaveMeeting = async () => {
    // Implementation for saving meeting
    toast({
      title: "Success",
      description: "Meeting saved successfully.",
    })
    setShowAddMeetingDialog(false)
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

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Starting comprehensive data load")

      // Wait for company data to be available
      let retries = 0
      const maxRetries = 5
      while ((!companyData.id || companyData.id === "") && retries < maxRetries) {
        console.log(`[v0] Waiting for company ID, attempt ${retries + 1}`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        retries++
      }

      if (!companyData.id || companyData.id === "") {
        console.log("[v0] Company ID not available after retries, loading basic data only")
        await Promise.all([loadCurrencyRates(), loadEmployeeDocuments()])
        return
      }

      // Load all data in parallel for better performance
      await Promise.all([
        loadSubsidiaries(),
        loadCurrencyRates(),
        loadOrganizationalCharts(),
        loadPromotions(),
        loadEmployeeDocuments(),
        loadCommunicationGroups(),
        loadOnlineMeetings(),
        loadPayrollConfigDetailed(),
        loadLeaveManagementData(),
        loadSalaryGrades(),
        loadEmployees(),
        loadPayrollAllowances(),
        loadPayrollDeductions(),
        loadLoanSettings(),
        loadRoles(),
        loadEmailTemplates(),
      ])

      console.log("[v0] Comprehensive data load completed")
    } catch (error) {
      console.error("[v0] Error in comprehensive data load:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllDataFunc = async () => {
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
        loadLeavePolicies(),
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

  const handleEditRole = (role: any) => {
    console.log("Edit role:", role)
  }

  const handleViewRolePermissions = (role: any) => {
    console.log("View role permissions:", role)
  }

  const handleDuplicateRole = (role: any) => {
    console.log("Duplicate role:", role)
  }

  const handleDeleteRole = (roleId: string) => {
    console.log("Delete role:", roleId)
  }

  const handlePermissionChange = (roleId: string, permission: string, checked: boolean) => {
    console.log("Permission change:", roleId, permission, checked)
  }

  const handleViewUser = (employee: any) => {
    console.log("View user:", employee)
  }

  const handleEditUser = (employee: any) => {
    console.log("Edit user:", employee)
  }

  const handleResetPassword = (employeeId: string) => {
    console.log("Reset password:", employeeId)
  }

  const handleToggleUserStatus = (employeeId: string) => {
    console.log("Toggle user status:", employeeId)
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

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details here.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
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
                    value={companyData.email_address}
                    onChange={(e) => setCompanyData({ ...companyData, email_address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    value={companyData.tax_id}
                    onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssnit_number">SSNIT Number</Label>
                  <Input
                    id="ssnit_number"
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
                    value={companyData.phone_number}
                    onChange={(e) => setCompanyData({ ...companyData, phone_number: e.target.value })}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Divisions</Label>
                  <div className="border rounded-md p-3 min-h-[100px]">
                    {companyData.divisions && Array.isArray(companyData.divisions) ? (
                      companyData.divisions.map((division, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border-b">
                          <span>{division}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeDivision(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No divisions added</p>
                    )}
                    <Button variant="outline" size="sm" onClick={addDivision} className="mt-2 bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Division
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Departments</Label>
                  <div className="border rounded-md p-3 min-h-[100px]">
                    {companyData.departments && Array.isArray(companyData.departments) ? (
                      companyData.departments.map((department, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border-b">
                          <span>{department}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeDepartment(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No departments added</p>
                    )}
                    <Button variant="outline" size="sm" onClick={addDepartment} className="mt-2 bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Locations</Label>
                  <div className="border rounded-md p-3 min-h-[100px]">
                    {companyData.locations && Array.isArray(companyData.locations) ? (
                      companyData.locations.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border-b">
                          <span>{location}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeLocation(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No locations added</p>
                    )}
                    <Button variant="outline" size="sm" onClick={addLocation} className="mt-2 bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 rounded-md overflow-hidden">
                    {companyData.logo_url ? (
                      <img
                        src={companyData.logo_url || "/placeholder.svg"}
                        alt="Company Logo"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Input type="file" id="logo-upload" className="hidden" onChange={handleLogoUpload} />
                    <Label
                      htmlFor="logo-upload"
                      className="bg-secondary text-secondary-foreground rounded-md px-4 py-2 cursor-pointer hover:bg-secondary/80"
                    >
                      Upload Logo
                    </Label>
                    {uploadedFileName && (
                      <p className="text-sm text-muted-foreground mt-1">Uploaded: {uploadedFileName}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi-company">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Multi-Company Management</h2>
                <p className="text-gray-600">Manage multiple companies and subsidiaries</p>
              </div>
            </div>

            {/* Main Company Card */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{companyData.name || "Akwaaba Technologies Ltd"}</h3>
                      <p className="text-gray-600">{companyData.email_address || "ykodiah@gmail.com"}</p>
                    </div>
                  </div>
                  <Badge variant={subsidiaryFunction ? "default" : "secondary"} className="bg-green-100 text-green-800">
                    {subsidiaryFunction ? "active" : "inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <p className="text-sm text-gray-600">Tax ID</p>
                    <p className="font-medium">{companyData.tax_id || "C001234567B"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SSNIT Number</p>
                    <p className="font-medium">{companyData.ssnit_number || "1234567890"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-medium">{companyData.industry || "Technology"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="subsidiaryFunction"
                      checked={subsidiaryFunction}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSubsidiaryFunction(true)
                        } else {
                          setShowDeactivateModal(true)
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="subsidiaryFunction" className="text-sm font-medium">
                      Activate Subsidiary Function
                    </label>
                    <Badge variant={subsidiaryFunction ? "default" : "secondary"} className="text-xs">
                      {subsidiaryFunction ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subsidiaries Section */}
            {subsidiaryFunction && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Subsidiaries ({subsidiaries.length})</h3>
                  <Button onClick={handleAddSubsidiary} className="bg-black text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subsidiary
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subsidiaries.map((subsidiary) => (
                    <Card key={subsidiary.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-semibold">{subsidiary.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {subsidiary.status || "active"}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditSubsidiary(subsidiary)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewSubsidiary(subsidiary)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {subsidiary.status === "inactive" ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSubsidiaryToToggle(subsidiary)
                                      setShowActivateSubsidiaryModal(true)
                                    }}
                                    className="text-green-600"
                                  >
                                    <Power className="h-4 w-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSubsidiaryToToggle(subsidiary)
                                      setShowDeactivateSubsidiaryModal(true)
                                    }}
                                    className="text-orange-600"
                                  >
                                    <Power className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Tax ID:</p>
                            <p className="font-medium">{subsidiary.tax_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">SSNIT:</p>
                            <p className="font-medium">{subsidiary.ssnit_number}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Divisions:</p>
                            <p className="font-medium">{subsidiary.divisions_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Departments:</p>
                            <p className="font-medium">{subsidiary.departments_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Locations:</p>
                            <p className="font-medium">{subsidiary.locations_count || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveMultiCompanySettings}
                className="bg-black text-white hover:bg-gray-800"
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Multi-Company Settings"
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hr">
          <Card>
            <CardHeader>
              <CardTitle>HR Management</CardTitle>
              <CardDescription>
                Comprehensive HR management including promotions, documents, and communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing leave types, policies, salary grades sections */}
              {/* Leave Types Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Leave Types</h3>
                  <Button onClick={handleAddLeaveType}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Leave Type
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Annual Entitlement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaveTypes.map((leaveType) => (
                        <tr key={leaveType.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {leaveType.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leaveType.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {leaveType.annual_entitlement} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={leaveType.is_paid ? "default" : "secondary"}>
                              {leaveType.is_paid ? "Paid" : "Unpaid"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditLeaveType(leaveType)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteLeaveType(leaveType.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leave Policies Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Leave Policies</h3>
                  <Button onClick={handleAddLeavePolicy}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Policy
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leavePolicies.map((policy) => (
                    <Card key={policy.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{policy.policy_name}</CardTitle>
                        <CardDescription className="text-xs">{policy.policy_type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Max Days:</strong> {policy.max_days}
                          </p>
                          <p>
                            <strong>Notice Period:</strong> {policy.notice_period_days} days
                          </p>
                          <p>
                            <strong>Requires Approval:</strong> {policy.requires_approval ? "Yes" : "No"}
                          </p>
                          <Badge variant={policy.is_active ? "default" : "secondary"}>
                            {policy.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button variant="ghost" size="sm" onClick={() => handleEditLeavePolicy(policy)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLeavePolicy(policy.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Salary Grades Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Salary Grades & Notches</h3>
                  <Button onClick={handleAddSalaryGrade}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Grade
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step 1
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step 2
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step 3
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step 4
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step 5
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salaryGrades.map((grade) => (
                        <tr key={grade.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {grade.grade_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.grade_level}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(grade.step_1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(grade.step_2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(grade.step_3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(grade.step_4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(grade.step_5)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditSalaryGrade(grade)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSalaryGrade(grade.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Promotions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Employee Promotions</h3>
                  <Button onClick={() => setShowAddPromotionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Initiate Promotion
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proposed Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Effective Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {promotions.map((promotion) => (
                        <tr key={promotion.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {promotion.employee_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {promotion.current_position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {promotion.proposed_position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                promotion.status === "approved"
                                  ? "default"
                                  : promotion.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {promotion.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {promotion.effective_date ? new Date(promotion.effective_date).toLocaleDateString() : "TBD"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewPromotion(promotion)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEditPromotion(promotion)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employee Documents */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Employee Documents</h3>
                  <Button onClick={() => setShowAddDocumentDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employeeDocuments.slice(0, 6).map((document) => (
                    <Card key={document.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{document.document_name}</CardTitle>
                        <CardDescription className="text-xs">{document.document_type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Size:</strong> {(document.file_size / 1024).toFixed(2)} KB
                          </p>
                          <p>
                            <strong>Uploaded:</strong> {new Date(document.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDocument(document)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(document)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(document.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Communication Groups */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Communication Groups</h3>
                  <Button onClick={() => setShowAddCommGroupDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communicationGroups.map((group) => (
                    <Card key={group.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{group.group_name}</CardTitle>
                        <CardDescription className="text-xs">{group.group_type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Description:</strong> {group.description}
                          </p>
                          <Badge variant={group.is_active ? "default" : "secondary"}>
                            {group.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button variant="ghost" size="sm" onClick={() => handleViewCommGroup(group)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditCommGroup(group)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCommGroup(group.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Online Meetings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Online Meetings</h3>
                  <Button onClick={() => setShowAddMeetingDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meeting Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheduled Start
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {onlineMeetings.slice(0, 5).map((meeting) => (
                        <tr key={meeting.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {meeting.meeting_title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.meeting_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(meeting.scheduled_start).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                meeting.status === "completed"
                                  ? "default"
                                  : meeting.status === "ongoing"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {meeting.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewMeeting(meeting)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {meeting.meeting_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(meeting.meeting_url, "_blank")}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employee Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Employee Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Employees</p>
                          <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Building2 className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Departments</p>
                          <p className="text-2xl font-bold text-gray-900">{companyData.departments?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <MapPin className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Locations</p>
                          <p className="text-2xl font-bold text-gray-900">{companyData.locations?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Leave Types</p>
                          <p className="text-2xl font-bold text-gray-900">{leaveTypes.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Notification Email</Label>
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

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security settings and password policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="two-factor-auth"
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                />
                <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-session-timeout"
                  checked={securitySettings.autoSessionTimeout}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, autoSessionTimeout: checked })
                  }
                />
                <Label htmlFor="auto-session-timeout">Auto Session Timeout</Label>
              </div>

              {securitySettings.autoSessionTimeout && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
                  <Input
                    id="timeout-duration"
                    type="number"
                    value={securitySettings.timeoutDuration}
                    onChange={(e) =>
                      setSecuritySettings({ ...securitySettings, timeoutDuration: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="audit-logging"
                  checked={securitySettings.auditLogging}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, auditLogging: checked })}
                />
                <Label htmlFor="audit-logging">Audit Logging</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="automated-backups"
                  checked={securitySettings.automatedBackups}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, automatedBackups: checked })}
                />
                <Label htmlFor="automated-backups">Automated Backups</Label>
              </div>

              {securitySettings.automatedBackups && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select
                    value={securitySettings.backupFrequency}
                    onValueChange={(value) => setSecuritySettings({ ...securitySettings, backupFrequency: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <h2 className="text-xl font-semibold">Password Policy</h2>
              <div className="space-y-2 ml-6">
                <Label htmlFor="min-length">Minimum Length</Label>
                <Input
                  id="min-length"
                  type="number"
                  value={passwordPolicy.minLength}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: Number.parseInt(e.target.value) })}
                />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-uppercase"
                    checked={passwordPolicy.requireUppercase}
                    onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: checked })}
                  />
                  <Label htmlFor="require-uppercase">Require Uppercase</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-numbers"
                    checked={passwordPolicy.requireNumbers}
                    onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: checked })}
                  />
                  <Label htmlFor="require-numbers">Require Numbers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-symbols"
                    checked={passwordPolicy.requireSymbols}
                    onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireSymbols: checked })}
                  />
                  <Label htmlFor="require-symbols">Require Symbols</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Default Meeting Duration (minutes)</Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  value={onlineMeetings.find((m) => m.is_default)?.duration || 60}
                  onChange={(e) => {
                    const updatedMeetings = onlineMeetings.map((meeting) =>
                      meeting.is_default ? { ...meeting, duration: Number.parseInt(e.target.value) } : meeting,
                    )
                    setOnlineMeetings(updatedMeetings)
                  }}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddMeetingDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMeeting}>Save Meeting</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showSubsidiaryDialog} onOpenChange={setShowSubsidiaryDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubsidiary ? "Edit Subsidiary" : "Add New Subsidiary"}</DialogTitle>
            <DialogDescription>
              {editingSubsidiary ? "Update subsidiary information" : "Create a new subsidiary company"}
            </DialogDescription>
          </DialogHeader>
          <SubsidiaryForm
            subsidiary={editingSubsidiary}
            onSave={handleSaveSubsidiary}
            onCancel={() => setShowSubsidiaryDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showViewSubsidiaryDialog} onOpenChange={setShowViewSubsidiaryDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subsidiary Details</DialogTitle>
            <DialogDescription>View detailed information about {viewingSubsidiary?.name}</DialogDescription>
          </DialogHeader>
          {viewingSubsidiary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm">{viewingSubsidiary.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {viewingSubsidiary.status || "active"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tax ID</Label>
                  <p className="text-sm">{viewingSubsidiary.tax_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">SSNIT Number</Label>
                  <p className="text-sm">{viewingSubsidiary.ssnit_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm">{viewingSubsidiary.email_address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="text-sm">{viewingSubsidiary.phone_number}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Address</Label>
                <p className="text-sm">{viewingSubsidiary.address}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Divisions</Label>
                  <p className="text-2xl font-bold">{viewingSubsidiary.divisions?.length || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Departments</Label>
                  <p className="text-2xl font-bold">{viewingSubsidiary.departments?.length || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Locations</Label>
                  <p className="text-2xl font-bold">{viewingSubsidiary.locations?.length || 0}</p>
                </div>
              </div>

              {viewingSubsidiary.divisions && viewingSubsidiary.divisions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Division List</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingSubsidiary.divisions.map((division: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {division}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewingSubsidiary.departments && viewingSubsidiary.departments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Department List</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingSubsidiary.departments.map((department: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {department}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewingSubsidiary.locations && viewingSubsidiary.locations.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Location List</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingSubsidiary.locations.map((location: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewSubsidiaryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Subsidiary Function</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this subsidiary? This will disable access but preserve all data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSubsidiaryFunction(false)
                setShowDeactivateModal(false)
                toast({ title: "Success", description: "Subsidiary function deactivated" })
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivateSubsidiaryModal} onOpenChange={setShowDeactivateSubsidiaryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Subsidiary Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this subsidiary? This will disable access but preserve all data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeactivateSubsidiaryModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (subsidiaryToToggle) {
                  handleDeactivateSubsidiary(subsidiaryToToggle.id)
                }
                setShowDeactivateSubsidiaryModal(false)
                setSubsidiaryToToggle(null)
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivateSubsidiaryModal} onOpenChange={setShowActivateSubsidiaryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate Subsidiary Company</DialogTitle>
            <DialogDescription>Are you sure you want to activate this subsidiary?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowActivateSubsidiaryModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (subsidiaryToToggle) {
                  handleActivateSubsidiary(subsidiaryToToggle.id)
                }
                setShowActivateSubsidiaryModal(false)
                setSubsidiaryToToggle(null)
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
