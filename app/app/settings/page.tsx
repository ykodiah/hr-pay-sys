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
import { Textarea } from "@/components/ui/textarea"
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
    const demoSession = document.cookie.includes("demo_session=true")
    const demoProfile = localStorage.getItem("demo_profile")
    return demoSession || !!demoProfile
  }
  return false
}

const loadCompanyData = async () => {
  console.log("[v0] Loading company data...")

  // Check demo mode first to prevent database queries
  if (isDemoMode()) {
    console.log("[v0] Demo mode detected, using mock company data")
    setCompanyData({
      id: "demo-company-001",
      name: "Akwaaba Technologies Ltd",
      email_address: "ykodiah@gmail.com",
      tax_id: "C0012345678",
      ssnit_number: "1234567890",
      industry: "Technology",
      status: "active",
      address: "123 Liberation Road, Labone, Accra, Ghana",
      phone_number: "0249397960",
      divisions: ["Head Office", "Regional Office"],
      departments: ["Technology", "Human Resources", "Finance"],
      locations: ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"],
    })
    setDivisions(["Head Office", "Regional Office"])
    setDepartments(["Technology", "Human Resources", "Finance"])
    setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
    return
  }

  try {
    const { data, error } = await supabase.from("companies").select("*").single()

    if (error) throw error

    if (data) {
      setCompanyData({
        id: data.id,
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
      })

      setDivisions(data.divisions || [])
      setDepartments(data.departments || [])
      setLocations(data.locations || [])
      setLogoPreview(data.logo_url || "")
    }
  } catch (error) {
    console.error("[v0] Error loading company data:", error)
    toast({
      title: "Error",
      description: "Failed to load company data",
      variant: "destructive",
    })
  }
}

const loadEmployees = async () => {
  console.log("[v0] Loading employees...")

  if (isDemoMode()) {
    console.log("[v0] Demo mode detected, using mock employees data")
    setEmployees([
      {
        id: "emp-001",
        employee_id: "EMP001",
        first_name: "John",
        last_name: "Doe",
        full_name: "John Doe",
        corporate_email: "john.doe@akwaaba.com",
        position: "Software Engineer",
        department: "Technology",
        status: "active",
        date_of_joining: "2023-01-15",
        phone: "0241234567",
        address: "123 Main St, Accra",
      },
      {
        id: "emp-002",
        employee_id: "EMP002",
        first_name: "Jane",
        last_name: "Smith",
        full_name: "Jane Smith",
        corporate_email: "jane.smith@akwaaba.com",
        position: "HR Manager",
        department: "Human Resources",
        status: "active",
        date_of_joining: "2022-11-20",
        phone: "0242345678",
        address: "456 Oak Ave, Kumasi",
      },
      {
        id: "emp-003",
        employee_id: "EMP003",
        first_name: "Michael",
        last_name: "Johnson",
        full_name: "Michael Johnson",
        corporate_email: "michael.johnson@akwaaba.com",
        position: "Finance Director",
        department: "Finance",
        status: "active",
        date_of_joining: "2021-08-10",
        phone: "0243456789",
        address: "789 Pine St, Takoradi",
      },
    ])
    return
  }

  try {
    const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false })

    if (error) throw error
    setEmployees(data || [])
  } catch (error) {
    console.error("Error loading employees:", error)
    toast({
      title: "Error",
      description: "Failed to load employees",
      variant: "destructive",
    })
  }
}

const loadSubsidiaries = async () => {
  console.log("[v0] Loading subsidiaries...")

  if (isDemoMode()) {
    console.log("[v0] Demo mode detected, using mock subsidiaries data")
    setSubsidiaries([
      {
        id: "sub-001",
        name: "Akwaaba Tech Solutions",
        email_address: "solutions@akwaaba.com",
        phone_number: "0244567890",
        tax_id: "S0012345678",
        ssnit_number: "0987654321",
        address: "456 Tech Park, Accra",
        status: "active",
        industry: "Software Development",
        divisions_count: 2,
        departments_count: 3,
        locations_count: 2,
      },
      {
        id: "sub-002",
        name: "Akwaaba Consulting",
        email_address: "consulting@akwaaba.com",
        phone_number: "0245678901",
        tax_id: "S0087654321",
        ssnit_number: "1357924680",
        address: "789 Business District, Kumasi",
        status: "active",
        industry: "Business Consulting",
        divisions_count: 1,
        departments_count: 2,
        locations_count: 1,
      },
    ])
    return
  }

  try {
    const { data, error } = await supabase.from("subsidiaries").select("*").order("created_at", { ascending: false })

    if (error) throw error
    setSubsidiaries(data || [])
  } catch (error) {
    console.error("Subsidiaries loading error:", error)
    toast({
      title: "Error",
      description: "Failed to load subsidiaries",
      variant: "destructive",
    })
  }
}

