/**
 * Send pass / fail / on-hold notification to an applicant after interview assessment.
 */

import { fetchActiveIntegration } from "@/lib/communication/delivery"
import { sendThroughProvider } from "@/lib/communication/providers/send"

export type InterviewResultEmailPayload = {
  companyId: string
  companyName?: string | null
  candidateName: string
  email: string
  jobTitle: string
  result: "pass" | "fail" | "on_hold"
  notes?: string | null
  nextStepUrl?: string | null
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildInterviewResultEmail(input: InterviewResultEmailPayload) {
  const company = input.companyName || "our company"

  const resultLabel = input.result === "pass" ? "Successful" : input.result === "fail" ? "Unsuccessful" : "Under review"
  const subject = `Interview result — ${input.jobTitle} at ${company}`

  const intro =
    input.result === "pass"
      ? `We are pleased to inform you that you have successfully passed your interview for the role of ${input.jobTitle} at ${company}.`
      : input.result === "fail"
      ? `Thank you for your time and interest in the role of ${input.jobTitle} at ${company}. After careful consideration, we regret to inform you that we will not be proceeding with your application at this time.`
      : `Thank you for attending your interview for the role of ${input.jobTitle} at ${company}. Your application is currently under review and we will be in touch shortly.`

  const nextStepNote =
    input.result === "pass"
      ? input.nextStepUrl
        ? `Our team will be reaching out to discuss the next steps. You can also visit your candidate portal:`
        : `Our team will be reaching out shortly to discuss the next steps.`
      : input.result === "fail"
      ? `We appreciate your interest and encourage you to apply for other suitable positions in the future.`
      : `We aim to provide an update within 5 business days.`

  const text = [
    `Dear ${input.candidateName},`,
    ``,
    intro,
    ``,
    nextStepNote,
    input.nextStepUrl ? input.nextStepUrl : "",
    input.notes ? `\nFeedback:\n${input.notes}` : "",
    ``,
    `Regards,`,
    `${company} Talent Team`,
  ]
    .filter(Boolean)
    .join("\n")

  const accentColor = input.result === "pass" ? "#059669" : input.result === "fail" ? "#dc2626" : "#d97706"

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
    <div style="background:${accentColor};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <p style="margin:0;font-size:13px;opacity:.9">Interview result</p>
      <h1 style="margin:6px 0 0;font-size:22px">${escapeHtml(input.jobTitle)}</h1>
      <p style="margin:8px 0 0;font-size:18px;font-weight:600">${resultLabel}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <p>Dear ${escapeHtml(input.candidateName)},</p>
      <p>${escapeHtml(intro)}</p>
      <p>${escapeHtml(nextStepNote)}</p>
      ${
        input.nextStepUrl
          ? `<p style="margin:20px 0"><a href="${escapeHtml(input.nextStepUrl)}" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">View candidate portal</a></p>`
          : ""
      }
      ${
        input.notes
          ? `<div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin:16px 0"><p style="font-size:13px;color:#64748b;margin:0 0 4px">Assessor notes</p><p style="margin:0;font-size:14px">${escapeHtml(input.notes)}</p></div>`
          : ""
      }
      <p style="margin-top:24px">Regards,<br/><strong>${escapeHtml(company)} Talent Team</strong></p>
    </div>
  </div>`

  return { subject, text, html }
}

export async function sendInterviewResultEmail(
  client: any,
  input: InterviewResultEmailPayload,
): Promise<{ ok: boolean; status: string; error?: string }> {
  try {
    const integration = await fetchActiveIntegration(client, input.companyId, "email")
    if (!integration) {
      return { ok: false, status: "no_email_integration", error: "No active email integration configured" }
    }

    const { subject, text, html } = buildInterviewResultEmail(input)

    await sendThroughProvider(integration, {
      to: [input.email],
      subject,
      text,
      html,
    })

    return { ok: true, status: "sent" }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[interview-result-email] send error:", message)
    return { ok: false, status: "error", error: message }
  }
}
