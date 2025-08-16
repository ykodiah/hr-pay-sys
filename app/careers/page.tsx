import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Briefcase } from "lucide-react"
import Link from "next/link"

export default function CareersPage() {
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
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800">Join Our Team</Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Build the Future of
              <span className="text-emerald-600 block">HR Technology</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Join our mission to transform how businesses in Ghana manage their most valuable asset - their people.
              We're looking for passionate individuals who want to make a real impact on the African business landscape.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why AkwaabaHRPay?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We offer more than just a job - we provide a platform to grow, innovate, and make a difference.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Collaborative Culture</h3>
                <p className="text-gray-600 leading-relaxed">
                  Work with a diverse, talented team that values collaboration, creativity, and continuous learning. We
                  believe the best ideas come from working together.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Growth Opportunities</h3>
                <p className="text-gray-600 leading-relaxed">
                  Advance your career with clear progression paths, mentorship programs, and opportunities to lead
                  projects that impact thousands of businesses across Ghana.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Flexible Work</h3>
                <p className="text-gray-600 leading-relaxed">
                  Enjoy flexible working arrangements with options for remote work, flexible hours, and a healthy
                  work-life balance that supports your personal and professional goals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Current Openings */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Current Openings</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're currently reviewing our hiring needs. Check back soon for exciting opportunities!
            </p>
          </div>

          <Card className="p-12 text-center max-w-2xl mx-auto">
            <CardContent className="p-0">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Open Positions Currently</h3>
              <p className="text-gray-600 leading-relaxed mb-8">
                We're not actively hiring at the moment, but we're always interested in connecting with talented
                individuals who are passionate about HR technology and want to make an impact in Ghana's business
                ecosystem.
              </p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Interested in future opportunities? Send us your resume and we'll keep you in mind for upcoming roles.
                </p>
                <Link href="/contact">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Send Your Resume</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Benefits & Perks</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We take care of our team so they can focus on building amazing products.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-emerald-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Competitive Salary</h4>
              <p className="text-gray-600 text-sm">Market-competitive compensation with performance bonuses</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Health Insurance</h4>
              <p className="text-gray-600 text-sm">Comprehensive health coverage for you and your family</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Professional Development</h4>
              <p className="text-gray-600 text-sm">Training budget and conference attendance opportunities</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Flexible Hours</h4>
              <p className="text-gray-600 text-sm">Work when you're most productive with core collaboration hours</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Remote Work</h4>
              <p className="text-gray-600 text-sm">Option to work remotely with quarterly team meetups</p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Equity Options</h4>
              <p className="text-gray-600 text-sm">Share in the company's success with stock options</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Make an Impact?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Even if we don't have current openings, we'd love to hear from talented individuals.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
              Get In Touch
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
                  <Link href="/careers" className="hover:text-white transition-colors text-emerald-400">
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
