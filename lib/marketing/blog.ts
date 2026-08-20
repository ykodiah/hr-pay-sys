export type BlogPost = {
  slug: string
  category: string
  title: string
  description: string
  published: string
  readingTime: string
  icon: "payroll" | "people" | "analytics"
  intro: string
  sections: { title: string; paragraphs: string[]; bullets?: string[] }[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: "ghana-payroll-checklist",
    category: "Payroll",
    title: "A practical Ghana payroll checklist for growing teams",
    description: "A repeatable framework for collecting payroll inputs, reviewing statutory deductions and closing each pay cycle with confidence.",
    published: "2026-08-12",
    readingTime: "8 min read",
    icon: "payroll",
    intro: "Reliable payroll is less about one final calculation and more about the quality of the process around it. A clear monthly checklist helps HR and finance teams catch missing information earlier, document approvals and create a consistent employee experience.",
    sections: [
      { title: "1. Confirm the employee population", paragraphs: ["Start by verifying who should be included in the cycle. Review new hires, exits, unpaid leave, transfers and any employee whose payroll status changed since the previous period."], bullets: ["Confirm active and inactive employees", "Validate start and exit dates", "Review bank and statutory details", "Resolve duplicate or incomplete employee records"] },
      { title: "2. Collect and approve variable inputs", paragraphs: ["Bring overtime, allowances, commissions, bonuses, absences, loan deductions and other changes into a controlled cut-off process. Every input should have an owner, effective period and approval status."], bullets: ["Set a published payroll cut-off", "Use structured requests rather than chat messages", "Separate recurring and one-off inputs", "Keep evidence for adjustments"] },
      { title: "3. Review PAYE and SSNIT context", paragraphs: ["Statutory calculations should be reviewed using the rules applicable to the pay period and the employee’s circumstances. Confirm that pensionable earnings, reliefs and relevant deductions have been treated consistently.", "Payroll software supports the calculation and record-keeping process, but organisations remain responsible for validating settings, filings and payments with qualified advisers or the relevant authorities."] },
      { title: "4. Perform gross-to-net checks", paragraphs: ["Compare totals and employee-level movements to the prior period. Large differences are not automatically errors, but they should have a clear explanation."], bullets: ["Check headcount and total gross pay", "Review unusual net pay changes", "Inspect negative or zero-value results", "Confirm deductions do not exceed expected limits", "Reconcile payroll cost by department or branch"] },
      { title: "5. Approve, publish and retain", paragraphs: ["Once reviewers sign off, lock the cycle, prepare payment information, publish payslips and retain payroll reports and decision history. A short post-payroll review can capture process improvements for next month."] },
    ],
  },
  {
    slug: "employee-self-service",
    category: "People operations",
    title: "How employee self-service creates capacity for HR",
    description: "Design practical self-service workflows that reduce routine administration while giving employees better visibility and ownership.",
    published: "2026-08-05",
    readingTime: "7 min read",
    icon: "people",
    intro: "Employee self-service is not simply a portal. Done well, it is an operating model that puts routine information and requests closer to the people who create them, while preserving the approvals and controls HR needs.",
    sections: [
      { title: "Start with frequent, predictable requests", paragraphs: ["The best early candidates are tasks employees already perform often and that follow a clear process."], bullets: ["Viewing payslips", "Requesting leave or overtime", "Updating profile details", "Accessing documents and policies", "Checking loan or leave balances"] },
      { title: "Make ownership visible", paragraphs: ["Employees should know what information they can update, what requires approval and who is responsible for the next action. Status labels and notifications reduce follow-up messages and uncertainty."] },
      { title: "Design for managers too", paragraphs: ["Self-service succeeds when managers can act quickly. A focused approval queue, useful team context and clear escalation paths help requests move without turning HR into a routing desk."] },
      { title: "Protect sensitive information", paragraphs: ["Not every employee or manager should see every field. Use role-aware permissions, appropriate authentication and a clear audit history for sensitive profile, compensation and employment changes."] },
      { title: "Measure capacity, not just adoption", paragraphs: ["Portal logins alone do not show business value. Track request completion time, HR handling effort, approval delays, data correction rates and employee questions before and after implementation."] },
    ],
  },
  {
    slug: "workforce-metrics",
    category: "Analytics",
    title: "The workforce metrics every growing business should know",
    description: "Build a focused people dashboard around headcount, payroll cost, attendance, hiring and employee movement.",
    published: "2026-07-28",
    readingTime: "9 min read",
    icon: "analytics",
    intro: "A useful workforce dashboard does not need dozens of charts. It needs a small set of trusted measures that connect people activity to operational decisions and can be explained consistently from one period to the next.",
    sections: [
      { title: "Headcount and workforce movement", paragraphs: ["Track active headcount alongside hires, exits, transfers and internal promotions. Segmenting by location, department, employment type and tenure helps leaders understand where growth or contraction is occurring."], bullets: ["Opening and closing headcount", "New hires and exits", "Voluntary and involuntary turnover", "Internal movement", "Span of control"] },
      { title: "Payroll and labour cost", paragraphs: ["Total payroll cost is more useful when its components are visible. Monitor base salary, variable pay, allowances, employer contributions, overtime and deductions in a consistent reporting structure."], bullets: ["Payroll cost by department or branch", "Average cost per employee", "Overtime trend", "Variable pay as a share of gross pay", "Month-over-month movement"] },
      { title: "Attendance and leave", paragraphs: ["Attendance metrics should support action rather than surveillance. Look for recurring operational patterns while considering role, shift and location context."], bullets: ["Absence frequency and duration", "Leave utilisation and outstanding balances", "Late or missed attendance records", "Overtime concentration", "Approval turnaround time"] },
      { title: "Hiring effectiveness", paragraphs: ["Measure whether the recruitment process produces timely, sustainable hires—not simply application volume."], bullets: ["Time to fill", "Stage conversion", "Offer acceptance", "Source of successful hires", "Early-tenure retention"] },
      { title: "Create a shared metric dictionary", paragraphs: ["Define exactly how each measure is calculated, which date fields it uses, who owns the source data and how often it refreshes. Consistency builds trust and prevents meetings from becoming debates about definitions."] },
    ],
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}
