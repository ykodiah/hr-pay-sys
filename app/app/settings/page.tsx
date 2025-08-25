"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Building, Shield, Bell, CreditCard, Save } from "lucide-react"

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState({
    name: "AkwaabaHR Solutions",
    address: "123 Independence Avenue, Accra, Ghana",
    phone: "+233 30 123 4567",
    email: "info@akwaabahr.com",
    website: "www.akwaabahr.com",
    taxId: "C0123456789",
    ssnit: "SSN123456",
    currency: "GHS",
    timezone: "Africa/Accra",
    fiscalYearStart: "01-01",
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    workingHours: {
      start: "08:00",
      end: "17:00",
    },
  })

  const [payrollSettings, setPayrollSettings] = useState({
    payPeriod: "monthly",
    payDay: "25",
    overtimeRate: "1.5",
    ssnit: {
      employeeRate: "5.5",
      employerRate: "13.0",
    },
    paye: {
      enabled: true,
      personalRelief: "4800",
    },
    tier3: {
      enabled: true,
      rate: "5.0",
    },
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    leaveRequests: true,
    payrollReminders: true,
    birthdayReminders: true,
    documentExpiry: true,
    attendanceAlerts: true,
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordPolicy: {
      minLength: "8",
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
    loginAttempts: "5",
    accountLockout: "15",
  })

  const handleSaveCompanySettings = () => {
    // Save company settings logic here
    toast({
      title: "Settings Saved",
      description: "Company settings have been updated successfully.",
    })
  }

  const handleSavePayrollSettings = () => {
    // Save payroll settings logic here
    toast({
      title: "Settings Saved",
      description: "Payroll settings have been updated successfully.",
    })
  }

  const handleSaveNotificationSettings = () => {
    // Save notification settings logic here
    toast({
      title: "Settings Saved",
      description: "Notification settings have been updated successfully.",
    })
  }

  const handleSaveSecuritySettings = () => {
    // Save security settings logic here
    toast({
      title: "Settings Saved",
      description: "Security settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system preferences and organizational settings</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={companySettings.taxId}
                    onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={companySettings.currency}
                    onValueChange={(value) => setCompanySettings({ ...companySettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">Ghana Cedi (GHS)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={companySettings.timezone}
                    onValueChange={(value) => setCompanySettings({ ...companySettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Accra">Africa/Accra (GMT)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ssnit">SSNIT Number</Label>
                  <Input
                    id="ssnit"
                    value={companySettings.ssnit}
                    onChange={(e) => setCompanySettings({ ...companySettings, ssnit: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workStart">Working Hours Start</Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={companySettings.workingHours.start}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        workingHours: { ...companySettings.workingHours, start: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="workEnd">Working Hours End</Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={companySettings.workingHours.end}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        workingHours: { ...companySettings.workingHours, end: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCompanySettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Company Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payroll Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="payPeriod">Pay Period</Label>
                  <Select
                    value={payrollSettings.payPeriod}
                    onValueChange={(value) => setPayrollSettings({ ...payrollSettings, payPeriod: value })}
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
                <div>
                  <Label htmlFor="payDay">Pay Day</Label>
                  <Input
                    id="payDay"
                    type="number"
                    min="1"
                    max="31"
                    value={payrollSettings.payDay}
                    onChange={(e) => setPayrollSettings({ ...payrollSettings, payDay: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="overtimeRate">Overtime Rate Multiplier</Label>
                  <Input
                    id="overtimeRate"
                    type="number"
                    step="0.1"
                    value={payrollSettings.overtimeRate}
                    onChange={(e) => setPayrollSettings({ ...payrollSettings, overtimeRate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SSNIT Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ssnitEmployee">Employee Rate (%)</Label>
                    <Input
                      id="ssnitEmployee"
                      type="number"
                      step="0.1"
                      value={payrollSettings.ssnit.employeeRate}
                      onChange={(e) =>
                        setPayrollSettings({
                          ...payrollSettings,
                          ssnit: { ...payrollSettings.ssnit, employeeRate: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssnitEmployer">Employer Rate (%)</Label>
                    <Input
                      id="ssnitEmployer"
                      type="number"
                      step="0.1"
                      value={payrollSettings.ssnit.employerRate}
                      onChange={(e) =>
                        setPayrollSettings({
                          ...payrollSettings,
                          ssnit: { ...payrollSettings.ssnit, employerRate: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">PAYE Configuration</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={payrollSettings.paye.enabled}
                    onCheckedChange={(checked) =>
                      setPayrollSettings({
                        ...payrollSettings,
                        paye: { ...payrollSettings.paye, enabled: checked },
                      })
                    }
                  />
                  <Label>Enable PAYE Calculation</Label>
                </div>
                <div>
                  <Label htmlFor="personalRelief">Personal Relief (GH₵)</Label>
                  <Input
                    id="personalRelief"
                    type="number"
                    value={payrollSettings.paye.personalRelief}
                    onChange={(e) =>
                      setPayrollSettings({
                        ...payrollSettings,
                        paye: { ...payrollSettings.paye, personalRelief: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tier 3 Pension</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={payrollSettings.tier3.enabled}
                    onCheckedChange={(checked) =>
                      setPayrollSettings({
                        ...payrollSettings,
                        tier3: { ...payrollSettings.tier3, enabled: checked },
                      })
                    }
                  />
                  <Label>Enable Tier 3 Deduction</Label>
                </div>
                <div>
                  <Label htmlFor="tier3Rate">Tier 3 Rate (%)</Label>
                  <Input
                    id="tier3Rate"
                    type="number"
                    step="0.1"
                    value={payrollSettings.tier3.rate}
                    onChange={(e) =>
                      setPayrollSettings({
                        ...payrollSettings,
                        tier3: { ...payrollSettings.tier3, rate: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePayrollSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Payroll Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">General Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Specific Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Leave Requests</Label>
                      <p className="text-sm text-gray-500">Notify when leave requests are submitted</p>
                    </div>
                    <Switch
                      checked={notificationSettings.leaveRequests}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, leaveRequests: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Payroll Reminders</Label>
                      <p className="text-sm text-gray-500">Remind about payroll processing deadlines</p>
                    </div>
                    <Switch
                      checked={notificationSettings.payrollReminders}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, payrollReminders: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Birthday Reminders</Label>
                      <p className="text-sm text-gray-500">Notify about employee birthdays</p>
                    </div>
                    <Switch
                      checked={notificationSettings.birthdayReminders}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, birthdayReminders: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Document Expiry</Label>
                      <p className="text-sm text-gray-500">Alert when documents are about to expire</p>
                    </div>
                    <Switch
                      checked={notificationSettings.documentExpiry}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, documentExpiry: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Attendance Alerts</Label>
                      <p className="text-sm text-gray-500">Alert for attendance irregularities</p>
                    </div>
                    <Switch
                      checked={notificationSettings.attendanceAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, attendanceAlerts: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Password Policy</h3>
                <div>
                  <Label htmlFor="minLength">Minimum Password Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    min="6"
                    max="20"
                    value={securitySettings.passwordPolicy.minLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: { ...securitySettings.passwordPolicy, minLength: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordPolicy: { ...securitySettings.passwordPolicy, requireUppercase: checked },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordPolicy: { ...securitySettings.passwordPolicy, requireNumbers: checked },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Symbols</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireSymbols}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordPolicy: { ...securitySettings.passwordPolicy, requireSymbols: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Security</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                    <Input
                      id="loginAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.loginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountLockout">Account Lockout Duration (minutes)</Label>
                    <Input
                      id="accountLockout"
                      type="number"
                      min="5"
                      max="60"
                      value={securitySettings.accountLockout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, accountLockout: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecuritySettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
