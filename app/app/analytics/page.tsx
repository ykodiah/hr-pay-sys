"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  LineChart,
} from "recharts"
import {
  TrendingUp,
  Users,
  DollarSign,
  Calculator,
  Download,
  Filter,
  BarChart3,
  PieChartIcon,
  RefreshCw,
  Target,
  Clock,
  TrendingDown,
  Brain,
  Calendar,
  Settings,
  Eye,
  Plus,
  Save,
  Zap,
  FileText,
  FileSpreadsheet,
  Receipt,
  Shield,
  CreditCard,
} from "lucide-react"

const payrollTrends = [
  {
    period: "2024-08",
    gross: 420000,
    paye: 63000,
    ssnit: 37800,
    tier3: 21000,
    net: 298200,
    employees: 235,
    predicted: false,
  },
  {
    period: "2024-09",
    gross: 435000,
    paye: 65250,
    ssnit: 39150,
    tier3: 21750,
    net: 308850,
    employees: 240,
    predicted: false,
  },
  {
    period: "2024-10",
    gross: 448000,
    paye: 67200,
    ssnit: 40320,
    tier3: 22400,
    net: 318080,
    employees: 245,
    predicted: false,
  },
  {
    period: "2024-11",
    gross: 462000,
    paye: 69300,
    ssnit: 41580,
    tier3: 23100,
    net: 328020,
    employees: 250,
    predicted: false,
  },
  {
    period: "2024-12",
    gross: 478900,
    paye: 71835,
    ssnit: 43101,
    tier3: 23945,
    net: 340019,
    employees: 245,
    predicted: false,
  },
  {
    period: "2025-01",
    gross: 485200,
    paye: 72780,
    ssnit: 43668,
    tier3: 24260,
    net: 344492,
    employees: 247,
    predicted: false,
  },
  {
    period: "2025-02",
    gross: 492000,
    paye: 73800,
    ssnit: 44280,
    tier3: 24600,
    net: 349320,
    employees: 250,
    predicted: true,
  },
  {
    period: "2025-03",
    gross: 498500,
    paye: 74775,
    ssnit: 44910,
    tier3: 24925,
    net: 353890,
    employees: 252,
    predicted: true,
  },
  {
    period: "2025-04",
    gross: 505200,
    paye: 75780,
    ssnit: 45468,
    tier3: 25260,
    net: 358692,
    employees: 255,
    predicted: true,
  },
]

const departmentCosts = [
  {
    department: "Technology",
    employees: 45,
    cost: 156000,
    avgSalary: 8500,
    turnover: 8.2,
    productivity: 92,
    satisfaction: 4.3,
    budget: 160000,
    utilization: 97.5,
  },
  {
    department: "Sales",
    employees: 62,
    cost: 142000,
    avgSalary: 5800,
    turnover: 15.3,
    productivity: 88,
    satisfaction: 3.9,
    budget: 145000,
    utilization: 97.9,
  },
  {
    department: "Marketing",
    employees: 28,
    cost: 98000,
    avgSalary: 6200,
    turnover: 12.1,
    productivity: 85,
    satisfaction: 4.1,
    budget: 100000,
    utilization: 98.0,
  },
  {
    department: "Finance",
    employees: 18,
    cost: 87000,
    avgSalary: 7200,
    turnover: 5.6,
    productivity: 94,
    satisfaction: 4.4,
    budget: 90000,
    utilization: 96.7,
  },
  {
    department: "HR",
    employees: 12,
    cost: 54000,
    avgSalary: 6800,
    turnover: 8.3,
    productivity: 89,
    satisfaction: 4.2,
    budget: 55000,
    utilization: 98.2,
  },
  {
    department: "Operations",
    employees: 82,
    cost: 168000,
    avgSalary: 4800,
    turnover: 18.7,
    productivity: 82,
    satisfaction: 3.7,
    budget: 170000,
    utilization: 98.8,
  },
]

const leaveAnalytics = [
  { month: "Aug", annual: 45, sick: 12, personal: 8, emergency: 3, maternity: 2, paternity: 1 },
  { month: "Sep", annual: 52, sick: 18, personal: 6, emergency: 2, maternity: 1, paternity: 2 },
  { month: "Oct", annual: 38, sick: 15, personal: 9, emergency: 4, maternity: 3, paternity: 1 },
  { month: "Nov", annual: 41, sick: 22, personal: 7, emergency: 1, maternity: 2, paternity: 0 },
  { month: "Dec", annual: 67, sick: 19, personal: 12, emergency: 5, maternity: 1, paternity: 3 },
  { month: "Jan", annual: 28, sick: 14, personal: 5, emergency: 2, maternity: 4, paternity: 1 },
]

