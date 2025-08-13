import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Calendar, Users, Calculator, TrendingUp, Building, Filter, Search } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const reportCategories = [
    {
      id: "payroll",
      name: "Payroll Reports",
      icon: Calculator,
      color: "emerald",
      reports: [
        {
          name: "Monthly Payroll Summary",
          description: "Complete payroll breakdown with PAYE and SSNIT calculations",
          template: "payroll-summary",
          frequency: "Monthly",
        },
        {
          name: "Employee Payslips",
          description: "Individual payslips for all employees",
          template: "payslips",
          frequency: "Monthly",
        },
        {
          name: "Tax Compliance Report",
          description: "PAYE and SSNIT summary for GRA filing",
          template: "tax-compliance",
          frequency: "Monthly",
        },
        {
          name: "Payroll Register",
          description: "Detailed payroll register with all deductions",
          template: "payroll-register",
          frequency: "Monthly",
        },
      ],
    },
    {
      id: "hr",
      name: "HR Reports",
      icon: Users,
      color: "blue",
      reports: [
        {
          name: "Employee Directory",
          description: "Complete list of all employees with contact details",
          template: "employee-directory",
          frequency: "On-demand",
        },
        {
          name: "Leave Summary Report",
          description: "Leave balances and usage by employee",
          template: "leave-summary",
          frequency: "Monthly",
        },
        {
          name: "New Hires Report",
          description: "Recently hired employees and onboarding status",
          template: "new-hires",
          frequency: "Monthly",
        },
        {
          name: "Employee Turnover",
          description: "Turnover analysis and exit interview summaries",
          template: "turnover",
          frequency: "Quarterly",
        },
      ],
    },
    {
      id: "analytics",
      name: "Analytics Reports",
      icon: TrendingUp,
      color: "purple",
      reports: [
        {
          name: "Payroll Cost Analysis",
          description: "Department-wise payroll cost breakdown and trends",
          template: "cost-analysis",
          frequency: "Monthly",
        },
        {
          name: "Headcount Report",
          description: "Employee headcount by department and location",
          template: "headcount",
          frequency: "Monthly",
        },
        {
          name: "Overtime Analysis",
          description: "Overtime hours and costs by department",
          template: "overtime-analysis",
          frequency: "Monthly",
        },
        {
          name: "Budget vs Actual",
          description: "Payroll budget comparison with actual expenses",
          template: "budget-comparison",
          frequency: "Monthly",
        },
      ],
    },
    {
      id: "compliance",
      name: "Compliance Reports",
      icon: FileText,
      color: "orange",
      reports: [
        {
          name: "SSNIT Contribution Report",
          description: "Employee and employer SSNIT contributions",
          template: "ssnit-report",
          frequency: "Monthly",
        },
        {
          name: "PAYE Tax Report",
          description: "Pay As You Earn tax deductions summary",
          template: "paye-report",
          frequency: "Monthly",
        },
        {
          name: "Audit Trail Report",
          description: "System access and changes log for compliance",
          template: "audit-trail",
          frequency: "On-demand",
        },
        {
          name: "Statutory Deductions",
          description: "All statutory deductions summary for filing",
          template: "statutory-deductions",
          frequency: "Monthly",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AkwaabaHRPay</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-emerald-600 transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/setup">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">Report Templates</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive report templates for payroll, HR, analytics, and compliance. Generate professional reports
              with Ghana-specific formatting and calculations.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search report templates..."
                  className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
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
              <Select>
                <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
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
          </div>
        </div>
      </section>

      {/* Report Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {reportCategories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.id} className="mb-16">
                <div className="flex items-center space-x-3 mb-8">
                  <div className={`w-12 h-12 bg-${category.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                    <p className="text-gray-600">{category.reports.length} templates available</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.reports.map((report) => (
                    <Card key={report.template} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg text-gray-900 leading-tight">{report.name}</CardTitle>
                          <Badge className={`bg-${category.color}-100 text-${category.color}-800 text-xs`}>
                            {report.frequency}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{report.description}</p>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent">
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Custom Reports */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Custom Report Builder</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Need a specific report? Use our custom report builder to create tailored reports for your business needs.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto p-8">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Filters</h3>
                  <p className="text-gray-600">
                    Filter by department, location, date range, employee type, and more to get exactly the data you
                    need.
                  </p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Location</h3>
                  <p className="text-gray-600">
                    Generate consolidated reports across multiple locations or separate reports for each branch.
                  </p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Scheduled Reports</h3>
                  <p className="text-gray-600">
                    Set up automated report generation and delivery via email on your preferred schedule.
                  </p>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700 px-8">Launch Report Builder</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sample Report Preview</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our reports look with real Ghana business data and formatting.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader className="bg-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Monthly Payroll Summary</CardTitle>
                  <p className="text-emerald-100">December 2024 • Accra Tech Solutions Ltd</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">GH¢ 125,450</div>
                  <div className="text-emerald-100 text-sm">Total Payroll</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">45</div>
                  <div className="text-gray-600 text-sm">Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">GH¢ 18,750</div>
                  <div className="text-gray-600 text-sm">PAYE Tax</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">GH¢ 15,625</div>
                  <div className="text-gray-600 text-sm">SSNIT (Employee)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">GH¢ 17,500</div>
                  <div className="text-gray-600 text-sm">SSNIT (Employer)</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Department Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Engineering</span>
                    <span className="font-medium">GH¢ 65,200 (52%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Sales & Marketing</span>
                    <span className="font-medium">GH¢ 35,150 (28%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Administration</span>
                    <span className="font-medium">GH¢ 25,100 (20%)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-gray-500 text-sm">
                  Generated on {new Date().toLocaleDateString()} • AkwaabaHRPay v2.1
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Generate Professional Reports?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start your free trial and access all report templates with sample data.
          </p>
          <Link href="/setup">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold">AkwaabaHRPay</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional HR & Payroll software built specifically for Ghanaian businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/features/security" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/#integrations" className="hover:text-white transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/training" className="hover:text-white transition-colors">
                    Training
                  </Link>
                </li>
                <li>
                  <Link href="/api-docs" className="hover:text-white transition-colors">
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 AkwaabaHRPay. Made with ❤️ in Ghana.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
