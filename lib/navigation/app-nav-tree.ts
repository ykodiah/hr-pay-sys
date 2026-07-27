/**
 * Canonical collapsible app navigation tree.
 * Seeded into app_nav_modules / app_nav_nodes (script 083).
 * ClientAppLayout renders this as a numbered expandable tree.
 */

export type NavNodeType = "folder" | "link"

export type AppNavNode = {
  code: string
  label: string
  /** Module gate code for tenant enablement (matches ADMIN_PORTAL_MODULES.code) */
  gate?: string
  href?: string
  type?: NavNodeType
  children?: AppNavNode[]
}

export type AppNavModule = {
  code: string
  number: number
  title: string
  /** Top-level gate: show module if any child gate is enabled */
  gates?: string[]
  children: AppNavNode[]
}

/**
 * Phase 1 modules (HR, Communications, Time & Attendance, Performance).
 * Remaining modules stay flat in ClientAppLayout until next pass.
 */
export const APP_NAV_TREE: AppNavModule[] = [
  {
    code: "hr_management",
    number: 1,
    title: "HR Management",
    gates: ["employees", "recruitment", "org_chart", "documents"],
    children: [
      {
        code: "employees",
        label: "Employees",
        gate: "employees",
        type: "folder",
        children: [
          { code: "employees_add", label: "Add Employees", href: "/app/employees?action=add", gate: "employees", type: "link" },
          { code: "employees_view", label: "View Employees", href: "/app/employees", gate: "employees", type: "link" },
        ],
      },
      {
        code: "recruitment",
        label: "Recruitment",
        gate: "recruitment",
        type: "folder",
        children: [
          { code: "recruitment_overview", label: "Overview", href: "/app/recruitment?tab=overview", gate: "recruitment", type: "link" },
          {
            code: "recruitment_requisitions",
            label: "Requisitions",
            gate: "recruitment",
            type: "folder",
            children: [
              { code: "recruitment_req_add", label: "Add Requisition", href: "/app/recruitment?tab=requisitions&action=add", gate: "recruitment", type: "link" },
              { code: "recruitment_req_view", label: "View Requisition", href: "/app/recruitment?tab=requisitions", gate: "recruitment", type: "link" },
            ],
          },
          {
            code: "recruitment_jobs",
            label: "Jobs",
            gate: "recruitment",
            type: "folder",
            children: [
              { code: "recruitment_jobs_add", label: "Add Jobs", href: "/app/recruitment?tab=jobs&action=add", gate: "recruitment", type: "link" },
              { code: "recruitment_jobs_view", label: "View Jobs list", href: "/app/recruitment?tab=jobs", gate: "recruitment", type: "link" },
            ],
          },
          {
            code: "recruitment_applications",
            label: "Applications",
            gate: "recruitment",
            type: "folder",
            children: [
              { code: "recruitment_apps_add", label: "Add Applications", href: "/app/recruitment?tab=applications&action=add", gate: "recruitment", type: "link" },
              { code: "recruitment_apps_view", label: "View Applications List", href: "/app/recruitment?tab=applications", gate: "recruitment", type: "link" },
            ],
          },
          {
            code: "recruitment_interviews",
            label: "Interviews",
            gate: "recruitment",
            type: "folder",
            children: [
              { code: "recruitment_int_add", label: "Schedule Interview", href: "/app/recruitment?tab=interviews&action=add", gate: "recruitment", type: "link" },
              { code: "recruitment_int_view", label: "View Interview List", href: "/app/recruitment?tab=interviews", gate: "recruitment", type: "link" },
            ],
          },
          {
            code: "recruitment_offers",
            label: "Offers",
            gate: "recruitment",
            type: "folder",
            children: [
              { code: "recruitment_offers_view", label: "View Offer list", href: "/app/recruitment?tab=offers", gate: "recruitment", type: "link" },
            ],
          },
          {
            code: "recruitment_onboarding",
            label: "Onboarding",
            gate: "recruitment",
            type: "folder",
            children: [
              { code: "recruitment_onb_view", label: "View Onboarding", href: "/app/recruitment?tab=onboarding", gate: "recruitment", type: "link" },
            ],
          },
          {
            code: "recruitment_analytics",
            label: "Analytics",
            gate: "recruitment",
            type: "folder",
            children: [
              { code: "recruitment_analytics_view", label: "View Analytics", href: "/app/recruitment?tab=analytics", gate: "recruitment", type: "link" },
            ],
          },
        ],
      },
      {
        code: "org_chart",
        label: "Organizational Chart",
        gate: "org_chart",
        type: "folder",
        children: [
          { code: "org_chart_create", label: "Create Organizational Chart", href: "/app/org-chart?action=create", gate: "org_chart", type: "link" },
          { code: "org_chart_view", label: "View Org. Chart", href: "/app/org-chart", gate: "org_chart", type: "link" },
        ],
      },
      {
        code: "documents",
        label: "Document",
        gate: "documents",
        href: "/app/documents",
        type: "link",
      },
    ],
  },
  {
    code: "communications",
    number: 2,
    title: "Communications",
    gates: ["communication", "communication_settings", "meetings"],
    children: [
      {
        code: "communication",
        label: "Communications",
        gate: "communication",
        href: "/app/communication",
        type: "link",
      },
      {
        code: "communication_settings",
        label: "Comm. Settings",
        gate: "communication_settings",
        type: "folder",
        children: [
          { code: "comm_channels", label: "Channels", href: "/app/communication/settings?tab=channels", gate: "communication_settings", type: "link" },
          { code: "comm_templates", label: "Templates", href: "/app/communication/settings?tab=templates", gate: "communication_settings", type: "link" },
          { code: "comm_snippets", label: "Snippets", href: "/app/communication/settings?tab=snippets", gate: "communication_settings", type: "link" },
        ],
      },
      {
        code: "meetings",
        label: "Meetings",
        gate: "meetings",
        href: "/app/meetings",
        type: "link",
      },
    ],
  },
  {
    code: "time_attendance",
    number: 3,
    title: "Time & Attendance",
    gates: ["attendance", "attendance_alerts", "leave", "overtime"],
    children: [
      { code: "attendance", label: "Attendance", href: "/app/attendance", gate: "attendance", type: "link" },
      { code: "attendance_alerts", label: "Attendance Alerts", href: "/attendance/alerts", gate: "attendance_alerts", type: "link" },
      { code: "leave", label: "Leave Management", href: "/app/leave", gate: "leave", type: "link" },
      { code: "overtime", label: "Overtime", href: "/app/overtime", gate: "overtime", type: "link" },
    ],
  },
  {
    code: "performance_module",
    number: 4,
    title: "Performance Module",
    gates: ["performance", "promotions", "learning"],
    children: [
      {
        code: "performance",
        label: "Performance",
        gate: "performance",
        type: "folder",
        children: [
          { code: "perf_overview", label: "Overview", href: "/app/performance?tab=overview", gate: "performance", type: "link" },
          {
            code: "perf_goals",
            label: "Goals & OKRs",
            gate: "performance",
            type: "folder",
            children: [
              { code: "perf_goals_add", label: "Add New Goals", href: "/app/performance?tab=goals&action=add", gate: "performance", type: "link" },
              { code: "perf_goals_list", label: "Goal List", href: "/app/performance?tab=goals", gate: "performance", type: "link" },
            ],
          },
          {
            code: "perf_reviews",
            label: "Reviews",
            gate: "performance",
            type: "folder",
            children: [
              { code: "perf_reviews_add", label: "Add New Review", href: "/app/performance?tab=reviews&action=add", gate: "performance", type: "link" },
              { code: "perf_reviews_list", label: "Review List", href: "/app/performance?tab=reviews", gate: "performance", type: "link" },
            ],
          },
          {
            code: "perf_competencies",
            label: "Competencies",
            gate: "performance",
            type: "folder",
            children: [
              { code: "perf_comp_add", label: "Add Competency", href: "/app/performance?tab=competencies&action=add", gate: "performance", type: "link" },
              { code: "perf_comp_list", label: "Competency List", href: "/app/performance?tab=competencies", gate: "performance", type: "link" },
            ],
          },
          {
            code: "perf_succession",
            label: "Succession",
            gate: "performance",
            type: "folder",
            children: [
              { code: "perf_succ_add", label: "Add Succession Plan", href: "/app/performance?tab=succession&action=add", gate: "performance", type: "link" },
              { code: "perf_succ_list", label: "Succession List", href: "/app/performance?tab=succession", gate: "performance", type: "link" },
            ],
          },
          { code: "perf_analytics", label: "Analytics", href: "/app/performance?tab=analytics", gate: "performance", type: "link" },
        ],
      },
      {
        code: "promotions",
        label: "Promotion",
        gate: "promotions",
        href: "/app/promotions",
        type: "link",
      },
      {
        code: "learning",
        label: "Learning & Development",
        gate: "learning",
        type: "folder",
        children: [
          { code: "learn_overview", label: "Overview", href: "/app/learning?tab=overview", gate: "learning", type: "link" },
          {
            code: "learn_courses",
            label: "Courses",
            gate: "learning",
            type: "folder",
            children: [
              { code: "learn_courses_add", label: "Add New Course", href: "/app/learning?tab=courses&action=add", gate: "learning", type: "link" },
              { code: "learn_courses_list", label: "Course List", href: "/app/learning?tab=courses", gate: "learning", type: "link" },
            ],
          },
          {
            code: "learn_paths",
            label: "Learning Paths",
            gate: "learning",
            type: "folder",
            children: [
              { code: "learn_paths_add", label: "Add Learning Paths", href: "/app/learning?tab=paths&action=add", gate: "learning", type: "link" },
              { code: "learn_paths_list", label: "Learning Path List", href: "/app/learning?tab=paths", gate: "learning", type: "link" },
            ],
          },
          { code: "learn_enrollments", label: "Enrollments", href: "/app/learning?tab=enrollments", gate: "learning", type: "link" },
          {
            code: "learn_certs",
            label: "Certifications",
            gate: "learning",
            type: "folder",
            children: [
              { code: "learn_certs_add", label: "Add Certifications", href: "/app/learning?tab=certifications&action=add", gate: "learning", type: "link" },
              { code: "learn_certs_view", label: "View Certifications", href: "/app/learning?tab=certifications", gate: "learning", type: "link" },
            ],
          },
          {
            code: "learn_instructors",
            label: "Instructors",
            gate: "learning",
            type: "folder",
            children: [
              { code: "learn_inst_add", label: "Add Instructors", href: "/app/learning?tab=instructors&action=add", gate: "learning", type: "link" },
              { code: "learn_inst_view", label: "View Instructors", href: "/app/learning?tab=instructors", gate: "learning", type: "link" },
            ],
          },
          { code: "learn_analytics", label: "Analytics", href: "/app/learning?tab=analytics", gate: "learning", type: "link" },
        ],
      },
    ],
  },
]

