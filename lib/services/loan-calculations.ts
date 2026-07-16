/** Shared loan math helpers safe for client and server imports. */

export interface AmortizationPreviewRow {
  month_number: number
  due_date: string
  payment_amount: number
  principal_portion: number
  interest_portion: number
  balance_remaining: number
}

/** Calculate monthly payment using reducing-balance (PMT formula). */
export function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return Math.round((principal / months) * 100) / 100
  const r = annualRate / 100 / 12
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1) * 100) / 100
}

/** Generate a client-side amortization preview (no DB write). */
export function buildAmortizationPreview(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string,
): AmortizationPreviewRow[] {
  const monthlyRate = annualRate / 100 / 12
  const payment = calcMonthlyPayment(principal, annualRate, months)
  let balance = principal
  const rows: AmortizationPreviewRow[] = []
  let due = new Date(startDate)

  for (let i = 1; i <= months; i++) {
    const interest = Math.round(balance * monthlyRate * 100) / 100
    let principalPortion = Math.round((payment - interest) * 100) / 100
    let actualPayment = payment

    if (i === months) {
      principalPortion = balance
      actualPayment = balance + interest
    }

    balance = Math.max(0, Math.round((balance - principalPortion) * 100) / 100)

    rows.push({
      month_number: i,
      due_date: due.toISOString().split("T")[0],
      payment_amount: Math.round(actualPayment * 100) / 100,
      principal_portion: principalPortion,
      interest_portion: interest,
      balance_remaining: balance,
    })

    due = new Date(due.getFullYear(), due.getMonth() + 1, due.getDate())
  }

  return rows
}
