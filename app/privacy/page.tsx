import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Eye, Users } from "lucide-react"
import Link from "next/link"
import { SiteFooter, SiteHeader } from "@/components/marketing-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | AkwaabaHRPay",
  description: "Learn how AkwaabaHRPay collects, uses, stores and protects account, employee, payroll and platform usage information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">Privacy Policy</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your privacy and data security are fundamental to our service. This policy explains how we collect, use,
              and protect your information.
            </p>
            <p className="text-sm text-gray-500 mt-4">Last updated: August 2026</p>
          </div>
        </div>
      </section>

      {/* Privacy Overview */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Encryption</h3>
                <p className="text-sm text-gray-600">All data encrypted in transit and at rest using AES-256</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Transparency</h3>
                <p className="text-sm text-gray-600">Clear policies on what data we collect and how it's used</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Rights</h3>
                <p className="text-sm text-gray-600">Full control over your data with easy access and deletion</p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
            <p className="text-gray-600 mb-4">
              When you create an AkwaabaHRPay account, we collect basic information such as your name, email address,
              company name, and contact details. This information is necessary to provide our services and communicate
              with you.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Employee Data</h3>
            <p className="text-gray-600 mb-4">
              As an HR and payroll platform, we process employee information including names, addresses, identification
              numbers, salary information, tax details, and employment records. This data is processed solely to provide
              payroll and HR services as requested by your organization.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Information</h3>
            <p className="text-gray-600 mb-6">
              We collect information about how you use our platform, including login times, features accessed, and
              system interactions. This helps us improve our service and ensure security.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Provide HR and payroll services as requested</li>
              <li>Process payments and calculate taxes according to Ghana's regulations</li>
              <li>Generate reports and analytics for your business</li>
              <li>Communicate important updates and support information</li>
              <li>Ensure platform security and prevent unauthorized access</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>

            <p className="text-gray-600 mb-4">We implement industry-standard security measures to protect your data:</p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>
                <strong>Encryption:</strong> All data is encrypted using AES-256 encryption both in transit and at rest
              </li>
              <li>
                <strong>Access Controls:</strong> Role-based access ensures only authorized personnel can view sensitive
                data
              </li>
              <li>
                <strong>Regular Audits:</strong> We conduct regular security audits and penetration testing
              </li>
              <li>
                <strong>Secure Infrastructure:</strong> Our servers are hosted in secure, certified data centers
              </li>
              <li>
                <strong>Backup & Recovery:</strong> Regular backups ensure data availability and disaster recovery
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing</h2>

            <p className="text-gray-600 mb-4">
              We do not sell, rent, or share your personal information with third parties except in the following
              circumstances:
            </p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>
                <strong>Service Providers:</strong> Trusted partners who help us provide our services (e.g., payment
                processors)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights and users
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger or acquisition (with notice to users)
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly authorize us to share specific information
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>

            <p className="text-gray-600 mb-4">You have the following rights regarding your personal data:</p>

            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of the personal data we hold about you
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or incomplete data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)
              </li>
              <li>
                <strong>Portability:</strong> Request transfer of your data to another service provider
              </li>
              <li>
                <strong>Objection:</strong> Object to certain types of data processing
              </li>
              <li>
                <strong>Restriction:</strong> Request restriction of data processing in certain circumstances
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>

            <p className="text-gray-600 mb-6">
              We retain your data only as long as necessary to provide our services and comply with legal obligations.
              Employee records are typically retained for 7 years after employment termination as required by Ghana's
              employment laws. Account data is deleted within 30 days of account closure, unless legal requirements
              dictate otherwise.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Transfers</h2>

            <p className="text-gray-600 mb-6">
              Your data is primarily stored and processed in Ghana. If we need to transfer data internationally, we
              ensure appropriate safeguards are in place to protect your information according to international
              standards.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>

            <p className="text-gray-600 mb-6">
              We use cookies and similar technologies to improve your experience, remember your preferences, and analyze
              platform usage. You can control cookie settings through your browser, though some features may not work
              properly if cookies are disabled.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>

            <p className="text-gray-600 mb-6">
              We may update this privacy policy from time to time. We will notify you of significant changes via email
              or through our platform. Continued use of our services after changes indicates acceptance of the updated
              policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>

            <p className="text-gray-600 mb-4">
              If you have questions about this privacy policy or want to exercise your rights, please contact us:
            </p>

            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> privacy@akwaabahr.com
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Address:</strong> Labone, Accra, Ghana
              </p>
              <p className="text-gray-700">
                <strong>Response Time:</strong> We respond to privacy requests within 30 days
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Questions About Privacy?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Our team is here to help you understand how we protect your data.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
