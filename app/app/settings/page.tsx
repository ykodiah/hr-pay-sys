"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  DollarSign,
  Mail,
  Ear as Gear,
} from "lucide-react"

const currencyConfig = {
  ghs: {
    symbol: "₵",
    name: "Ghana Cedi",
    taxBands: [
      { from: 0, to: 4800, rate: 0 },
      { from: 4800, to: 7200, rate: 5 },
      { from: 7200, to: 50000, rate: 10 },
      { from: 50000, to: 120000, rate: 17.5 },
      { from: 120000, to: null, rate: 25 },
    ],
    socialSecurity: { employee: 5.5, employer: 13, total: 18.5 },
    tier2: { employee: 5, employer: 5, total: 10 },
    tier3: { employee: 5, employer: 0, total: 5 },
  },
  usd: {
    symbol: "$",
    name: "US Dollar",
    taxBands: [
      { from: 0, to: 12950, rate: 10 },
      { from: 12950, to: 49400, rate: 12 },
      { from: 49400, to: 100000, rate: 22 },
      { from: 100000, to: 200000, rate: 24 },
      { from: 200000, to: null, rate: 37 },
    ],
    socialSecurity: { employee: 6.2, employer: 6.2, total: 12.4 },
    tier2: { employee: 1.45, employer: 1.45, total: 2.9 },
    tier3: { employee: 0, employer: 0, total: 0 },
  },
  eur: {
    symbol: "€",
    name: "Euro",
    taxBands: [
      { from: 0, to: 10000, rate: 0 },
      { from: 10000, to: 28000, rate: 14 },
      { from: 28000, to: 54000, rate: 30 },
      { from: 54000, to: 100000, rate: 37 },
      { from: 100000, to: null, rate: 45 },
    ],
    socialSecurity: { employee: 9.3, employer: 14.6, total: 23.9 },
    tier2: { employee: 2, employer: 2, total: 4 },
    tier3: { employee: 0, employer: 0, total: 0 },
  },
  gbp: {
    symbol: "£",
    name: "British Pound",
    taxBands: [
      { from: 0, to: 12570, rate: 0 },
      { from: 12570, to: 50270, rate: 20 },
      { from: 50270, to: 125140, rate: 40 },
      { from: 125140, to: null, rate: 45 },
    ],
    socialSecurity: { employee: 12, employer: 13.8, total: 25.8 },
    tier2: { employee: 0, employer: 0, total: 0 },
    tier3: { employee: 0, employer: 0, total: 0 },
  },
}

const isDemoMode = () => {
  if (typeof window !== "undefined") {
    const demoSession = document.cookie.includes("demo-session=active")
    const demoProfile = localStorage.getItem("demo_profile")
    return demoSession || !!demoProfile
  }
  return false
}

