/**
 * Shared helpers for Ghana payroll report API routes.
 * Handles company resolution, payroll run lookup by period, and data isolation.
 */
import { createClient } from '@/lib/supabase/server'
import { resolveTenantContext, isTenantContext } from '@/lib/settings/resolve-tenant'
import { NextRequest } from 'next/server'

export interface ReportCompany {
  id: string
  name: string
  erNumber: string // uses ssnit_number as the Ghana ER number; fallback to tax_id
}

export interface ReportContext {
  client: Awaited<ReturnType<typeof createClient>>
  company: ReportCompany
  payPeriod: string   // e.g. "06-2026" as sent from the client
  periodStart: string // e.g. "2026-06-01"
  periodEnd: string   // e.g. "2026-06-30"
  companyId: string
}

/**
 * Parse a MM-YYYY period string into YYYY-MM-DD start/end dates.
 * Also accepts YYYY-MM format for flexibility.
 */
export function parsePeriod(payPeriod: string): { start: string; end: string } | null {
  let year: number, month: number

  const mmYYYY = payPeriod.match(/^(\d{1,2})-(\d{4})$/)
  const yyyyMM = payPeriod.match(/^(\d{4})-(\d{2})$/)

  if (mmYYYY) {
    month = parseInt(mmYYYY[1], 10)
    year = parseInt(mmYYYY[2], 10)
  } else if (yyyyMM) {
    year = parseInt(yyyyMM[1], 10)
    month = parseInt(yyyyMM[2], 10)
  } else {
    return null
  }

  if (month < 1 || month > 12) return null

  const endDate = new Date(year, month, 0) // last day of month
  const pad = (n: number) => String(n).padStart(2, '0')

  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(endDate.getDate())}`,
  }
}

/**
 * Resolve company details for a report. Uses resolveTenantContext so both
 * demo and real sessions are handled automatically.
 * An empty companyId is fine — the tenant resolver derives it from the session.
 */
export async function resolveReportContext(
  request: NextRequest,
  companyId: string,
  payPeriod: string,
): Promise<ReportContext | { error: string; status: number }> {
  const parsed = parsePeriod(payPeriod)
  if (!parsed) {
    return { error: 'Invalid pay period format. Use MM-YYYY (e.g. 06-2026)', status: 400 }
  }

  const tenantResult = await resolveTenantContext(request, companyId || null)

  // resolveTenantContext returns NextResponse on error, TenantContext on success
  if (!isTenantContext(tenantResult)) {
    // It's a NextResponse — extract status and body
    try {
      const resp = tenantResult as Response
      const body = await resp.clone().json().catch(() => ({}))
      return { error: (body as any).error || 'Unauthorized', status: (resp as any).status || 401 }
    } catch {
      return { error: 'Unauthorized', status: 401 }
    }
  }

  const { companyId: resolvedCompanyId, service } = tenantResult

  const { data: company } = await service
    .from('companies')
    .select('id, name, ssnit_number, tax_id')
    .eq('id', resolvedCompanyId)
    .single()

  if (!company) return { error: 'Company not found', status: 404 }

  const client = await createClient()

  return {
    client,
    company: {
      id: company.id,
      name: company.name,
      // Ghana ER number = employer SSNIT number; fallback to tax_id
      erNumber: (company as any).ssnit_number || (company as any).tax_id || 'N/A',
    },
    payPeriod,
    periodStart: parsed.start,
    periodEnd: parsed.end,
    companyId: resolvedCompanyId,
  }
}

/**
 * Fetch payroll_items for a company + period by joining through payroll_runs.
 * payroll_items has no pay_period column — linked via payroll_run_id → payroll_runs(pay_period_start).
 */
export async function fetchPayrollItems(
  client: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  periodStart: string,
  periodEnd: string,
  selectFields: string,
): Promise<any[]> {
  const { data: runs } = await client
    .from('payroll_runs')
    .select('id')
    .eq('company_id', companyId)
    .gte('pay_period_start', periodStart)
    .lte('pay_period_start', periodEnd)
    .not('status', 'eq', 'cancelled')

  if (!runs || runs.length === 0) return []

  const runIds = runs.map((r: any) => r.id)

  const { data: items } = await client
    .from('payroll_items')
    .select(selectFields)
    .in('payroll_run_id', runIds)

  return items || []
}

/**
 * Cache a generated report in ghana_payroll_reports (best-effort — will not fail the request
 * if the table does not exist yet; migration 081 creates it).
 */
export async function cacheReport(
  client: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  payPeriod: string,
  reportType: string,
  reportData: Record<string, unknown>,
  generatedBy: string,
): Promise<void> {
  try {
    await client.from('ghana_payroll_reports').insert({
      company_id: companyId,
      pay_period: payPeriod,
      report_type: reportType,
      report_data: reportData,
      generated_by: generatedBy,
    })
  } catch {
    // Non-fatal — table may not be migrated yet
  }
}
