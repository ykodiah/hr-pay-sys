/** Default onboarding tasks for newly hired candidates. */
export function defaultOnboardingTasks(startDate?: string | null) {
  const start = startDate ? new Date(startDate) : new Date()
  const due = (days: number) => {
    const d = new Date(start)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  return [
    {
      task_type: "hr",
      title: "Complete employee information form",
      description: "Personal details, emergency contacts, and tax info",
      assigned_department: "HR",
      due_date: due(1),
      priority: "high",
    },
    {
      task_type: "it",
      title: "Provision laptop and accounts",
      description: "Email, Slack, and system access",
      assigned_department: "IT",
      due_date: due(2),
      priority: "high",
    },
    {
      task_type: "finance",
      title: "Set up payroll banking details",
      description: "Bank account and SSNIT registration",
      assigned_department: "Finance",
      due_date: due(3),
      priority: "medium",
    },
    {
      task_type: "hr",
      title: "Sign employment contract",
      description: "Review and sign Ghana Labour Act compliant contract",
      assigned_department: "HR",
      due_date: due(1),
      priority: "high",
    },
    {
      task_type: "orientation",
      title: "Company orientation session",
      description: "Culture, policies, and benefits overview",
      assigned_department: "HR",
      due_date: due(5),
      priority: "medium",
    },
  ]
}

export function buildOfferLetterText(input: {
  candidateName: string
  jobTitle: string
  salary: number
  currency?: string
  startDate?: string | null
  companyName?: string
}) {
  const currency = input.currency || "GHS"
  const start = input.startDate || "to be confirmed"
  return [
    `OFFER OF EMPLOYMENT`,
    ``,
    `Dear ${input.candidateName},`,
    ``,
    `We are pleased to offer you the position of ${input.jobTitle} at ${input.companyName || "our company"}.`,
    ``,
    `Compensation: ${currency} ${Number(input.salary).toLocaleString("en-GH", { minimumFractionDigits: 2 })} per month.`,
    `Proposed start date: ${start}.`,
    ``,
    `This offer is subject to satisfactory references and completion of required onboarding documentation.`,
    ``,
    `Please confirm acceptance of this offer in writing.`,
    ``,
    `Yours sincerely,`,
    `Human Resources`,
  ].join("\n")
}

export function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  )
}
