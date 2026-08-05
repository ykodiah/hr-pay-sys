import { createServiceClient } from "@/lib/supabase/server"

export type OrgSnapshot = {
  subsidiary_id: string | null
  division: string | null
  department: string | null
  location: string | null
  direct_supervisor: string | null
  head_of_department: string | null
  as_of: string
  source: "current" | "transfer_history"
}

/**
 * Resolve organisational placement as of a date for payroll / reports.
 * Walks applied transfers in reverse; months before a transfer keep prior org.
 */
export async function resolveEmployeeOrgAsOf(
  companyId: string,
  employeeId: string,
  asOfDate: string,
): Promise<OrgSnapshot> {
  const service = createServiceClient()
  const { data: emp } = await service
    .from("employees")
    .select(
      "subsidiary_id, division, department, location, direct_supervisor, head_of_department",
    )
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle()

  const current: OrgSnapshot = {
    subsidiary_id: emp?.subsidiary_id || null,
    division: emp?.division || null,
    department: emp?.department || null,
    location: emp?.location || null,
    direct_supervisor: emp?.direct_supervisor || null,
    head_of_department: emp?.head_of_department || null,
    as_of: asOfDate,
    source: "current",
  }

  const { data: transfers } = await service
    .from("employee_transfers")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("status", "applied")
    .order("effective_date", { ascending: false })

  if (!transfers?.length) return current

  // If as-of is before the earliest transfer, reconstruct from that transfer's "from_*"
  // If as-of is after latest transfer, current employee row is correct
  const futureOrOn = transfers.filter((t: any) => t.effective_date <= asOfDate)
  if (futureOrOn.length) {
    // Latest transfer on/before asOf already applied to current row for "now",
    // but for historical as-of we rebuild from that transfer's "to_*"
    const t = futureOrOn[0]
    return {
      subsidiary_id: t.to_subsidiary_id ?? current.subsidiary_id,
      division: t.to_division ?? current.division,
      department: t.to_department ?? current.department,
      location: t.to_location ?? current.location,
      direct_supervisor: t.to_direct_supervisor ?? current.direct_supervisor,
      head_of_department: t.to_head_of_department ?? current.head_of_department,
      as_of: asOfDate,
      source: "transfer_history",
    }
  }

  // asOf is before all transfers → use oldest transfer's from_*
  const oldest = transfers[transfers.length - 1]
  return {
    subsidiary_id: oldest.from_subsidiary_id ?? null,
    division: oldest.from_division ?? null,
    department: oldest.from_department ?? null,
    location: oldest.from_location ?? null,
    direct_supervisor: oldest.from_direct_supervisor ?? null,
    head_of_department: oldest.from_head_of_department ?? null,
    as_of: asOfDate,
    source: "transfer_history",
  }
}
