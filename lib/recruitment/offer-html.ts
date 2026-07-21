/**
 * Branded printable HTML for offer letters (browser Print → Save as PDF).
 */

import { renderBrandedHtmlDocument, type CompanyBrandInfo } from "@/lib/exports/company-branding"

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function renderOfferLetterHtml(opts: {
  company?: CompanyBrandInfo | null
  candidateName: string
  jobTitle: string
  salaryLabel: string
  startDate?: string | null
  deadline?: string | null
  status?: string | null
  letterText: string
  benefits?: string[]
  respondUrl?: string | null
  autoPrint?: boolean
}) {
  const letterBlocks = escapeHtml(opts.letterText)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;white-space:pre-wrap;line-height:1.55">${p}</p>`)
    .join("")

  const benefits =
    opts.benefits && opts.benefits.length
      ? `<div style="margin:16px 0"><h3 style="margin:0 0 8px;font-size:14px">Benefits</h3><ul style="margin:0;padding-left:18px">${opts.benefits
          .map((b) => `<li>${escapeHtml(b)}</li>`)
          .join("")}</ul></div>`
      : ""

  const respond = opts.respondUrl
    ? `<p style="margin-top:20px;padding:12px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;font-size:13px">
         Candidate response portal: <a href="${escapeHtml(opts.respondUrl)}">${escapeHtml(opts.respondUrl)}</a>
       </p>`
    : ""

  const bodyHtml = `
    <div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;font-size:13px;color:#334155">
      <div><strong>Candidate:</strong> ${escapeHtml(opts.candidateName)}</div>
      <div><strong>Role:</strong> ${escapeHtml(opts.jobTitle)}</div>
      <div><strong>Remuneration:</strong> ${escapeHtml(opts.salaryLabel)}</div>
      ${opts.startDate ? `<div><strong>Start:</strong> ${escapeHtml(opts.startDate)}</div>` : ""}
      ${opts.deadline ? `<div><strong>Respond by:</strong> ${escapeHtml(opts.deadline)}</div>` : ""}
      ${opts.status ? `<div><strong>Status:</strong> ${escapeHtml(opts.status)}</div>` : ""}
    </div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
    <div class="offer-letter">${letterBlocks}</div>
    ${benefits}
    ${respond}
  `

  return renderBrandedHtmlDocument({
    title: `Offer of Employment — ${opts.jobTitle}`,
    company: opts.company,
    subtitle: opts.candidateName,
    bodyHtml,
    autoPrint: opts.autoPrint !== false,
  })
}
