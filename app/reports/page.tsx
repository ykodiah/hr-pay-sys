"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import {
  Download,
  Calendar,
  Search,
  Plus,
  Settings,
  Clock,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Table,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Save,
  ChevronDown,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
} from "recharts"

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  frequency: string
  lastGenerated?: string
  isScheduled?: boolean
  downloadCount?: number
}

interface CustomReport {
  id: string
  name: string
  description: string
  dataSource: string
  filters: any[]
  columns: string[]
  chartType?: string
  schedule?: {
    enabled: boolean
    frequency: string
    recipients: string[]
  }
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("templates")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedFrequency, setSelectedFrequency] = useState("all")
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [customReports, setCustomReports] = useState<CustomReport[]>([
    {
      id: "custom-1",
      name: "Department Salary Analysis",
      description: "Custom salary breakdown by department with overtime",
      dataSource: "payroll",
      filters: [],
      columns: ["department", "base_salary", "overtime", "total"],
      chartType: "bar",
      schedule: {
        enabled: true,
        frequency: "monthly",
        recipients: ["hr@company.com"],
      },
    },
  ])

  const reportTemplates: ReportTemplate[] = [
    {
      id: "payroll-summary",
      name: "Monthly Payroll Summary",
      description: "Complete payroll breakdown with PAYE and SSNIT calculations",
      category: "payroll",
      frequency: "Monthly",
      lastGenerated: "2025-01-10",
      isScheduled: true,
      downloadCount: 45,
    },
    {
      id: "employee-payslips",
      name: "Employee Payslips",
      description: "Individual payslips for all employees with bank details",
      category: "payroll",
      frequency: "Monthly",
      lastGenerated: "2025-01-10",
      isScheduled: true,
      downloadCount: 120,
    },
    {
      id: "ssnit-tier1-report",
      name: "SSNIT Tier 1 Report",
      description: "SSNIT Tier 1 contributions with employee SSNIT numbers",
      category: "compliance",
      frequency: "Monthly",
      lastGenerated: "2025-01-08",
      isScheduled: true,
      downloadCount: 32,
    },
    {
      id: "ssnit-tier2-report",
      name: "SSNIT Tier 2 Report",
      description: "SSNIT Tier 2 contributions with employee SSNIT numbers",
      category: "compliance",
      frequency: "Monthly",
      lastGenerated: "2025-01-08",
      isScheduled: true,
      downloadCount: 28,
    },
    {
      id: "paye-report",
      name: "PAYE Tax Report",
      description: "Pay As You Earn tax deductions with Ghana card numbers",
      category: "compliance",
      frequency: "Monthly",
      lastGenerated: "2025-01-08",
      isScheduled: true,
      downloadCount: 28,
    },
    {
      id: "tier3-report",
      name: "Tier 3 Provident Fund Report",
      description: "Provident fund contributions and balances with employee details",
      category: "compliance",
      frequency: "Monthly",
      lastGenerated: "2025-01-08",
      isScheduled: false,
      downloadCount: 15,
    },
    {
      id: "loans-report",
      name: "Loans & Advances Report",
      description: "Employee loans, advances, and repayment schedules",
      category: "payroll",
      frequency: "Monthly",
      lastGenerated: "2025-01-05",
      isScheduled: false,
      downloadCount: 22,
    },
    {
      id: "leave-summary",
      name: "Leave Summary Report",
      description: "Leave balances and usage by employee",
      category: "hr",
      frequency: "Monthly",
      lastGenerated: "2025-01-12",
      isScheduled: true,
      downloadCount: 38,
    },
    {
      id: "employee-directory",
      name: "Employee Directory",
      description: "Complete list of all employees with contact details",
      category: "hr",
      frequency: "On-demand",
      lastGenerated: "2025-01-11",
      isScheduled: false,
      downloadCount: 67,
    },
    {
      id: "departmental-summary",
      name: "Departmental Payroll Summary",
      description: "Payroll costs broken down by department",
      category: "analytics",
      frequency: "Monthly",
      lastGenerated: "2025-01-10",
      isScheduled: true,
      downloadCount: 41,
    },
    {
      id: "subsidiary-summary",
      name: "Subsidiary Payroll Summary",
      description: "Multi-location payroll consolidation",
      category: "analytics",
      frequency: "Monthly",
      lastGenerated: "2025-01-10",
      isScheduled: false,
      downloadCount: 19,
    },
    {
      id: "grouped-payroll-summary",
      name: "Grouped Payroll Summary",
      description: "Payroll summary grouped by departments and locations",
      category: "analytics",
      frequency: "Monthly",
      lastGenerated: "2025-01-10",
      isScheduled: false,
      downloadCount: 25,
    },
    {
      id: "allowances-schedule",
      name: "Allowances Schedule",
      description: "Detailed breakdown of taxable and non-taxable allowances",
      category: "payroll",
      frequency: "Monthly",
      lastGenerated: "2025-01-10",
      isScheduled: false,
      downloadCount: 33,
    },
  ]

  const filteredReports = reportTemplates.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || report.category === selectedCategory
    const matchesFrequency = selectedFrequency === "all" || report.frequency.toLowerCase() === selectedFrequency
    return matchesSearch && matchesCategory && matchesFrequency
  })

  const handleDownloadReport = (reportId: string, reportName: string, format: "pdf" | "excel" = "pdf") => {
    let reportContent = ""

    switch (reportId) {
      case "ssnit-tier1-report":
        reportContent = generateSSNITTier1Report()
        break
      case "ssnit-tier2-report":
        reportContent = generateSSNITTier2Report()
        break
      case "paye-report":
        reportContent = generatePAYEReport()
        break
      case "tier3-report":
        reportContent = generateTier3Report()
        break
      case "allowances-schedule":
        reportContent = generateAllowancesSchedule()
        break
      default:
        reportContent = `Generated ${reportName} report`
    }

    const link = document.createElement("a")
    link.href = "#"
    link.download = `${reportName.replace(/\s+/g, "_")}.${format}`
    link.click()

    toast({
      title: "Download Started",
      description: `${reportName} is being downloaded in ${format.toUpperCase()} format.`,
    })
  }

  const handleBulkDownload = async (format: string) => {
    if (selectedReports.length === 0) {
      toast({
        title: "No Reports Selected",
        description: "Please select at least one report to download.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Generating Reports",
      description: `Preparing ${selectedReports.length} reports in ${format.toUpperCase()} format...`,
    })

    // Simulate bulk download
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `${selectedReports.length} reports downloaded successfully.`,
      })
      setSelectedReports([])
    }, 3000)
  }

  const handleScheduleReport = (reportId: string) => {
    toast({
      title: "Report Scheduled",
      description: "Report has been added to the automated schedule.",
    })
  }

  const sampleChartData = [
    { name: "Technology", value: 156000, employees: 45 },
    { name: "Sales", value: 142000, employees: 62 },
    { name: "Marketing", value: 98000, employees: 28 },
    { name: "Finance", value: 87000, employees: 18 },
    { name: "HR", value: 54000, employees: 12 },
    { name: "Operations", value: 168000, employees: 82 },
  ]

  const generateSSNITTier1Report = () => {
    return `
SSNIT TIER 1 CONTRIBUTION REPORT
Period: January 2025
Generated: ${new Date().toLocaleDateString()}

Employee Name          | Employee ID | SSNIT Number      | Basic Salary | Employee (5.5%) | Employer (13%) | Total
--------------------- | ----------- | ----------------- | ------------ | --------------- | -------------- | -------
KWAME ASANTE          | EMP001      | GHA-001689781-4   | 8,500.00     | 467.50          | 1,105.00       | 1,572.50
AMA OSEI              | EMP002      | GHA-002345678-9   | 7,200.00     | 396.00          | 936.00         | 1,332.00
KOFI MENSAH           | EMP003      | GHA-003456789-0   | 5,800.00     | 319.00          | 754.00         | 1,073.00
AKOSUA BOATENG        | EMP004      | GHA-004567890-1   | 6,500.00     | 357.50          | 845.00         | 1,202.50
YAW ADJEI             | EMP005      | GHA-005678901-2   | 4,200.00     | 231.00          | 546.00         | 777.00

TOTALS                |             |                   | 32,200.00    | 1,771.00        | 4,186.00       | 5,957.00

Company: MIKADDO HOLDINGS LIMITED
Prepared by: AkwaabaHRPay - Welcome to Growth
    `
  }

  const generateSSNITTier2Report = () => {
    return `
SSNIT TIER 2 CONTRIBUTION REPORT
Period: January 2025
Generated: ${new Date().toLocaleDateString()}

Employee Name          | Employee ID | SSNIT Number      | Basic Salary | Tier 2 Fund Name        | Contribution
--------------------- | ----------- | ----------------- | ------------ | ----------------------- | ------------
KWAME ASANTE          | EMP001      | GHA-001689781-4   | 8,500.00     | Enterprise Trustees     | 425.00
AMA OSEI              | EMP002      | GHA-002345678-9   | 7,200.00     | GLICO Pensions          | 360.00
KOFI MENSAH           | EMP003      | GHA-003456789-0   | 5,800.00     | Metropolitan Pensions   | 290.00
AKOSUA BOATENG        | EMP004      | GHA-004567890-1   | 6,500.00     | Enterprise Trustees     | 325.00
YAW ADJEI             | EMP005      | GHA-005678901-2   | 4,200.00     | GLICO Pensions          | 210.00

TOTAL TIER 2 CONTRIBUTIONS                                                                      | 1,610.00

Company: MIKADDO HOLDINGS LIMITED
Prepared by: AkwaabaHRPay - Welcome to Growth
    `
  }

  const generatePAYEReport = () => {
    return `
PAYE TAX REPORT
Period: January 2025
Generated: ${new Date().toLocaleDateString()}

Employee Name          | Employee ID | Ghana Card Number | Taxable Income | PAYE Tax   | Tax Band
--------------------- | ----------- | ----------------- | -------------- | ---------- | ---------
KWAME ASANTE          | EMP001      | GHA-123456789-0   | 7,607.50       | 1,248.98   | 25%
AMA OSEI              | EMP002      | GHA-234567890-1   | 6,444.00       | 998.75     | 17.5%
KOFI MENSAH           | EMP003      | GHA-345678901-2   | 5,191.00       | 748.25     | 17.5%
AKOSUA BOATENG        | EMP004      | GHA-456789012-3   | 5,817.50       | 873.50     | 17.5%
YAW ADJEI             | EMP005      | GHA-567890123-4   | 3,759.00       | 498.75     | 10%

TOTAL PAYE TAX COLLECTED                                                   | 4,368.23

Tax Rates Applied:
- 0% on first GHS 365
- 5% on next GHS 365 (GHS 365 - GHS 730)
- 10% on next GHS 365 (GHS 730 - GHS 1,095)
- 17.5% on next GHS 365 (GHS 1,095 - GHS 1,460)
- 25% on next GHS 2,190 (GHS 1,460 - GHS 3,650)
- 30% on amounts above GHS 3,650

Company: MIKADDO HOLDINGS LIMITED
Prepared by: AkwaabaHRPay - Welcome to Growth
    `
  }

  const generateTier3Report = () => {
    return `
TIER 3 PROVIDENT FUND REPORT
Period: January 2025
Generated: ${new Date().toLocaleDateString()}

Employee Name          | Employee ID | Basic Salary | Employee Rate | Employee Contrib | Employer Rate | Employer Contrib | Total
--------------------- | ----------- | ------------ | ------------- | --------------- | ------------- | --------------- | -------
KWAME ASANTE          | EMP001      | 8,500.00     | 5.0%          | 425.00          | 5.0%          | 425.00          | 850.00
AMA OSEI              | EMP002      | 7,200.00     | 5.0%          | 360.00          | 5.0%          | 360.00          | 720.00
KOFI MENSAH           | EMP003      | 5,800.00     | 3.0%          | 174.00          | 3.0%          | 174.00          | 348.00
AKOSUA BOATENG        | EMP004      | 6,500.00     | 5.0%          | 325.00          | 5.0%          | 325.00          | 650.00
YAW ADJEI             | EMP005      | 4,200.00     | 5.0%          | 210.00          | 5.0%          | 210.00          | 420.00

TOTALS                |             | 32,200.00    |               | 1,494.00        |               | 1,494.00        | 2,988.00

Note: Contribution rates are configurable per employee based on their preference and company policy.
Maximum contribution rate is 20% of basic salary as per Ghana pension regulations.

Company: MIKADDO HOLDINGS LIMITED
Prepared by: AkwaabaHRPay - Welcome to Growth
    `
  }

  const generateAllowancesSchedule = () => {
    return `
ALLOWANCES SCHEDULE
Period: January 2025
Generated: ${new Date().toLocaleDateString()}

TAXABLE ALLOWANCES:
Employee Name          | Employee ID | Transport | Housing  | Medical | Other | Total Taxable
--------------------- | ----------- | --------- | -------- | ------- | ----- | -------------
KWAME ASANTE          | EMP001      | 500.00    | 600.00   | 100.00  | 0.00  | 1,200.00
AMA OSEI              | EMP002      | 400.00    | 350.00   | 50.00   | 0.00  | 800.00
KOFI MENSAH           | EMP003      | 300.00    | 100.00   | 0.00    | 0.00  | 400.00
AKOSUA BOATENG        | EMP004      | 350.00    | 200.00   | 75.00   | 0.00  | 625.00
YAW ADJEI             | EMP005      | 250.00    | 150.00   | 0.00    | 0.00  | 400.00

TOTAL TAXABLE ALLOWANCES                                                    | 3,425.00

NON-TAXABLE ALLOWANCES:
Employee Name          | Employee ID | Uniform  | Training | Tools   | Other | Total Non-Taxable
--------------------- | ----------- | -------- | -------- | ------- | ----- | -----------------
KWAME ASANTE          | EMP001      | 0.00     | 200.00   | 100.00  | 0.00  | 300.00
AMA OSEI              | EMP002      | 0.00     | 150.00   | 0.00    | 0.00  | 150.00
KOFI MENSAH           | EMP003      | 50.00    | 100.00   | 0.00    | 0.00  | 150.00
AKOSUA BOATENG        | EMP004      | 0.00     | 100.00   | 50.00   | 0.00  | 150.00
YAW ADJEI             | EMP005      | 25.00    | 75.00    | 0.00    | 0.00  | 100.00

TOTAL NON-TAXABLE ALLOWANCES                                                | 850.00

GRAND TOTAL ALLOWANCES                                                      | 4,275.00

Note: Taxable allowances are included in PAYE calculations. Non-taxable allowances are exempt from income tax.

Company: MIKADDO HOLDINGS LIMITED
Prepared by: AkwaabaHRPay - Welcome to Growth
    `
  }

  const availableColumns = {
    payroll: [
      "employee_name",
      "employee_id",
      "ssnit_number",
      "ghana_card_number",
      "bank_name",
      "account_number",
      "department",
      "base_salary",
      "overtime",
      "allowances_taxable",
      "allowances_non_taxable",
      "deductions",
      "net_pay",
      "paye",
      "ssnit_employee",
      "ssnit_employer",
      "tier3_employee",
      "tier3_employer",
    ],
    hr: [
      "employee_name",
      "employee_id",
      "ssnit_number",
      "ghana_card_number",
      "department",
      "position",
      "hire_date",
      "leave_balance",
      "performance_rating",
    ],
    analytics: ["department", "headcount", "avg_salary", "turnover_rate", "productivity_score"],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate, schedule, and manage comprehensive business reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <Table className="w-4 h-4 mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            {viewMode === "grid" ? "List View" : "Grid View"}
          </Button>
          <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Custom Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Custom Report Builder</DialogTitle>
              </DialogHeader>
              <CustomReportBuilder onClose={() => setIsBuilderOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="analytics">Report Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search report templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="payroll">Payroll Reports</SelectItem>
                    <SelectItem value="hr">HR Reports</SelectItem>
                    <SelectItem value="analytics">Analytics Reports</SelectItem>
                    <SelectItem value="compliance">Compliance Reports</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frequencies</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="on-demand">On-demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      {selectedReports.length} selected
                    </Badge>
                    <span className="text-sm text-emerald-700">Bulk actions available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkDownload("pdf")}>
                      <FilePdf className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkDownload("excel")}>
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Excel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedReports([])}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Templates Grid/List */}
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredReports.map((report) => (
              <Card key={report.id} className={`hover:shadow-lg transition-shadow ${viewMode === "list" ? "p-4" : ""}`}>
                <CardHeader className={viewMode === "list" ? "pb-2" : "pb-3"}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedReports.includes(report.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReports([...selectedReports, report.id])
                          } else {
                            setSelectedReports(selectedReports.filter((id) => id !== report.id))
                          }
                        }}
                      />
                      <div className="flex-1">
                        <CardTitle
                          className={`${viewMode === "list" ? "text-base" : "text-lg"} text-gray-900 leading-tight`}
                        >
                          {report.name}
                        </CardTitle>
                        {viewMode === "list" && (
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span>Category: {report.category}</span>
                            <span>•</span>
                            <span>Downloads: {report.downloadCount}</span>
                            <span>•</span>
                            <span>Last: {report.lastGenerated}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.isScheduled && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                      <Badge
                        className={`text-xs ${
                          report.category === "payroll"
                            ? "bg-emerald-100 text-emerald-800"
                            : report.category === "hr"
                              ? "bg-blue-100 text-blue-800"
                              : report.category === "analytics"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {report.frequency}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={viewMode === "list" ? "pt-0" : "pt-0"}>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{report.description}</p>

                  {viewMode === "grid" && (
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Downloads: {report.downloadCount}</span>
                      <span>Last: {report.lastGenerated}</span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                          <Download className="w-4 h-4 mr-1" />
                          Generate
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleDownloadReport(report.id, report.name, "pdf")}>
                          <FilePdf className="w-4 h-4 mr-2" />
                          Download PDF (Default)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadReport(report.id, report.name, "excel")}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Download Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => handleScheduleReport(report.id)}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Custom Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customReports.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Reports</h3>
                  <p className="text-gray-600 mb-4">Create your first custom report to get started</p>
                  <Button onClick={() => setIsBuilderOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customReports.map((report) => (
                    <Card key={report.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{report.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Source: {report.dataSource}</span>
                              <span>•</span>
                              <span>Columns: {report.columns.length}</span>
                              {report.schedule?.enabled && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600">Scheduled: {report.schedule.frequency}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Play className="w-3 h-3 mr-1" />
                              Run
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Scheduled Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTemplates
                  .filter((r) => r.isScheduled)
                  .map((report) => (
                    <Card key={report.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{report.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Frequency: {report.frequency}</span>
                              <span>•</span>
                              <span>
                                Next run: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>Recipients: hr@company.com</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Play className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Pause className="w-3 h-3 mr-1" />
                              Pause
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sampleChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} downloads`, "Downloads"]} />
                    <Bar dataKey="employees" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Categories Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Payroll", value: 45, color: "#10b981" },
                        { name: "HR", value: 30, color: "#3b82f6" },
                        { name: "Analytics", value: 15, color: "#8b5cf6" },
                        { name: "Compliance", value: 10, color: "#f59e0b" },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {[
                        { name: "Payroll", value: 45, color: "#10b981" },
                        { name: "HR", value: 30, color: "#3b82f6" },
                        { name: "Analytics", value: 15, color: "#8b5cf6" },
                        { name: "Compliance", value: 10, color: "#f59e0b" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Generation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart
                  data={[
                    { month: "Aug", reports: 120 },
                    { month: "Sep", reports: 135 },
                    { month: "Oct", reports: 148 },
                    { month: "Nov", reports: 162 },
                    { month: "Dec", reports: 178 },
                    { month: "Jan", reports: 195 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} reports`, "Generated"]} />
                  <Line type="monotone" dataKey="reports" stroke="#10b981" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CustomReportBuilder({ onClose }: { onClose: () => void }) {
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [dataSource, setDataSource] = useState("")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [chartType, setChartType] = useState("")
  const [scheduleEnabled, setScheduleEnabled] = useState(false)

  const availableColumns = {
    payroll: [
      "employee_name",
      "employee_id",
      "ssnit_number",
      "ghana_card_number",
      "bank_name",
      "account_number",
      "department",
      "base_salary",
      "overtime",
      "allowances_taxable",
      "allowances_non_taxable",
      "deductions",
      "net_pay",
      "paye",
      "ssnit_employee",
      "ssnit_employer",
      "tier3_employee",
      "tier3_employer",
    ],
    hr: [
      "employee_name",
      "employee_id",
      "ssnit_number",
      "ghana_card_number",
      "department",
      "position",
      "hire_date",
      "leave_balance",
      "performance_rating",
    ],
    analytics: ["department", "headcount", "avg_salary", "turnover_rate", "productivity_score"],
  }

  const handleSave = () => {
    if (!reportName || !dataSource || selectedColumns.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Custom Report Created",
      description: `"${reportName}" has been saved successfully.`,
    })
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-name">Report Name *</Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe what this report shows"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data-source">Data Source *</Label>
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payroll">Payroll Data</SelectItem>
                <SelectItem value="hr">HR Data</SelectItem>
                <SelectItem value="analytics">Analytics Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table Only</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Available Columns</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              {dataSource &&
                availableColumns[dataSource as keyof typeof availableColumns]?.map((column) => (
                  <div key={column} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={column}
                      checked={selectedColumns.includes(column)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedColumns([...selectedColumns, column])
                        } else {
                          setSelectedColumns(selectedColumns.filter((c) => c !== column))
                        }
                      }}
                    />
                    <Label htmlFor={column} className="text-sm capitalize">
                      {column.replace(/_/g, " ")}
                    </Label>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="schedule-enabled">Enable Scheduling</Label>
              <Switch id="schedule-enabled" checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
            </div>
            {scheduleEnabled && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="schedule-frequency">Frequency</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          Save Report
        </Button>
      </div>
    </div>
  )
}
