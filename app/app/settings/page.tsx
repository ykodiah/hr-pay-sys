"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Upload,
  Save,
  Trash2,
  Shield,
  Bell,
  Users,
  Building,
  UserCheck,
  Plus,
  Edit,
  MoreHorizontal,
  Calculator,
  FileText,
  Key,
  Download,
  Mail,
  SettingsIcon,
  CheckCircle,
  Database,
  AlertTriangle,
  RefreshCw,
  Globe,
  CreditCard,
  X,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { CentralDocumentService } from "@/lib/storage/centralDocumentService"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabase = createClientComponentClient()

interface Company {
  id: string
  name: string
  taxId: string
  ssnitNumber: string
  industry: string
  address: string
  phone: string
  email: string
  logo?: string
  status: "active" | "inactive"
  subsidiaries: Subsidiary[]
}

interface Subsidiary {
  id: string
  name: string
  taxId: string
  ssnitNumber: string
  address: string
  phone: string
  email: string
  divisions: string[]
  departments: string[]
  locations: string[]
  logo?: string
  status: "active" | "inactive"
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  companies: string[]
  status: "active" | "inactive"
  lastLogin: string
}

interface CompanySettings {
  name: string
  taxId: string
  ssnitNumber: string
  industry: string
  address: string
  phone: string
  email: string
  logo?: string
}

interface PayrollSettings {
  frequency: string
  currency: string
  minWage: number
  overtimeRate: number
  autoPaye: boolean
  autoSsnit: boolean
  autoProvident: boolean
  payrollCutoffDay: number
  payrollProcessingDay: number
}

interface HRSettings {
  leaveYearStart: string
  annualLeaveDays: number
  sickLeaveDays: number
  probationPeriod: number
  autoApproveLeave: boolean
  emailNotifications: boolean
  workingHoursPerDay: number
  workingDaysPerWeek: number
}

interface SecuritySettings {
  twoFactor: boolean
  sessionTimeout: boolean
  timeoutDuration: number
  auditLog: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
}

