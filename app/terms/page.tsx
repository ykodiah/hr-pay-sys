import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Scale, Shield } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | AkwaabaHRPay",
  description: "Terms governing access to and use of the AkwaabaHRPay HR and payroll platform, including accounts, subscriptions, data, acceptable use and service conditions.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scale className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">Terms of Service</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              These terms govern your use of AkwaabaHRPay's HR and payroll management platform. Please read them
              carefully.
            </p>
            <p className="text-sm text-gray-500 mt-4">Last updated: August 2026</p>
          </div>
        </div>
      </section>

      {/* Terms Overview */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Clear Terms</h3>
                <p className="text-sm text-gray-600">Straightforward language explaining our service agreement</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fair Usage</h3>
                <p className="text-sm text-gray-600">Reasonable limits and guidelines for platform usage</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Protection</h3>
                <p className="text-sm text-gray-600">Terms designed to protect both you and our service</p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>

            <p className="text-gray-600 mb-6">
              By accessing or using AkwaabaHRPay's services, you agree to be bound by these Terms of Service and our
              Privacy Policy. If you do not agree to these terms, please do not use our services. These terms apply to
              all users, including administrators, HR personnel, and employees accessing the platform.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>

            <p className="text-gray-600 mb-4">
              AkwaabaHRPay provides cloud-based HR and payroll management software specifically designed for businesses
              operating in Ghana. Our services include:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Payroll processing with Ghana tax compliance (PAYE, SSNIT)</li>
              <li>Employee management and record keeping</li>
              <li>Leave management and approval workflows</li>
              <li>Loan and advance tracking</li>
              <li>HR analytics and reporting</li>
              <li>Employee self-service portal</li>
              <li>Mobile application access</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>

            <p className="text-gray-600 mb-4">
              To use our services, you must create an account and provide accurate, complete information. You are
              responsible for:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring all information provided is accurate and up-to-date</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>

            <p className="text-gray-600 mb-4">
              You agree to use our services only for lawful purposes and in accordance with these terms. You may not:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to our systems or other users' data</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Reverse engineer, decompile, or attempt to extract source code</li>
              <li>Use the service to compete with or create a similar product</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data and Privacy</h2>

            <p className="text-gray-600 mb-4">
              You retain ownership of all data you input into our system. By using our services, you grant us permission
              to:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Process your data to provide the requested services</li>
              <li>Store and backup your data for service continuity</li>
              <li>Use aggregated, anonymized data for service improvement</li>
              <li>Access your data as necessary for technical support</li>
            </ul>

            <p className="text-gray-600 mb-6">
              We are committed to protecting your data according to our Privacy Policy and applicable Ghana data
              protection laws.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>

            <p className="text-gray-600 mb-4">Our pricing is based on a per-employee, per-month model:</p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>
                <strong>Monthly Plan:</strong> GH¢10 per employee per month
              </li>
              <li>
                <strong>Annual Plan:</strong> GH¢9 per employee per month (billed annually)
              </li>
              <li>30-day free trial available for new customers</li>
              <li>Payments are due in advance and non-refundable</li>
              <li>Prices may change with 30 days' notice</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>

            <p className="text-gray-600 mb-6">
              We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. We may temporarily suspend
              service for maintenance, updates, or security reasons. We will provide advance notice when possible and
              work to minimize disruptions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>

            <p className="text-gray-600 mb-6">
              AkwaabaHRPay and all related trademarks, logos, and intellectual property are owned by us. You may not use
              our intellectual property without written permission. You retain rights to your data and content, while we
              retain rights to our software, algorithms, and platform.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>

            <p className="text-gray-600 mb-6">
              To the maximum extent permitted by law, AkwaabaHRPay shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of our services. Our total liability shall not
              exceed the amount you paid for the service in the 12 months preceding the claim.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>

            <p className="text-gray-600 mb-6">
              You agree to indemnify and hold harmless AkwaabaHRPay from any claims, damages, or expenses arising from
              your use of the service, violation of these terms, or infringement of any third-party rights.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>

            <p className="text-gray-600 mb-4">Either party may terminate this agreement at any time:</p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>We may terminate accounts that violate these terms</li>
              <li>Upon termination, you have 30 days to export your data</li>
              <li>We will delete your data after the retention period unless legally required to keep it</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>

            <p className="text-gray-600 mb-6">
              These terms are governed by the laws of Ghana. Any disputes will be resolved in the courts of Ghana. We
              will attempt to resolve disputes through good faith negotiation before pursuing legal action.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>

            <p className="text-gray-600 mb-6">
              We may update these terms from time to time. We will notify you of material changes via email or through
              our platform. Continued use of our services after changes indicates acceptance of the updated terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>

            <p className="text-gray-600 mb-4">If you have questions about these terms, please contact us:</p>

            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> legal@akwaabahr.com
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Address:</strong> Labone, Accra, Ghana
              </p>
              <p className="text-gray-700">
                <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM GMT
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            By using our service, you agree to these terms. Start your free trial today.
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
                  <Link href="/terms" className="hover:text-white transition-colors text-emerald-400">
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
