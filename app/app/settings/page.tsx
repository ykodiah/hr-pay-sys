"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle,
  Download,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface CompanyProfile {
  name: string
  taxId: string
  ssnitNumber: string
  industry: string
  phone: string
  email: string
  address: string
}

interface Subsidiary {
  id: string
  name: string
  employees: number
  status: "active" | "inactive"
  location: string
  description?: string
}

interface LeaveType {
  id: string
  name: string
  annualDays: number
  carryOver: number
}

interface SalaryGrade {
  id: string
  name: string
  minSalary: number
  maxSalary: number
  currency: string
}

interface NotificationPreference {
  key: string
  label: string
  description: string
  enabled: boolean
  channels: string[]
}

interface RoleDefinition {
  id: string
  name: string
  summary: string
  members: number
  permissions: string[]
}

interface AccessControlState {
  enforceMfa: boolean
  sessionTimeoutMinutes: number
  restrictExports: boolean
  ipAllowList: boolean
  geoFence: boolean
}

interface SecurityEvent {
  id: string
  title: string
  severity: "low" | "medium" | "high"
  occurredAt: string
  description: string
  acknowledged?: boolean
}

const defaultCompanyProfile: CompanyProfile = {
  name: "Akwaaba HR Services",
  taxId: "GH-TIN-00234892",
  ssnitNumber: "SSNIT-4412456",
  industry: "Professional Services",
  phone: "+233 544 210 987",
  email: "hq@akwaabahr.com",
  address: "14 Independence Ave, Accra, Ghana",
}

const defaultSubsidiaries: Subsidiary[] = [
  {
    id: "sub-1",
    name: "Akwaaba Payroll Services",
    employees: 112,
    status: "active",
    location: "Accra",
    description: "Handles Ghana payroll processing and statutory filings.",
  },
  {
    id: "sub-2",
    name: "Akwaaba Talent",
    employees: 58,
    status: "active",
    location: "Kumasi",
    description: "Regional talent acquisition and onboarding team.",
  },
  {
    id: "sub-3",
    name: "Akwaaba Lite",
    employees: 33,
    status: "inactive",
    location: "Tema",
    description: "Legacy entity winding down after migration to primary platform.",
  },
]

const defaultLeaveTypes: LeaveType[] = [
  { id: "lv-1", name: "Annual Leave", annualDays: 20, carryOver: 10 },
  { id: "lv-2", name: "Sick Leave", annualDays: 15, carryOver: 0 },
  { id: "lv-3", name: "Maternity Leave", annualDays: 90, carryOver: 0 },
]

const defaultSalaryGrades: SalaryGrade[] = [
  { id: "gr-1", name: "Grade A", minSalary: 5500, maxSalary: 9000, currency: "GHS" },
  { id: "gr-2", name: "Grade B", minSalary: 3500, maxSalary: 5200, currency: "GHS" },
  { id: "gr-3", name: "Grade C", minSalary: 2200, maxSalary: 3400, currency: "GHS" },
]

const defaultNotificationPreferences: NotificationPreference[] = [
  {
    key: "payslip",
    label: "Payslip delivery",
    description: "Send employees a notice when their payslip is published.",
    enabled: true,
    channels: ["Email", "SMS"],
  },
  {
    key: "variance",
    label: "Payroll variance alert",
    description: "Notify payroll and HR when net pay changes exceed a threshold.",
    enabled: true,
    channels: ["Email", "Slack"],
  },
  {
    key: "leave",
    label: "Leave workflow",
    description: "Remind managers of approvals, escalations, and employee updates.",
    enabled: true,
    channels: ["Email", "Push"],
  },
  {
    key: "compliance",
    label: "Compliance reminders",
    description: "Chase expiring documents (ID, medicals, work permits).",
    enabled: false,
    channels: ["Email"],
  },
]

const defaultRoles: RoleDefinition[] = [
  {
    id: "role-1",
    name: "Payroll Administrator",
    summary: "Run payroll, manage integrations, approve mass communications.",
    members: 3,
    permissions: ["payroll.run", "communication.manage", "reports.export"],
  },
  {
    id: "role-2",
    name: "HR Business Partner",
    summary: "Handle employee lifecycle updates and approvals.",
    members: 5,
    permissions: ["employee.edit", "leave.approve", "documents.manage"],
  },
  {
    id: "role-3",
    name: "People Manager",
    summary: "Approve leave, review performance goals, view team analytics.",
    members: 48,
    permissions: ["leave.approve", "goals.review", "reports.view"],
  },
]

