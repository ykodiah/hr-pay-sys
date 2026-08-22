import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users, Calculator, BarChart3, Clock, Star, Play, Download } from "lucide-react"
import Link from "next/link"
import { SiteFooter, SiteHeader } from "@/components/marketing-shell"

export default function TrainingPage() {
  const trainingModules = [
    {
      category: "Getting Started",
      icon: BookOpen,
      color: "emerald",
      articles: [
        {
          title: "Setting Up Your AkwaabaHRPay Account",
          duration: "5 min read",
          level: "Beginner",
          description: "Complete guide to initial setup, company configuration, and user management.",
          topics: ["Account creation", "Company profile setup", "User roles and permissions", "Initial configuration"],
        },
        {
          title: "Understanding the Dashboard",
          duration: "3 min read",
          level: "Beginner",
          description: "Navigate the main dashboard and understand key metrics and quick actions.",
          topics: ["Dashboard overview", "Key metrics", "Quick actions", "Navigation menu"],
        },
        {
          title: "First Steps Checklist",
          duration: "4 min read",
          level: "Beginner",
          description: "Essential tasks to complete before processing your first payroll.",
          topics: ["Employee data import", "Salary structures", "Tax settings", "Bank details"],
        },
      ],
    },
    {
      category: "Employee Management",
      icon: Users,
      color: "blue",
      articles: [
        {
          title: "Adding and Managing Employees",
          duration: "6 min read",
          level: "Beginner",
          description: "Complete guide to employee onboarding, profile management, and data organization.",
          topics: ["Employee registration", "Profile management", "Document uploads", "Bulk import"],
        },
        {
          title: "Employee Self-Service Portal",
          duration: "4 min read",
          level: "Intermediate",
          description: "Enable employees to manage their own information and access payslips.",
          topics: ["Portal setup", "Employee access", "Self-service features", "Mobile access"],
        },
        {
          title: "Leave Management System",
          duration: "7 min read",
          level: "Intermediate",
          description: "Configure leave policies, manage requests, and track employee time off.",
          topics: ["Leave policies", "Request workflow", "Approval process", "Leave balances"],
        },
        {
          title: "Performance Tracking",
          duration: "5 min read",
          level: "Advanced",
          description: "Set up performance reviews and track employee development.",
          topics: ["Review cycles", "Goal setting", "Performance metrics", "Development plans"],
        },
      ],
    },
    {
      category: "Payroll Processing",
      icon: Calculator,
      color: "purple",
      articles: [
        {
          title: "Ghana Payroll Fundamentals",
          duration: "8 min read",
          level: "Beginner",
          description: "Understanding Ghana's payroll requirements, PAYE, SSNIT, and compliance.",
          topics: ["PAYE calculations", "SSNIT contributions", "Minimum wage", "Tax brackets"],
        },
        {
          title: "Setting Up Salary Structures",
          duration: "6 min read",
          level: "Intermediate",
          description: "Create flexible salary structures with allowances, deductions, and benefits.",
          topics: ["Basic salary", "Allowances", "Deductions", "Benefits calculation"],
        },
        {
          title: "Running Monthly Payroll",
          duration: "10 min read",
          level: "Intermediate",
          description: "Step-by-step guide to processing monthly payroll from start to finish.",
          topics: ["Payroll preparation", "Review and approval", "Payment processing", "Payslip generation"],
        },
        {
          title: "Year-End Processing",
          duration: "12 min read",
          level: "Advanced",
          description: "Handle year-end payroll tasks, tax certificates, and annual reporting.",
          topics: ["Annual tax certificates", "13th month salary", "Bonus calculations", "Year-end reports"],
        },
      ],
    },
    {
      category: "Reports & Analytics",
      icon: BarChart3,
      color: "orange",
      articles: [
        {
          title: "Standard Payroll Reports",
          duration: "5 min read",
          level: "Beginner",
          description: "Generate and customize standard payroll reports for management and compliance.",
          topics: ["Payroll summaries", "Tax reports", "SSNIT reports", "Bank transfer files"],
        },
        {
          title: "Custom Report Builder",
          duration: "7 min read",
          level: "Intermediate",
          description: "Create custom reports tailored to your specific business needs.",
          topics: ["Report designer", "Data filters", "Custom fields", "Scheduled reports"],
        },
        {
          title: "Analytics Dashboard",
          duration: "6 min read",
          level: "Intermediate",
          description: "Understand payroll trends, cost analysis, and workforce insights.",
          topics: ["Cost analysis", "Trend analysis", "Department comparisons", "Forecasting"],
        },
        {
          title: "Compliance Reporting",
          duration: "8 min read",
          level: "Advanced",
          description: "Generate reports for Ghana Revenue Authority and Social Security submissions.",
          topics: ["GRA submissions", "SSNIT filings", "Audit trails", "Compliance checks"],
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">Training Center</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Master AkwaabaHRPay with our comprehensive training materials. From basic setup to advanced features,
              we'll help you become an expert.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-emerald-600 mb-2">50+</div>
                <div className="text-sm text-gray-600">Training Articles</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-blue-600 mb-2">4</div>
                <div className="text-sm text-gray-600">Learning Modules</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-purple-600 mb-2">Video</div>
                <div className="text-sm text-gray-600">Tutorials</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-orange-600 mb-2">24/7</div>
                <div className="text-sm text-gray-600">Access</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Learning Paths</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Structured learning paths to help you master different aspects of the platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">HR Administrator</h3>
                <p className="text-gray-600 mb-4">
                  Complete path for HR professionals managing employee data, leave, and compliance.
                </p>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-emerald-100 text-emerald-800">8 Articles</Badge>
                  <Badge className="bg-gray-100 text-gray-800">2-3 hours</Badge>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Start Learning</Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Payroll Specialist</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive training on Ghana payroll processing, tax calculations, and compliance.
                </p>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-purple-100 text-purple-800">12 Articles</Badge>
                  <Badge className="bg-gray-100 text-gray-800">4-5 hours</Badge>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Start Learning</Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Analyst</h3>
                <p className="text-gray-600 mb-4">
                  Learn to generate insights, create reports, and analyze workforce data effectively.
                </p>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-orange-100 text-orange-800">6 Articles</Badge>
                  <Badge className="bg-gray-100 text-gray-800">2 hours</Badge>
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Start Learning</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Training Modules */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Training Modules</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Detailed training materials organized by feature and complexity level
            </p>
          </div>

          <Tabs defaultValue="getting-started" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {trainingModules.map((module, moduleIndex) => (
              <TabsContent key={moduleIndex} value={module.category.toLowerCase().replace(" ", "-")} className="mt-8">
                <div className="space-y-6">
                  {module.articles.map((article, articleIndex) => (
                    <Card key={articleIndex} className="p-6">
                      <CardContent className="p-0">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">{article.title}</h3>
                              <Badge
                                className={`${
                                  article.level === "Beginner"
                                    ? "bg-green-100 text-green-800"
                                    : article.level === "Intermediate"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {article.level}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{article.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{article.duration}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4" />
                                <span>4.8/5</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {article.topics.map((topic, topicIndex) => (
                                <Badge key={topicIndex} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-6">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              Read Article
                            </Button>
                            <Button size="sm" variant="outline" className="bg-transparent">
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Video Tutorials</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch step-by-step video guides for key features and workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">5:32</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Getting Started with AkwaabaHRPay</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Complete overview of the platform and initial setup process.
                </p>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">8:15</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Processing Your First Payroll</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Step-by-step guide to running payroll with Ghana tax calculations.
                </p>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">6:45</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Employee Self-Service Setup</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Enable employees to access payslips and manage their information.
                </p>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">4:20</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Generating Compliance Reports</h3>
                <p className="text-sm text-gray-600 mb-3">Create reports for GRA and SSNIT submissions.</p>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">7:10</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Advanced Analytics & Insights</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Leverage data analytics for workforce planning and cost optimization.
                </p>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">3:55</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Mobile App Features</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Explore the mobile app for on-the-go HR and payroll management.
                </p>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Certification */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Certified</h2>
          <p className="text-xl text-gray-600 mb-8">
            Complete our training program and earn an AkwaabaHRPay certification to demonstrate your expertise
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-emerald-600 hover:bg-emerald-700">Start Certification</Button>
            <Button variant="outline" className="bg-transparent">
              View Requirements
            </Button>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
