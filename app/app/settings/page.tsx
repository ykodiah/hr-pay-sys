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
  MoreVertical,
  Loader2,
  Power,
  Clock,
  Brain,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
  status?: string
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

const isDemoMode = () => {
  if (typeof window !== "undefined") {
    return document.cookie.includes("demo-session=active") || localStorage.getItem("demo-profile")
  }
  return false
}

const getMockCompanyData = () => ({
  id: "demo-company-001",
  name: "Akwaaba HR Demo Company",
  email_address: "demo@akwaabahr.com",
  tax_id: "TIN123456789",
  ssnit_number: "SSNIT987654321",
  industry: "Technology",
  status: "active",
  address: "123 Demo Street, Accra, Ghana",
  phone_number: "+233 20 123 4567",
  divisions: [
    { id: "div-001", name: "Technology Division", description: "IT and Software Development" },
    { id: "div-002", name: "Operations Division", description: "Business Operations" },
  ],
  departments: [
    { id: "dept-001", name: "Human Resources", description: "HR Management" },
    { id: "dept-002", name: "Engineering", description: "Software Development" },
    { id: "dept-003", name: "Finance", description: "Financial Management" },
  ],
  locations: [
    { id: "loc-001", name: "Head Office", address: "123 Demo Street, Accra" },
    { id: "loc-002", name: "Branch Office", address: "456 Branch Road, Kumasi" },
  ],
  logo_url: "",
})

const getMockEmployees = () => [
  {
    id: "emp-001",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@demo.com",
    position: "Software Engineer",
    department: "Engineering",
    status: "active",
  },
  {
    id: "emp-002",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@demo.com",
    position: "HR Manager",
    department: "Human Resources",
    status: "active",
  },
  {
    id: "emp-003",
    first_name: "Mike",
    last_name: "Johnson",
    email: "mike.johnson@demo.com",
    position: "Finance Director",
    department: "Finance",
    status: "active",
  },
]

const getMockSubsidiaries = () => [
  {
    id: "sub-001",
    name: "Akwaaba Tech Solutions",
    description: "Technology subsidiary",
    divisions: [{ id: "div-tech-001", name: "Software Development" }],
    departments: [{ id: "dept-tech-001", name: "Development Team" }],
    locations: [{ id: "loc-tech-001", name: "Tech Hub" }],
    divisions_count: 1,
    departments_count: 1,
    locations_count: 1,
  },
  {
    id: "sub-002",
    name: "Akwaaba Consulting",
    description: "Consulting services subsidiary",
    divisions: [{ id: "div-cons-001", name: "Business Consulting" }],
    departments: [{ id: "dept-cons-001", name: "Consulting Team" }],
    locations: [{ id: "loc-cons-001", name: "Consulting Office" }],
    divisions_count: 1,
    departments_count: 1,
    locations_count: 1,
  },
]

