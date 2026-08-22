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
  {
    slug: "paye-ssnit-basics",
    category: "Compliance",
    title: "PAYE and SSNIT basics for Ghanaian employers",
    description: "A practical overview of how payroll teams prepare PAYE and SSNIT information inside a controlled monthly process.",
    published: "2026-07-18",
    readingTime: "8 min read",
    icon: "payroll",
    intro: "Employers in Ghana need a repeatable way to collect earnings, apply statutory treatments and retain evidence. Software can organise the workflow, but policy interpretation and filings still require professional judgement.",
    sections: [
      { title: "Separate master data from period inputs", paragraphs: ["Keep employee statutory identifiers, bank details and recurring earnings in master records. Use period inputs for overtime, bonuses, one-time adjustments and approved exceptions."] },
      { title: "Review before you file", paragraphs: ["Build a checklist that compares headcount, gross pay, statutory totals and unusual employee movements before any filing pack is prepared."], bullets: ["Confirm new joiners and exits", "Validate pensionable earnings context", "Inspect large period-over-period changes", "Retain reviewer sign-off"] },
      { title: "Use payslips as employee communication", paragraphs: ["Clear payslip labels reduce support tickets. Employees should be able to see earnings, statutory deductions, loans and net pay without deciphering internal codes."] },
      { title: "Keep an audit trail", paragraphs: ["Period locks, assignment history and approval notes make later questions easier to answer during audits, reconciliations or leadership reviews."] },
    ],
  },
  {
    slug: "multi-location-hr",
    category: "People operations",
    title: "How to run multi-location HR without losing control",
    description: "Design policies, approvals and reporting that work across Accra, Kumasi, Takoradi and distributed branch networks.",
    published: "2026-07-10",
    readingTime: "7 min read",
    icon: "people",
    intro: "Multi-location employers often struggle when every branch invents its own spreadsheet process. The goal is not rigid centralisation—it is shared standards with local execution.",
    sections: [
      { title: "Standardise the employee record", paragraphs: ["Use one structure for departments, locations, job titles and reporting lines so transfers and consolidated reporting remain trustworthy."] },
      { title: "Delegate approvals carefully", paragraphs: ["Managers should approve leave, overtime and team requests for their people, while HR retains policy ownership and exception handling."], bullets: ["Role-based permissions", "Visible request status", "Escalation paths", "Audit history"] },
      { title: "Assign pay components by audience", paragraphs: ["Location, department, division, subsidiary, job title and all-employee scopes help apply allowances or deductions without repeating individual edits."] },
      { title: "Report both locally and centrally", paragraphs: ["Branch managers need operational views. Finance and HR leaders need consolidated payroll cost, headcount and compliance status."] },
    ],
  },
  {
    slug: "choosing-hr-payroll-software-ghana",
    category: "Buying guide",
    title: "How to choose HR and payroll software in Ghana",
    description: "Evaluation criteria for local compliance, employee experience, reporting, security and total cost of ownership.",
    published: "2026-06-30",
    readingTime: "10 min read",
    icon: "analytics",
    intro: "Buying HR and payroll software is a process decision as much as a technology decision. The right platform should reduce manual work while fitting Ghanaian statutory and operational realities.",
    sections: [
      { title: "Start with your operating model", paragraphs: ["Map who owns employee data, who approves requests, who reviews payroll and who needs self-service. Software should reinforce those responsibilities."] },
      { title: "Prioritise local payroll workflows", paragraphs: ["Generic global tools often need heavy customisation. Look for PAYE, SSNIT, payslips, loans and period controls that match how Ghanaian teams already work."] },
      { title: "Evaluate security and permissions", paragraphs: ["Ask how roles, tenant separation, audit trails and employee access are designed. Payroll data deserves stronger controls than a shared spreadsheet."], bullets: ["Role-based access", "Encryption in transit", "Audit history", "Privacy commitments"] },
      { title: "Measure implementation effort", paragraphs: ["A strong product still fails if onboarding is unclear. Review import tools, training options, templates and support response expectations before you buy."] },
    ],
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}
