export function daysBetweenInclusive(start: string, end: string): number {
  const a = new Date(start)
  const b = new Date(end)
  const ms = b.getTime() - a.getTime()
  if (!Number.isFinite(ms) || ms < 0) return 1
  return Math.floor(ms / 86400000) + 1
}

export async function markAttendanceLeave(
  service: any,
  companyId: string,
  employeeId: string,
  start: string,
  end: string,
) {
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    const date = cur.toISOString().slice(0, 10)
    const day = cur.getDay()
    if (day !== 0 && day !== 6) {
      const { data: existing } = await service
        .from("attendance_records")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("date", date)
        .maybeSingle()
      const row = {
        company_id: companyId,
        employee_id: employeeId,
        date,
        status: "leave",
        source: "leave",
        notes: "Marked from approved leave",
        updated_at: new Date().toISOString(),
      }
      if (existing?.id) {
        await service.from("attendance_records").update(row).eq("id", existing.id)
      } else {
        await service.from("attendance_records").insert(row)
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
}

export async function debitLeaveBalance(
  service: any,
  companyId: string,
  employeeId: string,
  leaveTypeId: string | null | undefined,
  days: number,
) {
  if (!leaveTypeId || !days) return
  const year = new Date().getFullYear()
  const { data: bal } = await service
    .from("leave_balances")
    .select("id, used_days, remaining_days, entitled_days")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", year)
    .maybeSingle()

  if (bal?.id) {
    const used = Number(bal.used_days || 0) + days
    const entitled = Number(bal.entitled_days || 0)
    await service
      .from("leave_balances")
      .update({
        used_days: used,
        remaining_days: Math.max(0, entitled - used),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bal.id)
  } else {
    const { data: lt } = await service
      .from("leave_types")
      .select("entitlement_amount")
      .eq("id", leaveTypeId)
      .maybeSingle()
    const entitled = Number(lt?.entitlement_amount || 0)
    await service.from("leave_balances").insert({
      company_id: companyId,
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      entitled_days: entitled,
      used_days: days,
      remaining_days: Math.max(0, entitled - days),
    })
  }
}
