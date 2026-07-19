// @ts-nocheck
/**
 * GET /api/settings/payroll/schema-check
 * Inspects tax_reliefs / employee_tax_reliefs schema readiness for Save All + Assign.
 */

import { NextRequest, NextResponse } from "next/server"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

const REQUIRED_TAX_RELIEF_COLS = [
  "id",
  "company_id",
  "name",
  "relief_name",
  "relief_code",
  "gra_code",
  "amount",
  "relief_type",
  "is_active",
]

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const report: Record<string, any> = {
      company_id: companyId,
      ok: true,
      issues: [] as string[],
      recommendations: [] as string[],
    }

    // Prefer SQL inspect RPC from scripts/078
    const { data: rpcData, error: rpcErr } = await service.rpc("akwaaba_inspect_tax_reliefs_schema")
    if (!rpcErr && rpcData) {
      report.inspect = rpcData
      const cols = Array.isArray(rpcData.columns) ? rpcData.columns : []
      const colNames = new Set(cols.map((c: any) => c.column_name))
      for (const required of REQUIRED_TAX_RELIEF_COLS) {
        if (!colNames.has(required)) {
          report.ok = false
          report.issues.push(`Missing column tax_reliefs.${required}`)
        }
      }
      const checks = Array.isArray(rpcData.check_constraints) ? rpcData.check_constraints : []
      const legacyCheck = checks.find((c: any) =>
        String(c.name || "").includes("tax_relief_relief_type_check"),
      )
      if (legacyCheck) {
        report.ok = false
        report.issues.push(
          `Legacy check still present: ${legacyCheck.name} → ${legacyCheck.def}. Run scripts/078_tax_reliefs_relief_type_and_schema.sql`,
        )
      }
      if (!rpcData.employee_tax_reliefs_exists) {
        report.ok = false
        report.issues.push("employee_tax_reliefs table missing (Assign/Bulk will fail)")
        report.recommendations.push("Run scripts/069_employee_tax_reliefs.sql or 078")
      }
      report.recommendations.push(
        report.ok
          ? "Schema looks ready — retry Settings → Payroll → Tax Reliefs → Save All"
          : "Run scripts/078_tax_reliefs_relief_type_and_schema.sql in Supabase, then retry Save All",
      )
      return NextResponse.json(report)
    }

    // Fallback probe without RPC
    report.inspect_rpc = rpcErr?.message || "akwaaba_inspect_tax_reliefs_schema not available"
    report.recommendations.push(
      "Run scripts/078_tax_reliefs_relief_type_and_schema.sql to install inspect RPC + fix relief_type check",
    )

    const { data: sample, error: sampleErr } = await service
      .from("tax_reliefs")
      .select("*")
      .eq("company_id", companyId)
      .limit(1)

    if (sampleErr) {
      report.ok = false
      report.issues.push(`tax_reliefs read failed: ${sampleErr.message}`)
    } else {
      report.sample_row_keys = sample?.[0] ? Object.keys(sample[0]) : []
      report.active_or_any_rows = (sample || []).length
      if (sample?.[0] && !("relief_type" in sample[0])) {
        report.issues.push("relief_type column not visible on tax_reliefs sample row")
      }
    }

    const { error: assignErr } = await service
      .from("employee_tax_reliefs")
      .select("id")
      .eq("company_id", companyId)
      .limit(1)
    if (assignErr) {
      report.ok = false
      report.issues.push(`employee_tax_reliefs: ${assignErr.message}`)
    } else {
      report.employee_tax_reliefs_ok = true
    }

    // Probe insert capability with a disposable inactive row (rolled back via delete)
    const probeCode = `PROBE-${Date.now().toString().slice(-8)}`
    const probe = {
      company_id: companyId,
      name: "Probe",
      relief_name: "Probe",
      relief_code: probeCode.slice(0, 20),
      gra_code: probeCode.slice(0, 20),
      code: probeCode.slice(0, 20),
      amount: 0,
      relief_type: "fixed",
      is_active: false,
      updated_at: new Date().toISOString(),
    }
    const { data: inserted, error: insertErr } = await service
      .from("tax_reliefs")
      .insert(probe)
      .select("id")
      .maybeSingle()

    if (insertErr) {
      report.ok = false
      report.issues.push(`Probe insert failed: ${insertErr.message}`)
      if (/relief_type_check/i.test(insertErr.message)) {
        report.recommendations.push(
          "CRITICAL: Run scripts/078_tax_reliefs_relief_type_and_schema.sql to drop/replace tax_relief_relief_type_check",
        )
      }
    } else if (inserted?.id) {
      report.probe_insert_ok = true
      await service.from("tax_reliefs").delete().eq("id", inserted.id).eq("company_id", companyId)
    }

    if (!report.recommendations.length) {
      report.recommendations.push(
        report.ok
          ? "Schema probe passed — retry Save All"
          : "Run scripts/078_tax_reliefs_relief_type_and_schema.sql then retry",
      )
    }

    return NextResponse.json(report)
  } catch (err) {
    return jsonError(err, "Schema check failed")
  }
}
