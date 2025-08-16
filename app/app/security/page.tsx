"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Shield,
  Users,
  Eye,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  FileText,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  UserCheck,
  Settings,
  Activity,
  Ban,
} from "lucide-react"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isActive: boolean
  createdAt: string
}

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  details: string
  ipAddress: string
  timestamp: string
  status: "success" | "failed" | "warning"
}

interface ComplianceRule {
  id: string
  name: string
  description: string
  category: string
  status: "compliant" | "non-compliant" | "warning"
  lastChecked: string
  nextCheck: string
}

interface SecurityAlert {
  id: string
  type: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  timestamp: string
  status: "open" | "investigating" | "resolved"
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState("rbac")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const [roles] = useState<Role[]>([
    {
      id: "1",
      name: "Super Admin",
      description: "Full system access with all permissions",
      permissions: ["all"],
      userCount: 2,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "HR Manager",
      description: "Manage employees, payroll, and HR operations",
      permissions: ["employee.read", "employee.write", "payroll.read", "payroll.write", "reports.read"],
      userCount: 5,
      isActive: true,
      createdAt: "2024-01-20",
    },
    {
      id: "3",
      name: "Payroll Officer",
      description: "Process payroll and generate reports",
      permissions: ["payroll.read", "payroll.write", "reports.read"],
      userCount: 3,
      isActive: true,
      createdAt: "2024-02-01",
    },
    {
      id: "4",
      name: "Employee",
      description: "Self-service access to personal information",
      permissions: ["profile.read", "profile.write", "payslip.read", "leave.write"],
      userCount: 150,
      isActive: true,
      createdAt: "2024-01-15",
    },
  ])

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: "1",
      userId: "admin001",
      userName: "John Doe",
      action: "LOGIN",
      resource: "System",
      details: "Successful admin login",
      ipAddress: "192.168.1.100",
      timestamp: "2025-01-15 09:30:00",
      status: "success",
    },
    {
      id: "2",
      userId: "hr002",
      userName: "Jane Smith",
      action: "CREATE_EMPLOYEE",
      resource: "Employee",
      details: "Created new employee: Andrews Kodiah",
      ipAddress: "192.168.1.105",
      timestamp: "2025-01-15 10:15:00",
      status: "success",
    },
    {
      id: "3",
      userId: "payroll003",
      userName: "Mike Johnson",
      action: "PROCESS_PAYROLL",
      resource: "Payroll",
      details: "Processed January 2025 payroll",
      ipAddress: "192.168.1.110",
      timestamp: "2025-01-15 11:00:00",
      status: "success",
    },
    {
      id: "4",
      userId: "unknown",
      userName: "Unknown User",
      action: "FAILED_LOGIN",
      resource: "System",
      details: "Failed login attempt with invalid credentials",
      ipAddress: "203.45.67.89",
      timestamp: "2025-01-15 08:45:00",
      status: "failed",
    },
  ])

  const [complianceRules] = useState<ComplianceRule[]>([
    {
      id: "1",
      name: "PAYE Tax Compliance",
      description: "Ensure all PAYE calculations comply with Ghana Revenue Authority requirements",
      category: "Tax Compliance",
      status: "compliant",
      lastChecked: "2025-01-15",
      nextCheck: "2025-02-15",
    },
    {
      id: "2",
      name: "SSNIT Contribution Compliance",
      description: "Verify SSNIT contributions are calculated and remitted correctly",
      category: "Social Security",
      status: "compliant",
      lastChecked: "2025-01-15",
      nextCheck: "2025-02-15",
    },
    {
      id: "3",
      name: "Data Protection Compliance",
      description: "Ensure employee data is protected according to Ghana Data Protection Act",
      category: "Data Protection",
      status: "warning",
      lastChecked: "2025-01-10",
      nextCheck: "2025-01-20",
    },
    {
      id: "4",
      name: "Leave Policy Compliance",
      description: "Verify leave policies comply with Ghana Labour Act",
      category: "HR Compliance",
      status: "compliant",
      lastChecked: "2025-01-14",
      nextCheck: "2025-02-14",
    },
  ])

  const [securityAlerts] = useState<SecurityAlert[]>([
    {
      id: "1",
      type: "medium",
      title: "Multiple Failed Login Attempts",
      description: "5 failed login attempts detected from IP 203.45.67.89",
      timestamp: "2025-01-15 08:45:00",
      status: "investigating",
    },
    {
      id: "2",
      type: "low",
      title: "Password Policy Violation",
      description: "User attempted to set weak password",
      timestamp: "2025-01-15 07:30:00",
      status: "resolved",
    },
    {
      id: "3",
      type: "high",
      title: "Unusual Data Access Pattern",
      description: "Large volume of employee data accessed outside business hours",
      timestamp: "2025-01-14 23:15:00",
      status: "open",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "compliant":
      case "resolved":
        return "bg-green-100 text-green-700"
      case "failed":
      case "non-compliant":
      case "open":
        return "bg-red-100 text-red-700"
      case "warning":
      case "investigating":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security & Compliance</h1>
          <p className="text-gray-600">Manage system security, user permissions, and compliance monitoring.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Security Report
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Security Score</p>
                <p className="text-2xl font-bold text-green-600">95%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-blue-600">160</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Compliance</p>
                <p className="text-2xl font-bold text-emerald-600">98%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rbac">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Security</TabsTrigger>
        </TabsList>

        <TabsContent value="rbac" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Role Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{role.description}</TableCell>
                      <TableCell>{role.userCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {role.permissions.length === 1 && role.permissions[0] === "all"
                            ? "All Permissions"
                            : `${role.permissions.length} permissions`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={role.isActive ? getStatusColor("success") : getStatusColor("failed")}>
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search audit logs..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Audit Trail</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Compliance Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceRules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-gray-500">{rule.category}</p>
                      </div>
                      <Badge className={getStatusColor(rule.status)}>{rule.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last checked: {rule.lastChecked}</span>
                      <span>Next check: {rule.nextCheck}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Compliance Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Compliant</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">3</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Warning</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">1</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Ghana Labour Act</span>
                      <Badge className="bg-green-100 text-green-700">Compliant</Badge>
                    </div>
                    <p className="text-sm text-gray-600">All HR policies align with Ghana Labour Act requirements</p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Data Protection Act</span>
                      <Badge className="bg-yellow-100 text-yellow-700">Review Required</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Employee consent forms need updating</p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">GRA Tax Compliance</span>
                      <Badge className="bg-green-100 text-green-700">Compliant</Badge>
                    </div>
                    <p className="text-sm text-gray-600">All tax calculations and filings are up to date</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="open">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="bg-transparent">
              <Settings className="w-4 h-4 mr-2" />
              Alert Settings
            </Button>
          </div>

          <div className="space-y-4">
            {securityAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${getAlertTypeColor(alert.type)}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={getAlertTypeColor(alert.type)}>{alert.type.toUpperCase()}</Badge>
                      <h3 className="font-medium">{alert.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{alert.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.timestamp}</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span>IP Access Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable IP Allowlisting</Label>
                    <p className="text-sm text-gray-500">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Allowed IP Addresses</Label>
                  <Textarea placeholder="192.168.1.0/24&#10;203.45.67.89&#10;10.0.0.0/8" rows={4} />
                  <p className="text-xs text-gray-500">Enter one IP address or CIDR block per line</p>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add IP Range
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  <span>Data Encryption</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Encryption at Rest</Label>
                    <p className="text-sm text-gray-500">Encrypt sensitive data in database</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Encryption in Transit</Label>
                    <p className="text-sm text-gray-500">Force HTTPS for all connections</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Field-Level Encryption</Label>
                    <p className="text-sm text-gray-500">Encrypt PII and sensitive fields</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Encryption Status: Active</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">All data is encrypted using AES-256</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ban className="w-5 h-5 text-emerald-600" />
                  <span>Threat Protection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Brute Force Protection</Label>
                    <p className="text-sm text-gray-500">Block IPs after failed attempts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Max Failed Attempts</Label>
                  <Input type="number" defaultValue="5" min="3" max="10" />
                </div>
                <div className="space-y-2">
                  <Label>Lockout Duration (minutes)</Label>
                  <Input type="number" defaultValue="30" min="5" max="1440" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-gray-500">Limit API requests per user</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Data Retention</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Audit Log Retention (days)</Label>
                  <Input type="number" defaultValue="365" min="30" max="2555" />
                </div>
                <div className="space-y-2">
                  <Label>Employee Data Retention (years)</Label>
                  <Input type="number" defaultValue="7" min="1" max="50" />
                </div>
                <div className="space-y-2">
                  <Label>Payroll Data Retention (years)</Label>
                  <Input type="number" defaultValue="10" min="5" max="50" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Purge Expired Data</Label>
                    <p className="text-sm text-gray-500">Automatically delete old records</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
