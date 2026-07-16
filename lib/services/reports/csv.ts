import type { ReportColumn } from "./types"

function ghs(v: unknown): number {
  return Math.round(Number(v ?? 0) * 100) / 100
}

/** Build a downloadable CSV with a title block + column headings. */
export function toCSV(
  columns: ReportColumn[],
  rows: Record<string, unknown>[],
  meta?: { title?: string; company?: string; period?: string; generatedAt?: string },
): string {
  const lines: string[] = []
  // UTF-8 BOM helps Excel open Ghana character sets correctly
  const bom = "\uFEFF"

  if (meta?.title) lines.push(`"${String(meta.title).replace(/"/g, '""')}"`)
  if (meta?.company) lines.push(`"Company","${String(meta.company).replace(/"/g, '""')}"`)
  if (meta?.period) lines.push(`"Pay Period","${String(meta.period).replace(/"/g, '""')}"`)
  if (meta?.generatedAt) lines.push(`"Generated At","${String(meta.generatedAt).replace(/"/g, '""')}"`)
  if (lines.length > 0) lines.push("") // blank separator before column headings

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

  return bom + lines.join("\n")
}