const performanceMetrics = [
  { metric: "Employee Satisfaction", current: 4.1, target: 4.5, trend: "up" },
  { metric: "Retention Rate", current: 87.3, target: 90, trend: "up" },
  { metric: "Time to Hire", current: 28, target: 21, trend: "down" },
  { metric: "Training Hours", current: 32, target: 40, trend: "up" },
  { metric: "Productivity Index", current: 88.5, target: 92, trend: "up" },
  { metric: "Absenteeism Rate", current: 3.2, target: 2.5, trend: "down" },
]

const salaryBenchmarks = [
  { position: "Software Engineer", internal: 8500, market: 9200, variance: -7.6 },
  { position: "HR Manager", internal: 7200, market: 7800, variance: -7.7 },
  { position: "Sales Rep", internal: 5800, market: 5500, variance: 5.5 },
  { position: "Finance Officer", internal: 6500, market: 6800, variance: -4.4 },
  { position: "Marketing Specialist", internal: 6200, market: 6400, variance: -3.1 },
]

const diversityMetrics = [
  { category: "Gender", male: 58, female: 42 },
  { category: "Age Groups", "20-30": 35, "31-40": 42, "41-50": 18, "50+": 5 },
  { category: "Education", Bachelor: 45, Master: 35, PhD: 8, Diploma: 12 },
]

const complianceData = [
  { name: "PAYE Compliant", value: 247, total: 247, color: "#10b981", status: "compliant" },
  { name: "SSNIT Registered", value: 247, total: 247, color: "#3b82f6", status: "compliant" },
  { name: "Tier 3 Enrolled", value: 235, total: 247, color: "#8b5cf6", status: "warning" },
  { name: "Min Wage Review", value: 3, total: 247, color: "#f59e0b", status: "action_required" },
]

const executiveMetrics = [
  { metric: "Revenue per Employee", current: 125000, target: 130000, trend: "up", benchmark: 118000 },
  { metric: "Employee Lifetime Value", current: 450000, target: 500000, trend: "up", benchmark: 420000 },
  { metric: "Cost per Hire", current: 3200, target: 2800, trend: "down", benchmark: 3500 },
  { metric: "Training ROI", current: 340, target: 400, trend: "up", benchmark: 280 },
  { metric: "Engagement Score", current: 78, target: 85, trend: "up", benchmark: 72 },
  { metric: "Productivity Index", current: 88.5, target: 92, trend: "up", benchmark: 85 },
]

const predictiveInsights = [
  {
    title: "Attrition Risk Alert",
    description: "15 employees identified as high flight risk based on engagement patterns",
    probability: 85,
    impact: "High",
    timeframe: "Next 3 months",
    action: "Schedule retention interviews",
    category: "workforce",
  },
  {
    title: "Budget Variance Prediction",
    description: "Q2 payroll costs projected to exceed budget by 8.5%",
    probability: 72,
    impact: "Medium",
    timeframe: "Next quarter",
    action: "Review hiring plans and salary adjustments",
    category: "financial",
  },
  {
    title: "Skills Gap Analysis",
    description: "Critical shortage in data analytics skills projected for Q3",
    probability: 90,
    impact: "High",
    timeframe: "6 months",
    action: "Initiate training programs or external hiring",
    category: "skills",
  },
]

const customReports = [
  {
    id: "1",
    name: "Executive Dashboard",
    description: "High-level KPIs and trends for leadership team",
    schedule: "Weekly",
    recipients: ["CEO", "CFO", "CHRO"],
    lastRun: "2025-01-20",
    status: "active",
  },
  {
    id: "2",
    name: "Department Performance Report",
    description: "Detailed analysis of departmental metrics and costs",
    schedule: "Monthly",
    recipients: ["Department Heads"],
    lastRun: "2025-01-15",
    status: "active",
  },
  {
    id: "3",
    name: "Compliance Audit Report",
    description: "Comprehensive compliance status across all regulations",
    schedule: "Quarterly",
    recipients: ["Legal Team", "HR Manager"],
    lastRun: "2025-01-01",
    status: "active",
  },
]

