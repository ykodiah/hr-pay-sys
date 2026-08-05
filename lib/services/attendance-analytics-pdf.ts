import { loadCompanyBrand, renderBrandedHtmlDocument } from "@/lib/exports/company-branding"
import { getAttendanceAnalytics } from "@/lib/services/attendance-analytics-service"
import { createServiceClient } from "@/lib/supabase/server"

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Monthly HR pack — printable attendance analytics PDF (HTML → browser print).
 */
export async function renderAttendanceAnalyticsPdf(input: {
  companyId: string
  from: string
  to: string
}) {
  const analytics = await getAttendanceAnalytics(input)
  const service = createServiceClient()
  const company = await loadCompanyBrand(service, input.companyId)

  const kpis = analytics.kpis || {}
  const period = `${input.from} → ${input.to}`

  const kpiCards = [
    ["Attendance rate", `${kpis.attendance_rate ?? 0}%`],
    ["Punctuality", `${kpis.punctuality_rate ?? 0}%`],
    ["Absenteeism", `${kpis.absenteeism_rate ?? 0}%`],
    ["OT hours", String(kpis.overtime_hours ?? 0)],
    ["Present marks", String(kpis.present ?? 0)],
    ["Late marks", String(kpis.late ?? 0)],
    ["Absent marks", String(kpis.absent ?? 0)],
    ["Leave marks", String(kpis.leave ?? 0)],
  ]

  const deptRows = (analytics.departments || [])
    .map(
      (d: any) =>
        `<tr>
          <td>${esc(d.department)}</td>
          <td class="right">${esc(d.present || 0)}</td>
          <td class="right">${esc(d.late || 0)}</td>
          <td class="right">${esc(d.absent || 0)}</td>
          <td class="right">${esc(Number(d.hours || 0).toFixed(1))}</td>
          <td class="right">${esc(Number(d.overtime || 0).toFixed(1))}</td>
        </tr>`,
    )
    .join("")

  const lateRows = (analytics.top_late || [])
    .map(
      (e: any) =>
        `<tr><td>${esc(e.employee_name)}</td><td>${esc(e.department || "—")}</td><td class="right">${esc(e.late)}</td></tr>`,
    )
    .join("")

  const otRows = (analytics.top_overtime || [])
    .map(
      (e: any) =>
        `<tr><td>${esc(e.employee_name)}</td><td>${esc(e.department || "—")}</td><td class="right">${esc(e.overtime)}h</td></tr>`,
    )
    .join("")

  const absentRows = (analytics.top_absent || [])
    .map(
      (e: any) =>
        `<tr><td>${esc(e.employee_name)}</td><td>${esc(e.department || "—")}</td><td class="right">${esc(e.absent)}</td></tr>`,
    )
    .join("")

  const trendRows = (analytics.trend || [])
    .slice(-31)
    .map(
      (d: any) =>
        `<tr>
          <td>${esc(d.date)}</td>
          <td class="right">${esc(d.present || 0)}</td>
          <td class="right">${esc(d.late || 0)}</td>
          <td class="right">${esc(d.absent || 0)}</td>
          <td class="right">${esc(d.leave || 0)}</td>
          <td class="right">${esc(Number(d.hours || 0).toFixed(1))}</td>
        </tr>`,
    )
    .join("")

  const bodyHtml = `
    <section style="margin-bottom:18px">
      <p style="margin:0 0 10px;color:#5b6b62;font-size:13px">
        Monthly HR attendance pack — shift-aware punctuality, absenteeism, and overtime leaders for the selected period.
      </p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
        ${kpiCards
          .map(
            ([label, value]) => `
          <div style="border:1px solid #d7ddd8;border-radius:8px;padding:10px 12px;background:#f7faf8">
            <div style="font-size:11px;color:#5b6b62;text-transform:uppercase;letter-spacing:.04em">${esc(label)}</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px;color:#0f6b4c">${esc(value)}</div>
          </div>`,
          )
          .join("")}
      </div>
    </section>

    <h3 style="margin:0 0 6px;font-size:15px;color:#0f6b4c">Department summary</h3>
    <table>
      <thead>
        <tr>
          <th>Department</th><th class="right">Present</th><th class="right">Late</th>
          <th class="right">Absent</th><th class="right">Hours</th><th class="right">OT</th>
        </tr>
      </thead>
      <tbody>
        ${deptRows || `<tr><td colspan="6">No department data</td></tr>`}
      </tbody>
    </table>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:18px">
      <div>
        <h3 style="margin:0 0 6px;font-size:14px;color:#0f6b4c">Most late</h3>
        <table>
          <thead><tr><th>Employee</th><th>Dept</th><th class="right">Count</th></tr></thead>
          <tbody>${lateRows || `<tr><td colspan="3">None</td></tr>`}</tbody>
        </table>
      </div>
      <div>
        <h3 style="margin:0 0 6px;font-size:14px;color:#0f6b4c">Top overtime</h3>
        <table>
          <thead><tr><th>Employee</th><th>Dept</th><th class="right">Hours</th></tr></thead>
          <tbody>${otRows || `<tr><td colspan="3">None</td></tr>`}</tbody>
        </table>
      </div>
      <div>
        <h3 style="margin:0 0 6px;font-size:14px;color:#0f6b4c">Most absent</h3>
        <table>
          <thead><tr><th>Employee</th><th>Dept</th><th class="right">Count</th></tr></thead>
          <tbody>${absentRows || `<tr><td colspan="3">None</td></tr>`}</tbody>
        </table>
      </div>
    </div>

    <h3 style="margin:18px 0 6px;font-size:15px;color:#0f6b4c">Daily trend (last 31 days in range)</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th><th class="right">Present</th><th class="right">Late</th>
          <th class="right">Absent</th><th class="right">Leave</th><th class="right">Hours</th>
        </tr>
      </thead>
      <tbody>${trendRows || `<tr><td colspan="6">No daily data</td></tr>`}</tbody>
    </table>
  `

  return renderBrandedHtmlDocument({
    title: "Monthly Attendance Analytics Pack",
    company,
    period,
    subtitle: "HR pack · shift-aware late detection · overtime & absenteeism",
    bodyHtml,
    autoPrint: true,
  })
}
