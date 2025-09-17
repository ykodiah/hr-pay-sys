import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Calculator, TrendingUp, Shield, Globe, DollarSign, Lock, Zap } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function HomePage() {
  console.log("[v0] Homepage is rendering successfully")

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo variant="full" size="md" />

            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Pricing
              </a>
              <Link href="/about" className="text-gray-600 hover:text-emerald-600 transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/get-started">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Made for Ghana 🇬🇭</Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                HR & Payroll for Ghana
                <span className="text-emerald-600 block">Built for Growth</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                GHS-native payroll with PAYE, SSNIT, minimum wage compliance, and leave management. Consolidate across
                subsidiaries with multi-location controls.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4 w-full sm:w-auto">
                    Launch App
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-transparent w-full sm:w-auto">
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Free 30-day trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>No setup fees</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/professional-ghana-payroll-dashboard-showing-paye-.png"
                  alt="Professional Ghana payroll dashboard showing PAYE and SSNIT calculations"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full bg-emerald-200 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything you need for HR & Payroll</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for Ghanaian businesses with local compliance, multi-currency support, and
              enterprise-grade security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-default">
                <CardContent className="p-0">
                  <img
                    src="/ghana-payroll-engine-dashboard.png"
                    alt="Ghana Payroll Engine"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ghana Payroll Engine</h3>
                  <p className="text-gray-600 mb-4">
                    Automated PAYE, SSNIT calculations with effective-dated rules. No prior-year drift.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>2025 tax rules included</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Minimum wage compliance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-default">
                <CardContent className="p-0">
                  <img
                    src="/employee-management-dashboard.png"
                    alt="Employee Management"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Employee Management</h3>
                  <p className="text-gray-600 mb-4">
                    Complete HR suite with leave management, loans & advances, and self-service portal.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Leave tracking & approval</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Loan schedules</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-default">
                <CardContent className="p-0">
                  <img
                    src="/hr-analytics-dashboard.png"
                    alt="HR Analytics"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">HR Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Real-time dashboards with payroll insights, cost analysis, and compliance reporting.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Cost center reporting</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Compliance tracking</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-default">
                <CardContent className="p-0">
                  <img
                    src="/ghana-office-dashboard-multi-location.png"
                    alt="Multi-Location Management"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Location</h3>
                  <p className="text-gray-600 mb-4">
                    Manage multiple subsidiaries and locations from a single dashboard with consolidated reporting.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Group company support</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Consolidated reports</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-default">
                <CardContent className="p-0">
                  <img
                    src="/employee-self-service-mobile-app.png"
                    alt="Mobile App"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile App</h3>
                  <p className="text-gray-600 mb-4">
                    Employee self-service mobile app for leave requests, payslips, and profile management.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>iOS & Android</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Offline capability</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-default">
                <CardContent className="p-0">
                  <img
                    src="/security-dashboard-with-encryption-and-access-cont.png"
                    alt="Enterprise Security"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                  <p className="text-gray-600 mb-4">
                    Bank-grade security with role-based access, audit trails, and data encryption.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>256-bit encryption</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Audit logging</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pay per employee with no hidden fees. Start with a 30-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-2 border-gray-200">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-bold text-emerald-600">GH¢10</span>
                    <span className="text-gray-600">/employee/month</span>
                  </div>
                  <p className="text-gray-500 mt-2">Billed monthly</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Complete HR & Payroll suite</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Ghana tax compliance (PAYE, SSNIT)</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Employee self-service portal</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Mobile app access</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>24/7 support</span>
                  </li>
                </ul>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Start Free Trial</Button>
              </CardContent>
            </Card>

            <Card className="p-8 border-2 border-emerald-600 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual Plan</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-bold text-emerald-600">GH¢9</span>
                    <span className="text-gray-600">/employee/month</span>
                  </div>
                  <p className="text-gray-500 mt-2">Billed annually (GH¢108/employee/year)</p>
                  <Badge className="bg-green-100 text-green-800 mt-2">Save 10%</Badge>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Everything in Monthly Plan</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Start Free Trial</Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Need more than 100 employees? Contact us for enterprise pricing.</p>
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 bg-transparent"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Bank-Grade Security & Compliance</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your sensitive HR and payroll data is protected with enterprise-level security measures.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Encryption</h3>
                <p className="text-gray-600 mb-4">
                  All data is encrypted in transit and at rest using AES-256 encryption standards.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• SSL/TLS encryption</li>
                  <li>• Database encryption</li>
                  <li>• Secure API endpoints</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Access Control</h3>
                <p className="text-gray-600 mb-4">
                  Role-based permissions ensure only authorized personnel can access sensitive information.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Multi-factor authentication</li>
                  <li>• Role-based permissions</li>
                  <li>• Session management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Compliance & Auditing</h3>
                <p className="text-gray-600 mb-4">
                  Complete audit trails and compliance with Ghana's data protection regulations.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Activity logging</li>
                  <li>• Data backup & recovery</li>
                  <li>• Compliance reporting</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect AkwaabaHRPay with your existing business tools and banking systems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Banking APIs</h4>
                <p className="text-sm text-gray-600">Direct salary payments to employee bank accounts</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calculator className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Accounting Software</h4>
                <p className="text-sm text-gray-600">Sync with QuickBooks, Sage, and local accounting tools</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Time Tracking</h4>
                <p className="text-sm text-gray-600">Import attendance data from biometric systems</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Government APIs</h4>
                <p className="text-sm text-gray-600">Direct filing with GRA and SSNIT systems</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Trusted by Growing Ghanaian Businesses</h2>
            <p className="text-gray-600">Join hundreds of companies already using AkwaabaHRPay</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <img
                src="/professional-ghanaian-business-owner.png"
                alt="Ghanaian business owner"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <blockquote className="text-gray-600 italic mb-4">
                "AkwaabaHRPay simplified our payroll completely. The Ghana tax calculations are always accurate."
              </blockquote>
              <cite className="text-sm font-semibold text-gray-900">Kwame Asante, CEO at Accra Tech Solutions</cite>
            </div>
            <div className="text-center">
              <img
                src="/professional-ghanaian-woman-hr-manager.png"
                alt="Ghanaian HR manager"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <blockquote className="text-gray-600 italic mb-4">
                "The employee self-service portal reduced our HR workload by 70%. Highly recommended!"
              </blockquote>
              <cite className="text-sm font-semibold text-gray-900">Ama Osei, HR Director at Kumasi Manufacturing</cite>
            </div>
            <div className="text-center">
              <img
                src="/professional-ghanaian-finance-manager.png"
                alt="Ghanaian finance manager"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <blockquote className="text-gray-600 italic mb-4">
                "Multi-location reporting gives us perfect visibility across all our branches."
              </blockquote>
              <cite className="text-sm font-semibold text-gray-900">Kofi Mensah, CFO at Ghana Retail Group</cite>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Transform Your HR & Payroll?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join hundreds of Ghanaian businesses already saving time and ensuring compliance with AkwaabaHRPay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4 bg-transparent"
              >
                Schedule Demo
              </Button>
            </Link>
          </div>
          <p className="text-emerald-200 text-sm mt-4">
            30-day free trial • No credit card required • Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo variant="full" size="md" className="text-white" />
              </div>
              <p className="text-gray-400 text-sm">
                Professional HR & Payroll software built specifically for Ghanaian businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/features/security" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <a href="#integrations" className="hover:text-white transition-colors">
                    Integrations
                  </a>
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
