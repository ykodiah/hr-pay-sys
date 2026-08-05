/**
 * Canonical admin-portal module catalog.
 * Superadmin `superadmin_modules` and ClientAppLayout nav must stay aligned with this list.
 */
export type AdminPortalModule = {
  code: string
  name: string
  description: string
  href: string
  section: string
  monthly_cost: number
}

export const ADMIN_PORTAL_MODULES: AdminPortalModule[] = [
  { code: "dashboard", name: "Dashboard", description: "Overview and key metrics", href: "/app", section: "Overview", monthly_cost: 0 },
  { code: "employees", name: "Employees", description: "Manage employee records", href: "/app/employees", section: "HR Management", monthly_cost: 50 },
  { code: "recruitment", name: "Recruitment", description: "Hire new talent", href: "/app/recruitment", section: "HR Management", monthly_cost: 40 },
  { code: "org_chart", name: "Org Chart", description: "Organizational structure", href: "/app/org-chart", section: "HR Management", monthly_cost: 20 },
  { code: "documents", name: "Documents", description: "Document vault", href: "/app/documents", section: "HR Management", monthly_cost: 25 },
  { code: "communication", name: "Communication", description: "Team communication", href: "/app/communication", section: "HR Management", monthly_cost: 30 },
  { code: "communication_settings", name: "Comm. Settings", description: "Channels, templates & credentials", href: "/app/communication/settings", section: "HR Management", monthly_cost: 10 },
  { code: "meetings", name: "Meetings", description: "Secure meetings workspace", href: "/app/meetings", section: "HR Management", monthly_cost: 20 },
  { code: "attendance", name: "Attendance", description: "Track work hours", href: "/app/attendance", section: "Time & Attendance", monthly_cost: 35 },
  { code: "attendance_alerts", name: "Attendance Alerts", description: "Alerts & attendance rules", href: "/app/attendance/alerts", section: "Time & Attendance", monthly_cost: 15 },
  { code: "leave", name: "Leave Management", description: "Manage leave requests", href: "/app/leave", section: "Time & Attendance", monthly_cost: 30 },
  { code: "overtime", name: "Overtime", description: "Overtime requests", href: "/app/overtime", section: "Time & Attendance", monthly_cost: 20 },
  { code: "performance", name: "Performance", description: "Performance reviews", href: "/app/performance", section: "Performance", monthly_cost: 35 },
  { code: "promotions", name: "Promotions", description: "Career advancement", href: "/app/promotions", section: "Performance", monthly_cost: 15 },
  { code: "learning", name: "Learning", description: "Training & development", href: "/app/learning", section: "Performance", monthly_cost: 25 },
  { code: "payroll_input", name: "Pay Inputs", description: "Period emoluments & adjustments", href: "/app/payroll/input", section: "Payroll", monthly_cost: 20 },
  { code: "payroll", name: "Process Payroll", description: "Run statutory payroll", href: "/app/payroll", section: "Payroll", monthly_cost: 60 },
  { code: "tax_reliefs", name: "Tax Reliefs", description: "Assign employee tax reliefs by year", href: "/app/payroll/tax-reliefs", section: "Payroll", monthly_cost: 15 },
  { code: "payslips", name: "Payslips", description: "Generate & download payslips", href: "/app/payroll/payslips", section: "Payroll", monthly_cost: 15 },
  { code: "payroll_history", name: "Payroll History", description: "Past payroll records", href: "/app/payroll/history", section: "Payroll", monthly_cost: 10 },
  { code: "approvals", name: "Approvals", description: "Approve payroll, leave & overtime", href: "/app/approvals", section: "Payroll", monthly_cost: 15 },
  { code: "loans", name: "Loans", description: "Employee loans", href: "/app/loans", section: "Payroll", monthly_cost: 20 },
  { code: "analytics", name: "Analytics", description: "Reports & insights", href: "/app/analytics", section: "Analytics", monthly_cost: 40 },
  { code: "compliance_reports", name: "Compliance Reports", description: "PAYE, SSNIT & statutory reports", href: "/app/reports", section: "Analytics", monthly_cost: 30 },
  { code: "ml_analytics", name: "ML Analytics", description: "AI-powered HR analytics", href: "/app/ml-analytics", section: "Analytics", monthly_cost: 45 },
  { code: "self_service", name: "My Portal", description: "Personalised employee workspace", href: "/app/self-service", section: "Employee Hub", monthly_cost: 10 },
  { code: "update_details", name: "Update My Details", description: "Submit change requests", href: "/app/self-service/update-details", section: "Employee Hub", monthly_cost: 5 },
  { code: "change_requests", name: "Change Requests", description: "Review employee change requests", href: "/app/hr/change-requests", section: "Employee Hub", monthly_cost: 10 },
  { code: "disciplinary", name: "Disciplinary", description: "Disciplinary actions", href: "/app/disciplinary", section: "Administration", monthly_cost: 15 },
  { code: "offboarding", name: "Offboarding", description: "Employee exit process", href: "/app/offboarding", section: "Administration", monthly_cost: 15 },
  { code: "integrations", name: "Integrations", description: "Third-party integrations", href: "/app/integrations", section: "Administration", monthly_cost: 25 },
  { code: "settings", name: "Settings", description: "System settings", href: "/app/settings", section: "Administration", monthly_cost: 0 },
]

export const ALWAYS_ON_MODULE_CODES = new Set(["dashboard", "settings", "self_service"])
