"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, BookOpen, DollarSign, BarChart3, MessageSquare, Shield, Clock } from "lucide-react"
import Link from "next/link"
import { FeatureModal } from "@/components/landing/feature-modal"
import { useState, useEffect } from "react"

const featureData = {
  "Student Information System": {
    title: "Student Information System",
    description:
      "Comprehensive student management with complete profiles, enrollment tracking, guardian relationships, and academic history. Streamline admissions, manage student data, and maintain detailed records all in one place.",
    image: "/student-dashboard.png",
    badge: "Core Module",
    features: [
      "Complete student profiles with photos",
      "Guardian and emergency contact management",
      "Enrollment and admission tracking",
      "Medical records and allergies",
      "Academic history and transcripts",
      "Bulk student import/export",
      "Advanced search and filtering",
      "Student ID card generation",
    ],
  },
  "Academic Management": {
    title: "Academic Management",
    description:
      "Complete academic structure management including classes, subjects, terms, timetables, and curriculum planning. Organize your school's academic framework with ease and flexibility.",
    image: "/academic-management-interface.png",
    badge: "Academic Core",
    features: [
      "Grade level and class management",
      "Subject assignment to classes",
      "Teacher allocation and scheduling",
      "Academic term and calendar setup",
      "Timetable generation and management",
      "Curriculum planning tools",
      "Class capacity management",
      "Academic year transitions",
    ],
  },
  "Fee Management": {
    title: "Fee Management",
    description:
      "Automated fee collection system with invoice generation, payment tracking, and comprehensive financial reporting. Handle all school finances efficiently with built-in payment gateway integration.",
    image: "/fee-management-dashboard.png",
    badge: "Financial Module",
    features: [
      "Automated invoice generation",
      "Multiple payment gateway support",
      "Fee structure by grade and term",
      "Payment history and receipts",
      "Outstanding balance tracking",
      "Scholarship and discount management",
      "Financial reports and analytics",
      "Parent payment portal",
    ],
  },
  "Attendance Tracking": {
    title: "Attendance Tracking",
    description:
      "Digital attendance management with real-time tracking, automated reports, and parent notifications. Monitor student attendance patterns and generate comprehensive attendance analytics.",
    image: "/attendance-tracking-interface.png",
    badge: "Daily Operations",
    features: [
      "Digital attendance registers",
      "Real-time attendance marking",
      "Attendance analytics and trends",
      "Automated parent notifications",
      "Late arrival and early departure tracking",
      "Attendance reports by class/student",
      "Integration with gradebook",
      "Mobile attendance marking",
    ],
  },
  "Communication Hub": {
    title: "Communication Hub",
    description:
      "Centralized communication platform connecting teachers, students, parents, and administrators. Send announcements, messages, and notifications through multiple channels.",
    image: "/communication-hub.png",
    badge: "Communication",
    features: [
      "Multi-channel messaging system",
      "School-wide announcements",
      "Parent-teacher communication",
      "SMS and email integration",
      "Event notifications and reminders",
      "Emergency alert system",
      "Message history and archives",
      "Bulk communication tools",
    ],
  },
  "Reports & Analytics": {
    title: "Reports & Analytics",
    description:
      "Comprehensive reporting suite with interactive charts, data visualization, and actionable insights. Generate detailed reports on academics, finances, attendance, and school performance.",
    image: "/school-performance-dashboard.png",
    badge: "Intelligence",
    features: [
      "Interactive charts and graphs",
      "Academic performance analytics",
      "Financial reporting and trends",
      "Attendance pattern analysis",
      "Student progress tracking",
      "Custom report builder",
      "Export to PDF and Excel",
      "Real-time dashboard metrics",
    ],
  },
}

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        window.location.href = "/dashboard"
      }
      setUser(user)
    }
    checkUser()
  }, [])

  const handleFeatureClick = (featureName: string) => {
    setSelectedFeature(featureName)
  }

  const closeModal = () => {
    setSelectedFeature(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SchoolHub</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">Trusted by 500+ Schools Worldwide</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Complete School Management
            <span className="text-blue-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Streamline your educational institution with our comprehensive platform. Manage students, staff, academics,
            finances, and communications all in one place.
          </p>

          <div className="mb-8">
            <img
              src="/modern-school-tech.png"
              alt="Modern School Environment"
              className="mx-auto rounded-lg shadow-xl"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent">
                School Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything Your School Needs</h2>
            <p className="text-gray-600 text-lg">Powerful features designed for modern educational institutions</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleFeatureClick("Student Information System")}
            >
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Student Information System</CardTitle>
                <CardDescription>
                  Complete student profiles, enrollment tracking, and guardian management
                </CardDescription>
                <Badge className="w-fit mt-2 bg-blue-50 text-blue-700 hover:bg-blue-50">Click to Preview</Badge>
              </CardHeader>
            </Card>

            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleFeatureClick("Academic Management")}
            >
              <CardHeader>
                <BookOpen className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Academic Management</CardTitle>
                <CardDescription>Classes, subjects, timetables, assessments, and gradebook management</CardDescription>
                <Badge className="w-fit mt-2 bg-green-50 text-green-700 hover:bg-green-50">Click to Preview</Badge>
              </CardHeader>
            </Card>

            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleFeatureClick("Fee Management")}
            >
              <CardHeader>
                <DollarSign className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Fee Management</CardTitle>
                <CardDescription>Automated invoicing, payment tracking, and financial reporting</CardDescription>
                <Badge className="w-fit mt-2 bg-purple-50 text-purple-700 hover:bg-purple-50">Click to Preview</Badge>
              </CardHeader>
            </Card>

            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleFeatureClick("Attendance Tracking")}
            >
              <CardHeader>
                <Clock className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Attendance Tracking</CardTitle>
                <CardDescription>Digital attendance registers with real-time reporting and analytics</CardDescription>
                <Badge className="w-fit mt-2 bg-orange-50 text-orange-700 hover:bg-orange-50">Click to Preview</Badge>
              </CardHeader>
            </Card>

            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleFeatureClick("Communication Hub")}
            >
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Communication Hub</CardTitle>
                <CardDescription>Messaging, announcements, and parent-teacher communication tools</CardDescription>
                <Badge className="w-fit mt-2 bg-red-50 text-red-700 hover:bg-red-50">Click to Preview</Badge>
              </CardHeader>
            </Card>

            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleFeatureClick("Reports & Analytics")}
            >
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>Comprehensive reporting with interactive charts and data insights</CardDescription>
                <Badge className="w-fit mt-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">Click to Preview</Badge>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Leading Educational Institutions</h2>
            <p className="text-gray-600 text-lg">See how schools worldwide are transforming education with SchoolHub</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <img
                src="/modern-classroom.png"
                alt="Modern Classroom"
                className="w-full rounded-lg shadow-lg mb-4"
              />
              <h3 className="font-semibold text-lg">Digital Classrooms</h3>
              <p className="text-gray-600">Interactive learning environments</p>
            </div>
            <div className="text-center">
              <img
                src="/school-administration-office.png"
                alt="School Administration"
                className="w-full rounded-lg shadow-lg mb-4"
              />
              <h3 className="font-semibold text-lg">Efficient Administration</h3>
              <p className="text-gray-600">Streamlined school operations</p>
            </div>
            <div className="text-center">
              <img
                src="/parents-teachers-meeting.png"
                alt="Parent-Teacher Collaboration"
                className="w-full rounded-lg shadow-lg mb-4"
              />
              <h3 className="font-semibold text-lg">Enhanced Communication</h3>
              <p className="text-gray-600">Better parent-school engagement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Why Schools Choose SchoolHub</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <Shield className="h-16 w-16 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">Enterprise-grade security with 99.9% uptime guarantee</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-gray-600">Each school gets their own isolated, customized environment</p>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="h-16 w-16 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Quick Setup</h3>
              <p className="text-gray-600">Get your school online in minutes, not months</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your School?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of schools already using SchoolHub to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                Access Your School
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="h-8 w-8" />
            <span className="text-2xl font-bold">SchoolHub</span>
          </div>
          <p className="text-gray-400 mb-4">Empowering education through technology</p>
          <p className="text-sm text-gray-500">© 2024 SchoolHub. All rights reserved.</p>
        </div>
      </footer>

      {selectedFeature && (
        <FeatureModal
          isOpen={!!selectedFeature}
          onClose={closeModal}
          feature={featureData[selectedFeature as keyof typeof featureData]}
        />
      )}
    </div>
  )
}
