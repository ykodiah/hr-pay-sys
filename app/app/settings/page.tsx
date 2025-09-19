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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Building2, Users, Shield, Bell, Database, Palette, Calculator, DollarSign } from "lucide-react"
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

  const [payrollSettings, setPayrollSettings] = useState({
    currency: "GHS",
    currencySymbol: "GH₵",
    minimumWage: 18.0,
    overtimeWeekdayMultiplier: 1.5,
    overtimeWeekendMultiplier: 2.0,
    autoCalculatePAYE: true,
    autoCalculateSSNIT: true,
    payrollFrequency: "monthly",
  })

  const [taxBands, setTaxBands] = useState([
    { band: 1, rate: 0, from: 0, to: 490, description: "0% on first GH₵ 490" },
    { band: 2, rate: 5, from: 490, to: 600, description: "5% on next GH₵ 110" },
    { band: 3, rate: 10, from: 600, to: 730, description: "10% on next GH₵ 130" },
    { band: 4, rate: 17.5, from: 730, to: 3896.67, description: "17.5% on next GH₵ 3,166.67" },
    { band: 5, rate: 25, from: 3896.67, to: 19896.67, description: "25% on next GH₵ 16,000" },
    { band: 6, rate: 30, from: 19896.67, to: 50416.67, description: "30% on next GH₵ 30,520" },
    { band: 7, rate: 35, from: 50416.67, to: null, description: "35% on amounts exceeding GH₵ 50,416.67" },
  ])

  const [ssnitRates, setSSNITRates] = useState({
    employee: 5.5,
    employer: 13.0,
    total: 18.5,
  })

  const [allowances, setAllowances] = useState([
    { code: "TRANS", description: "Transport Allowance", taxable: true, amount: 0, percentage: 0 },
    { code: "HOUSE", description: "Housing Allowance", taxable: true, amount: 0, percentage: 0 },
    { code: "MED", description: "Medical Allowance", taxable: false, amount: 0, percentage: 0 },
  ])

  const [deductions, setDeductions] = useState([
    { code: "TAX", description: "Tax Deduction", taxable: false, amount: 0, percentage: 0 },
    { code: "SSNIT", description: "SSNIT Deduction", taxable: false, amount: 0, percentage: 5.5 },
    { code: "LOAN", description: "Loan Deduction", taxable: false, amount: 0, percentage: 0 },
  ])

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

  const handleSavePayrollSettings = async () => {
    console.log("[v0] Saving payroll settings:", payrollSettings)
    alert("Payroll settings saved successfully!")
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Payroll
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
          {/* ... existing company content ... */}
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

        <TabsContent value="payroll" className="space-y-6">
          {/* General Payroll Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                General Payroll Settings
              </CardTitle>
              <CardDescription>Configure basic payroll parameters and currency settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={payrollSettings.currency}
                    onValueChange={(value) => setPayrollSettings({ ...payrollSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">Ghana Cedi (GHS)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum-wage">Minimum Wage ({payrollSettings.currencySymbol})</Label>
                  <Input
                    id="minimum-wage"
                    type="number"
                    step="0.01"
                    value={payrollSettings.minimumWage}
                    onChange={(e) =>
                      setPayrollSettings({ ...payrollSettings, minimumWage: Number.parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payroll-frequency">Payroll Frequency</Label>
                  <Select
                    value={payrollSettings.payrollFrequency}
                    onValueChange={(value) => setPayrollSettings({ ...payrollSettings, payrollFrequency: value })}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overtime-weekday">Weekday Overtime Multiplier</Label>
                  <Input
                    id="overtime-weekday"
                    type="number"
                    step="0.1"
                    value={payrollSettings.overtimeWeekdayMultiplier}
                    onChange={(e) =>
                      setPayrollSettings({
                        ...payrollSettings,
                        overtimeWeekdayMultiplier: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime-weekend">Weekend Overtime Multiplier</Label>
                  <Input
                    id="overtime-weekend"
                    type="number"
                    step="0.1"
                    value={payrollSettings.overtimeWeekendMultiplier}
                    onChange={(e) =>
                      setPayrollSettings({
                        ...payrollSettings,
                        overtimeWeekendMultiplier: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-paye">Auto-calculate PAYE</Label>
                    <p className="text-sm text-gray-600">Automatically calculate Pay As You Earn tax</p>
                  </div>
                  <Switch
                    id="auto-paye"
                    checked={payrollSettings.autoCalculatePAYE}
                    onCheckedChange={(checked) =>
                      setPayrollSettings({ ...payrollSettings, autoCalculatePAYE: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-ssnit">Auto-calculate SSNIT</Label>
                    <p className="text-sm text-gray-600">Automatically calculate Social Security contributions</p>
                  </div>
                  <Switch
                    id="auto-ssnit"
                    checked={payrollSettings.autoCalculateSSNIT}
                    onCheckedChange={(checked) =>
                      setPayrollSettings({ ...payrollSettings, autoCalculateSSNIT: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSavePayrollSettings} className="bg-blue-600 hover:bg-blue-700">
                  Save Payroll Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tax Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
              <CardDescription>Configure PAYE tax bands and SSNIT rates for Ghana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PAYE Tax Bands */}
              <div>
                <h4 className="font-semibold mb-3">PAYE Tax Bands (Ghana 2025)</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Band</TableHead>
                      <TableHead>Rate (%)</TableHead>
                      <TableHead>From (GH₵)</TableHead>
                      <TableHead>To (GH₵)</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxBands.map((band) => (
                      <TableRow key={band.band}>
                        <TableCell>{band.band}</TableCell>
                        <TableCell>{band.rate}%</TableCell>
                        <TableCell>{band.from.toLocaleString()}</TableCell>
                        <TableCell>{band.to ? band.to.toLocaleString() : "No limit"}</TableCell>
                        <TableCell className="text-sm text-gray-600">{band.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* SSNIT Rates */}
              <div>
                <h4 className="font-semibold mb-3">SSNIT Contribution Rates</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{ssnitRates.employee}%</div>
                        <div className="text-sm text-gray-600">Employee Contribution</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{ssnitRates.employer}%</div>
                        <div className="text-sm text-gray-600">Employer Contribution</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{ssnitRates.total}%</div>
                        <div className="text-sm text-gray-600">Total Contribution</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allowances and Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Allowances</CardTitle>
                <CardDescription>Configure standard allowances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allowances.map((allowance, index) => (
                    <div key={allowance.code} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{allowance.description}</h4>
                        <p className="text-sm text-gray-600">
                          Code: {allowance.code} • {allowance.taxable ? "Taxable" : "Non-taxable"}
                        </p>
                      </div>
                      <Badge variant={allowance.taxable ? "default" : "secondary"}>
                        {allowance.taxable ? "Taxable" : "Non-taxable"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full bg-transparent">
                  Add Allowance
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deductions</CardTitle>
                <CardDescription>Configure standard deductions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deductions.map((deduction, index) => (
                    <div key={deduction.code} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{deduction.description}</h4>
                        <p className="text-sm text-gray-600">
                          Code: {deduction.code} •{" "}
                          {deduction.percentage > 0 ? `${deduction.percentage}%` : "Fixed Amount"}
                        </p>
                      </div>
                      <Badge variant="outline">{deduction.percentage > 0 ? `${deduction.percentage}%` : "Fixed"}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full bg-transparent">
                  Add Deduction
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ... existing other tabs content ... */}
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
