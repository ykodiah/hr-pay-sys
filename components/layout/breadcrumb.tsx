"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  admissions: "Admissions",
  enrollments: "Enrollments",
  academic: "Academic",
  classes: "Classes",
  subjects: "Subjects",
  timetable: "Timetable",
  terms: "Terms",
  attendance: "Attendance",
  assessments: "Assessments",
  gradebook: "Gradebook",
  exams: "Exams",
  reports: "Reports",
  finance: "Finance",
  structure: "Fee Structure",
  invoices: "Invoices",
  payments: "Payments",
  scholarships: "Scholarships",
  communications: "Communications",
  announcements: "Announcements",
  messages: "Messages",
  settings: "Settings",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return null
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === segments.length - 1

    return {
      href,
      label,
      isLast,
    }
  })

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link href="/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {breadcrumb.isLast ? (
            <span className="font-medium text-gray-900">{breadcrumb.label}</span>
          ) : (
            <Link href={breadcrumb.href} className="hover:text-gray-900 transition-colors">
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
