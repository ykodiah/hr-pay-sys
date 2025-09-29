import { createClient } from "@/lib/supabase/server"
import { PayrollDetailClient } from "@/components/payroll-detail-client"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PayrollDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the specific payroll run with all related data
  const { data: payrollRun, error } = await supabase
    .from("payroll_runs")
    .select(
      `
      *,
      created_by:employees!payroll_runs_created_by_fkey(full_name, employee_id),
      approved_by:employees!payroll_runs_approved_by_fkey(full_name, employee_id),
      payroll_items (
        *,
        employees (
          full_name,
          employee_id,
          position,
          department
        )
      )
    `,
    )
    .eq("id", id)
    .single()

  if (error || !payrollRun) {
    console.error("[v0] Error fetching payroll run:", error)
    notFound()
  }

  return <PayrollDetailClient payrollRun={payrollRun} />
}
