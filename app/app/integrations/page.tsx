"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  Plug,
  Settings,
  Key,
  WebhookIcon,
  Shield,
  Database,
  CreditCard,
  Building,
  Globe,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Zap,
  Lock,
  Unlock,
  Activity,
} from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  category: "banking" | "government" | "payroll" | "hr" | "sso" | "api"
  status: "connected" | "disconnected" | "error" | "pending"
  provider: string
  lastSync?: string
  config?: Record<string, any>
  webhookUrl?: string
  apiKey?: string
  isActive: boolean
}

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showApiDialog, setShowApiDialog] = useState(false)
  const [showWebhookDialog, setShowWebhookDialog] = useState(false)
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

  const [integrations] = useState<Integration[]>([
    {
      id: "1",
      name: "Ghana Revenue Authority (GRA)",
      description: "Automated PAYE tax filing and compliance reporting",
      category: "government",
      status: "connected",
      provider: "GRA",
      lastSync: "2025-01-20 14:30",
      isActive: true,
      config: {
        tin: "C0012345678",
        apiEndpoint: "https://api.gra.gov.gh/v1",
        autoSubmit: true,
      },
    },
    {
      id: "2",
      name: "Social Security & National Insurance Trust (SSNIT)",
      description: "Employee pension contributions and compliance",
      category: "government",
      status: "connected",
      provider: "SSNIT",
      lastSync: "2025-01-20 12:15",
      isActive: true,
      config: {
        employerNumber: "EMP001234",
        apiEndpoint: "https://api.ssnit.org.gh/v2",
        autoSubmit: false,
      },
    },
    {
      id: "3",
      name: "GT Bank Corporate Banking",
      description: "Salary payments and bulk transfers",
      category: "banking",
      status: "connected",
      provider: "GT Bank",
      lastSync: "2025-01-20 16:45",
      isActive: true,
      config: {
        accountNumber: "0123456789",
        corporateId: "CORP001",
        apiEndpoint: "https://api.gtbank.com/corporate/v1",
      },
    },
    {
      id: "4",
      name: "Microsoft Azure AD",
      description: "Single Sign-On and user authentication",
      category: "sso",
      status: "connected",
      provider: "Microsoft",
      lastSync: "2025-01-20 18:00",
      isActive: true,
      config: {
        tenantId: "12345678-1234-1234-1234-123456789012",
        clientId: "87654321-4321-4321-4321-210987654321",
        domain: "akwaabahr.onmicrosoft.com",
      },
    },
    {
      id: "5",
      name: "Slack Notifications",
      description: "HR notifications and alerts",
      category: "hr",
      status: "disconnected",
      provider: "Slack",
      isActive: false,
      webhookUrl: "https://hooks.slack.com/services/...",
    },
    {
      id: "6",
      name: "QuickBooks Online",
      description: "Accounting and financial data sync",
      category: "payroll",
      status: "error",
      provider: "Intuit",
      lastSync: "2025-01-19 09:30",
      isActive: false,
      config: {
        companyId: "123456789",
        realmId: "987654321",
      },
    },
  ])

  const [webhooksData] = useState([
    {
      id: "1",
      name: "Payroll Processed",
      url: "https://api.partner.com/webhooks/payroll",
      events: ["payroll.processed", "payroll.approved"],
      status: "active",
      lastTriggered: "2025-01-20 14:30",
      secret: "whsec_1234567890abcdef",
      retryCount: 3,
    },
    {
      id: "2",
      name: "Employee Onboarded",
      url: "https://slack.com/api/webhooks/employee-alerts",
      events: ["employee.created", "employee.activated"],
      status: "active",
      lastTriggered: "2025-01-18 10:15",
      secret: "whsec_abcdef1234567890",
      retryCount: 5,
    },
    {
      id: "3",
      name: "Compliance Alert",
      url: "https://compliance.system.com/alerts",
      events: ["compliance.violation", "tax.deadline"],
      status: "failed",
      lastTriggered: "2025-01-15 16:20",
      secret: "whsec_fedcba0987654321",
      retryCount: 0,
    },
  ])

  const [apiKeys] = useState([
    {
      id: "1",
      name: "Mobile App API",
      key: "ak_live_1234567890abcdef1234567890abcdef",
      permissions: ["read:employees", "read:payroll", "write:attendance"],
      lastUsed: "2025-01-20 15:45",
      expiresAt: "2025-12-31",
      isActive: true,
      createdAt: "2024-06-15",
    },
    {
      id: "2",
      name: "Analytics Dashboard",
      key: "ak_live_abcdef1234567890abcdef1234567890",
      permissions: ["read:analytics", "read:reports"],
      lastUsed: "2025-01-20 12:30",
      isActive: true,
      createdAt: "2024-08-22",
    },
    {
      id: "3",
      name: "Backup Service",
      key: "ak_live_fedcba0987654321fedcba0987654321",
      permissions: ["read:all", "export:data"],
      lastUsed: "2025-01-19 02:00",
      expiresAt: "2025-06-30",
      isActive: false,
      createdAt: "2024-12-01",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return "bg-green-100 text-green-700"
      case "disconnected":
      case "inactive":
        return "bg-gray-100 text-gray-700"
      case "error":
      case "failed":
        return "bg-red-100 text-red-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "disconnected":
      case "inactive":
        return <XCircle className="w-4 h-4 text-gray-600" />
      case "error":
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case "pending":
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "banking":
        return <CreditCard className="w-5 h-5" />
      case "government":
        return <Building className="w-5 h-5" />
      case "payroll":
        return <Database className="w-5 h-5" />
      case "hr":
        return <Globe className="w-5 h-5" />
      case "sso":
        return <Shield className="w-5 h-5" />
      case "api":
        return <Key className="w-5 h-5" />
      default:
        return <Plug className="w-5 h-5" />
    }
  }

  const handleToggleApiKey = (keyId: string) => {
    setShowApiKey((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }))
  }

  const handleTestIntegration = (integration: Integration) => {
    toast({
      title: "Testing Integration",
      description: `Testing connection to ${integration.name}...`,
    })

    // Simulate API test
    setTimeout(() => {
      toast({
        title: "Test Successful",
        description: `Connection to ${integration.name} is working properly.`,
      })
    }, 2000)
  }

  const handleSyncIntegration = (integration: Integration) => {
    toast({
      title: "Syncing Data",
      description: `Synchronizing data with ${integration.name}...`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Manage external connections, APIs, and data synchronization</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </Button>
          <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Integration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Integration Name</Label>
                    <Input placeholder="Enter integration name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banking">Banking</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="payroll">Payroll</SelectItem>
                        <SelectItem value="hr">HR Systems</SelectItem>
                        <SelectItem value="sso">Single Sign-On</SelectItem>
                        <SelectItem value="api">API Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the integration purpose..." />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Input placeholder="Provider name" />
                  </div>
                  <div className="space-y-2">
                    <Label>API Endpoint</Label>
                    <Input placeholder="https://api.provider.com/v1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Authentication</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select auth method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api-key">API Key</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowIntegrationDialog(false)}>
                    Cancel
                  </Button>
                  <Button>Add Integration</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Integrations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {integrations.filter((i) => i.status === "connected").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Keys</p>
                    <p className="text-2xl font-bold text-gray-900">{apiKeys.filter((k) => k.isActive).length}</p>
                  </div>
                  <Key className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Webhooks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {webhooksData.filter((w) => w.status === "active").length}
                    </p>
                  </div>
                  <WebhookIcon className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sync Status</p>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                  </div>
                  <Activity className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Integration Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.slice(0, 5).map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getCategoryIcon(integration.category)}
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-gray-600">
                            {integration.lastSync ? `Last sync: ${integration.lastSync}` : "Never synced"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(integration.status)}
                        <Badge className={getStatusColor(integration.status)}>{integration.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["government", "banking", "payroll", "hr", "sso"].map((category) => {
                    const categoryIntegrations = integrations.filter((i) => i.category === category)
                    const activeCount = categoryIntegrations.filter((i) => i.status === "connected").length

                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            {getCategoryIcon(category)}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{category}</p>
                            <p className="text-sm text-gray-600">
                              {activeCount} of {categoryIntegrations.length} active
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {Math.round((activeCount / categoryIntegrations.length) * 100) || 0}%
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getCategoryIcon(integration.category)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          <Badge className={getStatusColor(integration.status)}>{integration.status}</Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{integration.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Provider: {integration.provider}</span>
                          <span>Category: {integration.category}</span>
                          {integration.lastSync && <span>Last sync: {integration.lastSync}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={integration.isActive}
                        onCheckedChange={() => {
                          toast({
                            title: integration.isActive ? "Integration Disabled" : "Integration Enabled",
                            description: `${integration.name} has been ${integration.isActive ? "disabled" : "enabled"}.`,
                          })
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => handleTestIntegration(integration)}>
                        <Zap className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSyncIntegration(integration)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>

                  {integration.config && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Configuration</h4>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        {Object.entries(integration.config).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Webhook Management</h2>
            <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Webhook Name</Label>
                      <Input placeholder="Enter webhook name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Endpoint URL</Label>
                      <Input placeholder="https://your-app.com/webhooks" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {[
                        "employee.created",
                        "employee.updated",
                        "employee.deleted",
                        "payroll.processed",
                        "payroll.approved",
                        "payroll.failed",
                        "leave.requested",
                        "leave.approved",
                        "leave.rejected",
                        "compliance.violation",
                        "tax.deadline",
                        "backup.completed",
                      ].map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <input type="checkbox" id={event} className="rounded" />
                          <Label htmlFor={event} className="text-sm">
                            {event}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input placeholder="Optional webhook secret for verification" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create Webhook</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {webhooksData.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{webhook.name}</h3>
                        <Badge className={getStatusColor(webhook.status)}>{webhook.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3 font-mono text-sm">{webhook.url}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <span>Events: {webhook.events.length}</span>
                        <span>Retries: {webhook.retryCount}</span>
                        {webhook.lastTriggered && <span>Last triggered: {webhook.lastTriggered}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Zap className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Key Management</h2>
            <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Key Name</Label>
                    <Input placeholder="Enter a descriptive name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {[
                        "read:employees",
                        "write:employees",
                        "delete:employees",
                        "read:payroll",
                        "write:payroll",
                        "process:payroll",
                        "read:analytics",
                        "read:reports",
                        "export:data",
                        "read:all",
                        "write:all",
                        "admin:all",
                      ].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <input type="checkbox" id={permission} className="rounded" />
                          <Label htmlFor={permission} className="text-sm">
                            {permission}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date (Optional)</Label>
                    <Input type="date" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowApiDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Generate Key</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{apiKey.name}</h3>
                        <Badge
                          className={apiKey.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
                        >
                          {apiKey.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {apiKey.expiresAt && <Badge variant="outline">Expires: {apiKey.expiresAt}</Badge>}
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {showApiKey[apiKey.id] ? apiKey.key : "ak_live_••••••••••••••••••••••••••••••••"}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleApiKey(apiKey.id)}>
                          {showApiKey[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <span>Created: {apiKey.createdAt}</span>
                        {apiKey.lastUsed && <span>Last used: {apiKey.lastUsed}</span>}
                        <span>Permissions: {apiKey.permissions.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        {apiKey.isActive ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                        {apiKey.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    timestamp: "2025-01-20 16:45:23",
                    integration: "GT Bank Corporate Banking",
                    action: "Bulk salary transfer completed",
                    status: "success",
                    details: "247 employees processed successfully",
                  },
                  {
                    timestamp: "2025-01-20 14:30:15",
                    integration: "Ghana Revenue Authority",
                    action: "PAYE tax filing submitted",
                    status: "success",
                    details: "Monthly PAYE return for December 2024",
                  },
                  {
                    timestamp: "2025-01-20 12:15:42",
                    integration: "SSNIT",
                    action: "Pension contributions sync",
                    status: "success",
                    details: "Employee and employer contributions updated",
                  },
                  {
                    timestamp: "2025-01-20 10:22:18",
                    integration: "QuickBooks Online",
                    action: "Financial data sync failed",
                    status: "error",
                    details: "Authentication token expired",
                  },
                  {
                    timestamp: "2025-01-20 09:15:33",
                    integration: "Slack Notifications",
                    action: "Webhook delivery failed",
                    status: "warning",
                    details: "Endpoint returned 404 error",
                  },
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{log.action}</p>
                          <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{log.integration}</p>
                        <p className="text-xs text-gray-500">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
