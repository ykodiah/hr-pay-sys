import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Calculator, Shield, Globe, TrendingUp } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-serif font-bold text-xl">AkwaabaHRPay</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium hover:text-cyan-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-cyan-600 transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-sm font-medium hover:text-cyan-600 transition-colors">
              About
            </a>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🇬🇭 Built for Ghanaian Businesses
          </Badge>
          <h1 className="font-serif font-bold text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight">
            Empower Your Workforce with <span className="text-cyan-600">AkwaabaHRPay</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline HR & Payroll Management for Your Ghanaian Business. From SSNIT calculations to leave management,
            we handle it all with local expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-lg px-8 py-6">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
              Watch Demo
            </Button>
          </div>
          <div className="relative">
            <img
              src="/ghanaian-hr-office.png"
              alt="Ghanaian professionals using AkwaabaHRPay"
              className="rounded-lg shadow-2xl mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif font-bold text-3xl md:text-4xl mb-4">Everything You Need for HR Success</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive solutions designed specifically for Ghanaian businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="font-serif">Ghana-Compliant Payroll</CardTitle>
                <CardDescription>
                  Automated PAYE and SSNIT calculations following Ghana's 2025 tax regulations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="font-serif">Employee Management</CardTitle>
                <CardDescription>Complete employee lifecycle management from onboarding to offboarding</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="font-serif">Leave Management</CardTitle>
                <CardDescription>
                  Track annual, sick, maternity, and other leave types with automated approvals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="font-serif">Multi-Tenant Architecture</CardTitle>
                <CardDescription>Manage multiple companies and organizations from a single platform</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="font-serif">Analytics & Reporting</CardTitle>
                <CardDescription>Comprehensive insights into your workforce and payroll expenses</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="font-serif">Employee Self-Service</CardTitle>
                <CardDescription>
                  Empower employees with mobile access to payslips, leave requests, and more
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif font-bold text-3xl md:text-4xl mb-6">Why Choose AkwaabaHRPay?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-lg mb-2">Local Expertise</h3>
                    <p className="text-muted-foreground">
                      Built with Ghanaian businesses in mind, we understand your unique regulatory and cultural needs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-lg mb-2">Comprehensive Solutions</h3>
                    <p className="text-muted-foreground">
                      From payroll processing to employee management, we've got you covered with an all-in-one platform.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-lg mb-2">Cutting-Edge Technology</h3>
                    <p className="text-muted-foreground">
                      Experience a seamless, user-friendly platform that drives efficiency and reduces manual work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="/placeholder-xcjdz.png"
                alt="Successful Ghanaian business team"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-cyan-600">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-white mb-6">
            Ready to Transform Your HR Operations?
          </h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of Ghanaian businesses already using AkwaabaHRPay to streamline their workforce management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Get Started Today
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-cyan-600 bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-serif font-bold text-xl">AkwaabaHRPay</span>
              </div>
              <p className="text-muted-foreground">
                Empowering Ghanaian businesses with comprehensive HR & Payroll solutions.
              </p>
            </div>
            <div>
              <h4 className="font-serif font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 AkwaabaHRPay. All rights reserved. Made with ❤️ in Ghana.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
