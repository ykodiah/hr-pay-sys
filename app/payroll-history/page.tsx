import { PayrollHistoryClient } from "@/components/payroll-history-client"
import { createClient } from "@/lib/supabase/server"

export default async function PayrollHistoryPage() {
  const supabase = await createClient()

  // Fetch payroll runs with employee counts
  const { data: payrollRuns, error } = await supabase
    .from("payroll_runs")
    .select(
      `
      *,
      payroll_items (
        id,
        employee_id,
        employees (
          full_name,
          employee_id
        )
      )
    `,
    )
    .order("pay_period_end", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching payroll runs:", error)
  }

  return <PayrollHistoryClient initialData={payrollRuns || []} />
}
