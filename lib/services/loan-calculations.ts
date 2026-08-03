/** Shared loan math helpers safe for client and server imports. */

export type InterestType = "fixed" | "reducing_balance" | "daily_compound"

export interface AmortizationPreviewRow {
  month_number: number
  due_date: string
  payment_amount: number
  principal_portion: number
  interest_portion: number
  balance_remaining: number
}

export interface AmortizationPreviewResult {
  interest_type: InterestType
  monthly_payment: number
  total_interest: number
  total_payable: number
  rows: AmortizationPreviewRow[]
}

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function normalizeInterestType(value: string | null | undefined): InterestType {
  const t = String(value || "fixed")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
  if (t.includes("reduc")) return "reducing_balance"
  if (t.includes("daily") || t.includes("compound")) return "daily_compound"
  return "fixed"
}

export function interestTypeLabel(value: string | null | undefined): string {
  switch (normalizeInterestType(value)) {
    case "reducing_balance":
      return "Reducing Balance"
    case "daily_compound":
      return "Daily Compound"
    default:
      return "Fixed"
  }
}

/** Calculate monthly payment using reducing-balance (PMT formula). */
export function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (!months || months <= 0) return 0
  if (!annualRate || annualRate === 0) return round2(principal / months)
  const r = annualRate / 100 / 12
  return round2((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1))
}

function addMonths(startDate: string, offset: number): string {
  const due = new Date(startDate)
  const next = new Date(due.getFullYear(), due.getMonth() + offset, due.getDate())
  return next.toISOString().split("T")[0]
}

/** Fixed interest: interest on original principal only; equal principal + equal interest split. */
function buildFixedAmortization(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string,
): AmortizationPreviewResult {
  const monthlyRate = annualRate / 100 / 12
  const totalInterest = round2(principal * monthlyRate * months)
  const totalPayable = round2(principal + totalInterest)
  const monthlyPayment = round2(totalPayable / months)
  const equalPrincipal = round2(principal / months)
  const equalInterest = round2(totalInterest / months)

  const rows: AmortizationPreviewRow[] = []
  let principalLeft = principal
  let payableLeft = totalPayable

  for (let i = 1; i <= months; i++) {
    const isLast = i === months
    const principalPortion = isLast ? round2(principalLeft) : equalPrincipal
    const interestPortion = isLast
      ? round2(Math.max(0, payableLeft - principalPortion))
      : equalInterest
    const payment = isLast
      ? round2(principalPortion + interestPortion)
      : monthlyPayment

    principalLeft = round2(Math.max(0, principalLeft - principalPortion))
    payableLeft = round2(Math.max(0, payableLeft - payment))

    rows.push({
      month_number: i,
      due_date: addMonths(startDate, i - 1),
      payment_amount: payment,
      principal_portion: principalPortion,
      interest_portion: interestPortion,
      // Remaining total amount to pay (principal + interest still owed)
      balance_remaining: payableLeft,
    })
  }

  return {
    interest_type: "fixed",
    monthly_payment: monthlyPayment,
    total_interest: totalInterest,
    total_payable: totalPayable,
    rows,
  }
}

/** Reducing balance: standard amortization (PMT) with interest on remaining principal. */
function buildReducingAmortization(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string,
): AmortizationPreviewResult {
  const monthlyRate = annualRate / 100 / 12
  const payment = calcMonthlyPayment(principal, annualRate, months)
  let balance = principal
  const rows: AmortizationPreviewRow[] = []
  let totalInterest = 0

  for (let i = 1; i <= months; i++) {
    const interest = round2(balance * monthlyRate)
    let principalPortion = round2(payment - interest)
    let actualPayment = payment

    if (i === months) {
      principalPortion = round2(balance)
      actualPayment = round2(balance + interest)
    }

    balance = Math.max(0, round2(balance - principalPortion))
    totalInterest = round2(totalInterest + interest)

    rows.push({
      month_number: i,
      due_date: addMonths(startDate, i - 1),
      payment_amount: actualPayment,
      principal_portion: principalPortion,
      interest_portion: interest,
      balance_remaining: balance,
    })
  }

  const totalPayable = round2(rows.reduce((s, r) => s + r.payment_amount, 0))
  return {
    interest_type: "reducing_balance",
    monthly_payment: payment,
    total_interest: totalInterest,
    total_payable: totalPayable,
    rows,
  }
}

/**
 * Daily compound: interest accrues daily on outstanding principal;
 * monthly due = (principal + accrued interest for month) amortized toward payoff.
 */
function buildDailyCompoundAmortization(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string,
): AmortizationPreviewResult {
  const dailyRate = annualRate / 100 / 365
  let balance = principal
  const rows: AmortizationPreviewRow[] = []
  let totalInterest = 0

  // Target roughly equal principal reduction; interest added monthly.
  const basePrincipal = months > 0 ? principal / months : 0

  for (let i = 1; i <= months; i++) {
    const daysInMonth = 30
    let monthlyInterest = 0
    let working = balance

    for (let day = 0; day < daysInMonth; day++) {
      monthlyInterest += working * dailyRate
    }
    monthlyInterest = round2(monthlyInterest)
    totalInterest = round2(totalInterest + monthlyInterest)

    const isLast = i === months
    const principalPortion = isLast ? round2(balance) : round2(Math.min(balance, basePrincipal))
    const payment = round2(principalPortion + monthlyInterest)
    balance = Math.max(0, round2(balance - principalPortion))

    rows.push({
      month_number: i,
      due_date: addMonths(startDate, i - 1),
      payment_amount: payment,
      principal_portion: principalPortion,
      interest_portion: monthlyInterest,
      balance_remaining: balance,
    })
  }

  const totalPayable = round2(rows.reduce((s, r) => s + r.payment_amount, 0))
  const avgPayment = months > 0 ? round2(totalPayable / months) : 0

  return {
    interest_type: "daily_compound",
    monthly_payment: avgPayment,
    total_interest: totalInterest,
    total_payable: totalPayable,
    rows,
  }
}

/** Build amortization for the selected interest method. */
export function buildAmortizationForInterestType(opts: {
  principal: number
  annualRatePercent: number
  tenureMonths: number
  interestType?: string | null
  startDate: string
}): AmortizationPreviewResult {
  const principal = Number(opts.principal || 0)
  const annualRate = Number(opts.annualRatePercent || 0)
  const months = Math.max(1, Math.floor(Number(opts.tenureMonths || 1)))
  const startDate = opts.startDate || new Date().toISOString().split("T")[0]
  const interestType = normalizeInterestType(opts.interestType)

  if (interestType === "reducing_balance") {
    return buildReducingAmortization(principal, annualRate, months, startDate)
  }
  if (interestType === "daily_compound") {
    return buildDailyCompoundAmortization(principal, annualRate, months, startDate)
  }
  return buildFixedAmortization(principal, annualRate, months, startDate)
}

/**
 * Backward-compatible preview. Pass interestType explicitly (fixed / reducing_balance / daily_compound).
 * Defaults to fixed when omitted — matching loan_types / normalizeInterestType.
 */
export function buildAmortizationPreview(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string,
  interestType?: string | null,
): AmortizationPreviewRow[] {
  return buildAmortizationForInterestType({
    principal,
    annualRatePercent: annualRate,
    tenureMonths: months,
    interestType: interestType ?? "fixed",
    startDate,
  }).rows
}
