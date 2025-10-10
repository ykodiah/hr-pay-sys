"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Building2, Users, Calculator } from "lucide-react"
import Link from "next/link"

export default function GetStartedPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    contactName: "",
    email: "",
    phone: "",
    country: "Ghana",
    city: "",
    requirements: "",
    currentSystem: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    console.log("[v0] Get Started form submitted:", formData)
    // Here you would typically send data to your backend
    setStep(4) // Show success step
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Get Started with AkwaabaHRPay</h1>
          <p className="text-xl text-gray-600">Set up your HR & Payroll system in minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > stepNum ? <CheckCircle className="w-5 h-5" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${step > stepNum ? "bg-emerald-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Company Information
                </CardTitle>
                <CardDescription>Tell us about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Enter your company name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance & Banking</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => handleInputChange("companySize", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Contact Information
                </CardTitle>
                <CardDescription>How can we reach you?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+233 XX XXX XXXX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter your city"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Requirements & Setup
                </CardTitle>
                <CardDescription>Tell us about your specific needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentSystem">Current HR/Payroll System</Label>
                  <Select
                    value={formData.currentSystem}
                    onValueChange={(value) => handleInputChange("currentSystem", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="What system are you currently using?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No current system</SelectItem>
                      <SelectItem value="excel">Excel/Spreadsheets</SelectItem>
                      <SelectItem value="quickbooks">QuickBooks</SelectItem>
                      <SelectItem value="sage">Sage</SelectItem>
                      <SelectItem value="other-software">Other HR Software</SelectItem>
                      <SelectItem value="manual">Manual/Paper-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requirements">Specific Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    placeholder="Tell us about any specific requirements, integrations, or features you need..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-medium text-emerald-800 mb-2">What's included in your setup:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-emerald-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Ghana PAYE & SSNIT compliance
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Employee self-service portal
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Automated payroll processing
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Leave management system
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Performance tracking
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Document management
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                    Complete Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-emerald-600">Setup Complete!</CardTitle>
                <CardDescription>Your AkwaabaHRPay account is being prepared</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for choosing AkwaabaHRPay! Our team will contact you within 24 hours to complete your
                  account setup and provide training.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Next Steps:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Account setup and configuration</li>
                    <li>• Data migration assistance (if needed)</li>
                    <li>• Team training and onboarding</li>
                    <li>• Go-live support</li>
                  </ul>
                </div>
                <div className="flex gap-4 justify-center">
                  <Link href="/auth/login">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">Access Demo Account</Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline">Contact Support</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
