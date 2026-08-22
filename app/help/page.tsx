import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  BookOpen,
  Users,
  Calculator,
  TrendingUp,
  Globe,
  Shield,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { SiteFooter, SiteHeader } from "@/components/marketing-shell"

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">Help Center</h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Find answers to common questions, learn how to use AkwaabaHRPay features, and get the support you need.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-12">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search for help articles, features, or topics..."
              className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-emerald-500 rounded-lg"
            />
            <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Help Options */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Immediate Help?</h2>
            <p className="text-gray-600">Choose the best way to get support</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-sm text-gray-600 mb-4">Get instant help from our support team</p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">Start Chat</Button>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
                <p className="text-sm text-gray-600 mb-4">Send us a detailed message</p>
                <Link href="/contact">
                  <Button variant="outline" className="w-full bg-transparent">
                    Send Email
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
                <p className="text-sm text-gray-600 mb-4">Call us during business hours</p>
                <Button variant="outline" className="w-full bg-transparent">
                  +233 XX XXX XXXX
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Browse Help Topics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find detailed guides and tutorials for every aspect of AkwaabaHRPay
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/help/getting-started" className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Getting Started</h3>
                  <p className="text-gray-600 mb-4">
                    Learn the basics of setting up your account, adding employees, and running your first payroll.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-100 text-emerald-800">8 articles</Badge>
                    <span className="text-emerald-600 text-sm font-medium">View guides →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/payroll" className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Payroll Management</h3>
                  <p className="text-gray-600 mb-4">
                    Master Ghana's payroll calculations, PAYE, SSNIT, and ensure compliance with local tax laws.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-100 text-blue-800">12 articles</Badge>
                    <span className="text-emerald-600 text-sm font-medium">View guides →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/hr-management" className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">HR Management</h3>
                  <p className="text-gray-600 mb-4">
                    Manage employees, track leave, handle loans and advances, and streamline HR processes.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-100 text-purple-800">10 articles</Badge>
                    <span className="text-emerald-600 text-sm font-medium">View guides →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/analytics" className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Reports & Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Generate insights, create custom reports, and analyze your HR and payroll data effectively.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-orange-100 text-orange-800">6 articles</Badge>
                    <span className="text-emerald-600 text-sm font-medium">View guides →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/multi-location" className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Location Setup</h3>
                  <p className="text-gray-600 mb-4">
                    Configure multiple branches, manage subsidiaries, and consolidate reporting across locations.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800">5 articles</Badge>
                    <span className="text-emerald-600 text-sm font-medium">View guides →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/security" className="block">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Security & Compliance</h3>
                  <p className="text-gray-600 mb-4">
                    Understand security features, manage user permissions, and ensure data protection compliance.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-100 text-red-800">7 articles</Badge>
                    <span className="text-emerald-600 text-sm font-medium">View guides →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Popular Articles</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Most frequently accessed help articles by our users
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How to Set Up Your First Payroll</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Step-by-step guide to configuring payroll settings and running your first payroll cycle.
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>5 min read</span>
                      <span>•</span>
                      <span>Updated Jan 2025</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Understanding Ghana PAYE Calculations</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Complete guide to Ghana's Pay As You Earn tax system and how AkwaabaHRPay handles calculations.
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>8 min read</span>
                      <span>•</span>
                      <span>Updated Jan 2025</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Adding and Managing Employees</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Learn how to add new employees, update their information, and manage their records effectively.
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>6 min read</span>
                      <span>•</span>
                      <span>Updated Jan 2025</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Setting Up Leave Policies</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Configure annual leave, sick leave, and custom leave types according to your company policies.
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>7 min read</span>
                      <span>•</span>
                      <span>Updated Jan 2025</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Our support team is here to help you succeed with AkwaabaHRPay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
                Contact Support
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4 bg-transparent"
            >
              Schedule a Call
            </Button>
          </div>
          <p className="text-emerald-200 text-sm mt-4">
            Average response time: 2 hours • Available Monday-Friday, 9 AM - 6 PM GMT
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
