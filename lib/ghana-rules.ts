export interface PayeBand {
  upTo: number | null
  rate: number
}

export interface PayeRule {
  monthlyBands: PayeBand[]
  personalRelief: number
}

export interface SsnitRule {
  employee: number
  employer: number
  maxInsurableMonthly: number
}

export const GHANA_TAX_RULES_2025 = {
  PAYE: {
    monthlyBands: [
      { upTo: 365, rate: 0 },
      { upTo: 730, rate: 5 },
      { upTo: 3650, rate: 10 },
      { upTo: 16250, rate: 17.5 },
      { upTo: 50000, rate: 25 },
      { upTo: null, rate: 30 },
    ],
    personalRelief: 365,
  } as PayeRule,

  SSNIT: {
    employee: 0.055, // 5.5%
    employer: 0.135, // 13.5%
    maxInsurableMonthly: 4500,
  } as SsnitRule,
}

export function calculatePaye(taxableIncome: number): number {
  const bands = GHANA_TAX_RULES_2025.PAYE.monthlyBands
  let remainingIncome = taxableIncome
  let totalTax = 0
  let lowerBound = 0

  for (const band of bands) {
    if (remainingIncome <= 0) break

    const upperBound = band.upTo || Number.MAX_SAFE_INTEGER
    const taxableAtThisBand = Math.min(remainingIncome, upperBound - lowerBound)

    if (taxableAtThisBand > 0) {
      totalTax += taxableAtThisBand * (band.rate / 100)
      remainingIncome -= taxableAtThisBand
    }

    if (band.upTo === null) break
    lowerBound = band.upTo
  }

  return Math.round(totalTax * 100) / 100
}

export function calculateSsnit(grossSalary: number): { employee: number; employer: number } {
  const ssnit = GHANA_TAX_RULES_2025.SSNIT
  const insurableIncome = Math.min(grossSalary, ssnit.maxInsurableMonthly)

  return {
    employee: Math.round(insurableIncome * ssnit.employee * 100) / 100,
    employer: Math.round(insurableIncome * ssnit.employer * 100) / 100,
  }
}

export interface PayrollCalculation {
  grossPay: number
  taxableIncome: number
  paye: number
  ssnitEmployee: number
  ssnitEmployer: number
  netPay: number
}

export function calculatePayroll(
  baseSalary: number,
  allowances: Record<string, number> = {},
  preDeductions: Record<string, number> = {},
  postDeductions: Record<string, number> = {},
): PayrollCalculation {
  // Calculate gross pay
  const totalAllowances = Object.values(allowances).reduce((sum, amount) => sum + amount, 0)
  const grossPay = baseSalary + totalAllowances

  // Calculate SSNIT
  const ssnit = calculateSsnit(grossPay)

  // Calculate pre-tax deductions
  const totalPreDeductions = Object.values(preDeductions).reduce((sum, amount) => sum + amount, 0)

  // Calculate taxable income
  const taxableIncome = grossPay - ssnit.employee - totalPreDeductions

  // Calculate PAYE
  const paye = calculatePaye(taxableIncome)

  // Calculate post-tax deductions
  const totalPostDeductions = Object.values(postDeductions).reduce((sum, amount) => sum + amount, 0)

  // Calculate net pay
  const netPay = grossPay - ssnit.employee - paye - totalPostDeductions

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    paye: Math.round(paye * 100) / 100,
    ssnitEmployee: ssnit.employee,
    ssnitEmployer: ssnit.employer,
    netPay: Math.round(netPay * 100) / 100,
  }
}
