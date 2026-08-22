import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Key, Users, Calculator, FileText, Shield, Zap, Copy } from "lucide-react"
import Link from "next/link"
import { SiteFooter, SiteHeader } from "@/components/marketing-shell"

export default function APIDocsPage() {
  const endpoints = [
    {
      category: "Authentication",
      icon: Key,
      color: "emerald",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Authenticate user and get access token",
          params: ["email", "password"],
        },
        {
          method: "POST",
          path: "/api/auth/refresh",
          description: "Refresh access token using refresh token",
          params: ["refresh_token"],
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          description: "Invalidate current session",
          params: [],
        },
      ],
    },
    {
      category: "Employees",
      icon: Users,
      color: "blue",
      endpoints: [
        {
          method: "GET",
          path: "/api/employees",
          description: "Get list of all employees",
          params: ["page", "limit", "department", "status"],
        },
        {
          method: "POST",
          path: "/api/employees",
          description: "Create new employee record",
          params: ["first_name", "last_name", "email", "department", "position"],
        },
        {
          method: "GET",
          path: "/api/employees/{id}",
          description: "Get specific employee details",
          params: ["id"],
        },
        {
          method: "PUT",
          path: "/api/employees/{id}",
          description: "Update employee information",
          params: ["id", "...employee_data"],
        },
        {
          method: "DELETE",
          path: "/api/employees/{id}",
          description: "Deactivate employee record",
          params: ["id"],
        },
      ],
    },
    {
      category: "Payroll",
      icon: Calculator,
      color: "purple",
      endpoints: [
        {
          method: "GET",
          path: "/api/payroll/runs",
          description: "Get payroll run history",
          params: ["year", "month", "status"],
        },
        {
          method: "POST",
          path: "/api/payroll/runs",
          description: "Create new payroll run",
          params: ["period_start", "period_end", "employees"],
        },
        {
          method: "GET",
          path: "/api/payroll/payslips/{employee_id}",
          description: "Get employee payslips",
          params: ["employee_id", "year", "month"],
        },
        {
          method: "GET",
          path: "/api/payroll/tax-calculations",
          description: "Get PAYE and SSNIT calculations",
          params: ["employee_id", "gross_salary", "period"],
        },
      ],
    },
    {
      category: "Reports",
      icon: FileText,
      color: "orange",
      endpoints: [
        {
          method: "GET",
          path: "/api/reports/templates",
          description: "Get available report templates",
          params: ["category", "frequency"],
        },
        {
          method: "POST",
          path: "/api/reports/generate",
          description: "Generate custom report",
          params: ["template_id", "filters", "format"],
        },
        {
          method: "GET",
          path: "/api/reports/{report_id}",
          description: "Download generated report",
          params: ["report_id", "format"],
        },
      ],
    },
  ]

  const codeExamples = {
    authentication: `// Authentication Example
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@company.com',
    password: 'your-password'
  })
});

const { access_token, refresh_token } = await response.json();

// Use token in subsequent requests
const employeesResponse = await fetch('/api/employees', {
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  }
});`,

    employees: `// Create Employee Example
const newEmployee = {
  first_name: "Kwame",
  last_name: "Asante",
  email: "kwame.asante@company.com",
  phone: "+233244123456",
  department: "Engineering",
  position: "Software Developer",
  salary: 5000,
  start_date: "2025-01-15",
  employee_id: "EMP001"
};

const response = await fetch('/api/employees', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-access-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newEmployee)
});

const employee = await response.json();
console.log('Created employee:', employee);`,

    payroll: `// Generate Payroll Example
const payrollRun = {
  period_start: "2025-01-01",
  period_end: "2025-01-31",
  employees: ["emp_123", "emp_456", "emp_789"],
  include_overtime: true,
  include_bonuses: true
};

const response = await fetch('/api/payroll/runs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-access-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payrollRun)
});

const result = await response.json();
console.log('Payroll run created:', result);

// Get tax calculations for specific employee
const taxCalc = await fetch('/api/payroll/tax-calculations?employee_id=emp_123&gross_salary=5000&period=2025-01', {
  headers: {
    'Authorization': 'Bearer your-access-token'
  }
});

const taxes = await taxCalc.json();
console.log('PAYE:', taxes.paye);
console.log('SSNIT Employee:', taxes.ssnit_employee);
console.log('SSNIT Employer:', taxes.ssnit_employer);`,

    reports: `// Generate Report Example
const reportRequest = {
  template_id: "payroll-summary",
  filters: {
    period_start: "2025-01-01",
    period_end: "2025-01-31",
    departments: ["Engineering", "Sales"],
    include_terminated: false
  },
  format: "pdf"
};

const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-access-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reportRequest)
});

const { report_id, download_url } = await response.json();

// Download the generated report
const reportResponse = await fetch(\`/api/reports/\${report_id}?format=pdf\`, {
  headers: {
    'Authorization': 'Bearer your-access-token'
  }
});

const reportBlob = await reportResponse.blob();
// Handle the PDF blob as needed`,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Code className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">API Documentation</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Integrate AkwaabaHRPay with your existing systems using our comprehensive REST API. Built for developers,
              designed for Ghana's business needs.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-emerald-600 mb-2">50+</div>
                <div className="text-sm text-gray-600">API Endpoints</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-sm text-gray-600">Uptime SLA</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-purple-600 mb-2">OAuth 2.0</div>
                <div className="text-sm text-gray-600">Authentication</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-orange-600 mb-2">JSON</div>
                <div className="text-sm text-gray-600">Response Format</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow these steps to start integrating with the AkwaabaHRPay API
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Get API Keys</h3>
                <p className="text-gray-600 mb-4">
                  Sign up for an AkwaabaHRPay account and generate your API keys from the developer dashboard.
                </p>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Get API Keys</Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Authenticate</h3>
                <p className="text-gray-600 mb-4">
                  Use OAuth 2.0 to authenticate your application and get access tokens for API requests.
                </p>
                <Button variant="outline" className="w-full bg-transparent">
                  View Auth Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Make Requests</h3>
                <p className="text-gray-600 mb-4">
                  Start making API calls to manage employees, process payroll, and generate reports.
                </p>
                <Button variant="outline" className="w-full bg-transparent">
                  Try API
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">API Reference</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete reference for all available endpoints and their parameters
            </p>
          </div>

          <Tabs defaultValue="authentication" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="authentication" className="mt-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Key className="w-5 h-5 text-emerald-600" />
                      <span>Authentication Endpoints</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {endpoints[0].endpoints.map((endpoint, index) => (
                      <div key={index} className="border-l-4 border-emerald-500 pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className="bg-emerald-100 text-emerald-800">{endpoint.method}</Badge>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                        </div>
                        <p className="text-gray-600 text-sm">{endpoint.description}</p>
                        {endpoint.params.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Parameters: </span>
                            <span className="text-xs text-gray-700">{endpoint.params.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Code Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{codeExamples.authentication}</code>
                    </pre>
                    <Button size="sm" className="mt-4 bg-transparent" variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="employees" className="mt-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>Employee Endpoints</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {endpoints[1].endpoints.map((endpoint, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            className={`${
                              endpoint.method === "GET"
                                ? "bg-green-100 text-green-800"
                                : endpoint.method === "POST"
                                  ? "bg-blue-100 text-blue-800"
                                  : endpoint.method === "PUT"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                        </div>
                        <p className="text-gray-600 text-sm">{endpoint.description}</p>
                        {endpoint.params.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Parameters: </span>
                            <span className="text-xs text-gray-700">{endpoint.params.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Code Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{codeExamples.employees}</code>
                    </pre>
                    <Button size="sm" className="mt-4 bg-transparent" variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payroll" className="mt-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-purple-600" />
                      <span>Payroll Endpoints</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {endpoints[2].endpoints.map((endpoint, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            className={`${
                              endpoint.method === "GET" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                        </div>
                        <p className="text-gray-600 text-sm">{endpoint.description}</p>
                        {endpoint.params.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Parameters: </span>
                            <span className="text-xs text-gray-700">{endpoint.params.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Code Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{codeExamples.payroll}</code>
                    </pre>
                    <Button size="sm" className="mt-4 bg-transparent" variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span>Reports Endpoints</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {endpoints[3].endpoints.map((endpoint, index) => (
                      <div key={index} className="border-l-4 border-orange-500 pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            className={`${
                              endpoint.method === "GET" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                        </div>
                        <p className="text-gray-600 text-sm">{endpoint.description}</p>
                        {endpoint.params.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Parameters: </span>
                            <span className="text-xs text-gray-700">{endpoint.params.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Code Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{codeExamples.reports}</code>
                    </pre>
                    <Button size="sm" className="mt-4 bg-transparent" variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* SDKs and Libraries */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">SDKs & Libraries</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Official SDKs and community libraries to accelerate your integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">JavaScript SDK</h3>
                <p className="text-gray-600 mb-4">
                  Official JavaScript/TypeScript SDK for Node.js and browser environments.
                </p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded block mb-4">npm install @akwaabahr/sdk</code>
                <Button variant="outline" className="w-full bg-transparent">
                  View Documentation
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Python SDK</h3>
                <p className="text-gray-600 mb-4">
                  Official Python SDK with full support for all API endpoints and features.
                </p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded block mb-4">pip install akwaabahr-python</code>
                <Button variant="outline" className="w-full bg-transparent">
                  View Documentation
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">PHP SDK</h3>
                <p className="text-gray-600 mb-4">Community-maintained PHP SDK for Laravel and other PHP frameworks.</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded block mb-4">
                  composer require akwaabahr/php-sdk
                </code>
                <Button variant="outline" className="w-full bg-transparent">
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Our developer support team is here to help you integrate successfully
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/help">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Visit Help Center</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="bg-transparent">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
