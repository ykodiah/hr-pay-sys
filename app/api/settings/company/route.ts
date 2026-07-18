// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { data: company, error } = await service.from("companies").select("*").eq("id", companyId).maybeSingle()
    if (error) throw error
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const { data: settings } = await service
      .from("company_settings")
      .select("settings_data, fiscal_year_start, default_currency, timezone, language")
      .eq("company_id", companyId)
      .maybeSingle()

    const settingsPayload = (settings?.settings_data || {}) as Record<string, unknown>
    const divisions = ensureArray(settingsPayload.divisions ?? company.divisions)
    const departments = ensureArray(settingsPayload.departments ?? company.departments)
    const locations = ensureArray(settingsPayload.locations ?? company.locations)
    const logoFromSettings = typeof settingsPayload.logo_url === "string" ? settingsPayload.logo_url : undefined

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name || "",
        email_address: company.email_address || "",
        tax_id: company.tax_id || "",
        ssnit_number: company.ssnit_number || "",
        industry: company.industry || "",
        status: "active",
        address: company.address || "",
        phone_number: company.phone_number || "",
        divisions,
        departments,
        locations,
        logo_url: company.logo_url || logoFromSettings || null,
      },
      settings: settings || null,
    })
  } catch (err) {
    return jsonError(err, "Failed to load company settings")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const now = new Date().toISOString()

    const divisions = ensureArray(body.divisions)
    const departments = ensureArray(body.departments)
    const locations = ensureArray(body.locations)
    const logoUrl = body.logo_url ?? null

    const { error: companyError } = await service
      .from("companies")
      .update({
        name: body.name,
        industry: body.industry,
        tax_id: body.tax_id,
        ssnit_number: body.ssnit_number,
        email_address: body.email_address,
        phone_number: body.phone_number,
        address: body.address,
        divisions,
        departments,
        locations,
        logo_url: logoUrl,
        updated_at: now,
      })
      .eq("id", companyId)

    if (companyError) throw companyError

    const { error: settingsError } = await service.from("company_settings").upsert(
      {
        company_id: companyId,
        settings_data: {
          divisions,
          departments,
          locations,
          logo_url: logoUrl,
        },
        fiscal_year_start: body.fiscal_year_start,
        default_currency: body.default_currency,
        timezone: body.timezone,
        language: body.language,
        updated_at: now,
      },
      { onConflict: "company_id" },
    )

    if (settingsError) throw settingsError

    return NextResponse.json({ success: true, company_id: companyId })
  } catch (err) {
    return jsonError(err, "Failed to save company settings")
  }
}
