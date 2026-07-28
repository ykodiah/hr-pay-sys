/**
 * Shared helpers for Ghana payroll report API routes.
 * Handles company resolution, payroll run lookup by period, and data isolation.
 */
import { resolveTenantContext, isTenantContext, TenantContext } from '@/lib/settings/resolve-tenant'
import { NextRequest } from 'next/server'

export interface ReportCompany {
  id: string
  name: string
  erNumber: string // uses ssnit_number as the Ghana ER number; fallback to tax_id
}

export interface ReportContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any  // Supabase service or regular client — both share the same query API
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

  const { companyId: resolvedCompanyId, service } = tenantResult as TenantContext

  const { data: company } = await service
    .from('companies')
    .select('id, name, ssnit_number, tax_id')
    .eq('id', resolvedCompanyId)
    .single()

  if (!company) return { error: 'Company not found', status: 404 }

  // Use the service client from tenant context — already authenticated and correctly scoped
  return {
    client: service as any,
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
 * Fetch payroll_items for a company + period.
 * payroll_items.company_id was added in migration 080.
 * We also join payroll_runs to filter by period date range so the results
 * are scoped to the correct month even when multiple runs exist.
 */
export async function fetchPayrollItems(
  client: any,
  companyId: string,
  periodStart: string,
  periodEnd: string,
  selectFields: string,
): Promise<any[]> {
  // First get the run IDs for this company + period (handles multi-run months)
  const { data: runs } = await client
    .from('payroll_runs')
    .select('id')
    .eq('company_id', companyId)
    .gte('pay_period_start', periodStart)
    .lte('pay_period_start', periodEnd)
    .not('status', 'eq', 'cancelled')

  if (!runs || runs.length === 0) return []

  const runIds = (runs as any[]).map((r) => r.id)

  // Fetch payroll_items filtered by both company_id and run IDs for safety
  const { data: items, error } = await client
    .from('payroll_items')
    .select(selectFields)
    .eq('company_id', companyId)
    .in('payroll_run_id', runIds)

  if (error) {
    console.error('[v0] fetchPayrollItems error:', error.message)
    return []
  }

  return items || []
}

/**
 * Cache a generated report in ghana_payroll_reports (best-effort — will not fail the request
 * if the table does not exist yet; migration 081 creates it).
 */
export async function cacheReport(
  client: any,
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
