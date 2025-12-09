"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Users,
  Calculator,
  Building,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [planType, setPlanType] = useState("trial")

  const steps = [
    { number: 1, title: "Company Info", description: "Basic company details" },
    { number: 2, title: "Choose Modules", description: "Select HR & Payroll features" },
    { number: 3, title: "Plan Selection", description: "Choose your subscription" },
    { number: 4, title: "Complete Setup", description: "Finalize your account" },
  ]

  const modules = [
    {
      id: "hr",
      name: "HR Management",
      description: "Employee records, leave management, document storage",
      icon: Users,
      popular: true,
    },
    {
      id: "payroll",
      name: "Payroll Processing",
      description: "Ghana tax calculations, PAYE, SSNIT, salary processing",
      icon: Calculator,
      popular: true,
    },
    {
      id: "both",
      name: "Complete HR & Payroll Suite",
      description: "Full access to all features and modules",
      icon: Building,
      popular: false,
      recommended: true,
    },
  ]

  const toggleModule = (moduleId: string) => {
    if (moduleId === "both") {
      setSelectedModules(["both"])
    } else {
      setSelectedModules((prev) => {
        const filtered = prev.filter((id) => id !== "both")
        if (filtered.includes(moduleId)) {
          return filtered.filter((id) => id !== moduleId)
        } else {
          return [...filtered, moduleId]
        }
      })
    }
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
              <span className="text-sm text-gray-600">Already have an account?</span>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step.number ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : step.number}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentStep > step.number ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                      style={{ width: currentStep > step.number ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Company Information */}
        {currentStep === 1 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Company Information</CardTitle>
              <p className="text-gray-600">Tell us about your business to get started</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="industry" className="text-sm font-medium text-gray-700 mb-2 block">
                    Industry *
                  </Label>
                  <Select required>
                    <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance & Banking</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail & Commerce</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="employeeCount" className="text-sm font-medium text-gray-700 mb-2 block">
                    Number of Employees *
                  </Label>
                  <Select required>
                    <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Select employee count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-100">51-100 employees</SelectItem>
                      <SelectItem value="101-500">101-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-2 block">
                    Primary Location *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="location"
                      placeholder="e.g., Accra, Ghana"
                      className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                    Contact Email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="admin@company.com"
                      className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 mb-2 block">
                    Contact Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Modules */}
        {currentStep === 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Choose Your Modules</CardTitle>
              <p className="text-gray-600">Select the features you need for your business</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {modules.map((module) => {
                  const Icon = module.icon
                  const isSelected = selectedModules.includes(module.id)

                  return (
                    <div
                      key={module.id}
                      onClick={() => toggleModule(module.id)}
                      className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-emerald-600" : "bg-gray-100"
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? "text-white" : "text-gray-600"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                            {module.popular && <Badge className="bg-blue-100 text-blue-800">Popular</Badge>}
                            {module.recommended && (
                              <Badge className="bg-emerald-100 text-emerald-800">
                                <Star className="w-3 h-3 mr-1" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600">{module.description}</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="px-8">
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={selectedModules.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 px-8"
                >
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Plan Selection */}
        {currentStep === 3 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Choose Your Plan</CardTitle>
              <p className="text-gray-600">Start with a free trial or select a paid plan</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={planType} onValueChange={setPlanType}>
                <div className="space-y-4">
                  {/* Free Trial */}
                  <div
                    className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      planType === "trial" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="trial" id="trial" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-lg font-semibold text-gray-900">30-Day Free Trial</h3>
                          <Badge className="bg-emerald-100 text-emerald-800">Recommended</Badge>
                        </div>
                        <p className="text-gray-600 mb-3">
                          Try all features free for 30 days. No credit card required.
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Full access to all selected modules</li>
                          <li>• Up to 50 employees</li>
                          <li>• Email support</li>
                          <li>• No setup fees</li>
                        </ul>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">Free</div>
                        <div className="text-sm text-gray-500">for 30 days</div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Plan */}
                  <div
                    className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      planType === "monthly" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="monthly" id="monthly" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Monthly Plan</h3>
                        </div>
                        <p className="text-gray-600 mb-3">Pay monthly with full flexibility to cancel anytime.</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• All features included</li>
                          <li>• Unlimited employees</li>
                          <li>• Priority support</li>
                          <li>• Monthly billing</li>
                        </ul>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">GH¢10</div>
                        <div className="text-sm text-gray-500">per employee/month</div>
                      </div>
                    </div>
                  </div>

                  {/* Annual Plan */}
                  <div
                    className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      planType === "annual" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="annual" id="annual" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Annual Plan</h3>
                          <Badge className="bg-green-100 text-green-800">Save 10%</Badge>
                        </div>
                        <p className="text-gray-600 mb-3">Best value with annual billing and additional benefits.</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• All features included</li>
                          <li>• Unlimited employees</li>
                          <li>• Priority support</li>
                          <li>• Dedicated account manager</li>
                        </ul>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">GH¢9</div>
                        <div className="text-sm text-gray-500">per employee/month</div>
                        <div className="text-xs text-green-600 font-medium">Save GH¢12/employee/year</div>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="px-8">
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(4)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete Setup */}
        {currentStep === 4 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Complete Your Setup</CardTitle>
              <p className="text-gray-600">Create your admin account and finalize setup</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="adminFirstName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Admin First Name *
                  </Label>
                  <Input
                    id="adminFirstName"
                    placeholder="Enter first name"
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="adminLastName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Admin Last Name *
                  </Label>
                  <Input
                    id="adminLastName"
                    placeholder="Enter last name"
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adminEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                  Admin Email *
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@company.com"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="adminPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                  Password *
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Create a strong password"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="updates" />
                  <Label htmlFor="updates" className="text-sm text-gray-600">
                    Send me product updates and HR tips
                  </Label>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg">
                <h4 className="font-medium text-emerald-800 mb-2">Setup Summary</h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Modules: {selectedModules.join(", ").replace("both", "Complete HR & Payroll Suite")}</li>
                  <li>
                    • Plan:{" "}
                    {planType === "trial"
                      ? "30-Day Free Trial"
                      : planType === "monthly"
                        ? "Monthly Plan (GH¢10/employee)"
                        : "Annual Plan (GH¢9/employee)"}
                  </li>
                  <li>• Setup time: Less than 5 minutes</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="px-8">
                  Back
                </Button>
                <Link href="/launch">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 px-8">
                    Complete Setup
                    <CheckCircle className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
