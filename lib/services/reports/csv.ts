import type { ReportColumn } from "./types"
import {
  AKWAABA_BRAND_FOOTER,
  csvBrandFooter,
  csvBrandHeader,
  type CompanyBrandInfo,
} from "@/lib/exports/company-branding"

function ghs(v: unknown): number {
  return Math.round(Number(v ?? 0) * 100) / 100
}

/** Build a downloadable CSV with company letterhead + column headings + brand footer. */
export function toCSV(
  columns: ReportColumn[],
  rows: Record<string, unknown>[],
  meta?: {
    title?: string
    company?: string
    companyInfo?: CompanyBrandInfo | null
    period?: string
    generatedAt?: string
  },
): string {
  const lines: string[] = []
  const bom = "\uFEFF"

  const companyInfo: CompanyBrandInfo | null =
    meta?.companyInfo || (meta?.company ? { name: meta.company } : null)

  lines.push(
    ...csvBrandHeader({
      title: meta?.title || "Compliance Report",
      company: companyInfo,
      period: meta?.period,
      generatedAt: meta?.generatedAt || new Date().toISOString(),
    }),
  )

  const header = columns.map((c) => `"${c.label}"`).join(",")
  lines.push(header)

  for (const r of rows) {
    lines.push(
      columns
        .map((c) => {
          const val = r[c.key]
          if (val === null || val === undefined) return '""'
          if (c.type === "currency" || c.type === "number") return String(ghs(val))
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(","),
    )
  }

  lines.push(...csvBrandFooter())
  if (!lines.some((l) => l.includes("AkwaabaHRPay"))) {
    lines.push(`"${AKWAABA_BRAND_FOOTER}"`)
  }

  return bom + lines.join("\n")
}
