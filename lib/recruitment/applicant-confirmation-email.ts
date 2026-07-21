/**
 * Build + send applicant confirmation email (copy of submitted application).
 * Soft-fails when email integration is missing so apply flow never blocks.
 */

import { fetchActiveIntegration } from "@/lib/communication/delivery"
import { sendThroughProvider } from "@/lib/communication/providers/send"

export type ApplicantEmailPayload = {
  companyId: string
  companyName?: string | null
  companyAddress?: string | null
  applicationId: string
  candidateId?: string | null
  candidateName: string
  email: string
  phone?: string | null
  location?: string | null
  jobTitle: string
  department?: string | null
  employmentType?: string | null
  skills?: string[] | string | null
  experienceText?: string | null
  education?: string | null
  previousCompany?: string | null
  coverLetter?: string | null
  resumeFilename?: string | null
  resumeUrl?: string | null
  linkedinUrl?: string | null
  appliedAt?: string | null
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function asSkills(skills: ApplicantEmailPayload["skills"]) {
  if (Array.isArray(skills)) return skills.filter(Boolean).join(", ")
  return String(skills || "").trim()
}

export function buildApplicationConfirmationEmail(input: ApplicantEmailPayload) {
  const company = input.companyName || "the hiring team"
  const subject = `Application received — ${input.jobTitle} at ${company}`
  const applied = input.appliedAt
    ? new Date(input.appliedAt).toLocaleString()
    : new Date().toLocaleString()
  const skills = asSkills(input.skills)

  const rows: [string, string][] = [
    ["Role", input.jobTitle],
    ["Department", input.department || "—"],
    ["Employment type", input.employmentType || "—"],
    ["Full name", input.candidateName],
    ["Email", input.email],
    ["Phone", input.phone || "—"],
    ["Location", input.location || "—"],
    ["Education", input.education || "—"],
    ["Previous company", input.previousCompany || "—"],
    ["Skills", skills || "—"],
    ["LinkedIn / portfolio", input.linkedinUrl || "—"],
    ["CV / Resume", input.resumeFilename || (input.resumeUrl ? "Attached / uploaded" : "Not provided")],
    ["Submitted", applied],
  ]

  const text = [
    `Dear ${input.candidateName},`,
    ``,
    `Thank you for applying for ${input.jobTitle} at ${company}.`,
    `This email confirms we received your application. A copy of what you submitted is below.`,
    ``,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ``,
    input.experienceText ? `Experience summary:\n${input.experienceText}\n` : "",
    input.coverLetter ? `Cover note:\n${input.coverLetter}\n` : "",
    input.companyAddress ? `Employer address: ${input.companyAddress}` : "",
    ``,
    `Our recruitment team will review your application and contact you if you are shortlisted.`,
    ``,
    `Regards,`,
    `${company} Talent Team`,
  ]
    .filter(Boolean)
    .join("\n")

  const htmlRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;color:#64748b;width:160px;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 10px;color:#0f172a">${escapeHtml(v)}</td></tr>`,
    )
    .join("")

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
    <div style="background:#059669;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <p style="margin:0;font-size:13px;opacity:.9">Application confirmation</p>
      <h1 style="margin:6px 0 0;font-size:22px">${escapeHtml(input.jobTitle)}</h1>
      <p style="margin:8px 0 0;opacity:.95">${escapeHtml(company)}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <p>Dear ${escapeHtml(input.candidateName)},</p>
      <p>Thank you for applying. We have received your application. Below is a copy of the details you submitted.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:8px">${htmlRows}</table>
      ${
        input.experienceText
          ? `<h3 style="margin:16px 0 6px;font-size:14px">Experience summary</h3><p style="white-space:pre-wrap;margin:0;color:#334155">${escapeHtml(input.experienceText)}</p>`
          : ""
      }
      ${
        input.coverLetter
          ? `<h3 style="margin:16px 0 6px;font-size:14px">Cover note</h3><p style="white-space:pre-wrap;margin:0;color:#334155">${escapeHtml(input.coverLetter)}</p>`
          : ""
      }
      ${
        input.resumeUrl
          ? `<p style="margin-top:16px"><a href="${escapeHtml(input.resumeUrl)}" style="color:#059669">View uploaded CV</a></p>`
          : ""
      }
      <p style="margin-top:24px;color:#64748b;font-size:13px">Our talent team will review your application and reach out if you are shortlisted.</p>
      <p style="margin-top:16px">Regards,<br/><strong>${escapeHtml(company)} Talent Team</strong></p>
      ${
        input.companyAddress
          ? `<p style="margin-top:12px;font-size:12px;color:#94a3b8">${escapeHtml(input.companyAddress)}</p>`
          : ""
      }
    </div>
  </div>`

  return { subject, text, html }
}

export async function sendApplicantConfirmationEmail(
  client: any,
  input: ApplicantEmailPayload,
): Promise<{ ok: boolean; status: string; error?: string; externalId?: string | null }> {
  const email = String(input.email || "").trim().toLowerCase()
  if (!email) {
    await logEmail(client, input, "skipped", null, "No recipient email")
    return { ok: false, status: "skipped", error: "No recipient email" }
  }

  const { subject, text, html } = buildApplicationConfirmationEmail(input)

  try {
    const integration = await fetchActiveIntegration(client, input.companyId, "email")
    const result = await sendThroughProvider(integration, {
      to: [email],
      subject,
      text,
      html,
      metadata: { application_id: input.applicationId, type: "application_received" },
    })
    await logEmail(client, input, "sent", subject, null, {
      provider: integration.providerName,
      external_id: result.externalId,
      payload: { subject },
    })
    return { ok: true, status: "sent", externalId: result.externalId }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed"
    await logEmail(client, input, "failed", subject, message, { payload: { subject } })
    return { ok: false, status: "failed", error: message }
  }
}

async function logEmail(
  client: any,
  input: ApplicantEmailPayload,
  status: string,
  subject: string | null,
  errorMessage: string | null,
  extra?: { provider?: string; external_id?: string | null; payload?: Record<string, unknown> },
) {
  try {
    await client.from("recruitment_application_emails").insert({
      company_id: input.companyId,
      application_id: input.applicationId,
      candidate_id: input.candidateId || null,
      email_type: "application_received",
      recipient_email: String(input.email || "").trim().toLowerCase() || "unknown",
      subject,
      status,
      provider: extra?.provider || null,
      external_id: extra?.external_id || null,
      error_message: errorMessage,
      payload: extra?.payload || {},
    })
  } catch (err) {
    console.warn("[recruitment-email] audit insert failed", err)
  }
}