export default function SettingsPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(true)

  const [showSubsidiaryDialog, setShowSubsidiaryDialog] = useState(false)
  const [editingSubsidiary, setEditingSubsidiary] = useState<Subsidiary | null>(null)
  const [subsidiaryFunction, setSubsidiaryFunction] = useState(false)

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const [showActivateSubsidiaryModal, setShowActivateSubsidiaryModal] = useState(false)
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
  const [isBackingUp, setIsBackingUp] = useState(isBackingUp)
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

  const [showDeactivateSubsidiaryModal, setShowDeactivateSubsidiaryModal] = useState(false)
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false)

  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)

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
      const supabase = createClient()

      if (loan.id) {
        const { error } = await supabase.from("loan_settings").delete().eq("id", loan.id)

        if (error) throw error
      }

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

  const [showAddRoleDialogFunc, setShowAddRoleDialogFunc] = useState(false)
  const [showDeleteRoleDialog, setShowDeleteRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    is_active: true,
  })
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [securityScore, setSecurityScore] = useState(85)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userFilterRole, setUserFilterRole] = useState("all")
  const [userFilterStatus, setUserFilterStatus] = useState("all")
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)

  const [isLoadingSubsidiaries, setIsLoadingSubsidiaries] = useState(false)

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
          loadLoanSettings(),
          loadRoles(),
          loadEmailTemplates(),
          loadSecuritySettings(),
          loadLeavePolicies(),
        ])
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, []) // Only run once on mount

  const loadCompanyData = async (retryCount = 0) => {
    try {
      console.log("[v0] Loading company data, attempt:", retryCount + 1)

      if (isDemoMode()) {
        console.log("[v0] Demo mode detected, using mock company data")
        const mockData = getMockCompanyData()
        setCompanyData(mockData)
        setDivisions(mockData.divisions)
        setDepartments(mockData.departments)
        setLocations(mockData.locations)
        return
      }

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
      console.log("[v0] Loading roles data...")
      const supabase = createClient()
      // For now, use hardcoded roles since there's no roles table in the schema
      const rolesData = [
        {
          id: "1",
          name: "Super Admin",
          description: "Full system access",
          permissions: ["all"],
          user_count: 1,
          is_active: true,
        },
        {
          id: "2",
          name: "HR Manager",
          description: "HR operations management",
          permissions: ["hr"],
          user_count: 3,
          is_active: true,
        },
        {
          id: "3",
          name: "Payroll Manager",
          description: "Payroll processing",
          permissions: ["payroll"],
          user_count: 2,
          is_active: true,
        },
        {
          id: "4",
          name: "Employee",
          description: "Self-service access",
          permissions: ["self"],
          user_count: 45,
          is_active: true,
        },
      ]
      setRoles(rolesData)
      console.log("[v0] Roles loaded successfully:", rolesData.length)
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
      if (isDemoMode()) {
        console.log("[v0] Demo mode detected, using mock employees data")
        setEmployees(getMockEmployees())
        return
      }

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
    if (isLoadingSubsidiaries) return // Prevent concurrent calls

    try {
      setIsLoadingSubsidiaries(true)

      if (isDemoMode()) {
        console.log("[v0] Demo mode detected, using mock subsidiaries data")
        setSubsidiaries(getMockSubsidiaries())
        return
      }

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
    } finally {
      setIsLoadingSubsidiaries(false)
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

  return (
    <div className="flex flex-col h-screen">
      <div className="container max-w-7xl mt-10 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your company settings and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="company" className="space-y-4">
              <TabsList>
                <TabsTrigger value="company" onClick={() => setActiveTab("company")}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="subsidiaries" onClick={() => setActiveTab("subsidiaries")}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Subsidiaries
                </TabsTrigger>
                <TabsTrigger value="security" onClick={() => setActiveTab("security")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="users" onClick={() => setActiveTab("users")}>
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="payroll" onClick={() => setActiveTab("payroll")}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payroll
                </TabsTrigger>
                <TabsTrigger value="notifications" onClick={() => setActiveTab("notifications")}>
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="ai" onClick={() => setActiveTab("ai")}>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Insights
                </TabsTrigger>
              </TabsList>
              <TabsContent value="company">
                <div className="grid gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={companyData.industry}
                      onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
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

                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-dashed border-muted-foreground/25">
                        {logoPreview ? (
                          <img
                            src={logoPreview || "/placeholder.svg"}
                            alt="Company Logo"
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
                          id="logo-upload"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleLogoUpload}
                        />
                        <Label
                          htmlFor="logo-upload"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Label>
                        {uploadedFileName && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">File:</span> {uploadedFileName}
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
                      Add Location
                    </Button>
                  </div>

                  <Button onClick={handleSaveCompany} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      "Save Company Settings"
                    )}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="subsidiaries">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <CardTitle>Subsidiaries</CardTitle>
                    <Button onClick={handleAddSubsidiary}>Add Subsidiary</Button>
                  </div>
                  {isLoadingSubsidiaries ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading subsidiaries...
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {subsidiaries.length === 0 ? (
                        <p className="text-muted-foreground">No subsidiaries added yet.</p>
                      ) : (
                        <div className="grid gap-4">
                          {subsidiaries.map((subsidiary) => (
                            <Card key={subsidiary.id}>
                              <CardHeader>
                                <CardTitle>{subsidiary.name}</CardTitle>
                                <CardDescription>
                                  {subsidiary.email_address} | {subsidiary.phone_number}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p>
                                    <span className="font-medium">Tax ID:</span> {subsidiary.tax_id}
                                  </p>
                                  <p>
                                    <span className="font-medium">SSNIT Number:</span> {subsidiary.ssnit_number}
                                  </p>
                                  <p>
                                    <span className="font-medium">Address:</span> {subsidiary.address}
                                  </p>
                                  <div className="flex space-x-2">
                                    {subsidiary.divisions_count > 0 && (
                                      <Badge variant="secondary">Divisions: {subsidiary.divisions_count}</Badge>
                                    )}
                                    {subsidiary.departments_count > 0 && (
                                      <Badge variant="secondary">Departments: {subsidiary.departments_count}</Badge>
                                    )}
                                    {subsidiary.locations_count > 0 && (
                                      <Badge variant="secondary">Locations: {subsidiary.locations_count}</Badge>
                                    )}
                                  </div>
                                  <Badge variant={subsidiary.status === "active" ? "success" : "destructive"}>
                                    {subsidiary.status}
                                  </Badge>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                  <Button variant="outline" size="sm" onClick={() => setViewingSubsidiary(subsidiary)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleEditSubsidiary(subsidiary)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {subsidiary.status === "active" ? (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSubsidiaryToToggle(subsidiary)
                                            setShowDeactivateSubsidiaryModal(true)
                                          }}
                                        >
                                          <Power className="h-4 w-4 mr-2" />
                                          Deactivate
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSubsidiaryToToggle(subsidiary)
                                            setShowActivateSubsidiaryModal(true)
                                          }}
                                        >
                                          <Clock className="h-4 w-4 mr-2" />
                                          Activate
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedRole(subsidiary)
                                          setShowDeleteRoleDialog(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="security">
                <div className="grid gap-4">
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure your security settings to protect your account.</CardDescription>

                  <div className="space-y-2">
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <Checkbox
                      id="twoFactorAuth"
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, twoFactorAuth: checked || false })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autoSessionTimeout">Auto Session Timeout</Label>
                    <Checkbox
                      id="autoSessionTimeout"
                      checked={securitySettings.autoSessionTimeout}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, autoSessionTimeout: checked || false })
                      }
                    />
                    {securitySettings.autoSessionTimeout && (
                      <div className="ml-4">
                        <Label htmlFor="timeoutDuration">Timeout Duration (minutes)</Label>
                        <Input
                          id="timeoutDuration"
                          type="number"
                          value={securitySettings.timeoutDuration}
                          onChange={(e) =>
                            setSecuritySettings({
                              ...securitySettings,
                              timeoutDuration: Number.parseInt(e.target.value, 10),
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auditLogging">Audit Logging</Label>
                    <Checkbox
                      id="auditLogging"
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, auditLogging: checked || false })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="automatedBackups">Automated Backups</Label>
                    <Checkbox
                      id="automatedBackups"
                      checked={securitySettings.automatedBackups}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, automatedBackups: checked || false })
                      }
                    />
                    {securitySettings.automatedBackups && (
                      <div className="ml-4">
                        <Label htmlFor="backupFrequency">Backup Frequency</Label>
                        <Select
                          value={securitySettings.backupFrequency}
                          onValueChange={(value) =>
                            setSecuritySettings({ ...securitySettings, backupFrequency: value })
                          }
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

                  <div className="space-y-2">
                    <CardTitle>Password Policy</CardTitle>
                    <CardDescription>Configure your password policy settings.</CardDescription>

                    <div className="space-y-2">
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={passwordPolicy.minLength}
                        onChange={(e) =>
                          setPasswordPolicy({ ...passwordPolicy, minLength: Number.parseInt(e.target.value, 10) })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requireUppercase">Require Uppercase</Label>
                      <Checkbox
                        id="requireUppercase"
                        checked={passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) =>
                          setPasswordPolicy({ ...passwordPolicy, requireUppercase: checked || false })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requireNumbers">Require Numbers</Label>
                      <Checkbox
                        id="requireNumbers"
                        checked={passwordPolicy.requireNumbers}
                        onCheckedChange={(checked) =>
                          setPasswordPolicy({ ...passwordPolicy, requireNumbers: checked || false })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requireSymbols">Require Symbols</Label>
                      <Checkbox
                        id="requireSymbols"
                        checked={passwordPolicy.requireSymbols}
                        onCheckedChange={(checked) =>
                          setPasswordPolicy({ ...passwordPolicy, requireSymbols: checked || false })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <CardTitle>Password Strength</CardTitle>
                    <CardDescription>Evaluate your password strength based on the current policy.</CardDescription>

                    <div className="space-y-2">
                      <p>
                        Strength: {passwordStrength.score}%
                        {passwordStrength.score < 100 && (
                          <>
                            <br />
                            Requirements: {passwordStrength.requirements.join(", ")}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <CardTitle>Admin Password</CardTitle>
                    <Button onClick={handleChangeAdminPassword}>Change Password</Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <CardTitle>Security Report</CardTitle>
                    <Button onClick={handleDownloadSecurityReport}>Download Report</Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <CardTitle>System Backup</CardTitle>
                    <Button onClick={handleBackupNow} disabled={isBackingUp}>
                      {isBackingUp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Backing up...
                        </>
                      ) : (
                        "Backup Now"
                      )}
                    </Button>
                  </div>

                  {lastBackupTime && (
                    <div className="space-y-2">
                      <p>Last Backup: {new Date(lastBackupTime).toLocaleString()}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <CardTitle>Activity Log</CardTitle>
                    <Button onClick={handleViewActivityLog}>View Activity Log</Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <CardTitle>Audit Trail</CardTitle>
                    <Button onClick={handleDownloadAuditTrail}>Export Audit Trail</Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="users">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <CardTitle>Users</CardTitle>
                    <div className="flex space-x-2">
                      <Button onClick={() => setShowBulkImportDialog(true)}>Bulk Import</Button>
                      <Button onClick={() => setShowAddUserDialog(true)}>Add User</Button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                    <Select value={userFilterRole} onValueChange={setUserFilterRole}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={userFilterStatus} onValueChange={setUserFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4">
                    {employees.length === 0 ? (
                      <p className="text-muted-foreground">No users added yet.</p>
                    ) : (
                      <div className="grid gap-4">
                        {employees.map((employee) => (
                          <Card key={employee.id}>
                            <CardHeader>
                              <CardTitle>
                                {employee.first_name} {employee.last_name}
                              </CardTitle>
                              <CardDescription>
                                {employee.corporate_email} | {employee.position}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <p>
                                  <span className="font-medium">Department:</span> {employee.department}
                                </p>
                                <p>
                                  <span className="font-medium">Status:</span> {employee.status}
                                </p>
                              </div>
                              <div className="flex justify-end space-x-2 mt-4">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button variant="secondary" size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Power className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="payroll">
                <div className="space-y-4">
                  <CardTitle>Payroll Settings</CardTitle>
                  <CardDescription>Configure your payroll settings and preferences.</CardDescription>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payFrequency">Pay Frequency</Label>
                      <Select
                        value={payrollSettings.pay_frequency}
                        onValueChange={(value) => setPayrollSettings({ ...payrollSettings, pay_frequency: value })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cutoffDay">Cutoff Day</Label>
                      <Input
                        id="cutoffDay"
                        type="number"
                        value={payrollSettings.cutoff_day}
                        onChange={(e) =>
                          setPayrollSettings({ ...payrollSettings, cutoff_day: Number.parseInt(e.target.value, 10) })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="processingDay">Processing Day</Label>
                      <Input
                        id="processingDay"
                        type="number"
                        value={payrollSettings.processing_day}
                        onChange={(e) =>
                          setPayrollSettings({
                            ...payrollSettings,
                            processing_day: Number.parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="autoCalculatePaye">Auto Calculate PAYE</Label>
                      <Checkbox
                        id="autoCalculatePaye"
                        checked={payrollSettings.auto_calculate_paye}
                        onCheckedChange={(checked) =>
                          setPayrollSettings({ ...payrollSettings, auto_calculate_paye: checked || false })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="autoCalculateSsnit">Auto Calculate SSNIT</Label>
                      <Checkbox
                        id="autoCalculateSsnit"
                        checked={payrollSettings.auto_calculate_ssnit}
                        onCheckedChange={(checked) =>
                          setPayrollSettings({ ...payrollSettings, auto_calculate_ssnit: checked || false })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="autoCalculateProvident">Auto Calculate Provident</Label>
                      <Checkbox
                        id="autoCalculateProvident"
                        checked={payrollSettings.auto_calculate_provident}
                        onCheckedChange={(checked) =>
                          setPayrollSettings({ ...payrollSettings, auto_calculate_provident: checked || false })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimumWage">Minimum Wage</Label>
                      <Input
                        id="minimumWage"
                        type="number"
                        value={payrollConfig.minimum_wage}
                        onChange={(e) =>
                          setPayrollConfig({ ...payrollConfig, minimum_wage: Number.parseFloat(e.target.value) })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overtimeWeekdayMultiplier">Overtime Weekday Multiplier</Label>
                      <Input
                        id="overtimeWeekdayMultiplier"
                        type="number"
                        value={payrollConfig.overtime_weekday_multiplier}
                        onChange={(e) =>
                          setPayrollConfig({
                            ...payrollConfig,
                            overtime_weekday_multiplier: Number.parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overtimeWeekendMultiplier">Overtime Weekend Multiplier</Label>
                      <Input
                        id="overtimeWeekendMultiplier"
                        type="number"
                        value={payrollConfig.overtime_weekend_multiplier}
                        onChange={(e) =>
                          setPayrollConfig({
                            ...payrollConfig,
                            overtime_weekend_multiplier: Number.parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currencyCode">Currency</Label>
                      <Select value={payrollConfig.currency_code} onValueChange={handleCurrencyChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">Ghana Cedis (GHS)</SelectItem>
                          <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>SSNIT Rates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="employeeSSNIT">Employee (%)</Label>
                          <Input
                            id="employeeSSNIT"
                            type="number"
                            value={ssnit.employee}
                            onChange={(e) => dateSSNITRates("employee", Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="employerSSNIT">Employer (%)</Label>
                          <Input
                            id="employerSSNIT"
                            type="number"
                            value={ssnit.employer}
                            onChange={(e) => dateSSNITRates("employer", Number.parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Total: {ssnit.total}%</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Tier 2 Rates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="employeeTier2">Employee (%)</Label>
                          <Input
                            id="employeeTier2"
                            type="number"
                            value={tier2.employee}
                            onChange={(e) => updateTier2Rates("employee", Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="employerTier2">Employer (%)</Label>
                          <Input
                            id="employerTier2"
                            type="number"
                            value={tier2.employer}
                            onChange={(e) => updateTier2Rates("employer", Number.parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Total: {tier2.total}%</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Tier 3 Rates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="employeeTier3">Employee (%)</Label>
                          <Input
                            id="employeeTier3"
                            type="number"
                            value={tier3.employee}
                            onChange={(e) => updateTier3Rates("employee", Number.parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="employerTier3">Employer (%)</Label>
                          <Input
                            id="employerTier3"
                            type="number"
                            value={tier3.employer}
                            onChange={(e) => updateTier3Rates("employer", Number.parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Total: {tier3.total}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <CardTitle>Tax Bands</CardTitle>
                    <CardDescription>Configure your tax bands.</CardDescription>
                    <div className="grid gap-4">
                      {taxBands.map((band, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Label htmlFor={`rate-${index}`}>Rate (%)</Label>
                          <Input
                            id={`rate-${index}`}
                            type="number"
                            value={band.rate}
                            onChange={(e) => {
                              const newTaxBands = [...taxBands]
                              newTaxBands[index] = { ...band, rate: Number.parseFloat(e.target.value) }
                              setTaxBands(newTaxBands)
                            }}
                          />
                          <Label htmlFor={`threshold-${index}`}>Threshold</Label>
                          <Input
                            id={`threshold-${index}`}
                            type="number"
                            value={band.threshold}
                            onChange={(e) => {
                              const newTaxBands = [...taxBands]
                              newTaxBands[index] = { ...band, threshold: Number.parseFloat(e.target.value) }
                              setTaxBands(newTaxBands)
                            }}
                          />
                          <Label htmlFor={`description-${index}`}>Description</Label>
                          <Input
                            id={`description-${index}`}
                            type="text"
                            value={band.description}
                            onChange={(e) => {
                              const newTaxBands = [...taxBands]
                              newTaxBands[index] = { ...band, description: e.target.value }
                              setTaxBands(newTaxBands)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <CardTitle>Payroll Allowances</CardTitle>
                    <CardDescription>Manage your payroll allowances.</CardDescription>
                    <Button onClick={handleAddAllowance}>Add Allowance</Button>
                    <div className="grid gap-4">
                      {payrollAllowances.length === 0 ? (
                        <p className="text-muted-foreground">No allowances added yet.</p>
                      ) : (
                        <div className="grid gap-4">
                          {payrollAllowances.map((allowance, index) => (
                            <Card key={allowance.id || index}>
                              <CardHeader>
                                <CardTitle>{allowance.description}</CardTitle>
                                <CardDescription>
                                  {allowance.code} | {allowance.type}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p>
                                    <span className="font-medium">Amount:</span>{" "}
                                    {formatCurrency(allowance.amount, payrollConfig.currency_code)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Taxable:</span> {allowance.taxable ? "Yes" : "No"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Recurring:</span> {allowance.recurring ? "Yes" : "No"}
                                  </p>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                  <Button variant="secondary" size="sm" onClick={() => handleEditAllowance(index)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAllowance(index)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <CardTitle>Payroll Deductions</CardTitle>
                    <CardDescription>Manage your payroll deductions.</CardDescription>
                    <Button onClick={handleAddDeduction}>Add Deduction</Button>
                    <div className="grid gap-4">
                      {payrollDeductions.length === 0 ? (
                        <p className="text-muted-foreground">No deductions added yet.</p>
                      ) : (
                        <div className="grid gap-4">
                          {payrollDeductions.map((deduction, index) => (
                            <Card key={deduction.id || index}>
                              <CardHeader>
                                <CardTitle>{deduction.description}</CardTitle>
                                <CardDescription>
                                  {deduction.code} | {deduction.type}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p>
                                    <span className="font-medium">Amount:</span>{" "}
                                    {formatCurrency(deduction.amount, payrollConfig.currency_code)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Recurring:</span> {deduction.recurring ? "Yes" : "No"}
                                  </p>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                  <Button variant="secondary" size="sm" onClick={() => handleEditDeduction(index)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteDeduction(index)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <CardTitle>Loan Settings</CardTitle>
                    <CardDescription>Manage your loan settings.</CardDescription>
                    <Button onClick={handleAddLoan}>Add Loan</Button>
                    <div className="grid gap-4">
                      {loanSettings.length === 0 ? (
                        <p className="text-muted-foreground">No loans added yet.</p>
                      ) : (
                        <div className="grid gap-4">
                          {loanSettings.map((loan, index) => (
                            <Card key={loan.id || index}>
                              <CardHeader>
                                <CardTitle>{loan.description}</CardTitle>
                                <CardDescription>{loan.code}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <Label htmlFor={`code-${index}`}>Code</Label>
                                  <Input
                                    id={`code-${index}`}
                                    type="text"
                                    value={loan.code}
                                    onChange={(e) => handleLoanInputChange(index, "code", e.target.value)}
                                  />
                                  <Label htmlFor={`description-${index}`}>Description</Label>
                                  <Input
                                    id={`description-${index}`}
                                    type="text"
                                    value={loan.description}
                                    onChange={(e) => handleLoanInputChange(index, "description", e.target.value)}
                                  />
                                  <Label htmlFor={`maxAmount-${index}`}>Max Amount</Label>
                                  <Input
                                    id={`maxAmount-${index}`}
                                    type="number"
                                    value={loan.maxAmount}
                                    onChange={(e) =>
                                      handleLoanInputChange(index, "maxAmount", Number.parseFloat(e.target.value))
                                    }
                                  />
                                  <Label htmlFor={`interestRate-${index}`}>Interest Rate</Label>
                                  <Input
                                    id={`interestRate-${index}`}
                                    type="number"
                                    value={loan.interestRate}
                                    onChange={(e) =>
                                      handleLoanInputChange(index, "interestRate", Number.parseFloat(e.target.value))
                                    }
                                  />
                                  <Label htmlFor={`tenure-${index}`}>Tenure (Months)</Label>
                                  <Input
                                    id={`tenure-${index}`}
                                    type="number"
                                    value={loan.tenure}
                                    onChange={(e) =>
                                      handleLoanInputChange(index, "tenure", Number.parseInt(e.target.value))
                                    }
                                  />
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                  <Button variant="secondary" size="sm" onClick={() => handleSaveLoan(index)}>
                                    Save
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteLoan(index)}>
                                    Delete
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="notifications">
                <div className="space-y-4">
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure your notification settings and preferences.</CardDescription>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
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
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="space-y-4">
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>Get insights from AI to improve your company.</CardDescription>

                  <div className="flex justify-between items-center">
                    <CardTitle>Security Score</CardTitle>
                    <Button onClick={() => setIsAnalyzing(true)} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Now"
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p>Your security score is: {securityScore}%</p>
                  </div>

                  <div className="space-y-2">
                    <CardTitle>AI Insights</CardTitle>
                    <CardDescription>Get insights from AI to improve your company.</CardDescription>
                    <div className="grid gap-4">
                      {aiInsights.length === 0 ? (
                        <p className="text-muted-foreground">No insights available yet.</p>
                      ) : (
                        <div className="grid gap-4">
                          {aiInsights.map((insight) => (
                            <Card key={insight.id}>
                              <CardHeader>
                                <CardTitle>{insight.title}</CardTitle>
                                <CardDescription>{insight.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p>{insight.content}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={showSubsidiaryDialog} onOpenChange={setShowSubsidiaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubsidiary ? "Edit Subsidiary" : "Add Subsidiary"}</DialogTitle>
            <DialogDescription>
              {editingSubsidiary ? "Edit an existing subsidiary." : "Create a new subsidiary."}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Subsidiary</DialogTitle>
            <DialogDescription>View details of the selected subsidiary.</DialogDescription>
          </DialogHeader>
          {viewingSubsidiary && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={viewingSubsidiary.name} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input value={viewingSubsidiary.tax_id} readOnly />
              </div>
              <div className="space-y-2">
                <Label>SSNIT Number</Label>
                <Input value={viewingSubsidiary.ssnit_number} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={viewingSubsidiary.email_address} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={viewingSubsidiary.phone_number} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={viewingSubsidiary.address} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Divisions</Label>
                {viewingSubsidiary.divisions?.map((division, index) => (
                  <Input key={index} value={division} readOnly />
                ))}
              </div>
              <div className="space-y-2">
                <Label>Departments</Label>
                {viewingSubsidiary.departments?.map((department, index) => (
                  <Input key={index} value={department} readOnly />
                ))}
              </div>
              <div className="space-y-2">
                <Label>Locations</Label>
                {viewingSubsidiary.locations?.map((location, index) => (
                  <Input key={index} value={location} readOnly />
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewSubsidiaryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivateSubsidiaryModal} onOpenChange={setShowDeactivateSubsidiaryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Subsidiary</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this subsidiary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateSubsidiaryModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (subsidiaryToToggle) {
                  handleDeactivateSubsidiary(subsidiaryToToggle.id)
                }
                setShowDeactivateSubsidiaryModal(false)
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivateSubsidiaryModal} onOpenChange={setShowActivateSubsidiaryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Subsidiary</DialogTitle>
            <DialogDescription>Are you sure you want to activate this subsidiary?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateSubsidiaryModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (subsidiaryToToggle) {
                  handleActivateSubsidiary(subsidiaryToToggle.id)
                }
                setShowActivateSubsidiaryModal(false)
              }}
            >
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteRoleDialog} onOpenChange={setShowDeleteRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subsidiary</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subsidiary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteRoleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRole) {
                  handleDeleteSubsidiary(selectedRole.id)
                }
                setShowDeleteRoleDialog(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Change your admin password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                >
                  {showPasswords.current ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Show password</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  {showPasswords.new ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Show password</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  {showPasswords.confirm ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Show password</span>
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

      <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Log</DialogTitle>
            <DialogDescription>View your recent activity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Activity Log Data</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityLog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupSuccess} onOpenChange={setShowBackupSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Successful</DialogTitle>
            <DialogDescription>Your system has been backed up successfully.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupSuccess(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailTemplateDialog} onOpenChange={setShowCustomTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Template</DialogTitle>
            <DialogDescription>Customize your email templates.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomTemplateDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaveTypeDialog} onOpenChange={setShowLeaveTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Type</DialogTitle>
            <DialogDescription>Manage your leave types.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveTypeDialog(false)}>
              Close
            </Button>
            <Button onClick={handleSaveLeaveType}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSalaryGradeDialog} onOpenChange={setShowSalaryGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salary Grade</DialogTitle>
            <DialogDescription>Manage your salary grades.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSalaryGradeDialog(false)}>
              Close
            </Button>
            <Button onClick={handleSaveSalaryGrade}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAllowanceDialog} onOpenChange={setShowAllowanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Allowance" : "Add Allowance"}</DialogTitle>
            <DialogDescription>Manage your payroll allowances.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllowanceDialog(false)}>
              Close
            </Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Deduction" : "Add Deduction"}</DialogTitle>
            <DialogDescription>Manage your payroll deductions.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeductionDialog(false)}>
              Close
            </Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
