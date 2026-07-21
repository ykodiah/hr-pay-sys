/**
 * Build rich Ghana Labour Act–aligned offer letters for ATS.
 */

export type OfferLetterBuildInput = {
  candidateName: string
  candidateAddress?: string | null
  jobTitle: string
  department?: string | null
  salary: number
  currency?: string | null
  startDate?: string | null
  acceptanceDeadline?: string | null
  benefits?: string[] | string | null
  terms?: string | null
  workingHours?: string | null
  probationMonths?: number | null
  noticeMonths?: number | null
  companyName?: string | null
  companyAddress?: string | null
  signatoryName?: string | null
  signatoryTitle?: string | null
  /** Extra remuneration lines e.g. housing, transport */
  remunerationExtras?: string[] | null
}

function asBenefits(value: OfferLetterBuildInput["benefits"]): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean)
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return [
    "Statutory SSNIT employer contributions",
    "Paid annual leave per Ghana Labour Act",
    "Medical / health support as per company policy",
  ]
}

function money(amount: number, currency = "GHS") {
  return `${currency} ${Number(amount || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function buildRichOfferLetter(input: OfferLetterBuildInput): string {
  const company = input.companyName || "the Company"
  const currency = input.currency || "GHS"
  const start = input.startDate
    ? new Date(input.startDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "to be confirmed"
  const deadline = input.acceptanceDeadline
    ? new Date(input.acceptanceDeadline).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")
  const benefits = asBenefits(input.benefits)
  const extras = (input.remunerationExtras || []).filter(Boolean)
  const probation = input.probationMonths ?? 3
  const notice = input.noticeMonths ?? 1
  const hours = input.workingHours || "08:00 – 17:00"
  const dept = input.department || "the assigned"
  const signatory = input.signatoryName || "Human Resources"
  const title = input.signatoryTitle || "HR Manager"
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return [
    company.toUpperCase(),
    input.companyAddress || "",
    "",
    today,
    "",
    input.candidateName,
    input.candidateAddress || "",
    "",
    `Dear ${input.candidateName},`,
    "",
    `OFFER OF EMPLOYMENT — ${String(input.jobTitle || "Role").toUpperCase()}`,
    "",
    `We are pleased to offer you the position of ${input.jobTitle} in our ${dept} department, subject to the terms below and in accordance with the Ghana Labour Act, 2003 (Act 651).`,
    "",
    "1. POSITION AND DUTIES",
    `You will be employed as ${input.jobTitle} and will perform duties assigned by your supervisor and management.`,
    "",
    "2. COMMENCEMENT DATE",
    `Your employment will commence on ${start}, subject to satisfactory completion of pre-employment requirements.`,
    "",
    "3. REMUNERATION",
    `Your gross monthly salary will be ${money(input.salary, currency)}, payable monthly in arrears, subject to PAYE, SSNIT, and other statutory deductions.`,
    ...(extras.length ? extras.map((e) => `• ${e}`) : []),
    "",
    "4. WORKING HOURS",
    `Normal working hours: ${hours}, Monday to Friday, with a one-hour lunch break. Overtime will be handled per the Labour Act and company policy.`,
    "",
    "5. PROBATIONARY PERIOD",
    `Probation of ${probation} month(s) under Section 20 of Act 651. During probation, either party may terminate with one week's notice.`,
    "",
    "6. NOTICE PERIOD",
    `After probation, either party may terminate by giving ${notice} month(s) written notice or payment in lieu (Section 22).`,
    "",
    "7. BENEFITS",
    "You will be entitled to:",
    ...benefits.map((b) => `• ${b}`),
    "• Annual leave of at least 15 working days (increasing with service) per Section 31",
    "• Sick leave and maternity/paternity leave as provided under the Labour Act",
    "",
    "8. STATUTORY COMPLIANCE",
    "This employment is governed by Ghana labour law. The company will fulfil SSNIT, tax, and workplace safety obligations.",
    "",
    "9. CONFIDENTIALITY",
    "You must keep company, client, and commercial information confidential during and after employment.",
    "",
    ...(input.terms ? ["10. ADDITIONAL TERMS", input.terms, ""] : []),
    "ACCEPTANCE",
    `This offer remains open until ${deadline}. Please respond via the secure offer link (Accept / Decline / Withdraw interest), or contact HR.`,
    "",
    "We look forward to welcoming you.",
    "",
    "Yours sincerely,",
    "",
    signatory,
    title,
    company,
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
}

/** Optional Groq polish of an existing letter draft. Falls back to input text. */
export async function polishOfferLetterWithAi(letter: string, context: {
  jobTitle: string
  candidateName: string
  companyName?: string | null
}): Promise<{ text: string; model: string; notes?: string }> {
  const raw = String(letter || "").trim()
  if (!raw) {
    return { text: raw, model: "none", notes: "Empty letter" }
  }
  if (!process.env.GROQ_API_KEY) {
    return { text: raw, model: "heuristic", notes: "GROQ_API_KEY not set — letter unchanged" }
  }

  try {
    const { generateText } = await import("ai")
    const result = await Promise.race([
      generateText({
        model: "groq/llama-3.3-70b-versatile",
        temperature: 0.3,
        maxOutputTokens: 2500,
        system:
          "You polish employment offer letters for Ghana HR. Keep all facts (salary, dates, benefits, legal references). Improve clarity and professionalism. Return ONLY the letter text, no markdown fences.",
        prompt: `Polish this offer letter for ${context.candidateName} as ${context.jobTitle} at ${context.companyName || "the company"}.\n\n${raw.slice(0, 9000)}`,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 25000)),
    ])
    const text = String((result as any).text || "").trim()
    if (text.length < 80) return { text: raw, model: "groq-fallback", notes: "AI returned too little text" }
    return { text, model: "groq/llama-3.3-70b-versatile", notes: "Letter polished by AI" }
  } catch (err) {
    return {
      text: raw,
      model: "heuristic",
      notes: err instanceof Error ? err.message : "AI polish failed",
    }
  }
}
