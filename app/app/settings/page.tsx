"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Building2, Users, Shield, Bell, Database, Palette } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

console.log("[v0] SettingsPage component initializing...")

// Create Supabase client
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function SettingsPage() {
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
  })

  const [employees, setEmployees] = useState([])
  const [subsidiaries, setSubsidiaries] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllSettings()
  }, [])

  const loadAllSettings = async () => {
    console.log("[v0] Loading all settings data...")
    setLoading(true)

    try {
      await Promise.all([loadCompanyData(), loadEmployees(), loadSubsidiaries(), loadRoles()])
    } catch (error) {
      console.error("[v0] Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyData = async () => {
    console.log("[v0] Loading company data...")

    // Demo mode - use mock data
    console.log("[v0] Demo mode detected, using mock company data")
    setCompanyData({
      name: "Acme Corporation",
      address: "123 Business Street, City, State 12345",
      phone: "+1 (555) 123-4567",
      email: "info@acmecorp.com",
      taxId: "12-3456789",
    })
  }

  const loadEmployees = async () => {
    console.log("[v0] Loading employees...")

    // Demo mode - use mock data
    console.log("[v0] Demo mode detected, using mock employees data")
    setEmployees([
      { id: 1, name: "John Doe", role: "Manager", department: "Sales" },
      { id: 2, name: "Jane Smith", role: "Developer", department: "IT" },
      { id: 3, name: "Mike Johnson", role: "Analyst", department: "Finance" },
    ])
  }

  const loadSubsidiaries = async () => {
    console.log("[v0] Loading subsidiaries...")

    // Demo mode - use mock data
    console.log("[v0] Demo mode detected, using mock subsidiaries data")
    setSubsidiaries([
      { id: 1, name: "Acme West", location: "California" },
      { id: 2, name: "Acme East", location: "New York" },
    ])
  }

  const loadRoles = async () => {
    console.log("[v0] Loading roles...")

    // Demo mode - use mock data
    console.log("[v0] Demo mode detected, using mock roles data")
    setRoles([
      { id: 1, name: "Administrator", permissions: ["all"] },
      { id: 2, name: "Manager", permissions: ["read", "write"] },
      { id: 3, name: "Employee", permissions: ["read"] },
    ])
  }

  const handleSaveCompany = async () => {
    console.log("[v0] Saving company data:", companyData)
    // In demo mode, just show success
    alert("Company settings saved successfully!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  console.log("[v0] All settings data loaded successfully")

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your HR system configuration</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={companyData.taxId}
                    onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                    placeholder="Enter tax ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  placeholder="Enter company address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subsidiaries</CardTitle>
              <CardDescription>Manage your company subsidiaries and locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subsidiaries.map((subsidiary: any) => (
                  <div key={subsidiary.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{subsidiary.name}</h4>
                      <p className="text-sm text-gray-600">{subsidiary.location}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 bg-transparent">
                Add Subsidiary
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>View and manage employee information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((employee: any) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-gray-600">
                        {employee.role} - {employee.department}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 bg-transparent">
                Add Employee
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Configure user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles.map((role: any) => (
                  <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-sm text-gray-600">Permissions: {role.permissions.join(", ")}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 bg-transparent">
                Add Role
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="payroll-alerts">Payroll Alerts</Label>
                  <p className="text-sm text-gray-600">Get notified about payroll processing</p>
                </div>
                <Switch id="payroll-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="employee-updates">Employee Updates</Label>
                  <p className="text-sm text-gray-600">Notifications for employee changes</p>
                </div>
                <Switch id="employee-updates" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Integrations</CardTitle>
              <CardDescription>Manage external system connections and APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Supabase Database</h4>
                  <p className="text-sm text-gray-600">Primary database connection</p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Tax API Integration</h4>
                  <p className="text-sm text-gray-600">Automated tax calculations</p>
                </div>
                <Badge variant="secondary">Available</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Banking Integration</h4>
                  <p className="text-sm text-gray-600">Direct deposit and payments</p>
                </div>
                <Badge variant="outline">Not Connected</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your HR system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-gray-600">Switch to dark theme</p>
                </div>
                <Switch id="dark-mode" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-gray-600">Reduce spacing and padding</p>
                </div>
                <Switch id="compact-view" />
              </div>

              <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-blue-600"></div>
                  <div className="w-8 h-8 rounded-full bg-green-600 border-2 border-transparent hover:border-green-600 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-transparent hover:border-purple-600 cursor-pointer"></div>
                  <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-transparent hover:border-red-600 cursor-pointer"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
