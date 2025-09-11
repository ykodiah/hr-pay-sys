"use client"
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
  X,
  Eye,
  Edit,
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

const isDemoMode = () => {
  if (typeof window !== "undefined") {
    const demoSession = document.cookie.includes("demo-session=active")
    const demoProfile = localStorage.getItem("demo_profile")
    return demoSession || !!demoProfile
  }
  return false
}

const SettingsPage: FunctionComponent = () => {
  console.log("[v0] SettingsPage component initializing...")

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

  // Dialog states
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

  // Load functions
  const loadCompanyData = async () => {
    console.log("[v0] Loading company data...")

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
          first_name: "John",
          last_name: "Doe",
          full_name: "John Doe",
          corporate_email: "john.doe@akwaaba.com",
          personal_email: "john.doe@gmail.com",
          position: "Software Engineer",
          department: "Technology",
          status: "active",
        },
        {
          id: "emp-002",
          first_name: "Jane",
          last_name: "Smith",
          full_name: "Jane Smith",
          corporate_email: "jane.smith@akwaaba.com",
          personal_email: "jane.smith@gmail.com",
          position: "HR Manager",
          department: "Human Resources",
          status: "active",
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
          divisions: ["Development", "Support"],
          departments: ["Engineering", "QA", "DevOps"],
          locations: ["Accra", "Kumasi"],
          divisions_count: 2,
          departments_count: 3,
          locations_count: 2,
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
          description: "Full system access and management capabilities",
          permissions: ["all"],
          user_count: 2,
        },
        {
          id: "role-002",
          name: "HR Manager",
          description: "Human resources management and employee oversight",
          permissions: ["hr", "employees", "reports"],
          user_count: 3,
        },
        {
          id: "role-003",
          name: "Employee",
          description: "Standard employee access to personal information",
          permissions: ["profile", "payslip", "leave"],
          user_count: 45,
        },
      ])
      return
    }

    try {
      const { data, error } = await supabase.from("roles").select("*").order("created_at", { ascending: false })

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

  const loadAllData = async () => {
    console.log("[v0] Loading all settings data...")
    try {
      await Promise.all([loadCompanyData(), loadEmployees(), loadSubsidiaries(), loadRoles()])
      console.log("[v0] All settings data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading settings data:", error)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your organization settings and configurations</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="subsidiaries">Multi-Company</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Company Settings</span>
              </CardTitle>
              <CardDescription>Manage your company information and organizational structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={companyData.industry}
                    onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={companyData.tax_id}
                    onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                  <Input
                    id="ssnitNumber"
                    value={companyData.ssnit_number}
                    onChange={(e) => setCompanyData({ ...companyData, ssnit_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email_address}
                    onChange={(e) => setCompanyData({ ...companyData, email_address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={companyData.phone_number}
                    onChange={(e) => setCompanyData({ ...companyData, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Departments</Label>
                  <div className="space-y-2">
                    {departments.map((dept, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={dept}
                          onChange={(e) => {
                            const newDepts = [...departments]
                            newDepts[index] = e.target.value
                            setDepartments(newDepts)
                          }}
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
                </div>

                <div>
                  <Label>Locations</Label>
                  <div className="space-y-2">
                    {locations.map((location, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={location}
                          onChange={(e) => {
                            const newLocations = [...locations]
                            newLocations[index] = e.target.value
                            setLocations(newLocations)
                          }}
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
              </div>

              <div className="flex justify-end">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Save Company Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Company Management */}
        <TabsContent value="subsidiaries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Multi-Company Management</span>
                </div>
                <Button onClick={() => setShowSubsidiaryDialog(true)}>Add Subsidiary</Button>
              </CardTitle>
              <CardDescription>Manage subsidiary companies and their organizational structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subsidiaries.map((subsidiary) => (
                  <div key={subsidiary.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{subsidiary.name}</h3>
                        <p className="text-sm text-gray-600">{subsidiary.industry}</p>
                        <p className="text-sm text-gray-500">{subsidiary.address}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setViewingSubsidiary(subsidiary)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingSubsidiary(subsidiary)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HR Settings */}
        <TabsContent value="hr">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>HR Settings</span>
              </CardTitle>
              <CardDescription>Configure human resources policies and employee management settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Leave Policies</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Annual Leave</span>
                      <span className="text-sm text-gray-600">21 days</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Sick Leave</span>
                      <span className="text-sm text-gray-600">10 days</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Maternity Leave</span>
                      <span className="text-sm text-gray-600">84 days</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Leave Types
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Employee Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Total Employees</span>
                      <span className="font-semibold">{employees.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Active Employees</span>
                      <span className="font-semibold">{employees.filter((emp) => emp.status === "active").length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Departments</span>
                      <span className="font-semibold">{departments.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Settings */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Payroll Settings</span>
              </CardTitle>
              <CardDescription>Configure payroll calculations, allowances, and deductions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Allowances</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Transport Allowance</span>
                      <span className="text-sm text-gray-600">₵200.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Housing Allowance</span>
                      <span className="text-sm text-gray-600">15%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Meal Allowance</span>
                      <span className="text-sm text-gray-600">₵150.00</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Allowances
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>SSNIT (Employee)</span>
                      <span className="text-sm text-gray-600">5.5%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Income Tax</span>
                      <span className="text-sm text-gray-600">Variable</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Staff Loan</span>
                      <span className="text-sm text-gray-600">₵500.00</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Deductions
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Salary Grades</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Grade</th>
                        <th className="border border-gray-300 p-2 text-left">Step 1</th>
                        <th className="border border-gray-300 p-2 text-left">Step 2</th>
                        <th className="border border-gray-300 p-2 text-left">Step 3</th>
                        <th className="border border-gray-300 p-2 text-left">Step 4</th>
                        <th className="border border-gray-300 p-2 text-left">Step 5</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">Junior Level</td>
                        <td className="border border-gray-300 p-2">₵2,500</td>
                        <td className="border border-gray-300 p-2">₵2,750</td>
                        <td className="border border-gray-300 p-2">₵3,000</td>
                        <td className="border border-gray-300 p-2">₵3,250</td>
                        <td className="border border-gray-300 p-2">₵3,500</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Mid Level</td>
                        <td className="border border-gray-300 p-2">₵4,000</td>
                        <td className="border border-gray-300 p-2">₵4,500</td>
                        <td className="border border-gray-300 p-2">₵5,000</td>
                        <td className="border border-gray-300 p-2">₵5,500</td>
                        <td className="border border-gray-300 p-2">₵6,000</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Senior Level</td>
                        <td className="border border-gray-300 p-2">₵7,000</td>
                        <td className="border border-gray-300 p-2">₵8,000</td>
                        <td className="border border-gray-300 p-2">₵9,000</td>
                        <td className="border border-gray-300 p-2">₵10,000</td>
                        <td className="border border-gray-300 p-2">₵11,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm">
                  Manage Salary Grades
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>Configure email templates and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Email Templates</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Welcome Email</span>
                      <p className="text-sm text-gray-600">Welcome to Akwaaba Technologies</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Leave Approval</span>
                      <p className="text-sm text-gray-600">Leave Request Approved</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Payroll Notification</span>
                      <p className="text-sm text-gray-600">Payroll Processed</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Add Email Template
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Notification Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="notificationEmail">Notification Email</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      value="notifications@akwaaba.com"
                      placeholder="Enter notification email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      value="https://api.akwaaba.com/webhooks/notifications"
                      placeholder="Enter webhook URL"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Role Management</span>
                </div>
                <Button onClick={() => setShowEditRoleDialog(true)}>Add Role</Button>
              </CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                        <p className="text-sm text-gray-500">{role.user_count} users assigned</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingItem(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Permissions</DropdownMenuItem>
                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete Role</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Access Control</span>
              </CardTitle>
              <CardDescription>Manage user access permissions and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Permission Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Role</th>
                        <th className="border border-gray-300 p-2 text-center">Dashboard</th>
                        <th className="border border-gray-300 p-2 text-center">Employees</th>
                        <th className="border border-gray-300 p-2 text-center">Payroll</th>
                        <th className="border border-gray-300 p-2 text-center">Reports</th>
                        <th className="border border-gray-300 p-2 text-center">Settings</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">Administrator</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">HR Manager</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">Employee</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Access Restrictions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>IP Address Restrictions</span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Time-based Access</span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Device Restrictions</span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>Configure security policies and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Password Policy</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Minimum Length</span>
                      <span className="font-semibold">8 characters</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Require Special Characters</span>
                      <span className="font-semibold">Yes</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Password Expiry</span>
                      <span className="font-semibold">90 days</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update Policy
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Security Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setShowPasswordChangeDialog(true)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Change Admin Password
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setShowActivityLog(true)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      View Activity Log
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Brain className="h-4 w-4 mr-2" />
                      Download Security Report
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">System Backup</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Last Backup</p>
                    <p className="text-sm text-gray-600">
                      {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsBackingUp(true)}
                    disabled={isBackingUp}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isBackingUp ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Backing Up...
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Backup Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage
