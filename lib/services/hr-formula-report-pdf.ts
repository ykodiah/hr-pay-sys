import type { CategoryReport } from "@/lib/services/hr-formula-reports"
import { formatMetricValue } from "@/lib/services/hr-formula-reports"
import type { CategoryAiMlPackage } from "@/lib/services/hr-formula-ai-insights"
import {
  AKWAABA_BRAND_FOOTER,
  formatCompanyAddress,
  type CompanyBrandInfo,
} from "@/lib/exports/company-branding"

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function narrativeToHtml(text: string): string {
  return esc(text)
    .split(/\n+/)
    .map((line) => {
      const t = line.trim()
      if (!t) return ""
      if (t.startsWith("•") || t.startsWith("-")) {
        return `<li>${t.replace(/^[-•]\s*/, "")}</li>`
      }
      return `<p>${t}</p>`
    })
    .join("")
    .replace(/(<li>.*<\/li>)+/g, (m) => `<ul>${m}</ul>`)
}

export function renderHrFormulaReportPdfHtml(opts: {
  category: CategoryReport
  insights: CategoryAiMlPackage
  company?: CompanyBrandInfo | null
  periodStart: string
  periodEnd: string
}): string {
  const companyName = opts.company?.name || "Company"
  const address = formatCompanyAddress(opts.company)
  const logo = opts.company?.logo_url || ""
  const initials = companyName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")

  const metricCards = opts.category.metrics
    .map(
      (m) => `
      <div class="metric">
        <div class="metric-name">${esc(m.name)}</div>
        <div class="metric-formula">${esc(m.formula)}</div>
        <div class="metric-value">${esc(formatMetricValue(m))}</div>
        <div class="metric-status">${esc(m.dataStatus)}</div>
      </div>`,
    )
    .join("")

  const insightBlocks = opts.insights.blocks
    .map(
      (b) => `
      <div class="insight ${esc(b.severity)}">
        <div class="insight-head">
          <strong>${esc(b.title)}</strong>
          <span>${esc(b.severity)} · ${b.confidence}% confidence</span>
        </div>
        <p>${esc(b.summary)}</p>
        ${
          b.recommendations.length
            ? `<p class="rec"><em>Recommendation:</em> ${esc(b.recommendations[0])}</p>`
            : ""
        }
      </div>`,
    )
    .join("")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${esc(opts.category.title)} Report — ${esc(companyName)}</title>
  <style>
    :root { --brand:#0f6b4c; --ink:#14201a; --muted:#5b6b62; --line:#d7ddd8; --soft:#f4f7f5; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family: "Source Serif 4", Georgia, "Times New Roman", serif; color:var(--ink); font-size:13px; background:#fff; padding:28px; max-width:960px; margin:0 auto; line-height:1.45; }
    .toolbar { display:flex; gap:8px; margin-bottom:18px; }
    .toolbar button { background:var(--brand); color:#fff; border:0; padding:9px 14px; border-radius:6px; cursor:pointer; font:600 13px/1 system-ui,sans-serif; }
    .toolbar button.secondary { background:#fff; color:var(--brand); border:1px solid var(--brand); }
    .header { display:flex; gap:14px; align-items:flex-start; border-bottom:2.5px solid var(--brand); padding-bottom:12px; margin-bottom:16px; }
    .logo { width:56px; height:56px; object-fit:contain; border:1px solid var(--line); border-radius:6px; }
    .logo-init { width:56px; height:56px; border-radius:6px; background:linear-gradient(145deg,#0f6b4c,#1f8f67); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; font-family:system-ui,sans-serif; }
    .co-name { font-size:20px; font-weight:700; }
    .title { font-size:12px; font-weight:700; color:var(--brand); letter-spacing:.08em; text-transform:uppercase; margin-top:4px; font-family:system-ui,sans-serif; }
    .meta { color:var(--muted); font-size:12px; margin-top:2px; }
    h2 { font-size:16px; margin:18px 0 8px; }
    .scorebox { display:flex; gap:16px; align-items:center; background:var(--soft); border:1px solid var(--line); border-radius:10px; padding:14px 16px; margin-bottom:14px; }
    .score { font-size:34px; font-weight:700; color:var(--brand); font-family:system-ui,sans-serif; }
    .score small { display:block; font-size:12px; color:var(--muted); font-weight:600; }
    .metrics { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px; }
    .metric { border:1px solid var(--line); border-radius:8px; padding:10px 12px; background:#fff; }
    .metric-name { font-weight:700; font-size:13px; }
    .metric-formula { color:var(--muted); font-family:ui-monospace,monospace; font-size:10px; margin-top:2px; }
    .metric-value { font-size:20px; font-weight:700; margin-top:6px; font-family:system-ui,sans-serif; }
    .metric-status { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; margin-top:2px; font-family:system-ui,sans-serif; }
    .brief { background:#fff; border-left:3px solid var(--brand); padding:8px 12px; margin:8px 0 14px; }
    .insight { border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:8px; }
    .insight.positive { border-left:3px solid #059669; }
    .insight.watch { border-left:3px solid #d97706; }
    .insight.critical { border-left:3px solid #dc2626; }
    .insight.info { border-left:3px solid #64748b; }
    .insight-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:4px; font-family:system-ui,sans-serif; font-size:12px; }
    .insight-head span { color:var(--muted); white-space:nowrap; }
    .rec { margin-top:6px; color:#334155; }
    .narrative p { margin-bottom:8px; }
    .narrative ul { margin:6px 0 10px 18px; }
    .footer { margin-top:22px; padding-top:10px; border-top:1px solid var(--line); color:var(--muted); font-size:11px; font-family:system-ui,sans-serif; }
    @media print {
      .toolbar { display:none; }
      body { padding:12px; }
      @page { size: A4; margin: 14mm; }
    }
    @media (max-width:720px) { .metrics { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save PDF</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>
  <div class="header">
    ${
      logo
        ? `<img class="logo" src="${esc(logo)}" alt="logo"/>`
        : `<div class="logo-init">${esc(initials || "CO")}</div>`
    }
    <div>
      <div class="co-name">${esc(companyName)}</div>
      <div class="title">${esc(opts.category.title)} Formula Report</div>
      <div class="meta">Period ${esc(opts.periodStart)} → ${esc(opts.periodEnd)}</div>
      ${address ? `<div class="meta">${esc(address)}</div>` : ""}
    </div>
  </div>

  <div class="scorebox">
    <div class="score">${opts.insights.healthScore}<small>${esc(opts.insights.healthLabel)}</small></div>
    <div>
      <strong>AI &amp; ML health assessment</strong>
      <p class="meta" style="margin-top:4px">ML model: ${esc(opts.insights.mlModel)}${
        opts.insights.aiModel ? ` · AI: ${esc(opts.insights.aiModel)}` : " · AI narrative (offline fallback)"
      }</p>
    </div>
  </div>

  <h2>Executive brief</h2>
  <div class="brief">${esc(opts.insights.executiveBrief)}</div>

  <h2>Formula metrics</h2>
  <div class="metrics">${metricCards}</div>

  <h2>ML findings</h2>
  ${insightBlocks}

  <h2>AI advisory narrative</h2>
  <div class="narrative">${narrativeToHtml(opts.insights.narrative)}</div>

  <div class="footer">
    ${esc(AKWAABA_BRAND_FOOTER)} · Generated ${esc(opts.insights.generatedAt)} · Source ${esc(opts.insights.source)}
  </div>
  <script>window.addEventListener('load',function(){ setTimeout(function(){ /* ready for print */ }, 200); });</script>
</body>
</html>`
}
