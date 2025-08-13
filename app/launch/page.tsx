"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Users,
  Calculator,
  TrendingUp,
  Settings,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LaunchPage() {
  const [showCredentials, setShowCredentials] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const demoCredentials = {
    adminEmail: "admin@demo.akwaabahr.com",
    adminPassword: "Demo123!@#",
    employeeEmail: "employee@demo.akwaabahr.com",
    employeePassword: "Employee123!",
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AkwaabaHRPay</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/help">
                <Button variant="ghost" className="text-gray-600">
                  Help Center
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="text-gray-600">
                  Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to AkwaabaHRPay!</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your account has been successfully created. You're ready to start managing your HR and payroll operations.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center p-6">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Employees Added</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Payrolls Processed</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">30</div>
              <div className="text-sm text-gray-600">Trial Days Left</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">25%</div>
              <div className="text-sm text-gray-600">Setup Complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Credentials */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Eye className="w-6 h-6 mr-2 text-emerald-600" />
              Demo Access Credentials
            </CardTitle>
            <p className="text-gray-600">
              Use these credentials to explore the full AkwaabaHRPay platform with sample data
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h4 className="font-medium text-emerald-800 mb-2">What's included in the demo:</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Sample employee data with Ghana-specific information</li>
                <li>• Pre-configured payroll with PAYE and SSNIT calculations</li>
                <li>• Leave management system with approval workflows</li>
                <li>• HR analytics dashboard with real insights</li>
                <li>• Employee self-service portal demonstration</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Admin Credentials */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-emerald-100 text-emerald-800">Admin Access</Badge>
                  <span className="text-sm text-gray-600">Full system access</span>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={demoCredentials.adminEmail} readOnly className="bg-gray-50 border-gray-300" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(demoCredentials.adminEmail, "adminEmail")}
                    >
                      {copiedField === "adminEmail" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Password</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showCredentials ? "text" : "password"}
                      value={demoCredentials.adminPassword}
                      readOnly
                      className="bg-gray-50 border-gray-300"
                    />
                    <Button size="sm" variant="outline" onClick={() => setShowCredentials(!showCredentials)}>
                      {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(demoCredentials.adminPassword, "adminPassword")}
                    >
                      {copiedField === "adminPassword" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Employee Credentials */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">Employee Access</Badge>
                  <span className="text-sm text-gray-600">Self-service portal</span>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={demoCredentials.employeeEmail} readOnly className="bg-gray-50 border-gray-300" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(demoCredentials.employeeEmail, "employeeEmail")}
                    >
                      {copiedField === "employeeEmail" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Password</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showCredentials ? "text" : "password"}
                      value={demoCredentials.employeePassword}
                      readOnly
                      className="bg-gray-50 border-gray-300"
                    />
                    <Button size="sm" variant="outline" onClick={() => setShowCredentials(!showCredentials)}>
                      {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(demoCredentials.employeePassword, "employeePassword")}
                    >
                      {copiedField === "employeePassword" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Admin Dashboard</h3>
              <p className="text-gray-600 mb-6">
                Access the full HR and payroll management system with administrative privileges.
              </p>
              <Link href="/app">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Launch Admin Dashboard
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Employee Portal</h3>
              <p className="text-gray-600 mb-6">
                Experience the employee self-service portal for payslips, leave requests, and more.
              </p>
              <Link href="/self-service">
                <Button variant="outline" className="w-full bg-transparent">
                  Launch Employee Portal
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Next Steps</CardTitle>
            <p className="text-gray-600">Get the most out of your AkwaabaHRPay experience</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Quick Setup Tasks</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">1</span>
                    </div>
                    <span className="text-gray-700">Add your first employees</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">2</span>
                    </div>
                    <span className="text-gray-700">Configure payroll settings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">3</span>
                    </div>
                    <span className="text-gray-700">Set up leave policies</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">4</span>
                    </div>
                    <span className="text-gray-700">Run your first payroll</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Resources</h4>
                <div className="space-y-3">
                  <Link href="/help" className="flex items-center space-x-3 text-emerald-600 hover:text-emerald-700">
                    <ArrowRight className="w-4 h-4" />
                    <span>Browse Help Center</span>
                  </Link>
                  <Link
                    href="/training"
                    className="flex items-center space-x-3 text-emerald-600 hover:text-emerald-700"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Watch Training Videos</span>
                  </Link>
                  <Link href="/contact" className="flex items-center space-x-3 text-emerald-600 hover:text-emerald-700">
                    <ArrowRight className="w-4 h-4" />
                    <span>Contact Support</span>
                  </Link>
                  <Link href="/demo" className="flex items-center space-x-3 text-emerald-600 hover:text-emerald-700">
                    <ArrowRight className="w-4 h-4" />
                    <span>Schedule a Demo Call</span>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
