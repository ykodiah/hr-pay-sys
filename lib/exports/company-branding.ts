/**
 * Shared company header + AkwaabaHRPay footer for CSV and printable PDF/HTML.
 */

export type CompanyBrandInfo = {
  id?: string | null
  name?: string | null
  address?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  email_address?: string | null
  logo_url?: string | null
  website?: string | null
}

export const AKWAABA_BRAND_FOOTER =
  "Payroll processing by AkwaabaHRPay · Ghana HR & Payroll Management"

export function formatCompanyAddress(company: CompanyBrandInfo | null | undefined): string {
  if (!company) return ""
  return [company.address, company.city, company.region, company.country]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(", ")
}

export function csvBrandHeader(opts: {
  title: string
  company?: CompanyBrandInfo | null
  period?: string
  generatedAt?: string
}): string[] {
  const lines: string[] = []
  const companyName = opts.company?.name || "Company"
  const address = formatCompanyAddress(opts.company)
  const phone = opts.company?.phone || ""
  const email = opts.company?.email || opts.company?.email_address || ""
  const logo = opts.company?.logo_url || ""

  lines.push(`"${String(opts.title).replace(/"/g, '""')}"`)
  lines.push(`"Company","${companyName.replace(/"/g, '""')}"`)
  if (address) lines.push(`"Address","${address.replace(/"/g, '""')}"`)
  if (phone) lines.push(`"Phone","${phone.replace(/"/g, '""')}"`)
  if (email) lines.push(`"Email","${email.replace(/"/g, '""')}"`)
  if (logo) lines.push(`"Logo","${logo.replace(/"/g, '""')}"`)
  if (opts.period) lines.push(`"Pay Period","${String(opts.period).replace(/"/g, '""')}"`)
  lines.push(`"Generated At","${opts.generatedAt || new Date().toISOString()}"`)
  lines.push("")
  return lines
}

export function csvBrandFooter(): string[] {
  return ["", `"${AKWAABA_BRAND_FOOTER}"`, `"www.akwaabahrpay.com"`]
}

/** Full branded HTML shell for printable PDF (browser Print → Save as PDF). */
export function renderBrandedHtmlDocument(opts: {
  title: string
  company?: CompanyBrandInfo | null
  period?: string
  subtitle?: string
  bodyHtml: string
  autoPrint?: boolean
}): string {
  const companyName = opts.company?.name || "Company"
  const address = formatCompanyAddress(opts.company)
  const phone = opts.company?.phone || ""
  const email = opts.company?.email || opts.company?.email_address || ""
  const logo = opts.company?.logo_url || ""
  const autoPrint = opts.autoPrint !== false

  const esc = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>${esc(opts.title)} — ${esc(companyName)}</title>
<style>
  :root { --ink:#14201a; --muted:#5b6b62; --line:#d7ddd8; --brand:#0f6b4c; }
  * { box-sizing: border-box; }
  body { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; color: var(--ink); margin: 0; padding: 28px; font-size: 14px; background: #fff; }
  .toolbar { margin-bottom: 16px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .toolbar button { background: var(--brand); color: #fff; border: 0; padding: 9px 16px; border-radius: 6px; cursor: pointer; font: 600 14px/1 inherit; }
  .toolbar .hint { color: var(--muted); font-size: 12px; }
  .letterhead { display: flex; gap: 16px; align-items: flex-start; border-bottom: 2px solid var(--brand); padding-bottom: 14px; margin-bottom: 16px; }
  .logo { width: 64px; height: 64px; object-fit: contain; border: 1px solid var(--line); border-radius: 8px; background: #f7faf8; }
  .logo-fallback { width: 64px; height: 64px; border-radius: 8px; background: linear-gradient(145deg,#0f6b4c,#1f8f67); color: #fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; }
  h1 { margin: 0 0 4px; font-size: 24px; letter-spacing: -0.02em; }
  .meta { color: var(--muted); line-height: 1.45; font-size: 13px; }
  h2 { margin: 0 0 4px; font-size: 18px; color: var(--brand); }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid var(--line); padding: 7px 8px; text-align: left; vertical-align: top; font-size: 12px; }
  th { background: #eef6f1; font-weight: 600; }
  .right { text-align: right; white-space: nowrap; }
  .total { font-weight: 700; background: #f7faf8; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; display:flex; justify-content:space-between; gap: 12px; }
  .brand { color: var(--brand); font-weight: 700; }
  @media print { 
    .toolbar { display: none; } 
    body { padding: 10px; margin: 0; }
    .letterhead { padding-bottom: 10px; margin-bottom: 10px; }
    h1 { margin: 0 0 2px; font-size: 20px; }
    .meta { font-size: 11px; }
    table { margin-top: 8px; }
    th, td { padding: 5px 6px; font-size: 11px; border-width: 0.5px; }
  }
  /* Default landscape suggestion; browser Print dialog can switch to portrait */
  @page { 
    size: A4 landscape;
    margin: 10mm;
  }
</style></head><body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save as PDF</button>
    <span class="hint">Use the print dialog to choose Portrait or Landscape</span>
  </div>
  <header class="letterhead">
    ${
      logo
        ? `<img class="logo" src="${esc(logo)}" alt="${esc(companyName)} logo"/>`
        : `<div class="logo-fallback">${esc(companyName.slice(0, 2).toUpperCase())}</div>`
    }
    <div>
      <h1>${esc(companyName)}</h1>
      <div class="meta">
        ${address ? `${esc(address)}<br/>` : ""}
        ${phone ? `Tel: ${esc(phone)}` : ""}${phone && email ? " · " : ""}${email ? `Email: ${esc(email)}` : ""}
      </div>
      <h2 style="margin-top:10px">${esc(opts.title)}</h2>
      <div class="meta">
        ${opts.period ? `Pay period: ${esc(opts.period)}` : ""}
        ${opts.subtitle ? `<br/>${esc(opts.subtitle)}` : ""}
        <br/>Generated ${esc(new Date().toLocaleString("en-GH"))}
      </div>
    </div>
  </header>
  ${opts.bodyHtml}
  <footer class="footer">
    <div><span class="brand">${esc(AKWAABA_BRAND_FOOTER)}</span></div>
    <div>Confidential · For authorised payroll use only</div>
  </footer>
  ${autoPrint ? `<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250))</script>` : ""}
</body></html>`
}

export async function loadCompanyBrand(
  client: any,
  companyId: string | null | undefined,
): Promise<CompanyBrandInfo | null> {
  if (!companyId) {
    // Fail closed — never pick an arbitrary tenant via limit(1)
    return null
  }
  const { data } = await client.from("companies").select("*").eq("id", companyId).maybeSingle()
  return data
}