const defaultAccessControls: AccessControlState = {
  enforceMfa: true,
  sessionTimeoutMinutes: 30,
  restrictExports: true,
  ipAllowList: false,
  geoFence: false,
}

const defaultSecurityEvents: SecurityEvent[] = [
  {
    id: "sec-1",
    title: "Blocked login attempt",
    severity: "low",
    occurredAt: "2025-10-29T09:45:00Z",
    description: "Access attempt from an unlisted IP in Accra was blocked by MFA policy.",
  },
  {
    id: "sec-2",
    title: "Payroll export approval pending",
    severity: "medium",
    occurredAt: "2025-10-28T16:20:00Z",
    description: "Finance requested export of the October net pay register; awaiting second approver.",
  },
  {
    id: "sec-3",
    title: "New device sign-in",
    severity: "high",
    occurredAt: "2025-10-27T21:05:00Z",
    description: "Administrator signed in from a new device in Kumasi. Review session details.",
  },
]

export default function SettingsPage() {
  const { toast } = useToast()

  const [companyProfile, setCompanyProfile] = useState(defaultCompanyProfile)
  const [locations, setLocations] = useState<string[]>(["Accra", "Kumasi", "Takoradi"])
  const [divisions, setDivisions] = useState<string[]>(["Corporate", "Operations", "Finance"])
  const [departments, setDepartments] = useState<string[]>(["Payroll", "Employee Relations", "Compliance"])
  const [newLocation, setNewLocation] = useState("")
  const [newDivision, setNewDivision] = useState("")
  const [newDepartment, setNewDepartment] = useState("")

  const [subsidiaries, setSubsidiaries] = useState(defaultSubsidiaries)
  const [newSubsidiaryName, setNewSubsidiaryName] = useState("")
  const [newSubsidiaryLocation, setNewSubsidiaryLocation] = useState("")
  const [activeSubsidiary, setActiveSubsidiary] = useState<Subsidiary | null>(null)
  const [subsidiaryDialogOpen, setSubsidiaryDialogOpen] = useState(false)
  const [subsidiaryRemoveDialogOpen, setSubsidiaryRemoveDialogOpen] = useState(false)

  const [leaveTypes, setLeaveTypes] = useState(defaultLeaveTypes)
  const [newLeaveName, setNewLeaveName] = useState("")
  const [newLeaveDays, setNewLeaveDays] = useState(10)

  const [salaryGrades, setSalaryGrades] = useState(defaultSalaryGrades)
  const [newGradeName, setNewGradeName] = useState("")
  const [newGradeMin, setNewGradeMin] = useState(2500)
  const [newGradeMax, setNewGradeMax] = useState(4200)

  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences)

  const [roles, setRoles] = useState(defaultRoles)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleDetailDialogOpen, setRoleDetailDialogOpen] = useState(false)
  const [roleDetail, setRoleDetail] = useState<RoleDefinition | null>(null)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleSummary, setNewRoleSummary] = useState("")
  const [newRoleMembers, setNewRoleMembers] = useState(1)

  const [accessControls, setAccessControls] = useState(defaultAccessControls)

  const [securityEvents, setSecurityEvents] = useState(defaultSecurityEvents)

  const totalEmployees = useMemo(
    () => subsidiaries.reduce((sum, subsidiary) => sum + subsidiary.employees, 0),
    [subsidiaries],
  )

  const addValue = (type: "location" | "division" | "department") => {
    const value = type === "location" ? newLocation : type === "division" ? newDivision : newDepartment
    if (!value.trim()) return

    const setter = type === "location" ? setLocations : type === "division" ? setDivisions : setDepartments
    setter((prev) => (prev.includes(value.trim()) ? prev : [...prev, value.trim()]))

    if (type === "location") setNewLocation("")
    if (type === "division") setNewDivision("")
    if (type === "department") setNewDepartment("")
  }

  const handleAddSubsidiary = () => {
    if (!newSubsidiaryName.trim()) {
      toast({ title: "Missing name", description: "Provide a subsidiary name before adding.", variant: "destructive" })
      return
    }

    const subsidiary: Subsidiary = {
      id: `sub-${Date.now()}`,
      name: newSubsidiaryName.trim(),
      employees: 0,
      status: "active",
      location: newSubsidiaryLocation.trim() || "Accra",
      description: "New subsidiary awaiting configuration.",
    }

    setSubsidiaries((prev) => [...prev, subsidiary])
    setNewSubsidiaryName("")
    setNewSubsidiaryLocation("")
    toast({ title: "Subsidiary added", description: `${subsidiary.name} is now available in the workspace.` })
  }

  const toggleSubsidiaryStatus = (id: string) => {
    setSubsidiaries((prev) =>
      prev.map((subsidiary) =>
        subsidiary.id === id
          ? {
              ...subsidiary,
              status: subsidiary.status === "active" ? "inactive" : "active",
            }
          : subsidiary,
      ),
    )
    toast({ title: "Subsidiary updated", description: "Status toggled successfully." })
  }

  const openSubsidiaryDetail = (subsidiary: Subsidiary) => {
    setActiveSubsidiary(subsidiary)
    setSubsidiaryDialogOpen(true)
  }

  const requestSubsidiaryRemoval = (subsidiary: Subsidiary) => {
    setActiveSubsidiary(subsidiary)
    setSubsidiaryRemoveDialogOpen(true)
  }

  const removeSubsidiary = () => {
    if (!activeSubsidiary) return
    setSubsidiaries((prev) => prev.filter((subsidiary) => subsidiary.id !== activeSubsidiary.id))
    toast({
      title: "Subsidiary removed",
      description: `${activeSubsidiary.name} has been removed from the workspace.`,
    })
    setActiveSubsidiary(null)
    setSubsidiaryRemoveDialogOpen(false)
  }

  const addLeaveType = () => {
    if (!newLeaveName.trim()) {
      toast({ title: "Missing leave type", description: "Provide a leave name before adding.", variant: "destructive" })
      return
    }

    setLeaveTypes((prev) => [
      ...prev,
      { id: `lv-${Date.now()}`, name: newLeaveName.trim(), annualDays: newLeaveDays, carryOver: Math.floor(newLeaveDays / 2) },
    ])
    setNewLeaveName("")
    setNewLeaveDays(10)
    toast({ title: "Leave type added", description: "Remember to sync changes with the leave automation journey." })
  }

  const addSalaryGrade = () => {
    if (!newGradeName.trim()) {
      toast({ title: "Missing grade", description: "Provide a grade name before adding.", variant: "destructive" })
      return
    }

    if (newGradeMin >= newGradeMax) {
      toast({ title: "Invalid range", description: "Minimum salary must be lower than maximum.", variant: "destructive" })
      return
    }

    setSalaryGrades((prev) => [
      ...prev,
      { id: `gr-${Date.now()}`, name: newGradeName.trim(), minSalary: newGradeMin, maxSalary: newGradeMax, currency: "GHS" },
    ])
    setNewGradeName("")
    setNewGradeMin(2500)
    setNewGradeMax(4200)
    toast({ title: "Salary grade added", description: "Variance alerts will use this range on next payroll run." })
  }

  const exportSalaryGrade = (grade: SalaryGrade) => {
    toast({ title: "Export queued", description: `${grade.name} range will be exported as CSV.` })
  }

  const resetNotifications = () => {
    setNotificationPreferences(defaultNotificationPreferences)
    toast({ title: "Notification defaults restored" })
  }

  const toggleNotification = (key: string) => {
    setNotificationPreferences((prev) => prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)))
    toast({ title: "Notification updated" })
  }

  const addRole = () => {
    if (!newRoleName.trim() || !newRoleSummary.trim()) {
      toast({ title: "Missing role details", description: "Provide name and summary before saving.", variant: "destructive" })
      return
    }

    const role: RoleDefinition = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      summary: newRoleSummary.trim(),
      members: newRoleMembers,
      permissions: ["custom.permission"],
    }

    setRoles((prev) => [...prev, role])
    setNewRoleName("")
    setNewRoleSummary("")
    setNewRoleMembers(1)
    setRoleDialogOpen(false)
    toast({ title: "Role created", description: `${role.name} now appears in the directory.` })
  }

  const removeRole = (id: string) => {
    setRoles((prev) => prev.filter((role) => role.id !== id))
    toast({ title: "Role removed" })
  }

  const openRoleDetail = (role: RoleDefinition) => {
    setRoleDetail(role)
    setRoleDetailDialogOpen(true)
  }

  const saveAccessControls = () => {
    toast({ title: "Access controls saved", description: "Security policies will refresh for all users within 5 minutes." })
  }

  const resolveSecurityEvent = (id: string) => {
    setSecurityEvents((prev) => prev.filter((event) => event.id !== id))
    toast({ title: "Event acknowledged", description: "Security operations has received the resolution." })
  }

  const downloadSecurityReport = () => {
    toast({ title: "Audit report queued", description: "You will receive an email with the download link shortly." })
  }

  const exportSubsidiaryGuide = (format: "csv" | "pdf") => {
    toast({ title: `Export queued`, description: `Subsidiary onboarding guide will download as ${format.toUpperCase()}.` })
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-2xl">
          Configure company profiles, subsidiaries, HR policies, and security guardrails for the Akwaaba workspace.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Headcount</CardTitle>
              <div className="text-2xl font-semibold text-foreground">{totalEmployees + 312}</div>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> +4.2% vs last quarter
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subsidiaries</CardTitle>
              <div className="text-2xl font-semibold text-foreground">{subsidiaries.length}</div>
              <p className="text-xs text-muted-foreground">Across Greater Accra & Ashanti regions</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Automations</CardTitle>
              <div className="text-2xl font-semibold text-foreground">72%</div>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Coverage improving
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Bell className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security posture</CardTitle>
              <div className="text-2xl font-semibold text-foreground">Low risk</div>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <Shield className="h-3 w-3" /> MFA enforced for admins
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Shield className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
      </section>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="subsidiaries">Multi-Company</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Company profile</CardTitle>
              <CardDescription>Statutory information and primary contact details used across workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company name</Label>
                  <Input
                    id="company-name"
                    value={companyProfile.name}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-industry">Industry</Label>
                  <Input
                    id="company-industry"
                    value={companyProfile.industry}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, industry: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">GRA Tax ID</Label>
                  <Input id="tax-id" value={companyProfile.taxId} onChange={(event) => setCompanyProfile({ ...companyProfile, taxId: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssnit-number">SSNIT number</Label>
                  <Input
                    id="ssnit-number"
                    value={companyProfile.ssnitNumber}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, ssnitNumber: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input id="company-phone" value={companyProfile.phone} onChange={(event) => setCompanyProfile({ ...companyProfile, phone: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input id="company-email" value={companyProfile.email} onChange={(event) => setCompanyProfile({ ...companyProfile, email: event.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-address">Head office address</Label>
                <Textarea
                  id="company-address"
                  value={companyProfile.address}
                  onChange={(event) => setCompanyProfile({ ...companyProfile, address: event.target.value })}
                  rows={3}
                />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Locations</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {locations.map((location) => (
                        <Badge key={location} className="bg-primary/10 text-primary">
                          {location}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Add new location" value={newLocation} onChange={(event) => setNewLocation(event.target.value)} />
                      <Button type="button" onClick={() => addValue("location")}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Divisions</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {divisions.map((division) => (
                        <Badge key={division} className="bg-primary/10 text-primary">
                          {division}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Add new division" value={newDivision} onChange={(event) => setNewDivision(event.target.value)} />
                      <Button type="button" onClick={() => addValue("division")}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {departments.map((department) => (
                        <Badge key={department} className="bg-primary/10 text-primary">
                          {department}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Add new department" value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} />
                      <Button type="button" onClick={() => addValue("department")}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast({ title: "Company profile saved" })}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subsidiaries" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle>Subsidiary overview</CardTitle>
                <CardDescription>Manage regional legal entities and visibility across automation journeys.</CardDescription>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Input
                  placeholder="New subsidiary"
                  value={newSubsidiaryName}
                  onChange={(event) => setNewSubsidiaryName(event.target.value)}
                  className="md:w-52"
                />
                <Input
                  placeholder="Location"
                  value={newSubsidiaryLocation}
                  onChange={(event) => setNewSubsidiaryLocation(event.target.value)}
                  className="md:w-40"
                />
                <Button type="button" onClick={handleAddSubsidiary}>
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subsidiaries.map((subsidiary) => (
                    <TableRow key={subsidiary.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{subsidiary.name}</div>
                        <div className="text-xs text-muted-foreground">Entity ID: {subsidiary.id}</div>
                      </TableCell>
                      <TableCell>{subsidiary.employees}</TableCell>
                      <TableCell>
                        <Badge className={subsidiary.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                          {subsidiary.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" /> {subsidiary.location}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openSubsidiaryDetail(subsidiary)}>
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => toggleSubsidiaryStatus(subsidiary.id)}>
                            <RefreshCw className="h-4 w-4" /> Toggle
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1" onClick={() => requestSubsidiaryRemoval(subsidiary)}>
                            <Trash2 className="h-4 w-4" /> Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Export onboarding guidance for new entities.
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => exportSubsidiaryGuide("csv")}>
                    <Download className="h-4 w-4" /> Download template (CSV)
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => exportSubsidiaryGuide("pdf")}>
                    <Download className="h-4 w-4" /> Download SOP (PDF)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Leave & policy settings</CardTitle>
              <CardDescription>Fine tune paid time off and deliver personalised policy comms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="leave-name">Leave type</Label>
                  <Input
                    id="leave-name"
                    value={newLeaveName}
                    onChange={(event) => setNewLeaveName(event.target.value)}
                    placeholder="Add new leave policy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-days">Annual days</Label>
                  <Input
                    id="leave-days"
                    type="number"
                    min={1}
                    max={210}
                    value={newLeaveDays}
                    onChange={(event) => setNewLeaveDays(Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={addLeaveType}>
                  <Plus className="mr-2 h-4 w-4" /> Add leave type
                </Button>
              </div>
              <div className="grid gap-3">
                {leaveTypes.map((leave) => (
                  <div key={leave.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{leave.name}</p>
                      <p className="text-xs text-muted-foreground">Carry over up to {leave.carryOver} days</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary">{leave.annualDays} days</Badge>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="policy-guidance">Policy guidance</Label>
                <Textarea
                  id="policy-guidance"
                  rows={5}
                  placeholder="Document policy updates, AI guardrails, and employee communications guidance"
                  defaultValue="Ensure managers receive policy digest every Monday at 08:00 GMT. AI Copilot should summarise changes and auto-translate to Twi/Ewe for branch staff."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Salary grade framework</CardTitle>
              <CardDescription>Define the ranges that power variance alerts and template merge fields.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="grade-name">Grade name</Label>
                  <Input id="grade-name" value={newGradeName} onChange={(event) => setNewGradeName(event.target.value)} placeholder="e.g. Grade D" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade-min">Minimum salary (GHS)</Label>
                  <Input
                    id="grade-min"
                    type="number"
                    min={1000}
                    value={newGradeMin}
                    onChange={(event) => setNewGradeMin(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade-max">Maximum salary (GHS)</Label>
                  <Input
                    id="grade-max"
                    type="number"
                    min={newGradeMin + 200}
                    value={newGradeMax}
                    onChange={(event) => setNewGradeMax(Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={addSalaryGrade}>
                  <Plus className="mr-2 h-4 w-4" /> Add salary grade
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>{grade.name}</TableCell>
                      <TableCell>
                        {grade.minSalary.toLocaleString()} ? {grade.maxSalary.toLocaleString()}
                      </TableCell>
                      <TableCell>{grade.currency}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => exportSalaryGrade(grade)}>
                          <Download className="h-4 w-4" /> Export
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Automation notifications</CardTitle>
                <CardDescription>
                  Control the journeys that publish messages across email, SMS, push, and collaboration channels.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={resetNotifications}>
                <RefreshCw className="h-4 w-4" /> Reset to defaults
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationPreferences.map((preference) => (
                <div key={preference.key} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{preference.label}</p>
                    <p className="text-xs text-muted-foreground">{preference.description}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {preference.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="uppercase text-[10px] tracking-wide">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Switch checked={preference.enabled} onCheckedChange={() => toggleNotification(preference.key)} />
                </div>
              ))}
              <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                Tip: Published templates and snippets are managed under Communication &gt; Settings to keep messaging consistent.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Role definitions</CardTitle>
                <CardDescription>Ensure the right teams have the right level of access before activating journeys.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setRoleDialogOpen(true)}>
                <Plus className="h-4 w-4" /> New role
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{role.name}</p>
                    <p className="text-xs text-muted-foreground">{role.summary}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-[10px] uppercase tracking-wide">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary">{role.members} members</Badge>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openRoleDetail(role)}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => removeRole(role.id)}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Access controls</CardTitle>
              <CardDescription>Balance security and usability across Ghanaian and multi-country operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-card/70 p-4">
                <div>
                  <p className="font-medium text-foreground">Enforce MFA</p>
                  <p className="text-xs text-muted-foreground">Require OTP or authenticator for privileged roles.</p>
                </div>
                <Switch checked={accessControls.enforceMfa} onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, enforceMfa: value }))} />
              </div>
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-card/70 p-4">
                <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min={10}
                  max={240}
                  value={accessControls.sessionTimeoutMinutes}
                  onChange={(event) => setAccessControls((prev) => ({ ...prev, sessionTimeoutMinutes: Number(event.target.value) }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-card/70 p-4">
                <div>
                  <p className="font-medium text-foreground">Restrict exports</p>
                  <p className="text-xs text-muted-foreground">Require approval before payroll data leaves the platform.</p>
                </div>
                <Switch checked={accessControls.restrictExports} onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, restrictExports: value }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-card/70 p-4">
                <div>
                  <p className="font-medium text-foreground">IP allow list</p>
                  <p className="text-xs text-muted-foreground">Restrict admin access to head office networks.</p>
                </div>
                <Switch checked={accessControls.ipAllowList} onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, ipAllowList: value }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-card/70 p-4">
                <div>
                  <p className="font-medium text-foreground">Geo fence mobile access</p>
                  <p className="text-xs text-muted-foreground">Block logins from outside ECOWAS countries.</p>
                </div>
                <Switch checked={accessControls.geoFence} onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, geoFence: value }))} />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveAccessControls}>Save policies</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Security centre</CardTitle>
                <CardDescription>Review audit activity, resolve alerts, and download evidence packs.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={downloadSecurityReport}>
                <Download className="h-4 w-4" /> Download audit report
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityEvents.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  All recent security events have been acknowledged.
                </div>
              ) : (
                securityEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-slate-200 bg-card/70 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <BadgeCheck
                          className={
                            event.severity === "high"
                              ? "text-red-600"
                              : event.severity === "medium"
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }
                        />
                        <div>
                          <p className="font-medium text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          event.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : event.severity === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }
                      >
                        {event.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => resolveSecurityEvent(event.id)}>
                        <AlertTriangle className="h-4 w-4" /> Resolve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={subsidiaryDialogOpen} onOpenChange={setSubsidiaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeSubsidiary?.name}</DialogTitle>
            <DialogDescription>Overview of subsidiary details and operational status.</DialogDescription>
          </DialogHeader>
          {activeSubsidiary && (
            <div className="space-y-3 text-sm text-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employees</span>
                <span>{activeSubsidiary.employees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span>{activeSubsidiary.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{activeSubsidiary.status === "active" ? "Active" : "Inactive"}</span>
              </div>
              <Separator />
              <p className="text-muted-foreground">{activeSubsidiary.description}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubsidiaryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subsidiaryRemoveDialogOpen} onOpenChange={setSubsidiaryRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove subsidiary</DialogTitle>
            <DialogDescription>
              This will hide the entity from selectors and automation scopes. Historical records stay available for audit.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove {activeSubsidiary?.name}? You can re-create it later if needed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSubsidiaryRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={removeSubsidiary}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>Provision a new permission set for the Akwaaba workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input id="role-name" value={newRoleName} onChange={(event) => setNewRoleName(event.target.value)} placeholder="e.g. Communication Editor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-summary">Summary</Label>
              <Textarea
                id="role-summary"
                value={newRoleSummary}
                onChange={(event) => setNewRoleSummary(event.target.value)}
                rows={3}
                placeholder="Describe the responsibilities for this role"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-members">Current members</Label>
              <Input
                id="role-members"
                type="number"
                min={0}
                value={newRoleMembers}
                onChange={(event) => setNewRoleMembers(Number(event.target.value))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addRole}>Save role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDetailDialogOpen} onOpenChange={setRoleDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{roleDetail?.name}</DialogTitle>
            <DialogDescription>Permission summary for this role.</DialogDescription>
          </DialogHeader>
          {roleDetail && (
            <div className="space-y-3 text-sm text-foreground">
              <p className="text-muted-foreground">{roleDetail.summary}</p>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {roleDetail.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-[10px] uppercase tracking-wide">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

