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
}

function isActiveOn(line: CompLine, asOf: string): boolean {
  if (line.is_active === false) return false
  if (line.effective_date && line.effective_date > asOf) return false
  if (line.end_date && line.end_date < asOf) return false
  return true
}

export function sumCompLines(lines: CompLine[] | null | undefined, basicSalary: number, asOf: string): number {
  let total = 0
  for (const line of lines ?? []) {
    if (!isActiveOn(line, asOf)) continue
    const type = String(line.calculation_type || "AMOUNT").toUpperCase()
    if (type === "PERCENTAGE") {
      total += (Number(basicSalary) * Number(line.percentage || 0)) / 100
    } else {
      total += Number(line.amount || 0)
    }
  }
  return Math.round((total + Number.EPSILON) * 100) / 100
}