const parseDocumentContent = (document: any) => {
  // Placeholder function for parsing document content
  return "Document content goes here"
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [showPasswordEmail, setShowPasswordEmail] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  // Company settings state
  const [companyData, setCompanyData] = useState({
    name: "Akwaaba Technologies",
    address: "123 Business Street, Accra, Ghana",
    phone: "+233 20 123 4567",
    email: "info@akwaaba.com",
    website: "www.akwaaba.com",
    registration_number: "CS-123456789",
    tax_id: "TIN-987654321",
    logo_url: "",
  })

  // Email configuration state
  const [emailConfig, setEmailConfig] = useState({
    provider: "SMTP",
    host: "smtp.gmail.com",
    port: "587",
    username: "your-email@company.com",
    password: "",
    fromEmail: "hr@company.com",
    fromName: "HR Department",
    replyTo: "noreply@company.com",
    enableTLS: true,
    enableSSL: false,
  })

  // Salary grades state
  const [salaryGrades, setSalaryGrades] = useState([
    {
      id: 1,
      grade: "Grade 1",
      description: "Entry Level",
      minSalary: 2500,
      maxSalary: 4000,
      notchCount: 7,
      notches: [
        { step: 1, amount: 2500 },
        { step: 2, amount: 2750 },
        { step: 3, amount: 3000 },
        { step: 4, amount: 3250 },
        { step: 5, amount: 3500 },
        { step: 6, amount: 3750 },
        { step: 7, amount: 4000 },
      ],
    },
  ])

  const [showAddGradeModal, setShowAddGradeModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState<any>(null)
  const [isGeneratingNotches, setIsGeneratingNotches] = useState(false)
  const [isSavingGrade, setIsSavingGrade] = useState(false)
  const [newGrade, setNewGrade] = useState({
    grade: "",
    description: "",
    minSalary: 0,
    maxSalary: 0,
    notchCount: 7,
    notches: [] as any[],
  })

  // Other state variables
  const [selectedCurrency, setSelectedCurrency] = useState("ghs")
  const [payeTaxBands, setPayeTaxBands] = useState(currencyConfig.ghs.taxBands)
  const [ssnitRates, setSsnitRates] = useState(currencyConfig.ghs.socialSecurity)
  const [tier2Rates, setTier2Rates] = useState(currencyConfig.ghs.tier2)
  const [tier3Rates, setTier3Rates] = useState(currencyConfig.ghs.tier3)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [companyLogoPreview, setCompanyLogoPreview] = useState("")
  const [subsidiaryLogoPreview, setSubsidiaryLogoPreview] = useState("")
  const [subsidiaries, setSubsidiaries] = useState<any[]>([])
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<any>(null)
  const [documentZoom, setDocumentZoom] = useState(100)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    console.log("[v0] SettingsPage initialized")
  }, [])

  const getCurrencyConfig = (currency: string) => {
    return currencyConfig[currency as keyof typeof currencyConfig] || currencyConfig.ghs
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    const selectedConfig = getCurrencyConfig(currency)
    if (selectedConfig && selectedConfig.taxBands) {
      setPayeTaxBands(selectedConfig.taxBands)
      if (selectedConfig.socialSecurity) {
        setSsnitRates({
          employee: selectedConfig.socialSecurity.employee,
          employer: selectedConfig.socialSecurity.employer,
          total: selectedConfig.socialSecurity.total,
        })
      }
      if (selectedConfig.tier2) {
        setTier2Rates({
          employee: selectedConfig.tier2.employee,
          employer: selectedConfig.tier2.employer,
          total: selectedConfig.tier2.total,
        })
      }
      if (selectedConfig.tier3) {
        setTier3Rates({
          employee: selectedConfig.tier3.employee,
          employer: selectedConfig.tier3.employer,
          total: selectedConfig.tier3.total,
        })
      }
    }
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus("testing")

    try {
      // Simulate API call to test email connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate success/failure based on configuration
      const isValid = emailConfig.host && emailConfig.username && emailConfig.password

      if (isValid) {
        setConnectionStatus("success")
        toast({
          title: "Connection Successful",
          description: "Email configuration is working correctly.",
        })
      } else {
        setConnectionStatus("error")
        toast({
          title: "Connection Failed",
          description: "Please check your email configuration settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus("error")
      toast({
        title: "Connection Failed",
        description: "Unable to test email connection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
      // Reset status after 3 seconds
      setTimeout(() => setConnectionStatus("idle"), 3000)
    }
  }

  const handleGenerateNotches = async () => {
    if (!newGrade.minSalary || !newGrade.maxSalary || newGrade.notchCount < 2) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid minimum salary, maximum salary, and number of notches (minimum 2).",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingNotches(true)

    try {
      // Simulate generation delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const notches = []
      const salaryDifference = newGrade.maxSalary - newGrade.minSalary
      const stepIncrement = salaryDifference / (newGrade.notchCount - 1)

      for (let i = 0; i < newGrade.notchCount; i++) {
        notches.push({
          step: i + 1,
          amount: Math.round(newGrade.minSalary + stepIncrement * i),
        })
      }

      setNewGrade({ ...newGrade, notches })

      toast({
        title: "Notches Generated",
        description: `Successfully generated ${newGrade.notchCount} salary notches.`,
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate notches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingNotches(false)
    }
  }

  const handleSaveSalaryGrade = () => {
    if (!newGrade.grade || !newGrade.description || newGrade.notches.length === 0) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields and generate notches.",
        variant: "destructive",
      })
      return
    }

    setIsSavingGrade(true)

    setTimeout(() => {
      const gradeToAdd = {
        id: editingGrade ? editingGrade.id : Date.now(),
        ...newGrade,
      }

      if (editingGrade) {
        setSalaryGrades((prev) => prev.map((grade) => (grade.id === editingGrade.id ? gradeToAdd : grade)))
        toast({
          title: "Grade Updated",
          description: "Salary grade has been successfully updated.",
        })
        setEditingGrade(null)
      } else {
        setSalaryGrades((prev) => [...prev, gradeToAdd])
        toast({
          title: "Grade Added",
          description: "New salary grade has been successfully added.",
        })
      }

      setShowAddGradeModal(false)
      setNewGrade({
        grade: "",
        description: "",
        minSalary: 0,
        maxSalary: 0,
        notchCount: 7,
        notches: [],
      })
      setIsSavingGrade(false)
    }, 1000)
  }

  const handleEditGrade = (grade: any) => {
    setEditingGrade(grade)
    setNewGrade({
      grade: grade.grade,
      description: grade.description,
      minSalary: grade.minSalary,
      maxSalary: grade.maxSalary,
      notchCount: grade.notchCount,
      notches: grade.notches,
    })
    setShowAddGradeModal(true)
  }

  const handleDeleteGrade = (gradeId: number) => {
    setSalaryGrades((prev) => prev.filter((grade) => grade.id !== gradeId))
    toast({
      title: "Grade Deleted",
      description: "Salary grade has been successfully deleted.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your organization settings and configurations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="multi-company">Multi-Company</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={companyData.registration_number}
                      onChange={(e) => setCompanyData({ ...companyData, registration_number: e.target.value })}
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
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HR Tab */}
        <TabsContent value="hr">
          <div className="space-y-6">
            {/* Salary Grades & Notches Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Salary Grades & Notches</span>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingGrade(null)
                      setNewGrade({
                        grade: "",
                        description: "",
                        minSalary: 0,
                        maxSalary: 0,
                        notchCount: 7,
                        notches: [],
                      })
                      setShowAddGradeModal(true)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Grade
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salaryGrades.map((grade) => (
                    <div key={grade.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{grade.grade}</h3>
                          <p className="text-sm text-gray-600">{grade.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditGrade(grade)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteGrade(grade.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Min Salary:</span>
                          <p className="font-medium">₵{grade.minSalary.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Max Salary:</span>
                          <p className="font-medium">₵{grade.maxSalary.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Notches:</span>
                          <p className="font-medium">{grade.notches.length} steps</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Increment:</span>
                          <p className="font-medium">
                            ₵
                            {Math.round(
                              (grade.maxSalary - grade.minSalary) / (grade.notches.length - 1),
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Configuration</span>
                </CardTitle>
                <p className="text-sm text-gray-600">Configure SMTP settings for sending notifications</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailProvider">Email Provider</Label>
                    <Select
                      value={emailConfig.provider}
                      onValueChange={(value) => setEmailConfig({ ...emailConfig, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMTP">SMTP</SelectItem>
                        <SelectItem value="SendGrid">SendGrid</SelectItem>
                        <SelectItem value="Mailgun">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      value={emailConfig.fromEmail}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailConfig.host}
                      onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={emailConfig.port}
                      onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="replyTo">Reply To</Label>
                    <Input
                      id="replyTo"
                      value={emailConfig.replyTo}
                      onChange={(e) => setEmailConfig({ ...emailConfig, replyTo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={emailConfig.username}
                      onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableTLS"
                        checked={emailConfig.enableTLS}
                        onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, enableTLS: checked })}
                      />
                      <Label htmlFor="enableTLS">Enable TLS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableSSL"
                        checked={emailConfig.enableSSL}
                        onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, enableSSL: checked })}
                      />
                      <Label htmlFor="enableSSL">Enable SSL</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPasswordEmail ? "text" : "password"}
                      value={emailConfig.password}
                      onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordEmail(!showPasswordEmail)}
                    >
                      {showPasswordEmail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className={`
                      ${connectionStatus === "success" ? "border-green-500 text-green-600" : ""}
                      ${connectionStatus === "error" ? "border-red-500 text-red-600" : ""}
                    `}
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : connectionStatus === "success" ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Connection Successful
                      </>
                    ) : connectionStatus === "error" ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Connection Failed
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs content would go here */}
        <TabsContent value="multi-company">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Company Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Multi-company configuration options will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Payroll configuration options will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Role and permission management will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Access control settings will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Security configuration options will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Salary Grade Modal */}
      {showAddGradeModal && (
        <Dialog open={showAddGradeModal} onOpenChange={setShowAddGradeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingGrade ? "Edit Salary Grade" : "Add New Salary Grade"}</DialogTitle>
              <p className="text-sm text-gray-600">Configure salary grade details and notch structure</p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gradeName">Grade Name</Label>
                  <Input
                    id="gradeName"
                    value={newGrade.grade}
                    onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                    placeholder="Grade 1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newGrade.description}
                    onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                    placeholder="Entry Level"
                  />
                </div>
                <div>
                  <Label htmlFor="minSalary">Minimum Salary (₵)</Label>
                  <Input
                    id="minSalary"
                    type="number"
                    value={newGrade.minSalary}
                    onChange={(e) => setNewGrade({ ...newGrade, minSalary: Number(e.target.value) })}
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label htmlFor="maxSalary">Maximum Salary (₵)</Label>
                  <Input
                    id="maxSalary"
                    type="number"
                    value={newGrade.maxSalary}
                    onChange={(e) => setNewGrade({ ...newGrade, maxSalary: Number(e.target.value) })}
                    placeholder="4000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notchCount">Number of Notches/Steps</Label>
                <Input
                  id="notchCount"
                  type="number"
                  min="2"
                  max="20"
                  value={newGrade.notchCount}
                  onChange={(e) => setNewGrade({ ...newGrade, notchCount: Number(e.target.value) })}
                  placeholder="7"
                />
                <p className="text-xs text-gray-500 mt-1">Specify between 2-20 steps for this grade</p>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={handleGenerateNotches}
                  disabled={isGeneratingNotches || !newGrade.minSalary || !newGrade.maxSalary}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGeneratingNotches ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Gear className="mr-2 h-4 w-4" />
                      Generate Notches
                    </>
                  )}
                </Button>
                {newGrade.notches.length > 0 && (
                  <span className="text-sm text-gray-600">{newGrade.notches.length} notches configured</span>
                )}
              </div>

              {newGrade.notches.length > 0 && (
                <div>
                  <Label>Generated Notches Preview</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {newGrade.notches.map((notch) => (
                      <div key={notch.step} className="flex justify-between py-1">
                        <span className="text-sm">Step {notch.step}</span>
                        <span className="text-sm font-medium">₵{notch.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddGradeModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSalaryGrade}
                disabled={isSavingGrade || !newGrade.grade || !newGrade.description || newGrade.notches.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSavingGrade ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingGrade ? "Update Grade" : "Save Grade"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