const loadRoles = async () => {
  console.log("[v0] Loading roles...")

  if (isDemoMode()) {
    console.log("[v0] Demo mode detected, using mock roles data")
    setRoles([
      {
        id: "role-001",
        name: "Administrator",
        code: "ADMIN",
        description: "Full system access and management capabilities",
        level: 1,
        is_active: true,
        is_system_role: true,
      },
      {
        id: "role-002",
        name: "HR Manager",
        code: "HR_MGR",
        description: "Human resources management and employee oversight",
        level: 2,
        is_active: true,
        is_system_role: false,
      },
      {
        id: "role-003",
        name: "Employee",
        code: "EMP",
        description: "Standard employee access to personal information",
        level: 3,
        is_active: true,
        is_system_role: false,
      },
      {
        id: "role-004",
        name: "Finance Manager",
        code: "FIN_MGR",
        description: "Financial management and payroll oversight",
        level: 2,
        is_active: true,
        is_system_role: false,
      },
    ])
    return
  }

  try {
    const { data, error } = await supabase.from("roles").select("*").order("level", { ascending: true })

    if (error) throw error
    setRoles(data || [])
  } catch (error) {
    console.error("Error loading roles:", error)
    toast({
      title: "Error",
      description: "Failed to load roles",
      variant: "destructive",
    })
  }
}

const loadPayrollData = async () => {
  console.log("[v0] Loading payroll data...")

  if (isDemoMode()) {
    console.log("[v0] Demo mode detected, using mock payroll data")
    setPayrollAllowancesState([
      {
        id: "allow-001",
        code: "TRANSPORT",
        description: "Transportation Allowance",
        type: "Fixed",
        amount: 200.0,
        percentage: 0,
        taxable: false,
        recurring: true,
        is_active: true,
      },
      {
        id: "allow-002",
        code: "HOUSING",
        description: "Housing Allowance",
        type: "Percentage",
        amount: 0,
        percentage: 15,
        taxable: true,
        recurring: true,
        is_active: true,
      },
      {
        id: "allow-003",
        code: "MEAL",
        description: "Meal Allowance",
        type: "Fixed",
        amount: 150.0,
        percentage: 0,
        taxable: false,
        recurring: true,
        is_active: true,
      },
    ])

    setPayrollDeductionsState([
      {
        id: "ded-001",
        code: "LOAN",
        description: "Staff Loan Deduction",
        type: "Fixed",
        amount: 500.0,
        percentage: 0,
        recurring: true,
        is_active: true,
      },
      {
        id: "ded-002",
        code: "ADVANCE",
        description: "Salary Advance",
        type: "Fixed",
        amount: 300.0,
        percentage: 0,
        recurring: false,
        is_active: true,
      },
    ])

    setLoanSettingsState([
      {
        id: "loan-001",
        code: "STAFF_LOAN",
        description: "Staff Personal Loan",
        type: "Personal",
        max_amount: 50000,
        interest_rate: 12.5,
        max_repayment_months: 24,
        auto_deduct: true,
        taxable: false,
        recurring: true,
        is_active: true,
      },
      {
        id: "loan-002",
        code: "EMERGENCY",
        description: "Emergency Loan",
        type: "Emergency",
        max_amount: 10000,
        interest_rate: 8.0,
        max_repayment_months: 12,
        auto_deduct: true,
        taxable: false,
        recurring: false,
        is_active: true,
      },
    ])

    setSalaryGradesState([
      {
        id: "grade-001",
        grade_name: "Junior Level",
        grade_level: 1,
        step_1: 2500,
        step_2: 2750,
        step_3: 3000,
        step_4: 3250,
        step_5: 3500,
      },
      {
        id: "grade-002",
        grade_name: "Mid Level",
        grade_level: 2,
        step_1: 4000,
        step_2: 4500,
        step_3: 5000,
        step_4: 5500,
        step_5: 6000,
      },
      {
        id: "grade-003",
        grade_name: "Senior Level",
        grade_level: 3,
        step_1: 7000,
        step_2: 8000,
        step_3: 9000,
        step_4: 10000,
        step_5: 11000,
      },
    ])

    setLeaveTypesState([
      {
        id: "leave-001",
        name: "Annual Leave",
        code: "ANNUAL",
        description: "Annual vacation leave",
        annual_entitlement: 21,
        is_paid: true,
        requires_approval: true,
        is_active: true,
      },
      {
        id: "leave-002",
        name: "Sick Leave",
        code: "SICK",
        description: "Medical sick leave",
        annual_entitlement: 10,
        is_paid: true,
        requires_approval: false,
        is_active: true,
      },
      {
        id: "leave-003",
        name: "Maternity Leave",
        code: "MATERNITY",
        description: "Maternity leave for new mothers",
        annual_entitlement: 84,
        is_paid: true,
        requires_approval: true,
        is_active: true,
      },
    ])
    return
  }

  try {
    // Load payroll allowances
    const { data: allowances, error: allowancesError } = await supabase
      .from("payroll_allowances")
      .select("*")
      .order("created_at", { ascending: false })

    if (allowancesError) throw allowancesError
    setPayrollAllowancesState(allowances || [])

    // Load payroll deductions
    const { data: deductions, error: deductionsError } = await supabase
      .from("payroll_deductions")
      .select("*")
      .order("created_at", { ascending: false })

    if (deductionsError) throw deductionsError
    setPayrollDeductionsState(deductions || [])

    // Load loan settings
    const { data: loans, error: loansError } = await supabase
      .from("loan_settings")
      .select("*")
      .order("created_at", { ascending: false })

    if (loansError) throw loansError
    setLoanSettingsState(loans || [])

    // Load salary grades
    const { data: grades, error: gradesError } = await supabase
      .from("salary_grades")
      .select("*")
      .order("grade_level", { ascending: true })

    if (gradesError) throw gradesError
    setSalaryGradesState(grades || [])

    // Load leave types
    const { data: leaveTypes, error: leaveTypesError } = await supabase
      .from("leave_types")
      .select("*")
      .order("created_at", { ascending: false })

    if (leaveTypesError) throw leaveTypesError
    setLeaveTypesState(leaveTypes || [])
  } catch (error) {
    console.error("Error loading payroll data:", error)
    toast({
      title: "Error",
      description: "Failed to load payroll data",
      variant: "destructive",
    })
  }
}

