/**
 * Send offer letter email with Accept / Decline / Withdraw portal link.
 */

import { fetchActiveIntegration } from "@/lib/communication/delivery"
import { sendThroughProvider } from "@/lib/communication/providers/send"

export type OfferEmailPayload = {
  companyId: string
  companyName?: string | null
  offerId: string
  applicationId?: string | null
  candidateId?: string | null
  candidateName: string
  email: string
  jobTitle: string
  salaryLabel: string
  startDate?: string | null
  deadline?: string | null
  respondUrl: string
  letterExcerpt?: string | null
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildOfferDecisionEmail(input: OfferEmailPayload) {
  const company = input.companyName || "our company"
  const subject = `Offer of employment — ${input.jobTitle} at ${company}`
  const text = [
    `Dear ${input.candidateName},`,
    ``,
    `Congratulations! We are pleased to offer you the role of ${input.jobTitle} at ${company}.`,
    ``,
    `Remuneration: ${input.salaryLabel}`,
    input.startDate ? `Proposed start date: ${input.startDate}` : "",
    input.deadline ? `Please respond by: ${input.deadline}` : "",
    ``,
    `Review the full offer and choose one of the following:`,
    `• Accept the offer`,
    `• Decline the offer`,
    `• Withdraw your interest`,
    ``,
    `Secure link: ${input.respondUrl}`,
    ``,
    input.letterExcerpt ? `Letter excerpt:\n${input.letterExcerpt.slice(0, 800)}\n` : "",
    `If the link does not open, copy and paste it into your browser.`,
    ``,
    `Regards,`,
    `${company} Talent Team`,
  ]
    .filter(Boolean)
    .join("\n")

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
    <div style="background:#059669;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <p style="margin:0;font-size:13px;opacity:.9">Offer of employment</p>
      <h1 style="margin:6px 0 0;font-size:22px">${escapeHtml(input.jobTitle)}</h1>
      <p style="margin:8px 0 0;opacity:.95">${escapeHtml(company)}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <p>Dear ${escapeHtml(input.candidateName)},</p>
      <p>Congratulations — we are delighted to offer you the position of <strong>${escapeHtml(input.jobTitle)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border-radius:8px">
        <tr><td style="padding:8px 12px;color:#64748b">Remuneration</td><td style="padding:8px 12px">${escapeHtml(input.salaryLabel)}</td></tr>
        ${input.startDate ? `<tr><td style="padding:8px 12px;color:#64748b">Start date</td><td style="padding:8px 12px">${escapeHtml(input.startDate)}</td></tr>` : ""}
        ${input.deadline ? `<tr><td style="padding:8px 12px;color:#64748b">Respond by</td><td style="padding:8px 12px">${escapeHtml(input.deadline)}</td></tr>` : ""}
      </table>
      <p style="margin:16px 0 8px">Use the secure portal to:</p>
      <ul>
        <li><strong>Accept</strong> the offer</li>
        <li><strong>Decline</strong> the offer</li>
        <li><strong>Withdraw</strong> your interest</li>
      </ul>
      <p style="margin:20px 0">
        <a href="${escapeHtml(input.respondUrl)}"
           style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">
          Review &amp; respond to offer
        </a>
      </p>
      <p style="font-size:12px;color:#64748b;word-break:break-all">${escapeHtml(input.respondUrl)}</p>
      <p style="margin-top:24px">Regards,<br/><strong>${escapeHtml(company)} Talent Team</strong></p>
    </div>
  </div>`

  return { subject, text, html }
}

export async function sendOfferDecisionEmail(
  client: any,
  input: OfferEmailPayload,
): Promise<{ ok: boolean; status: string; error?: string; externalId?: string | null }> {
  const email = String(input.email || "").trim().toLowerCase()
  if (!email) {
    await logOfferEmail(client, input, "skipped", null, "No recipient email")
    return { ok: false, status: "skipped", error: "No recipient email" }
  }

  const { subject, text, html } = buildOfferDecisionEmail(input)

  try {
    const integration = await fetchActiveIntegration(client, input.companyId, "email")
    const result = await sendThroughProvider(integration, {
      to: [email],
      subject,
      text,
      html,
      metadata: { offer_id: input.offerId, application_id: input.applicationId, type: "offer" },
    })
    await logOfferEmail(client, input, "sent", subject, null, {
      provider: integration.providerName,
      external_id: result.externalId,
    })
    return { ok: true, status: "sent", externalId: result.externalId }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed"
    await logOfferEmail(client, input, "failed", subject, message)
    return { ok: false, status: "failed", error: message }
  }
}

async function logOfferEmail(
  client: any,
  input: OfferEmailPayload,
  status: string,
  subject: string | null,
  errorMessage: string | null,
  extra?: { provider?: string; external_id?: string | null },
) {
  try {
    await client.from("recruitment_application_emails").insert({
      company_id: input.companyId,
      application_id: input.applicationId || null,
      candidate_id: input.candidateId || null,
      email_type: "offer",
      to_email: input.email,
      subject,
      status,
      error_message: errorMessage,
      provider: extra?.provider || null,
      external_id: extra?.external_id || null,
      payload: { offer_id: input.offerId, respond_url: input.respondUrl },
    })
  } catch (err) {
    console.warn("[offer-email] audit log failed", err)
  }
}