interface NotificationSettings {
  payrollAlerts: boolean
  leaveAlerts: boolean
  employeeAlerts: boolean
  systemAlerts: boolean
  notificationEmail: string
  smsNotifications: boolean
  webhookUrl?: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([
    {
      id: "1",
      name: "Akwaaba Technologies Ltd",
      taxId: "C0012345678",
      ssnitNumber: "1234567890",
      industry: "technology",
      address: "123 Liberation Road, Labone, Accra, Ghana",
      phone: "+233 30 123 4567",
      email: "info@akwaabatech.com",
      status: "active",
      subsidiaries: [
        {
          id: "1",
          name: "Akwaaba Tech Solutions",
          taxId: "T0012345678",
          ssnitNumber: "S1234567890",
          address: "456 Independence Ave, Ridge, Accra",
          phone: "+233 30 234 5678",
          email: "tech@akwaabatech.com",
          divisions: ["IT", "Support"],
          departments: ["Development", "Customer Service"],
          locations: ["Accra", "Tema"],
          status: "active",
        },
        {
          id: "2",
          name: "Akwaaba Consulting",
          taxId: "T0087654321",
          ssnitNumber: "S0987654321",
          address: "789 Airport Road, Kumasi",
          phone: "+233 32 245 6789",
          email: "consulting@akwaabatech.com",
          divisions: ["Consulting", "Training"],
          departments: ["Management", "Sales"],
          locations: ["Kumasi", "Sunyani"],
          status: "active",
        },
      ],
    },
  ])

  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Super Admin",
      description: "Full system access",
      permissions: ["all"],
      userCount: 1,
      isSystem: true,
    },
    {
      id: "2",
      name: "HR Manager",
      description: "HR operations management",
      permissions: ["hr.manage", "payroll.view", "employees.manage"],
      userCount: 3,
      isSystem: true,
    },
    {
      id: "3",
      name: "Payroll Manager",
      description: "Payroll processing",
      permissions: ["payroll.manage", "employees.view"],
      userCount: 2,
      isSystem: true,
    },
    {
      id: "4",
      name: "Employee",
      description: "Self-service access",
      permissions: ["profile.view", "payslips.view", "leave.request"],
      userCount: 45,
      isSystem: true,
    },
  ])

  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@akwaabatech.com",
      role: "Super Admin",
      companies: ["1"],
      status: "active",
      lastLogin: "2024-01-15 09:30",
    },
    {
      id: "2",
      name: "HR Manager",
      email: "hr@akwaabatech.com",
      role: "HR Manager",
      companies: ["1"],
      status: "active",
      lastLogin: "2024-01-15 08:45",
    },
  ])

  const [selectedCompany, setSelectedCompany] = useState<Company>(companies[0])
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "Akwaaba Technologies Ltd",
    taxId: "C0012345678",
    ssnitNumber: "1234567890",
    industry: "technology",
    address: "123 Liberation Road, Labone, Accra, Ghana",
    phone: "+233 30 123 4567",
    email: "info@akwaabatech.com",
  })

  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({
    frequency: "monthly",
    currency: "ghs",
    minWage: 18.15,
    overtimeRate: 1.5,
    autoPaye: true,
    autoSsnit: true,
    autoProvident: true,
    payrollCutoffDay: 25,
    payrollProcessingDay: 28,
  })

  const [hrSettings, setHRSettings] = useState<HRSettings>({
    leaveYearStart: "january",
    annualLeaveDays: 21,
    sickLeaveDays: 10,
    probationPeriod: 3,
    autoApproveLeave: false,
    emailNotifications: true,
    workingHoursPerDay: 8,
    workingDaysPerWeek: 5,
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactor: false,
    sessionTimeout: true,
    timeoutDuration: 30,
    auditLog: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
    },
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    payrollAlerts: true,
    leaveAlerts: true,
    employeeAlerts: false,
    systemAlerts: true,
    notificationEmail: "admin@akwaabatech.com",
    smsNotifications: false,
  })

  const [subsidiaryFunctionActive, setSubsidiaryFunctionActive] = useState(false)
  const [showSubsidiaryDialog, setShowSubsidiaryDialog] = useState(false)
  const [subsidiaryForm, setSubsidiaryForm] = useState({
    name: "",
    taxId: "",
    ssnitNumber: "",
    address: "",
    phone: "",
    email: "",
    divisions: [""],
    departments: [""],
    locations: [""],
    logo: null as File | null,
  })

  const addDivision = () => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      divisions: [...prev.divisions, ""],
    }))
  }

  const removeDivision = (index: number) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      divisions: prev.divisions.filter((_, i) => i !== index),
    }))
  }

  const updateDivision = (index: number, value: string) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      divisions: prev.divisions.map((div, i) => (i === index ? value : div)),
    }))
  }

  const addDepartment = () => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      departments: [...prev.departments, ""],
    }))
  }

  const removeDepartment = (index: number) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }))
  }

  const updateDepartment = (index: number, value: string) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      departments: prev.departments.map((dept, i) => (i === index ? value : dept)),
    }))
  }

  const addLocation = () => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      locations: [...prev.locations, ""],
    }))
  }

  const removeLocation = (index: number) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    }))
  }

  const updateLocation = (index: number, value: string) => {
    setSubsidiaryForm((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, i) => (i === index ? value : loc)),
    }))
  }

  const handleSubsidiarySubmit = async () => {
    try {
      const { data, error } = await supabase.from("subsidiaries").insert([
        {
          name: subsidiaryForm.name,
          tax_id: subsidiaryForm.taxId,
          ssnit_number: subsidiaryForm.ssnitNumber,
          address: subsidiaryForm.address,
          phone: subsidiaryForm.phone,
          email: subsidiaryForm.email,
          divisions: subsidiaryForm.divisions.filter((d) => d.trim()),
          departments: subsidiaryForm.departments.filter((d) => d.trim()),
          locations: subsidiaryForm.locations.filter((l) => l.trim()),
          logo: subsidiaryForm.logo ? await uploadLogo(subsidiaryForm.logo) : null,
          status: "active",
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Subsidiary added successfully!",
      })

      setShowSubsidiaryDialog(false)
      setSubsidiaryForm({
        name: "",
        taxId: "",
        ssnitNumber: "",
        address: "",
        phone: "",
        email: "",
        divisions: [""],
        departments: [""],
        locations: [""],
        logo: null,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subsidiary. Please try again.",
        variant: "destructive",
      })
    }
  }

  const uploadLogo = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `subsidiary-logos/${fileName}`

    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from("documents").getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSettings = () => {
    // Reset to default values
    setHasUnsavedChanges(false)
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    })
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const documentService = CentralDocumentService.getInstance()

      try {
        const documentId = await documentService.uploadDocument({
          file,
          documentType: "company-logo",
          source: "settings",
          uploadedBy: "Admin",
          notes: "Company logo upload",
        })

        console.log("[v0] Company logo uploaded to vault:", documentId)

        // Update UI state
        setCompanySettings((prev) => ({
          ...prev,
          logo: URL.createObjectURL(file),
        }))
      } catch (error) {
        console.error("[v0] Logo upload failed:", error)
      }
    }
  }

  const updateCompanySettings = (field: keyof CompanySettings, value: string) => {
    setCompanySettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updatePayrollSettings = (field: keyof PayrollSettings, value: any) => {
    setPayrollSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updateHRSettings = (field: keyof HRSettings, value: any) => {
    setHRSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updateSecuritySettings = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const updateNotificationSettings = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your system configuration and preferences</p>
        </div>
        {hasUnsavedChanges && (
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="multi-company">Multi-Company</TabsTrigger>
          <TabsTrigger value="rbac">Roles & Access</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="multi-company" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Multi-Company Management</h2>
              <p className="text-gray-600">Manage multiple companies and subsidiaries</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="subsidiary-function"
                  checked={subsidiaryFunctionActive}
                  onCheckedChange={setSubsidiaryFunctionActive}
                />
                <Label htmlFor="subsidiary-function" className="text-sm font-medium">
                  Activate Subsidiary Function
                </Label>
              </div>
              {subsidiaryFunctionActive && (
                <Dialog open={showSubsidiaryDialog} onOpenChange={setShowSubsidiaryDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subsidiary
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Subsidiary</DialogTitle>
                      <p className="text-sm text-gray-600">Create a new subsidiary with comprehensive details</p>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Name of Subsidiary *</Label>
                            <Input
                              placeholder="Enter subsidiary name"
                              value={subsidiaryForm.name}
                              onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tax ID / TIN *</Label>
                            <Input
                              placeholder="Enter tax ID"
                              value={subsidiaryForm.taxId}
                              onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, taxId: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>SSNIT Employer Number *</Label>
                            <Input
                              placeholder="Enter SSNIT number"
                              value={subsidiaryForm.ssnitNumber}
                              onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, ssnitNumber: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number *</Label>
                            <Input
                              placeholder="+233 XX XXX XXXX"
                              value={subsidiaryForm.phone}
                              onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Email Address *</Label>
                            <Input
                              type="email"
                              placeholder="subsidiary@company.com"
                              value={subsidiaryForm.email}
                              onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Address *</Label>
                            <Input
                              placeholder="Full address"
                              value={subsidiaryForm.address}
                              onChange={(e) => setSubsidiaryForm((prev) => ({ ...prev, address: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Organizational Structure</h3>

                        {/* Divisions/Branches */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Division / Branch</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addDivision}>
                              <Plus className="w-3 h-3 mr-1" />
                              Add Division
                            </Button>
                          </div>
                          {subsidiaryForm.divisions.map((division, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                placeholder="Enter division/branch name"
                                value={division}
                                onChange={(e) => updateDivision(index, e.target.value)}
                              />
                              {subsidiaryForm.divisions.length > 1 && (
                                <Button type="button" variant="outline" size="sm" onClick={() => removeDivision(index)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Departments */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Department</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addDepartment}>
                              <Plus className="w-3 h-3 mr-1" />
                              Add Department
                            </Button>
                          </div>
                          {subsidiaryForm.departments.map((department, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                placeholder="Enter department name"
                                value={department}
                                onChange={(e) => updateDepartment(index, e.target.value)}
                              />
                              {subsidiaryForm.departments.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDepartment(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Locations */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Location</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                              <Plus className="w-3 h-3 mr-1" />
                              Add Location
                            </Button>
                          </div>
                          {subsidiaryForm.locations.map((location, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                placeholder="Enter location"
                                value={location}
                                onChange={(e) => updateLocation(index, e.target.value)}
                              />
                              {subsidiaryForm.locations.length > 1 && (
                                <Button type="button" variant="outline" size="sm" onClick={() => removeLocation(index)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Branding</h3>
                        <div className="space-y-2">
                          <Label>Subsidiary Logo</Label>
                          <div className="flex items-center space-x-4">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setSubsidiaryForm((prev) => ({
                                  ...prev,
                                  logo: e.target.files?.[0] || null,
                                }))
                              }
                              className="flex-1"
                            />
                            {subsidiaryForm.logo && (
                              <div className="flex items-center space-x-2 text-sm text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Logo selected</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Upload a logo for this subsidiary (PNG, JPG, or SVG format)
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowSubsidiaryDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubsidiarySubmit}
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={!subsidiaryForm.name || !subsidiaryForm.taxId || !subsidiaryForm.ssnitNumber}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Subsidiary
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {companies.map((company) => (
              <Card key={company.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-emerald-600" />
                      <div>
                        <CardTitle>{company.name}</CardTitle>
                        <p className="text-sm text-gray-600">{company.email}</p>
                      </div>
                    </div>
                    <Badge variant={company.status === "active" ? "default" : "secondary"}>{company.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Tax ID</Label>
                      <p className="text-sm text-gray-600">{company.taxId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">SSNIT Number</Label>
                      <p className="text-sm text-gray-600">{company.ssnitNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Industry</Label>
                      <p className="text-sm text-gray-600 capitalize">{company.industry}</p>
                    </div>
                  </div>

                  {subsidiaryFunctionActive && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Subsidiaries ({company.subsidiaries.length})</Label>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          {company.subsidiaries.map((subsidiary) => (
                            <div key={subsidiary.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{subsidiary.name}</p>
                                  <p className="text-xs text-gray-600">{subsidiary.locations.join(", ")}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {subsidiary.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rbac" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Roles & Access Control</h2>
              <p className="text-gray-600">Manage user roles and permissions</p>
            </div>
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role Name *</Label>
                      <Input placeholder="Enter role name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input placeholder="Enter role description" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium">Employee Management</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="emp-view" />
                            <Label htmlFor="emp-view" className="text-sm">
                              View Employees
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="emp-create" />
                            <Label htmlFor="emp-create" className="text-sm">
                              Create Employees
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="emp-edit" />
                            <Label htmlFor="emp-edit" className="text-sm">
                              Edit Employees
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Payroll Management</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="payroll-view" />
                            <Label htmlFor="payroll-view" className="text-sm">
                              View Payroll
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="payroll-process" />
                            <Label htmlFor="payroll-process" className="text-sm">
                              Process Payroll
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="payroll-approve" />
                            <Label htmlFor="payroll-approve" className="text-sm">
                              Approve Payroll
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create Role</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{role.name}</h3>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{role.userCount} users</p>
                        <p className="text-xs text-gray-600">{role.permissions.length} permissions</p>
                      </div>
                      {!role.isSystem && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-gray-600">Manage system users and their access</p>
            </div>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input placeholder="Enter full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input type="email" placeholder="Enter email address" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Access</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select companies" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create User</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.role}</p>
                        <p className="text-xs text-gray-600">Last login: {user.lastLogin}</p>
                      </div>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deactivate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      value={companySettings.name}
                      onChange={(e) => updateCompanySettings("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">Tax ID / TIN *</Label>
                    <Input
                      id="tax-id"
                      value={companySettings.taxId}
                      onChange={(e) => updateCompanySettings("taxId", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssnit-number">SSNIT Employer Number *</Label>
                    <Input
                      id="ssnit-number"
                      value={companySettings.ssnitNumber}
                      onChange={(e) => updateCompanySettings("ssnitNumber", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={companySettings.industry}
                      onValueChange={(value) => updateCompanySettings("industry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Company Address</Label>
                  <Textarea
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => updateCompanySettings("address", e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => updateCompanySettings("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => updateCompanySettings("email", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span>Company Logo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {companySettings.logo ? (
                    <div className="relative">
                      <img
                        src={companySettings.logo || "/placeholder.svg"}
                        alt="Company Logo"
                        className="w-32 h-32 object-contain border rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() => updateCompanySettings("logo", "")}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="text-center">
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" className="bg-transparent">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG up to 2MB
                      <br />
                      Recommended: 200x200px
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <span>Payroll Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay-frequency">Pay Frequency</Label>
                    <Select
                      value={payrollSettings.frequency}
                      onValueChange={(value) => updatePayrollSettings("frequency", value)}
                    >
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
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={payrollSettings.currency}
                      onValueChange={(value) => updatePayrollSettings("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghs">Ghana Cedis (GHS)</SelectItem>
                        <SelectItem value="usd">US Dollar (USD)</SelectItem>
                        <SelectItem value="eur">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-wage">Minimum Wage (GHS)</Label>
                    <Input
                      id="min-wage"
                      type="number"
                      value={payrollSettings.minWage}
                      onChange={(e) => updatePayrollSettings("minWage", Number.parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime-rate">Overtime Rate Multiplier</Label>
                    <Input
                      id="overtime-rate"
                      type="number"
                      value={payrollSettings.overtimeRate}
                      onChange={(e) => updatePayrollSettings("overtimeRate", Number.parseFloat(e.target.value) || 0)}
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cutoff-day">Payroll Cutoff Day</Label>
                    <Input
                      id="cutoff-day"
                      type="number"
                      value={payrollSettings.payrollCutoffDay}
                      onChange={(e) => updatePayrollSettings("payrollCutoffDay", Number.parseInt(e.target.value) || 1)}
                      min="1"
                      max="31"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processing-day">Processing Day</Label>
                    <Input
                      id="processing-day"
                      type="number"
                      value={payrollSettings.payrollProcessingDay}
                      onChange={(e) =>
                        updatePayrollSettings("payrollProcessingDay", Number.parseInt(e.target.value) || 1)
                      }
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-paye">Auto-calculate PAYE</Label>
                    <Switch
                      id="auto-paye"
                      checked={payrollSettings.autoPaye}
                      onCheckedChange={(checked) => updatePayrollSettings("autoPaye", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-ssnit">Auto-calculate SSNIT</Label>
                    <Switch
                      id="auto-ssnit"
                      checked={payrollSettings.autoSsnit}
                      onCheckedChange={(checked) => updatePayrollSettings("autoSsnit", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-provident">Auto-calculate Provident Fund (Tier 3)</Label>
                    <Switch
                      id="auto-provident"
                      checked={payrollSettings.autoProvident}
                      onCheckedChange={(checked) => updatePayrollSettings("autoProvident", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Tax Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">PAYE Tax Bands</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>0% on first GHS 4,380</div>
                      <div>5% on next GHS 1,000</div>
                      <div>10% on next GHS 2,000</div>
                      <div>17.5% on next GHS 20,000</div>
                      <div>25% on next GHS 20,000</div>
                      <div>30% on remaining amount</div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">SSNIT Rates</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Employee: 5.5%</div>
                      <div>Employer: 13%</div>
                      <div>Total: 18.5%</div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Tier 3 Rates</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Employee: 5%</div>
                      <div>Employer: 5%</div>
                      <div>Total: 10%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hr" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>HR Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave-year">Leave Year Start</Label>
                    <Select
                      value={hrSettings.leaveYearStart}
                      onValueChange={(value) => updateHRSettings("leaveYearStart", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                        <SelectItem value="october">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="probation">Probation Period (months)</Label>
                    <Input
                      id="probation"
                      type="number"
                      value={hrSettings.probationPeriod}
                      onChange={(e) => updateHRSettings("probationPeriod", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annual-leave">Annual Leave Days</Label>
                    <Input
                      id="annual-leave"
                      type="number"
                      value={hrSettings.annualLeaveDays}
                      onChange={(e) => updateHRSettings("annualLeaveDays", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sick-leave">Sick Leave Days</Label>
                    <Input
                      id="sick-leave"
                      type="number"
                      value={hrSettings.sickLeaveDays}
                      onChange={(e) => updateHRSettings("sickLeaveDays", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="working-hours">Working Hours/Day</Label>
                    <Input
                      id="working-hours"
                      type="number"
                      value={hrSettings.workingHoursPerDay}
                      onChange={(e) => updateHRSettings("workingHoursPerDay", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="working-days">Working Days/Week</Label>
                    <Input
                      id="working-days"
                      type="number"
                      value={hrSettings.workingDaysPerWeek}
                      onChange={(e) => updateHRSettings("workingDaysPerWeek", Number.parseInt(e.target.value) || 0)}
                      min="1"
                      max="7"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-approve">Auto-approve leave requests</Label>
                      <p className="text-sm text-gray-500">Automatically approve requests within policy</p>
                    </div>
                    <Switch
                      id="auto-approve"
                      checked={hrSettings.autoApproveLeave}
                      onCheckedChange={(checked) => updateHRSettings("autoApproveLeave", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email notifications</Label>
                      <p className="text-sm text-gray-500">Send email updates for HR activities</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={hrSettings.emailNotifications}
                      onCheckedChange={(checked) => updateHRSettings("emailNotifications", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Leave Policies</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Annual Leave</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Accrual: 1.75 days per month</div>
                      <div>Max carry over: 5 days</div>
                      <div>Notice period: 2 weeks</div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Sick Leave</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Medical certificate: After 3 days</div>
                      <div>Max consecutive: 30 days</div>
                      <div>Paid: 100% for first 10 days</div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Maternity/Paternity</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Maternity: 12 weeks</div>
                      <div>Paternity: 2 weeks</div>
                      <div>Notice: 4 weeks before</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <Switch
                    id="two-factor"
                    checked={securitySettings.twoFactor}
                    onCheckedChange={(checked) => updateSecuritySettings("twoFactor", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                    <p className="text-sm text-gray-500">Automatically log out inactive users</p>
                  </div>
                  <Switch
                    id="session-timeout"
                    checked={securitySettings.sessionTimeout}
                    onCheckedChange={(checked) => updateSecuritySettings("sessionTimeout", checked)}
                  />
                </div>
                {securitySettings.sessionTimeout && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
                    <Select
                      value={securitySettings.timeoutDuration.toString()}
                      onValueChange={(value) => updateSecuritySettings("timeoutDuration", Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audit-log">Audit Logging</Label>
                    <p className="text-sm text-gray-500">Track all system activities</p>
                  </div>
                  <Switch
                    id="audit-log"
                    checked={securitySettings.auditLog}
                    onCheckedChange={(checked) => updateSecuritySettings("auditLog", checked)}
                  />
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Key className="w-4 h-4 mr-2" />
                    Change Admin Password
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download Security Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-emerald-600" />
                  <span>Password Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min-length">Minimum Length</Label>
                  <Input
                    id="min-length"
                    type="number"
                    value={securitySettings.passwordPolicy.minLength}
                    onChange={(e) =>
                      updateSecuritySettings("passwordPolicy", {
                        ...securitySettings.passwordPolicy,
                        minLength: Number.parseInt(e.target.value) || 8,
                      })
                    }
                    min="6"
                    max="20"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-uppercase">Require Uppercase Letters</Label>
                    <Switch
                      id="require-uppercase"
                      checked={securitySettings.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) =>
                        updateSecuritySettings("passwordPolicy", {
                          ...securitySettings.passwordPolicy,
                          requireUppercase: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-numbers">Require Numbers</Label>
                    <Switch id="require-numbers" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-numbers">Require Numbers</Label>
                    <Switch
                      id="require-numbers"
                      checked={securitySettings.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) =>
                        updateSecuritySettings("passwordPolicy", {
                          ...securitySettings.passwordPolicy,
                          requireNumbers: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-symbols">Require Symbols</Label>
                    <Switch
                      id="require-symbols"
                      checked={securitySettings.passwordPolicy.requireSymbols}
                      onCheckedChange={(checked) =>
                        updateSecuritySettings("passwordPolicy", {
                          ...securitySettings.passwordPolicy,
                          requireSymbols: checked,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Password Strength Preview</Label>
                  <div className="mt-2">
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">Strong password policy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <span>Notification Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payroll-alerts">Payroll Processing Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified about payroll status</p>
                  </div>
                  <Switch
                    id="payroll-alerts"
                    checked={notificationSettings.payrollAlerts}
                    onCheckedChange={(checked) => updateNotificationSettings("payrollAlerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="leave-alerts">Leave Request Alerts</Label>
                    <p className="text-sm text-gray-500">New leave requests and approvals</p>
                  </div>
                  <Switch
                    id="leave-alerts"
                    checked={notificationSettings.leaveAlerts}
                    onCheckedChange={(checked) => updateNotificationSettings("leaveAlerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="employee-alerts">Employee Updates</Label>
                    <p className="text-sm text-gray-500">New employees and profile changes</p>
                  </div>
                  <Switch
                    id="employee-alerts"
                    checked={notificationSettings.employeeAlerts}
                    onCheckedChange={(checked) => updateNotificationSettings("employeeAlerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-alerts">System Maintenance</Label>
                    <p className="text-sm text-gray-500">Scheduled maintenance and updates</p>
                  </div>
                  <Switch
                    id="system-alerts"
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => updateNotificationSettings("systemAlerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Send critical alerts via SMS</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => updateNotificationSettings("smsNotifications", checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    value={notificationSettings.notificationEmail}
                    onChange={(e) => updateNotificationSettings("notificationEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    value={notificationSettings.webhookUrl || ""}
                    onChange={(e) => updateNotificationSettings("webhookUrl", e.target.value)}
                    placeholder="https://your-app.com/webhook"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  <span>Email Templates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Welcome Email</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Sent to new employees</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Payslip Notification</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Monthly payslip availability</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Leave Approval</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Leave request status updates</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Password Reset</Label>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Password reset instructions</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5 text-emerald-600" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">System Health</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Excellent
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Backup</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    2 days ago
                  </Badge>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run System Check
                </Button>
              </CardContent>
            </Card>

            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span>Integrations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Email Service</p>
                      <p className="text-sm text-gray-500">SMTP configuration</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Payment Gateway</p>
                      <p className="text-sm text-gray-500">For salary payments</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-gray-600">
                    Not Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Document Storage</p>
                      <p className="text-sm text-gray-500">Cloud file storage</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  Manage Integrations
                </Button>
              </CardContent>
            </Card>

            {/* Backup & Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Backup & Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backup">Automatic Backups</Label>
                    <p className="text-sm text-gray-500">Daily system backups</p>
                  </div>
                  <Switch id="auto-backup" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-time">Backup Time</Label>
                  <Select defaultValue="02:00">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00:00">12:00 AM</SelectItem>
                      <SelectItem value="02:00">2:00 AM</SelectItem>
                      <SelectItem value="04:00">4:00 AM</SelectItem>
                      <SelectItem value="06:00">6:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Backup Retention (days)</Label>
                  <Input id="retention" type="number" defaultValue="30" />
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Database className="w-4 h-4 mr-2" />
                    Create Manual Backup
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restore from Backup
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Last Backup:</strong> January 13, 2025 at 2:00 AM
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Size: 2.4 GB • Status: Successful</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
