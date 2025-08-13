import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  Users,
  Calculator,
  Shield,
  Bell,
  Globe,
  CreditCard,
  Mail,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  SettingsIcon,
  Database,
  Key,
  FileText,
} from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your AkwaabaHRPay system configuration and preferences.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
            <RefreshCw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Company Information */}
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
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="Akwaaba Technologies Ltd" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-id">Tax ID / TIN</Label>
                <Input id="tax-id" defaultValue="C0012345678" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ssnit-number">SSNIT Employer Number</Label>
                <Input id="ssnit-number" defaultValue="1234567890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select defaultValue="technology">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Company Address</Label>
              <Textarea id="address" defaultValue="123 Liberation Road, Labone, Accra, Ghana" rows={3} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+233 30 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="info@akwaabatech.com" />
              </div>
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Payroll Configuration */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Payroll Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pay-frequency">Pay Frequency</Label>
              <Select defaultValue="monthly">
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
              <Select defaultValue="ghs">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ghs">Ghana Cedis (GHS)</SelectItem>
                  <SelectItem value="usd">US Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-wage">Minimum Wage (GHS)</Label>
              <Input id="min-wage" type="number" defaultValue="18.15" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtime-rate">Overtime Rate Multiplier</Label>
              <Input id="overtime-rate" type="number" defaultValue="1.5" step="0.1" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-paye">Auto-calculate PAYE</Label>
              <Switch id="auto-paye" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-ssnit">Auto-calculate SSNIT</Label>
              <Switch id="auto-ssnit" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>HR Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leave-year">Leave Year Start</Label>
              <Select defaultValue="january">
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
              <Label htmlFor="annual-leave">Annual Leave Days</Label>
              <Input id="annual-leave" type="number" defaultValue="21" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sick-leave">Sick Leave Days</Label>
              <Input id="sick-leave" type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probation">Probation Period (months)</Label>
              <Input id="probation" type="number" defaultValue="3" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-approve">Auto-approve leave requests</Label>
              <Switch id="auto-approve" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email notifications</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Notifications */}
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
              <Switch id="two-factor" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                <p className="text-sm text-gray-500">Automatically log out inactive users</p>
              </div>
              <Switch id="session-timeout" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
              <Select defaultValue="30">
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
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audit-log">Audit Logging</Label>
                <p className="text-sm text-gray-500">Track all system activities</p>
              </div>
              <Switch id="audit-log" defaultChecked />
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              <Key className="w-4 h-4 mr-2" />
              Change Admin Password
            </Button>
          </CardContent>
        </Card>

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
              <Switch id="payroll-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="leave-alerts">Leave Request Alerts</Label>
                <p className="text-sm text-gray-500">New leave requests and approvals</p>
              </div>
              <Switch id="leave-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="employee-alerts">Employee Updates</Label>
                <p className="text-sm text-gray-500">New employees and profile changes</p>
              </div>
              <Switch id="employee-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-alerts">System Maintenance</Label>
                <p className="text-sm text-gray-500">Scheduled maintenance and updates</p>
              </div>
              <Switch id="system-alerts" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-email">Notification Email</Label>
              <Input id="notification-email" type="email" defaultValue="admin@akwaabatech.com" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration & Backup */}
      <div className="grid lg:grid-cols-2 gap-6">
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
    </div>
  )
}
