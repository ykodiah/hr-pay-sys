"use client"

import { useMemo, useState } from "react"
import {
  Badge,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
}

interface RoleDefinition {
  key: string
  name: string
  summary: string
  members: number
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
  { id: "sub-1", name: "Akwaaba Payroll Services", employees: 112, status: "active", location: "Accra" },
  { id: "sub-2", name: "Akwaaba Talent", employees: 58, status: "active", location: "Kumasi" },
  { id: "sub-3", name: "Akwaaba Lite", employees: 33, status: "inactive", location: "Tema" },
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
    description: "Send employees a notice when their payslip is published",
    enabled: true,
  },
  {
    key: "payroll-variance",
    label: "Payroll variance alert",
    description: "Alert payroll and HR when net pay changes exceed a threshold",
    enabled: true,
  },
  {
    key: "leave",
    label: "Leave workflow",
    description: "Notify managers of approvals, rejections, and escalations",
    enabled: true,
  },
  {
    key: "compliance",
    label: "Compliance reminders",
    description: "Remind employees about expiring documents and compliance tasks",
    enabled: false,
  },
]

const defaultRoles: RoleDefinition[] = [
  {
    key: "payroll-admin",
    name: "Payroll Administrator",
    summary: "Can run payroll, configure communication channels, and approve mass announcements",
    members: 3,
  },
  {
    key: "hrbp",
    name: "HR Business Partner",
    summary: "Manages employee lifecycle updates and approvals",
    members: 5,
  },
  {
    key: "manager",
    name: "People Manager",
    summary: "Approves leave, manages performance workflows, and views team analytics",
    members: 48,
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

  const [leaveTypes, setLeaveTypes] = useState(defaultLeaveTypes)
  const [newLeaveName, setNewLeaveName] = useState("")
  const [newLeaveDays, setNewLeaveDays] = useState(10)

  const [salaryGrades, setSalaryGrades] = useState(defaultSalaryGrades)
  const [newGradeName, setNewGradeName] = useState("")
  const [newGradeMin, setNewGradeMin] = useState(2500)
  const [newGradeMax, setNewGradeMax] = useState(4200)

  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences)
  const [accessControls, setAccessControls] = useState(defaultAccessControls)
  const [securityEvents] = useState(defaultSecurityEvents)

  const totalEmployees = useMemo(() => subsidiaries.reduce((sum, sub) => sum + sub.employees, 0), [subsidiaries])

  const handleSaveCompanyProfile = () => {
    toast({ title: "Company profile updated" })
  }

  const handleAddValue = (type: "location" | "division" | "department") => {
    const value = type === "location" ? newLocation : type === "division" ? newDivision : newDepartment
    if (!value.trim()) return

    const setter = type === "location" ? setLocations : type === "division" ? setDivisions : setDepartments
    setter((prev) => (prev.includes(value.trim()) ? prev : [...prev, value.trim()]))

    if (type === "location") setNewLocation("")
    if (type === "division") setNewDivision("")
    if (type === "department") setNewDepartment("")
  }

  const toggleSubsidiaryStatus = (id: string) => {
    setSubsidiaries((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: sub.status === "active" ? "inactive" : "active" } : sub)),
    )
  }

  const addSubsidiary = () => {
    if (!newSubsidiaryName.trim()) return
    setSubsidiaries((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}`,
        name: newSubsidiaryName.trim(),
        employees: 0,
        status: "active",
        location: newSubsidiaryLocation.trim() || "Accra",
      },
    ])
    setNewSubsidiaryName("")
    setNewSubsidiaryLocation("")
    toast({ title: "Subsidiary added" })
  }

  const addLeaveType = () => {
    if (!newLeaveName.trim()) return
    setLeaveTypes((prev) => [
      ...prev,
      { id: `lv-${Date.now()}`, name: newLeaveName.trim(), annualDays: newLeaveDays, carryOver: Math.floor(newLeaveDays / 2) },
    ])
    setNewLeaveName("")
    setNewLeaveDays(10)
    toast({ title: "Leave type added" })
  }

  const addSalaryGrade = () => {
    if (!newGradeName.trim()) return
    if (newGradeMin >= newGradeMax) {
      toast({ title: "Invalid range", description: "Minimum salary must be lower than maximum", variant: "destructive" })
      return
    }
    setSalaryGrades((prev) => [
      ...prev,
      { id: `gr-${Date.now()}`, name: newGradeName.trim(), minSalary: newGradeMin, maxSalary: newGradeMax, currency: "GHS" },
    ])
    setNewGradeName("")
    setNewGradeMin(2500)
    setNewGradeMax(4200)
    toast({ title: "Salary grade added" })
  }

  const toggleNotification = (key: string) => {
    setNotificationPreferences((prev) => prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)))
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-2xl">
          Configure company profiles, manage subsidiaries, tune HR & payroll policies, and control access in one workspace.
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
              <CardDescription>Update statutory information and primary contact details.</CardDescription>
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
                  <Input
                    id="tax-id"
                    value={companyProfile.taxId}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, taxId: event.target.value })}
                  />
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
                  <Input
                    id="company-phone"
                    value={companyProfile.phone}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, phone: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    value={companyProfile.email}
                    onChange={(event) => setCompanyProfile({ ...companyProfile, email: event.target.value })}
                  />
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

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Locations</Label>
                  <div className="space-y-2">
                    {locations.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No locations captured yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {locations.map((location) => (
                          <Badge key={location} className="bg-primary/10 text-primary">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={newLocation}
                        onChange={(event) => setNewLocation(event.target.value)}
                        placeholder="Add new location"
                      />
                      <Button type="button" onClick={() => handleAddValue("location")}>Add</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Divisions</Label>
                  <div className="space-y-2">
                    {divisions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No divisions captured yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {divisions.map((division) => (
                          <Badge key={division} className="bg-primary/10 text-primary">
                            {division}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={newDivision}
                        onChange={(event) => setNewDivision(event.target.value)}
                        placeholder="Add new division"
                      />
                      <Button type="button" onClick={() => handleAddValue("division")}>Add</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <div className="space-y-2">
                    {departments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No departments captured yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {departments.map((department) => (
                          <Badge key={department} className="bg-primary/10 text-primary">
                            {department}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={newDepartment}
                        onChange={(event) => setNewDepartment(event.target.value)}
                        placeholder="Add new department"
                      />
                      <Button type="button" onClick={() => handleAddValue("department")}>Add</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompanyProfile}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subsidiaries" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle>Subsidiary overview</CardTitle>
                <CardDescription>Manage regional entities and cross-company visibility.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="New subsidiary"
                  value={newSubsidiaryName}
                  onChange={(event) => setNewSubsidiaryName(event.target.value)}
                  className="w-48"
                />
                <Input
                  placeholder="Location"
                  value={newSubsidiaryLocation}
                  onChange={(event) => setNewSubsidiaryLocation(event.target.value)}
                  className="w-40"
                />
                <Button type="button" onClick={addSubsidiary}>
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
                          <Button size="sm" variant="outline" className="gap-1">
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => toggleSubsidiaryStatus(subsidiary.id)}>
                            <RefreshCw className="h-4 w-4" /> Toggle
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1">
                            <Trash2 className="h-4 w-4" /> Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Export entity configuration for onboarding new subsidiaries.
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> Download template (CSV)
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
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
              <CardDescription>Tune paid time off, approval chains, and policy communications.</CardDescription>
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
                    max={120}
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

              <div className="space-y-2">
                <Label htmlFor="policy-guidance">HR policy guidance</Label>
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
              <CardDescription>Define ranges that feed automation templates and variance alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="grade-name">Grade name</Label>
                  <Input
                    id="grade-name"
                    value={newGradeName}
                    onChange={(event) => setNewGradeName(event.target.value)}
                    placeholder="e.g. Grade D"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade-min">Minimum salary (GHS)</Label>
                  <Input
                    id="grade-min"
                    type="number"
                    value={newGradeMin}
                    min={1000}
                    onChange={(event) => setNewGradeMin(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade-max">Maximum salary (GHS)</Label>
                  <Input
                    id="grade-max"
                    type="number"
                    min={newGradeMin + 100}
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
                        <Button size="sm" variant="outline" className="gap-1">
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
            <CardHeader>
              <CardTitle>Automation notifications</CardTitle>
              <CardDescription>Decide which journeys trigger templates across email, SMS, and workspace channels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationPreferences.map((preference) => (
                <div key={preference.key} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-card/70 p-4">
                  <div>
                    <p className="font-medium text-foreground">{preference.label}</p>
                    <p className="text-xs text-muted-foreground">{preference.description}</p>
                  </div>
                  <Switch checked={preference.enabled} onCheckedChange={() => toggleNotification(preference.key)} />
                </div>
              ))}
              <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                Tip: Published templates are available under Communication ? Settings ? Templates.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Role definitions</CardTitle>
              <CardDescription>Grant the right workspace permissions before activating self-service journeys.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {defaultRoles.map((role) => (
                <div key={role.key} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{role.name}</p>
                    <p className="text-xs text-muted-foreground">{role.summary}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">{role.members} members</Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New role
              </Button>
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
                  <p className="text-xs text-muted-foreground">Require OTP or authenticator for privileged roles</p>
                </div>
                <Switch
                  checked={accessControls.enforceMfa}
                  onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, enforceMfa: value }))}
                />
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
                  <p className="text-xs text-muted-foreground">Require secondary approval before payroll data leaves the platform</p>
                </div>
                <Switch
                  checked={accessControls.restrictExports}
                  onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, restrictExports: value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-card/70 p-4">
                <div>
                  <p className="font-medium text-foreground">IP allow list</p>
                  <p className="text-xs text-muted-foreground">Restrict admin access to head office networks</p>
                </div>
                <Switch
                  checked={accessControls.ipAllowList}
                  onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, ipAllowList: value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-card/70 p-4">
                <div>
                  <p className="font-medium text-foreground">Geo fence mobile access</p>
                  <p className="text-xs text-muted-foreground">Block logins from outside ECOWAS countries</p>
                </div>
                <Switch
                  checked={accessControls.geoFence}
                  onCheckedChange={(value) => setAccessControls((prev) => ({ ...prev, geoFence: value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast({ title: "Access policies updated" })}>Save policies</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Security centre</CardTitle>
              <CardDescription>Review recent audit activity and upcoming control checks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-200 bg-card/70 p-4">
                  <div className="flex items-center gap-3">
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
                    <p className="font-medium text-foreground">{event.title}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                </div>
              ))}
              <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                Upcoming audit: Data protection review scheduled for 15 December 2025.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