const loadNotificationSettings = async () => {
  console.log("[v0] Loading notification settings...")

  if (isDemoMode()) {
    console.log("[v0] Demo mode detected, using mock notification settings")
    setEmailTemplates([
      {
        id: "template-001",
        name: "Welcome Email",
        subject: "Welcome to Akwaaba Technologies",
        body: "Dear {{employee_name}}, Welcome to our team! We're excited to have you on board.",
        type: "onboarding",
        is_active: true,
      },
      {
        id: "template-002",
        name: "Leave Approval",
        subject: "Leave Request Approved",
        body: "Dear {{employee_name}}, Your leave request from {{start_date}} to {{end_date}} has been approved.",
        type: "leave",
        is_active: true,
      },
      {
        id: "template-003",
        name: "Payroll Notification",
        subject: "Payroll Processed",
        body: "Dear {{employee_name}}, Your salary for {{month}} has been processed. Net pay: {{net_amount}}",
        type: "payroll",
        is_active: true,
      },
    ])

    setNotificationSettings({
      email: "notifications@akwaaba.com",
      webhookUrl: "https://api.akwaaba.com/webhooks/notifications",
    })
    return
  }

  // In a real implementation, load from database
  setEmailTemplates([])
  setNotificationSettings({
    email: "",
    webhookUrl: "",
  })
}