const payrollReports = [
  {
    id: "monthly-payroll",
    name: "Monthly Payroll Summary",
    description: "Complete payroll breakdown with 2024 PAYE tax calculations",
    category: "Payroll",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF", "Excel"],
    records: 156,
    totalAmount: "GHS 2,847,650.00",
  },
  {
    id: "paye-tax-report",
    name: "PAYE Tax Report",
    description: "Income tax calculations using 2024 Ghana tax bands (GHS 490, 600, 730...)",
    category: "Tax",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF", "Excel"],
    records: 156,
    totalAmount: "GHS 487,250.00",
  },
  {
    id: "ssnit-tier1-tier2",
    name: "SSNIT Tier 1 & Tier 2 Report",
    description: "Social Security contributions with employee SSNIT numbers",
    category: "Statutory",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF", "Excel"],
    records: 156,
    totalAmount: "GHS 312,450.00",
  },
  {
    id: "tier3-provident-fund",
    name: "Tier 3 Provident Fund Report",
    description: "Employee and employer provident fund contributions",
    category: "Statutory",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF", "Excel"],
    records: 89,
    totalAmount: "GHS 156,780.00",
  },
  {
    id: "employee-payslips",
    name: "Employee Payslips",
    description: "Individual payslips with Ghana-specific format and bank details",
    category: "Payroll",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF"],
    records: 156,
    totalAmount: "GHS 2,847,650.00",
  },
  {
    id: "allowances-schedule",
    name: "Allowances Schedule",
    description: "Taxable and non-taxable allowances breakdown by employee",
    category: "Payroll",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF", "Excel"],
    records: 134,
    totalAmount: "GHS 445,230.00",
  },
  {
    id: "deductions-summary",
    name: "Deductions Summary",
    description: "All employee deductions including loans, advances, and statutory",
    category: "Payroll",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF", "Excel"],
    records: 156,
    totalAmount: "GHS 892,340.00",
  },
  {
    id: "bank-payment-schedule",
    name: "Bank Payment Schedule",
    description: "Net pay amounts grouped by bank for salary transfers",
    category: "Banking",
    frequency: "Monthly",
    lastGenerated: "2025-01-20",
    status: "active",
    downloadFormats: ["PDF", "Excel"],
    records: 156,
    totalAmount: "GHS 1,955,310.00",
  },
]

const handleDownloadReport = (reportId: string, format: string) => {
  const report = payrollReports.find((r) => r.id === reportId)
  if (!report) return

  // Generate report content based on type
  let content = ""
  let filename = ""

  switch (reportId) {
    case "monthly-payroll":
      content = generateMonthlyPayrollReport()
      filename = `Monthly_Payroll_Summary_${new Date().toISOString().slice(0, 7)}`
      break
    case "paye-tax-report":
      content = generatePAYEReport()
      filename = `PAYE_Tax_Report_${new Date().toISOString().slice(0, 7)}`
      break
    case "ssnit-tier1-tier2":
      content = generateSSNITReport()
      filename = `SSNIT_Tier1_Tier2_Report_${new Date().toISOString().slice(0, 7)}`
      break
    case "tier3-provident-fund":
      content = generateTier3Report()
      filename = `Tier3_Provident_Fund_Report_${new Date().toISOString().slice(0, 7)}`
      break
    case "employee-payslips":
      content = generatePayslipsReport()
      filename = `Employee_Payslips_${new Date().toISOString().slice(0, 7)}`
      break
    case "allowances-schedule":
      content = generateAllowancesReport()
      filename = `Allowances_Schedule_${new Date().toISOString().slice(0, 7)}`
      break
    case "deductions-summary":
      content = generateDeductionsReport()
      filename = `Deductions_Summary_${new Date().toISOString().slice(0, 7)}`
      break
    case "bank-payment-schedule":
      content = generateBankPaymentReport()
      filename = `Bank_Payment_Schedule_${new Date().toISOString().slice(0, 7)}`
      break
    default:
      content = generateGenericReport(report)
      filename = `${report.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 7)}`
  }

  if (format === "PDF") {
    // Generate PDF
    const blob = new Blob([content], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } else if (format === "Excel") {
    // Generate Excel-compatible CSV
    const csvContent = convertToCSV(content)
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  toast({
    title: "Report Downloaded",
    description: `${report.name} has been downloaded in ${format} format.`,
  })
}

const generateMonthlyPayrollReport = () => {
  return `
    <html>
      <head>
        <title>Monthly Payroll Summary</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
          .total { font-weight: bold; background-color: #e6f7ff; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>Monthly Payroll Summary - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <h3>Payroll Summary</h3>
          <p><strong>Total Employees:</strong> 156</p>
          <p><strong>Gross Salary:</strong> GHS 2,847,650.00</p>
          <p><strong>Total Deductions:</strong> GHS 892,340.00</p>
          <p><strong>Net Pay:</strong> GHS 1,955,310.00</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Basic Salary</th>
              <th>Allowances</th>
              <th>Gross Pay</th>
              <th>PAYE Tax</th>
              <th>SSNIT Employee</th>
              <th>Tier 3 PF</th>
              <th>Other Deductions</th>
              <th>Net Pay</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EMP001</td>
              <td>Kwame Asante</td>
              <td>GHS 8,500.00</td>
              <td>GHS 2,500.00</td>
              <td>GHS 11,000.00</td>
              <td>GHS 1,247.50</td>
              <td>GHS 467.50</td>
              <td>GHS 977.50</td>
              <td>GHS 150.00</td>
              <td>GHS 8,157.50</td>
            </tr>
            <tr class="total">
              <td colspan="9"><strong>TOTAL</strong></td>
              <td><strong>GHS 1,955,310.00</strong></td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

const generatePAYEReport = () => {
  return `
    <html>
      <head>
        <title>PAYE Tax Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .tax-bands { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>PAYE Tax Report - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
          <p>Using 2024 Ghana Revenue Authority Tax Bands</p>
        </div>
        
        <div class="tax-bands">
          <h3>2024 Tax Bands Applied</h3>
          <ul>
            <li>First GHS 490: 0%</li>
            <li>Next GHS 110: 5%</li>
            <li>Next GHS 130: 10%</li>
            <li>Next GHS 3,166.67: 17.5%</li>
            <li>Next GHS 16,000: 25%</li>
            <li>Next GHS 30,520: 30%</li>
            <li>Exceeding GHS 50,000: 35%</li>
          </ul>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Ghana Card No.</th>
              <th>Taxable Income</th>
              <th>Tax Band</th>
              <th>PAYE Tax</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EMP001</td>
              <td>Kwame Asante</td>
              <td>GHA-123456789-0</td>
              <td>GHS 9,555.00</td>
              <td>25%</td>
              <td>GHS 1,247.50</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

const generateSSNITReport = () => {
  return `
    <html>
      <head>
        <title>SSNIT Tier 1 & Tier 2 Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>SSNIT Tier 1 & Tier 2 Report - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>SSNIT Number</th>
              <th>Basic Salary</th>
              <th>Employee (5.5%)</th>
              <th>Employer (13%)</th>
              <th>Total SSNIT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EMP001</td>
              <td>Kwame Asante</td>
              <td>C123456789012</td>
              <td>GHS 8,500.00</td>
              <td>GHS 467.50</td>
              <td>GHS 1,105.00</td>
              <td>GHS 1,572.50</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

const generateTier3Report = () => {
  return `
    <html>
      <head>
        <title>Tier 3 Provident Fund Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>Tier 3 Provident Fund Report - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Basic Salary</th>
              <th>Employee Contribution</th>
              <th>Employer Contribution</th>
              <th>Total PF</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EMP001</td>
              <td>Kwame Asante</td>
              <td>GHS 8,500.00</td>
              <td>GHS 977.50</td>
              <td>GHS 425.00</td>
              <td>GHS 1,402.50</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

const generatePayslipsReport = () => {
  return `
    <html>
      <head>
        <title>Employee Payslips</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .payslip { border: 2px solid #059669; margin: 30px 0; padding: 20px; page-break-after: always; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 20px; font-weight: bold; }
          .payslip-info { display: flex; justify-content: space-between; margin: 15px 0; }
          .earnings-deductions { display: flex; justify-content: space-between; }
          .section { width: 48%; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .net-pay { font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="payslip">
          <div class="header">
            <div class="company-name">COMPANY NAME</div>
            <h3>Payslip</h3>
          </div>
          
          <div class="payslip-info">
            <div>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Period:</strong> ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
              <p><strong>Employee Name:</strong> KWAME ASANTE</p>
              <p><strong>Job Title:</strong> ACCOUNTANT</p>
            </div>
            <div>
              <p><strong>SSNIT No.:</strong> C123456789012</p>
              <p><strong>Bank:</strong> GT BANK</p>
              <p><strong>Acc. Number:</strong> 20610953414</p>
            </div>
          </div>

          <div class="earnings-deductions">
            <div class="section">
              <h4>EARNINGS</h4>
              <table>
                <tr><td>BASIC SALARY</td><td>GHS 8,500.00</td></tr>
                <tr><td>TRANSPORT ALLOWANCE</td><td>GHS 500.00</td></tr>
                <tr><td><strong>GROSS SALARY</strong></td><td><strong>GHS 9,000.00</strong></td></tr>
              </table>
            </div>
            
            <div class="section">
              <h4>DEDUCTIONS</h4>
              <table>
                <tr><td>SSNIT EMPLOYEE (5.5%)</td><td>GHS 467.50</td></tr>
                <tr><td>INCOME TAX</td><td>GHS 1,247.50</td></tr>
                <tr><td>PROVIDENT FUND (11.5%)</td><td>GHS 977.50</td></tr>
                <tr><td><strong>TOTAL DEDUCTIONS</strong></td><td><strong>GHS 2,692.50</strong></td></tr>
              </table>
            </div>
          </div>

          <div class="net-pay">
            <strong>NET PAY: GHS 6,307.50</strong>
          </div>

          <div style="margin-top: 20px; font-size: 12px;">
            <p><strong>SSNIT - EMPLOYER (13%):</strong> GHS 1,105.00</p>
            <p><strong>PROVIDENT FUND - EMPLOYER (5%):</strong> GHS 425.00</p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px;">
            <p>akwaabahrpay - Welcome to Growth</p>
            <p>Print date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
    </html>
  `
}

const generateAllowancesReport = () => {
  return `
    <html>
      <head>
        <title>Allowances Schedule</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .taxable { background-color: #fff2e6; }
          .non-taxable { background-color: #e6f7ff; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>Allowances Schedule - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Transport</th>
              <th>Housing</th>
              <th>Meal</th>
              <th>Medical</th>
              <th>Total Taxable</th>
              <th>Total Non-Taxable</th>
              <th>Total Allowances</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EMP001</td>
              <td>Kwame Asante</td>
              <td class="taxable">GHS 500.00</td>
              <td class="non-taxable">GHS 1,200.00</td>
              <td class="taxable">GHS 300.00</td>
              <td class="non-taxable">GHS 500.00</td>
              <td>GHS 800.00</td>
              <td>GHS 1,700.00</td>
              <td>GHS 2,500.00</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

const generateDeductionsReport = () => {
  return `
    <html>
      <head>
        <title>Deductions Summary</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>Deductions Summary - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>PAYE Tax</th>
              <th>SSNIT Employee</th>
              <th>Tier 3 PF</th>
              <th>Loans</th>
              <th>Advances</th>
              <th>Other</th>
              <th>Total Deductions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EMP001</td>
              <td>Kwame Asante</td>
              <td>GHS 1,247.50</td>
              <td>GHS 467.50</td>
              <td>GHS 977.50</td>
              <td>GHS 0.00</td>
              <td>GHS 0.00</td>
              <td>GHS 0.00</td>
              <td>GHS 2,692.50</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

const generateBankPaymentReport = () => {
  return `
    <html>
      <head>
        <title>Bank Payment Schedule</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .bank-total { background-color: #f0f8ff; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>Bank Payment Schedule - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Bank Name</th>
              <th>Employee Count</th>
              <th>Total Net Pay</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GT Bank</td>
              <td>45</td>
              <td>GHS 587,850.00</td>
              <td>${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>GCB Bank</td>
              <td>38</td>
              <td>GHS 495,230.00</td>
              <td>${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Ecobank</td>
              <td>32</td>
              <td>GHS 418,760.00</td>
              <td>${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Standard Chartered</td>
              <td>25</td>
              <td>GHS 326,450.00</td>
              <td>${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Fidelity Bank</td>
              <td>16</td>
              <td>GHS 127,020.00</td>
              <td>${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}</td>
            </tr>
            <tr class="bank-total">
              <td><strong>TOTAL</strong></td>
              <td><strong>156</strong></td>
              <td><strong>GHS 1,955,310.00</strong></td>
              <td><strong>-</strong></td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

const generateGenericReport = (report: any) => {
  return `
    <html>
      <head>
        <title>${report.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AkwaabaHRPay</div>
          <h2>${report.name}</h2>
          <p>${report.description}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `
}

const convertToCSV = (htmlContent: string) => {
  // Simple HTML to CSV conversion for demo purposes
  return "Employee ID,Name,Basic Salary,Allowances,Gross Pay,PAYE Tax,SSNIT Employee,Tier 3 PF,Other Deductions,Net Pay\nEMP001,Kwame Asante,8500.00,2500.00,11000.00,1247.50,467.50,977.50,150.00,8157.50"
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months")
  const [selectedView, setSelectedView] = useState("overview")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [showReportBuilder, setShowReportBuilder] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(() => {
        setLastUpdated(new Date())
        console.log("[v0] Real-time analytics data updated")
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isRealTimeEnabled])

  const currentMonth = payrollTrends.filter((p) => !p.predicted)[payrollTrends.filter((p) => !p.predicted).length - 1]
  const previousMonth = payrollTrends.filter((p) => !p.predicted)[payrollTrends.filter((p) => !p.predicted).length - 2]
  const grossChange = ((currentMonth.gross - previousMonth.gross) / previousMonth.gross) * 100
  const netChange = ((currentMonth.net - previousMonth.net) / previousMonth.net) * 100
  const employeeChange = currentMonth.employees - previousMonth.employees

  const filteredDepartmentData =
    selectedDepartments.length > 0
      ? departmentCosts.filter((dept) => selectedDepartments.includes(dept.department))
      : departmentCosts

  const handleDepartmentToggle = (department: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(department) ? prev.filter((d) => d !== department) : [...prev, department],
    )
  }

  const handleRefreshData = () => {
    setLastUpdated(new Date())
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated with the latest information.",
    })
  }

  const handleCreateReport = () => {
    toast({
      title: "Report Created",
      description: "Your custom report has been saved and scheduled successfully.",
    })
    setShowReportBuilder(false)
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced HR Analytics</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-gray-600">AI-powered insights and predictive analytics</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="realtime" checked={isRealTimeEnabled} onCheckedChange={setIsRealTimeEnabled} />
            <Label htmlFor="realtime" className="text-sm">
              Real-time updates
            </Label>
          </div>
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showReportBuilder} onOpenChange={setShowReportBuilder}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Custom Report Builder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Name</Label>
                    <Input placeholder="Enter report name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive">Executive Summary</SelectItem>
                        <SelectItem value="departmental">Departmental Analysis</SelectItem>
                        <SelectItem value="compliance">Compliance Report</SelectItem>
                        <SelectItem value="custom">Custom Dashboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the report purpose and content..." />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Schedule</Label>
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
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Input placeholder="Enter email addresses" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Metrics to Include</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {executiveMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox id={`metric-${index}`} />
                        <Label htmlFor={`metric-${index}`} className="text-sm">
                          {metric.metric}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowReportBuilder(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReport}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("payroll")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                    <p className="text-2xl font-bold text-gray-900">GHS {currentMonth.gross.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+{grossChange.toFixed(1)}% from last month</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("payroll")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Pay</p>
                    <p className="text-2xl font-bold text-gray-900">GHS {currentMonth.net.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+{netChange.toFixed(1)}% from last month</span>
                    </div>
                  </div>
                  <Calculator className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveTab("workforce")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{currentMonth.employees}</p>
                    <div className="flex items-center mt-1">
                      {employeeChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                      )}
                      <span className={`text-xs ${employeeChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {employeeChange >= 0 ? "+" : ""}
                        {employeeChange} from last month
                      </span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveTab("performance")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
                    <p className="text-2xl font-bold text-gray-900">
                      GHS {Math.round(currentMonth.gross / currentMonth.employees).toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                      <span className="text-xs text-emerald-600">+3.2% from last month</span>
                    </div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Key Performance Indicators</span>
                <Badge variant="secondary">vs Industry Benchmark</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                      <div className="flex items-center space-x-1">
                        {metric.trend === "up" ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <span className="text-xs text-gray-500">
                          {metric.current}
                          {metric.metric.includes("Rate") || metric.metric.includes("Index")
                            ? "%"
                            : metric.metric.includes("Time")
                              ? " days"
                              : metric.metric.includes("Hours")
                                ? " hrs"
                                : ""}
                        </span>
                      </div>
                    </div>
                    <Progress value={(metric.current / metric.target) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Current: {metric.current}</span>
                      <span>Target: {metric.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Payroll Trends & Predictions</span>
                  <Badge variant="outline">3-month forecast</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={payrollTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        `${name === "employees" ? "" : "GHS "}${Number(value).toLocaleString()}`,
                        name === "employees" ? "Employees" : name,
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="gross" fill="#10b981" name="Gross Pay" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="employees"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDashArray={(entry: any) => (entry.predicted ? "5 5" : "0")}
                      name="Employees"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5" />
                  <span>Department Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredDepartmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="employees"
                      label={({ department, employees }) => `${department}: ${employees}`}
                    >
                      {filteredDepartmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executive" className="space-y-6">
          <ExecutiveDashboard metrics={executiveMetrics} />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveAnalytics insights={predictiveInsights} payrollData={payrollTrends} />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Comprehensive Payroll Reports</h2>
                <p className="text-gray-600">All payroll reports with 2024 PAYE calculations and Ghana compliance</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Reports
                </Button>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Bulk Download
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {payrollReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{report.name}</h3>
                          <Badge
                            className={
                              report.category === "Payroll"
                                ? "bg-blue-100 text-blue-700"
                                : report.category === "Tax"
                                  ? "bg-red-100 text-red-700"
                                  : report.category === "Statutory"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-purple-100 text-purple-700"
                            }
                          >
                            {report.category}
                          </Badge>
                          <Badge
                            className={
                              report.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{report.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {report.frequency}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {report.records} records
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {report.totalAmount}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Last: {report.lastGenerated}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        {report.downloadFormats.includes("PDF") && (
                          <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report.id, "PDF")}>
                            <FileText className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        )}
                        {report.downloadFormats.includes("Excel") && (
                          <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report.id, "Excel")}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Excel
                          </Button>
                        )}
                        <Button size="sm">
                          <Zap className="w-4 h-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Gross Pay</p>
                      <p className="text-2xl font-bold text-gray-900">GHS 2.85M</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">+12.5% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">PAYE Tax Collected</p>
                      <p className="text-2xl font-bold text-gray-900">GHS 487K</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <Receipt className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Using 2024 tax bands</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">SSNIT Contributions</p>
                      <p className="text-2xl font-bold text-gray-900">GHS 312K</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Tier 1 & 2 combined</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Pay Disbursed</p>
                      <p className="text-2xl font-bold text-gray-900">GHS 1.96M</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Across 5 banks</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workforce" className="space-y-6">
          <WorkforceAnalytics
            departments={filteredDepartmentData}
            selectedDepartments={selectedDepartments}
            onDepartmentToggle={handleDepartmentToggle}
            diversityData={diversityMetrics}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceAnalytics
            metrics={performanceMetrics}
            salaryBenchmarks={salaryBenchmarks}
            departments={filteredDepartmentData}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceAnalytics data={complianceData} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsManagement reports={customReports} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ExecutiveDashboard({ metrics }: { metrics: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{metric.metric}</h3>
                <Badge variant={metric.current >= metric.target ? "default" : "secondary"}>
                  {metric.current >= metric.target ? "On Track" : "Below Target"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-bold text-gray-900">
                    {metric.metric.includes("Cost") ? "GHS " : ""}
                    {metric.current.toLocaleString()}
                  </span>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {metric.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-gray-600">vs Target</span>
                    </div>
                  </div>
                </div>
                <Progress value={(metric.current / metric.target) * 100} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Target: {metric.target.toLocaleString()}</span>
                  <span>Benchmark: {metric.benchmark.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PredictiveAnalytics({ insights, payrollData }: { insights: any[]; payrollData: any[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI-Powered Predictions</span>
            <Badge variant="outline">Machine Learning</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge variant={insight.impact === "High" ? "destructive" : "secondary"}>
                        {insight.impact} Impact
                      </Badge>
                      <Badge variant="outline">{insight.probability}% Confidence</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {insight.timeframe}
                      </span>
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {insight.category}
                      </span>
                    </div>
                    <div className="mt-3 p-2 bg-white rounded border-l-4 border-l-blue-500">
                      <p className="text-sm font-medium text-blue-900">Recommended Action:</p>
                      <p className="text-sm text-blue-800">{insight.action}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Predictive Payroll Modeling</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={payrollData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="gross"
                stroke="#10b981"
                strokeWidth={2}
                strokeDashArray={(entry: any) => (entry.predicted ? "5 5" : "0")}
                name="Gross Payroll"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDashArray={(entry: any) => (entry.predicted ? "5 5" : "0")}
                name="Net Payroll"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsManagement({ reports }: { reports: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Scheduled Reports</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule New Report
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">{report.name}</h3>
                    <Badge
                      className={
                        report.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{report.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {report.schedule}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {report.recipients.length} recipients
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Last run: {report.lastRun}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Run Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PayrollAnalytics({ data, departments }: { data: any[]; departments: any[] }) {
  const actualData = data.filter((d) => !d.predicted)
  const predictedData = data.filter((d) => d.predicted)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              GHS {actualData[actualData.length - 1].gross.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Current Gross Payroll</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              GHS {actualData[actualData.length - 1].paye.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">PAYE Tax</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              GHS {actualData[actualData.length - 1].ssnit.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">SSNIT Contributions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              GHS {actualData[actualData.length - 1].tier3.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Tier 3 Contributions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Breakdown Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => [`GHS ${Number(value).toLocaleString()}`, ""]} />
              <Legend />
              <Area type="monotone" dataKey="gross" stackId="1" stroke="#10b981" fill="#10b981" name="Gross Pay" />
              <Area type="monotone" dataKey="paye" stackId="2" stroke="#ef4444" fill="#ef4444" name="PAYE" />
              <Area type="monotone" dataKey="ssnit" stackId="2" stroke="#3b82f6" fill="#3b82f6" name="SSNIT" />
              <Area type="monotone" dataKey="tier3" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" name="Tier 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Payroll Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total Cost</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Budget</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Utilization</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Variance</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => {
                  const variance = ((dept.cost - dept.budget) / dept.budget) * 100
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{dept.department}</td>
                      <td className="py-3 px-4 text-right">GHS {dept.cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-600">GHS {dept.budget.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{ width: `${dept.utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{dept.utilization}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={variance > 0 ? "destructive" : "default"}>
                          {variance > 0 ? "+" : ""}
                          {variance.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WorkforceAnalytics({
  departments,
  selectedDepartments,
  onDepartmentToggle,
  diversityData,
}: {
  departments: any[]
  selectedDepartments: string[]
  onDepartmentToggle: (dept: string) => void
  diversityData: any[]
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Department Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <div key={dept.department} className="flex items-center space-x-2">
                <Checkbox
                  id={dept.department}
                  checked={selectedDepartments.includes(dept.department)}
                  onCheckedChange={() => onDepartmentToggle(dept.department)}
                />
                <Label htmlFor={dept.department} className="text-sm">
                  {dept.department} ({dept.employees})
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Turnover Rate by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, "Turnover Rate"]} />
                <Bar dataKey="turnover" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={departments}>
                <RadialBar dataKey="satisfaction" cornerRadius={10} fill="#10b981" />
                <Tooltip formatter={(value) => [`${value}/5`, "Satisfaction"]} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{dept.department}</span>
                    <span className="text-sm text-gray-600">{dept.productivity}%</span>
                  </div>
                  <Progress value={dept.productivity} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workforce Diversity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {diversityData.map((category, index) => (
              <div key={index}>
                <h4 className="font-medium mb-3">{category.category}</h4>
                <div className="space-y-2">
                  {Object.entries(category)
                    .filter(([key]) => key !== "category")
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm">{key}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
                          </div>
                          <span className="text-sm w-8">{value}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PerformanceAnalytics({
  metrics,
  salaryBenchmarks,
  departments,
}: {
  metrics: any[]
  salaryBenchmarks: any[]
  departments: any[]
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{metric.metric}</p>
                    <p className="text-sm text-gray-600">
                      Current: {metric.current} | Target: {metric.target}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <Progress value={(metric.current / metric.target) * 100} className="w-20 h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Benchmarking</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={salaryBenchmarks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="internal" name="Internal Salary" />
                <YAxis dataKey="market" name="Market Rate" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => [`GHS ${value}`, name === "internal" ? "Internal" : "Market"]}
                />
                <Scatter dataKey="market" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Position</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Internal Salary</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Market Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Variance</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {salaryBenchmarks.map((position, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{position.position}</td>
                    <td className="py-3 px-4 text-right">GHS {position.internal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-600">GHS {position.market.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={position.variance > 0 ? "text-emerald-600" : "text-red-600"}>
                        {position.variance > 0 ? "+" : ""}
                        {position.variance.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={Math.abs(position.variance) > 10 ? "destructive" : "default"}>
                        {Math.abs(position.variance) > 10 ? "Review" : "Competitive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ComplianceAnalytics({ data }: { data: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <Card
            key={index}
            className={`border-l-4 ${
              item.status === "compliant"
                ? "border-l-emerald-500"
                : item.status === "warning"
                  ? "border-l-yellow-500"
                  : "border-l-red-500"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.name}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {item.value}/{item.total}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(item.value / item.total) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{Math.round((item.value / item.total) * 100)}%</span>
                  </div>
                </div>
                <Badge
                  variant={
                    item.status === "compliant" ? "default" : item.status === "warning" ? "secondary" : "destructive"
                  }
                >
                  {item.status === "compliant"
                    ? "Compliant"
                    : item.status === "warning"
                      ? "Warning"
                      : "Action Required"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data
              .filter((item) => item.status !== "compliant")
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.total - item.value} employees need attention</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Take Action
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InsightsAnalytics({
  payrollData,
  departmentData,
  performanceData,
}: {
  payrollData: any[]
  departmentData: any[]
  performanceData: any[]
}) {
  const insights = [
    {
      title: "Payroll Growth Trend",
      description: "Monthly payroll has increased by 14.2% over the last 6 months, indicating business growth.",
      type: "positive",
      impact: "high",
      recommendation: "Consider salary benchmarking to ensure competitive compensation.",
    },
    {
      title: "High Turnover in Operations",
      description: "Operations department shows 18.7% turnover rate, significantly above company average.",
      type: "warning",
      impact: "high",
      recommendation: "Investigate working conditions and implement retention strategies.",
    },
    {
      title: "Technology Department Performance",
      description: "Tech team shows highest productivity (92%) and satisfaction (4.3/5) scores.",
      type: "positive",
      impact: "medium",
      recommendation: "Use as best practice model for other departments.",
    },
    {
      title: "Tier 3 Enrollment Gap",
      description: "12 employees not enrolled in Tier 3 pension scheme, affecting compliance.",
      type: "warning",
      impact: "medium",
      recommendation: "Conduct enrollment drive and provide education on pension benefits.",
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
          <p className="text-sm text-gray-600">
            Automated analysis of your HR and payroll data with actionable recommendations
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  insight.type === "positive"
                    ? "border-emerald-200 bg-emerald-50"
                    : insight.type === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge
                        variant={
                          insight.impact === "high"
                            ? "destructive"
                            : insight.impact === "medium"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                    <p className="text-sm font-medium text-gray-900">Recommendation: {insight.recommendation}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Predictive Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Projected Payroll Growth</h4>
                <p className="text-sm text-gray-600 mb-2">Based on current trends, expect 8-12% growth next quarter</p>
                <Progress value={75} className="h-2" />
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Turnover Risk</h4>
                <p className="text-sm text-gray-600 mb-2">15 employees identified as high turnover risk</p>
                <Progress value={60} className="h-2" />
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Budget Utilization</h4>
                <p className="text-sm text-gray-600 mb-2">On track to utilize 97.8% of annual HR budget</p>
                <Progress value={98} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benchmarking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Industry Average Salary</p>
                  <p className="text-sm text-gray-600">Technology Sector</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">+12%</p>
                  <p className="text-xs text-gray-500">Above average</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Employee Satisfaction</p>
                  <p className="text-sm text-gray-600">Ghana Market</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">+8%</p>
                  <p className="text-xs text-gray-500">Above average</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Turnover Rate</p>
                  <p className="text-sm text-gray-600">Similar Companies</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">+3%</p>
                  <p className="text-xs text-gray-500">Above average</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
