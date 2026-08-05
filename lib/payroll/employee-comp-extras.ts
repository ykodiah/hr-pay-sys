/**
 * Resolve active employee_allowances / employee_deductions into payroll amounts.
 */

export type CompLine = {
  amount: number
  percentage: number
  calculation_type: string
  effective_date?: string | null
  end_date?: string | null
  is_active?: boolean | null
  recurring?: boolean | null
  code?: string | null
  description?: string | null
  name?: string | null
  allowance_id?: string | null
  deduction_id?: string | null
}

export type NamedCompLine = {
  label: string
  code?: string | null
  amount: number
}

function isActiveOn(line: CompLine, asOf: string): boolean {
  if (line.is_active === false) return false
  if (line.effective_date && line.effective_date > asOf) return false
  if (line.end_date && line.end_date < asOf) return false
  return true
}

function lineAmount(line: CompLine, basicSalary: number): number {
  const type = String(line.calculation_type || "AMOUNT").toUpperCase()
  if (type === "PERCENTAGE") {
    return (Number(basicSalary) * Number(line.percentage || 0)) / 100
  }
  return Number(line.amount || 0)
}

function lineLabel(line: CompLine, fallback: string): string {
  return (
    String(line.description || line.name || line.code || "").trim() ||
    fallback
  )
}

export function sumCompLines(lines: CompLine[] | null | undefined, basicSalary: number, asOf: string): number {
  let total = 0
  for (const line of lines ?? []) {
    if (!isActiveOn(line, asOf)) continue
    total += lineAmount(line, basicSalary)
  }
  return Math.round((total + Number.EPSILON) * 100) / 100
}

/** Expand active compensation cards into named payslip lines. */
export function expandCompLines(
  lines: CompLine[] | null | undefined,
  basicSalary: number,
  asOf: string,
  fallbackPrefix = "Allowance",
): NamedCompLine[] {
  const out: NamedCompLine[] = []
  let idx = 0
  for (const line of lines ?? []) {
    if (!isActiveOn(line, asOf)) continue
    const amount = Math.round((lineAmount(line, basicSalary) + Number.EPSILON) * 100) / 100
    if (amount <= 0) continue
    idx += 1
    out.push({
      label: lineLabel(line, `${fallbackPrefix} ${idx}`),
      code: line.code ?? null,
      amount,
    })
  }
  return out
}