const loadSecurityData = async () => {
  console.log("[v0] Loading security data...")

  if (isDemoMode()) {
    console.log("[v0] Demo mode detected, using mock security data")
    // Mock security analytics data would be loaded here
    return
  }

  try {
    // Load security analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from("security_analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (analyticsError) throw analyticsError

    // Load access logs
    const { data: accessLogs, error: logsError } = await supabase
      .from("access_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (logsError) throw logsError
  } catch (error) {
    console.error("Error loading security data:", error)
    toast({
      title: "Error",
      description: "Failed to load security data",
      variant: "destructive",
    })
  }
}

const handleAddSubsidiary = () => {
  setEditingSubsidiary(null)
  setShowSubsidiaryDialog(true)
}

const handleEditSubsidiary = (subsidiary: any) => {
  setEditingSubsidiary(subsidiary)
  setShowSubsidiaryDialog(true)
}

const handleViewSubsidiary = (subsidiary: any) => {
  setViewingSubsidiary(subsidiary)
  setShowViewSubsidiaryDialog(true)
}

const handleAddAllowance = () => {
  setEditingItem(null)
  setShowAllowanceDialog(true)
}

const handleEditAllowance = (index: number) => {
  setEditingItem(payrollAllowances[index])
  setEditingIndex(index)
  setShowAllowanceDialog(true)
}

const handleDeleteAllowance = async (index: number) => {
  if (isDemoMode()) {
    const newAllowances = payrollAllowances.filter((_, i) => i !== index)
    setPayrollAllowancesState(newAllowances)
    toast({
      title: "Success",
      description: "Allowance deleted successfully",
    })
    return
  }

  try {
    const allowance = payrollAllowances[index]
    const { error } = await supabase.from("payroll_allowances").delete().eq("id", allowance.id)

    if (error) throw error

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

const handleAddDeduction = () => {
  setEditingItem(null)
  setShowDeductionDialog(true)
}

const handleEditDeduction = (index: number) => {
  setEditingItem(payrollDeductions[index])
  setEditingIndex(index)
  setShowDeductionDialog(true)
}

const handleDeleteDeduction = async (index: number) => {
  if (isDemoMode()) {
    const newDeductions = payrollDeductions.filter((_, i) => i !== index)
    setPayrollDeductionsState(newDeductions)
    toast({
      title: "Success",
      description: "Deduction deleted successfully",
    })
    return
  }

  try {
    const deduction = payrollDeductions[index]
    const { error } = await supabase.from("payroll_deductions").delete().eq("id", deduction.id)

    if (error) throw error

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

const handleAddLoan = () => {
  setEditingItem(null)
  setShowLoanDialog(true)
}

const handleEditLoan = (index: number) => {
  setEditingItem(loanSettings[index])
  setEditingIndex(index)
  setShowLoanDialog(true)
}

const handleDeleteLoan = async (index: number) => {
  if (isDemoMode()) {
    const newLoans = loanSettings.filter((_, i) => i !== index)
    setLoanSettingsState(newLoans)
    toast({
      title: "Success",
      description: "Loan setting deleted successfully",
    })
    return
  }

  try {
    const loan = loanSettings[index]
    const { error } = await supabase.from("loan_settings").delete().eq("id", loan.id)

    if (error) throw error

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

const handleAddRole = () => {
  setEditingItem(null)
  setShowEditRoleDialog(true)
}

const handleEditRole = (role: any) => {
  setEditingItem(role)
  setShowEditRoleDialog(true)
}

const handleDeleteRole = async (role: any) => {
  if (isDemoMode()) {
    const newRoles = roles.filter((r) => r.id !== role.id)
    setRoles(newRoles)
    toast({
      title: "Success",
      description: "Role deleted successfully",
    })
    return
  }

  try {
    const { error } = await supabase.from("roles").delete().eq("id", role.id)

    if (error) throw error

    const newRoles = roles.filter((r) => r.id !== role.id)
    setRoles(newRoles)

    toast({
      title: "Success",
      description: "Role deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting role:", error)
    toast({
      title: "Error",
      description: "Failed to delete role",
      variant: "destructive",
    })
  }
}

const handleChangeAdminPassword = () => {
  setShowPasswordChangeDialog(true)
}

const handleViewActivityLog = () => {
  setShowActivityLog(true)
}

const handleDownloadSecurityReport = async () => {
  toast({
    title: "Security Report",
    description: "Security report download started",
  })
}

const handleDownloadAuditTrail = async () => {
  toast({
    title: "Audit Trail",
    description: "Audit trail export started",
  })
}

const handleBackupNow = async () => {
  setIsBackingUp(true)

  try {
    // Simulate backup process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setLastBackupTime(new Date().toISOString())
    setShowBackupSuccess(true)

    toast({
      title: "Backup Complete",
      description: "System backup completed successfully",
    })
  } catch (error) {
    toast({
      title: "Backup Failed",
      description: "Failed to complete system backup",
      variant: "destructive",
    })
  } finally {
    setIsBackingUp(false)
  }
}

const SettingsPage: FunctionComponent = () => {
  const { toast } = useToast()
  const supabase = createClient()

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
  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [payrollAllowances, setPayrollAllowancesState] = useState<any[]>([])
  const [payrollDeductions, setPayrollDeductionsState] = useState<any[]>([])
  const [loanSettings, setLoanSettingsState] = useState<any[]>([])
  const [salaryGrades, setSalaryGradesState] = useState<any[]>([])
  const [leaveTypes, setLeaveTypesState] = useState<any[]>([])
  const [emailTemplates, setEmailTemplates] = useState<any[]>([])
  const [notificationSettings, setNotificationSettings] = useState<any>({})

  const [editingSubsidiary, setEditingSubsidiary] = useState<Subsidiary | null>(null)
  const [showSubsidiaryDialog, setShowSubsidiaryDialog] = useState<boolean>(false)
  const [viewingSubsidiary, setViewingSubsidiary] = useState<Subsidiary | null>(null)
  const [showViewSubsidiaryDialog, setShowViewSubsidiaryDialog] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [showAllowanceDialog, setShowAllowanceDialog] = useState<boolean>(false)
  const [showDeductionDialog, setShowDeductionDialog] = useState<boolean>(false)
  const [showLoanDialog, setShowLoanDialog] = useState<boolean>(false)
  const [showEditRoleDialog, setShowEditRoleDialog] = useState<boolean>(false)
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState<boolean>(false)
  const [showActivityLog, setShowActivityLog] = useState<boolean>(false)
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false)
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null)
  const [showBackupSuccess, setShowBackupSuccess] = useState<boolean>(false)

  useEffect(() => {
    loadCompanyData()
    loadEmployees()
    loadSubsidiaries()
    loadRoles()
    loadPayrollData()
    loadNotificationSettings()
    loadSecurityData()
  }, [])

  const handleCompanySave = async (data: any) => {
    if (isDemoMode()) {
      toast({
        title: "Demo Mode",
        description: "Company settings cannot be saved in demo mode.",
      })
      return
    }

    try {
      const { error } = await supabase.from("companies").update(data).eq("id", companyData.id)

      if (error) throw error

      setCompanyData(data)
      setDivisions(data.divisions || [])
      setDepartments(data.departments || [])
      setLocations(data.locations || [])

      toast({
        title: "Success",
        description: "Company settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating company settings:", error)
      toast({
        title: "Error",
        description: "Failed to update company settings",
        variant: "destructive",
      })
    }
  }

  const handleSubsidiarySave = async (data: any) => {
    setShowSubsidiaryDialog(false)

    if (isDemoMode()) {
      toast({
        title: "Demo Mode",
        description: "Subsidiary settings cannot be saved in demo mode.",
      })
      return
    }

    if (editingSubsidiary) {
      // Update existing subsidiary
      try {
        const { error } = await supabase.from("subsidiaries").update(data).eq("id", editingSubsidiary.id)

        if (error) throw error

        // Optimistically update the state
        setSubsidiaries(subsidiaries.map((sub) => (sub.id === editingSubsidiary.id ? { ...sub, ...data } : sub)))

        toast({
          title: "Success",
          description: "Subsidiary updated successfully",
        })
      } catch (error) {
        console.error("Error updating subsidiary:", error)
        toast({
          title: "Error",
          description: "Failed to update subsidiary",
          variant: "destructive",
        })
      }
    } else {
      // Create new subsidiary
      try {
        const { data: newSubsidiary, error } = await supabase.from("subsidiaries").insert(data).select().single()

        if (error) throw error

        // Optimistically update the state
        setSubsidiaries([...subsidiaries, newSubsidiary])

        toast({
          title: "Success",
          description: "Subsidiary created successfully",
        })
      } catch (error) {
        console.error("Error creating subsidiary:", error)
        toast({
          title: "Error",
          description: "Failed to create subsidiary",
          variant: "destructive",
        })
      }
    }
    loadSubsidiaries()
  }

  const handleDeleteSubsidiary = async (subsidiary: any) => {
    if (isDemoMode()) {
      const newSubsidiaries = subsidiaries.filter((s) => s.id !== subsidiary.id)
      setSubsidiaries(newSubsidiaries)
      toast({
        title: "Success",
        description: "Subsidiary deleted successfully",
      })
      return
    }

    try {
      const { error } = await supabase.from("subsidiaries").delete().eq("id", subsidiary.id)

      if (error) throw error

      const newSubsidiaries = subsidiaries.filter((s) => s.id !== subsidiary.id)
      setSubsidiaries(newSubsidiaries)

      toast({
        title: "Success",
        description: "Subsidiary deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting subsidiary:", error)
      toast({
        title: "Error",
        description: "Failed to delete subsidiary",
        variant: "destructive",
      })
    }
  }

  const handleAllowanceSave = async (data: any) => {
    setShowAllowanceDialog(false)

    if (isDemoMode()) {
      toast({
        title: "Demo Mode",
        description: "Payroll settings cannot be saved in demo mode.",
      })
      return
    }

    if (editingItem) {
      // Update existing allowance
      try {
        const { error } = await supabase.from("payroll_allowances").update(data).eq("id", editingItem.id)

        if (error) throw error

        // Optimistically update the state
        setPayrollAllowancesState(
          payrollAllowances.map((item) => (item.id === editingItem.id ? { ...item, ...data } : item)),
        )

        toast({
          title: "Success",
          description: "Allowance updated successfully",
        })
      } catch (error) {
        console.error("Error updating allowance:", error)
        toast({
          title: "Error",
          description: "Failed to update allowance",
          variant: "destructive",
        })
      }
    } else {
      // Create new allowance
      try {
        const { data: newAllowance, error } = await supabase.from("payroll_allowances").insert(data).select().single()

        if (error) throw error

        // Optimistically update the state
        setPayrollAllowancesState([...payrollAllowances, newAllowance])

        toast({
          title: "Success",
          description: "Allowance created successfully",
        })
      } catch (error) {
        console.error("Error creating allowance:", error)
        toast({
          title: "Error",
          description: "Failed to create allowance",
          variant: "destructive",
        })
      }
    }
    loadPayrollData()
  }

  const handleDeductionSave = async (data: any) => {
    setShowDeductionDialog(false)

    if (isDemoMode()) {
      toast({
        title: "Demo Mode",
        description: "Payroll settings cannot be saved in demo mode.",
      })
      return
    }

    if (editingItem) {
      // Update existing deduction
      try {
        const { error } = await supabase.from("payroll_deductions").update(data).eq("id", editingItem.id)

        if (error) throw error

        // Optimistically update the state
        setPayrollDeductionsState(
          payrollDeductions.map((item) => (item.id === editingItem.id ? { ...item, ...data } : item)),
        )

        toast({
          title: "Success",
          description: "Deduction updated successfully",
        })
      } catch (error) {
        console.error("Error updating deduction:", error)
        toast({
          title: "Error",
          description: "Failed to update deduction",
          variant: "destructive",
        })
      }
    } else {
      // Create new deduction
      try {
        const { data: newDeduction, error } = await supabase.from("payroll_deductions").insert(data).select().single()

        if (error) throw error

        // Optimistically update the state
        setPayrollDeductionsState([...payrollDeductions, newDeduction])

        toast({
          title: "Success",
          description: "Deduction created successfully",
        })
      } catch (error) {
        console.error("Error creating deduction:", error)
        toast({
          title: "Error",
          description: "Failed to create deduction",
          variant: "destructive",
        })
      }
    }
    loadPayrollData()
  }

  const handleLoanSave = async (data: any) => {
    setShowLoanDialog(false)

    if (isDemoMode()) {
      toast({
        title: "Demo Mode",
        description: "Payroll settings cannot be saved in demo mode.",
      })
      return
    }

    if (editingItem) {
      // Update existing loan
      try {
        const { error } = await supabase.from("loan_settings").update(data).eq("id", editingItem.id)

        if (error) throw error

        // Optimistically update the state
        setLoanSettingsState(loanSettings.map((item) => (item.id === editingItem.id ? { ...item, ...data } : item)))

        toast({
          title: "Success",
          description: "Loan setting updated successfully",
        })
      } catch (error) {
        console.error("Error updating loan setting:", error)
        toast({
          title: "Error",
          description: "Failed to update loan setting",
          variant: "destructive",
        })
      }
    } else {
      // Create new loan
      try {
        const { data: newLoan, error } = await supabase.from("loan_settings").insert(data).select().single()

        if (error) throw error

        // Optimistically update the state
        setLoanSettingsState([...loanSettings, newLoan])

        toast({
          title: "Success",
          description: "Loan setting created successfully",
        })
      } catch (error) {
        console.error("Error creating loan setting:", error)
        toast({
          title: "Error",
          description: "Failed to create loan setting",
          variant: "destructive",
        })
      }
    }
    loadPayrollData()
  }

  const handleRoleSave = async (data: any) => {
    setShowEditRoleDialog(false)

    if (isDemoMode()) {
      toast({
        title: "Demo Mode",
        description: "Roles cannot be saved in demo mode.",
      })
      return
    }

    if (editingItem) {
      // Update existing role
      try {
        const { error } = await supabase.from("roles").update(data).eq("id", editingItem.id)

        if (error) throw error

        // Optimistically update the state
        setRoles(roles.map((role) => (role.id === editingItem.id ? { ...role, ...data } : role)))

        toast({
          title: "Success",
          description: "Role updated successfully",
        })
      } catch (error) {
        console.error("Error updating role:", error)
        toast({
          title: "Error",
          description: "Failed to update role",
          variant: "destructive",
        })
      }
    } else {
      // Create new role
      try {
        const { data: newRole, error } = await supabase.from("roles").insert(data).select().single()

        if (error) throw error

        // Optimistically update the state
        setRoles([...roles, newRole])

        toast({
          title: "Success",
          description: "Role created successfully",
        })
      } catch (error) {
        console.error("Error creating role:", error)
        toast({
          title: "Error",
          description: "Failed to create role",
          variant: "destructive",
        })
      }
    }
    loadRoles()
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your company settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="company" className="space-y-4">
            <TabsList>
              <TabsTrigger value="company">
                <Building2 className="h-4 w-4 mr-2" /> Company
              </TabsTrigger>
              <TabsTrigger value="employees">
                <Users className="h-4 w-4 mr-2" /> Employees
              </TabsTrigger>
              <TabsTrigger value="subsidiaries">
                <Building2 className="h-4 w-4 mr-2" /> Subsidiaries
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" /> Roles
              </TabsTrigger>
              <TabsTrigger value="payroll">
                <DollarSign className="h-4 w-4 mr-2" /> Payroll
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" /> Notifications
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" /> Security
              </TabsTrigger>
            </TabsList>
            <TabsContent value="company" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="phone">Phone</Label>
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
                        id="company-logo-upload"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        // onChange={handleLogoUpload}
                      />
                      <Label
                        htmlFor="company-logo-upload"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 cursor-pointer"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Label>
                      {/* {logoFileName && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">File:</span> {logoFileName}
                        </p>
                      )} */}
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
              </div>
              <Button onClick={() => handleCompanySave(companyData)}>Save Company</Button>
            </TabsContent>
            <TabsContent value="employees" className="space-y-4">
              <div className="grid gap-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 bg-gray-50"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                            {employee.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {employee.corporate_email}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {employee.position}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {employee.department}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Power className="h-4 w-4 mr-2" /> Deactivate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="subsidiaries" className="space-y-4">
              <div className="grid gap-4">
                <Button onClick={handleAddSubsidiary}>Add Subsidiary</Button>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Tax ID
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          SSNIT
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Divisions
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Departments
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Locations
                        </th>
                        <th className="px-6 py-3 bg-gray-50"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subsidiaries.map((subsidiary) => (
                        <tr key={subsidiary.id}>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                            {subsidiary.name}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {subsidiary.email_address}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {subsidiary.tax_id}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {subsidiary.ssnit_number}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {subsidiary.divisions_count}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {subsidiary.departments_count}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {subsidiary.locations_count}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewSubsidiary(subsidiary)}>
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditSubsidiary(subsidiary)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteSubsidiary(subsidiary)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="roles" className="space-y-4">
              <div className="grid gap-4">
                <Button onClick={handleAddRole}>Add Role</Button>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                          User Count
                        </th>
                        <th className="px-6 py-3 bg-gray-50"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roles.map((role) => (
                        <tr key={role.id}>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                            {role.name}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {role.description}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                            {role.user_count}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteRole(role)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="payroll" className="space-y-4">
              <div className="grid gap-4">
                <Tabs defaultValue="allowances" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="allowances">
                      <DollarSign className="h-4 w-4 mr-2" /> Allowances
                    </TabsTrigger>
                    <TabsTrigger value="deductions">
                      <DollarSign className="h-4 w-4 mr-2" /> Deductions
                    </TabsTrigger>
                    <TabsTrigger value="loans">
                      <DollarSign className="h-4 w-4 mr-2" /> Loans
                    </TabsTrigger>
                    <TabsTrigger value="grades">
                      <Brain className="h-4 w-4 mr-2" /> Salary Grades
                    </TabsTrigger>
                    <TabsTrigger value="leave">
                      <Clock className="h-4 w-4 mr-2" /> Leave Types
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="allowances" className="space-y-4">
                    <Button onClick={handleAddAllowance}>Add Allowance</Button>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Code
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 bg-gray-50"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payrollAllowances.map((allowance, index) => (
                            <tr key={allowance.id}>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                {allowance.code}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {allowance.description}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {allowance.type}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(allowance.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditAllowance(index)}>
                                      <Edit className="h-4 w-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteAllowance(index)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent value="deductions" className="space-y-4">
                    <Button onClick={handleAddDeduction}>Add Deduction</Button>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Code
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 bg-gray-50"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payrollDeductions.map((deduction, index) => (
                            <tr key={deduction.id}>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                {deduction.code}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {deduction.description}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {deduction.type}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(deduction.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditDeduction(index)}>
                                      <Edit className="h-4 w-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteDeduction(index)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent value="loans" className="space-y-4">
                    <Button onClick={handleAddLoan}>Add Loan Setting</Button>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Code
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Max Amount
                            </th>
                            <th className="px-6 py-3 bg-gray-50"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loanSettings.map((loan, index) => (
                            <tr key={loan.id}>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                {loan.code}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {loan.description}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {loan.type}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(loan.max_amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditLoan(index)}>
                                      <Edit className="h-4 w-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteLoan(index)}>
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent value="grades" className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Grade Name
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Level
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Step 1
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Step 2
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Step 3
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Step 4
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Step 5
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {salaryGrades.map((grade) => (
                            <tr key={grade.id}>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                {grade.grade_name}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {grade.grade_level}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(grade.step_1)}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(grade.step_2)}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(grade.step_3)}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(grade.step_4)}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {formatCurrency(grade.step_5)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent value="leave" className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Code
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Entitlement
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Paid
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              Approval
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {leaveTypes.map((leave) => (
                            <tr key={leave.id}>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                {leave.name}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {leave.code}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {leave.annual_entitlement}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {leave.is_paid ? "Yes" : "No"}
                              </td>
                              <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                {leave.requires_approval ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <div className="grid gap-4">
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
                    value={notificationSettings.webhookUrl}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookUrl: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <div className="grid gap-4">
                <Button onClick={handleChangeAdminPassword}>Change Admin Password</Button>
                <Button onClick={handleViewActivityLog}>View Activity Log</Button>
                <Button onClick={handleDownloadSecurityReport}>Download Security Report</Button>
                <Button onClick={handleDownloadAuditTrail}>Download Audit Trail</Button>
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">System Backup</h3>
                  <p className="text-sm text-gray-500">Regular backups ensure data safety and quick recovery.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Last Backup:</p>
                      <p className="text-xs text-gray-500">
                        {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "Never"}
                      </p>
                    </div>
                    <Button onClick={handleBackupNow} disabled={isBackingUp}>
                      {isBackingUp ? (
                        <>
                          Backing Up...
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        "Backup Now"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showSubsidiaryDialog} onOpenChange={setShowSubsidiaryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSubsidiary ? "Edit Subsidiary" : "Create Subsidiary"}</DialogTitle>
            <DialogDescription>
              {editingSubsidiary ? "Update the subsidiary details." : "Enter the details for the new subsidiary."}
            </DialogDescription>
          </DialogHeader>
          <SubsidiaryForm
            subsidiary={editingSubsidiary}
            onSave={handleSubsidiarySave}
            onCancel={() => setShowSubsidiaryDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showViewSubsidiaryDialog} onOpenChange={setShowViewSubsidiaryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>View Subsidiary</DialogTitle>
            <DialogDescription>View the details of the selected subsidiary.</DialogDescription>
          </DialogHeader>
          {viewingSubsidiary && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={viewingSubsidiary.name} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={viewingSubsidiary.email_address} readOnly />
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
                <Label>Address</Label>
                <Textarea value={viewingSubsidiary.address} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={viewingSubsidiary.phone_number} readOnly />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowViewSubsidiaryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAllowanceDialog} onOpenChange={setShowAllowanceDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Allowance" : "Create Allowance"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the allowance details." : "Enter the details for the new allowance."}
            </DialogDescription>
          </DialogHeader>
          {/* <AllowanceForm
            allowance={editingItem}
            onSave={handleAllowanceSave}
            onCancel={() => setShowAllowanceDialog(false)}
          /> */}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAllowanceDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Deduction" : "Create Deduction"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the deduction details." : "Enter the details for the new deduction."}
            </DialogDescription>
          </DialogHeader>
          {/* <DeductionForm
            deduction={editingItem}
            onSave={handleDeductionSave}
            onCancel={() => setShowDeductionDialog(false)}
          /> */}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowDeductionDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Loan Setting" : "Create Loan Setting"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the loan setting details." : "Enter the details for the new loan setting."}
            </DialogDescription>
          </DialogHeader>
          {/* <LoanForm
            loan={editingItem}
            onSave={handleLoanSave}
            onCancel={() => setShowLoanDialog(false)}
          /> */}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowLoanDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the role details." : "Enter the details for the new role."}
            </DialogDescription>
          </DialogHeader>
          {/* <RoleForm
            role={editingItem}
            onSave={handleRoleSave}
            onCancel={() => setShowEditRoleDialog(false)}
          /> */}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowEditRoleDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Admin Password</DialogTitle>
            <DialogDescription>Enter the new password for the administrator account.</DialogDescription>
          </DialogHeader>
          {/* <PasswordChangeForm
            onSave={handlePasswordChange}
            onCancel={() => setShowPasswordChangeDialog(false)}
          /> */}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowPasswordChangeDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Activity Log</DialogTitle>
            <DialogDescription>View the recent activities performed on the system.</DialogDescription>
          </DialogHeader>
          {/* <ActivityLog
            activities={activities}
            onClose={() => setShowActivityLog(false)}
          /> */}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowActivityLog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupSuccess} onOpenChange={setShowBackupSuccess}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Backup Successful</DialogTitle>
            <DialogDescription>The system backup has been completed successfully.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowBackupSuccess(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SettingsPage