/** Flat leftover sections kept as simple expandable groups until next redesign pass. */
export type AppNavFlatItem = { code: string; name: string; href: string }
export type AppNavFlatSection = { title: string; items: AppNavFlatItem[] }

export const APP_NAV_FLAT_SECTIONS: AppNavFlatSection[] = [
  {
    title: "Payroll",
    items: [
      { code: "payroll_input", name: "Pay Inputs", href: "/app/payroll/input" },
      { code: "payroll", name: "Process Payroll", href: "/app/payroll" },
      { code: "payroll_reports", name: "Ghana Reports", href: "/app/payroll/reports" },
      { code: "tax_reliefs", name: "Tax Reliefs", href: "/app/payroll/tax-reliefs" },
      { code: "payslips", name: "Payslips", href: "/app/payroll/payslips" },
      { code: "payroll_history", name: "Payroll History", href: "/app/payroll/history" },
      { code: "approvals", name: "Approvals", href: "/app/approvals" },
      { code: "loans", name: "Loans", href: "/app/loans" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { code: "analytics", name: "Analytics", href: "/app/analytics" },
      { code: "compliance_reports", name: "Compliance Reports", href: "/app/reports" },
      { code: "ml_analytics", name: "ML Analytics", href: "/app/ml-analytics" },
    ],
  },
  {
    title: "Employee Hub",
    items: [
      { code: "self_service", name: "My Portal", href: "/app/self-service" },
      { code: "update_details", name: "Update My Details", href: "/app/self-service/update-details" },
      { code: "change_requests", name: "Change Requests", href: "/app/hr/change-requests" },
    ],
  },
  {
    title: "Administration",
    items: [
      { code: "disciplinary", name: "Disciplinary", href: "/app/disciplinary" },
      { code: "offboarding", name: "Offboarding", href: "/app/offboarding" },
      { code: "integrations", name: "Integrations", href: "/app/integrations" },
      { code: "settings", name: "Settings", href: "/app/settings" },
    ],
  },
]

export function filterNavTreeByGates(
  tree: AppNavModule[],
  enabledCodes: string[] | null,
): AppNavModule[] {
  if (!enabledCodes) return tree

  const allowed = new Set(enabledCodes)
  const filterNodes = (nodes: AppNavNode[]): AppNavNode[] =>
    nodes
      .map((n) => {
        if (n.gate && !allowed.has(n.gate)) return null
        const children = n.children ? filterNodes(n.children) : undefined
        if (n.type === "folder" && children && children.length === 0) return null
        return { ...n, children }
      })
      .filter(Boolean) as AppNavNode[]

  return tree
    .map((mod) => {
      const children = filterNodes(mod.children)
      if (!children.length) return null
      return { ...mod, children }
    })
    .filter(Boolean) as AppNavModule[]
}

export function collectExpandableCodes(tree: AppNavModule[]): string[] {
  const codes: string[] = []
  const walk = (nodes: AppNavNode[]) => {
    for (const n of nodes) {
      if (n.children?.length) {
        codes.push(n.code)
        walk(n.children)
      }
    }
  }
  for (const m of tree) {
    codes.push(m.code)
    walk(m.children)
  }
  return codes
}

export function pathMatchesHref(currentPath: string, search: string, href?: string) {
  if (!href) return false
  try {
    const url = new URL(href, "http://local")
    if (currentPath !== url.pathname) return false
    const have = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    if (!url.search) {
      return !have.get("tab") && !have.get("action")
    }
    const want = new URLSearchParams(url.search)
    for (const [k, v] of want.entries()) {
      if (have.get(k) !== v) return false
    }
    // List links (no action) should not stay active when an action deep-link is open
    if (!want.has("action") && have.get("action")) return false
    return true
  } catch {
    return currentPath === href.split("?")[0]
  }
}
