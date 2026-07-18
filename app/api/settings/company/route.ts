// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { ensureArray, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

type CompanyRow = Record<string, any>

function buildCompanyResponse(company: CompanyRow, settings: CompanyRow | null) {
  const settingsPayload = (settings?.settings_data || {}) as Record<string, unknown>
  const pick = <T,>(key: string, fallback: T): T => {
    const fromSettings = settingsPayload[key]
    if (fromSettings !== undefined && fromSettings !== null) return fromSettings as T
    return fallback
  }

  const divisions = ensureArray(pick("divisions", company.divisions))
  const departments = ensureArray(pick("departments", company.departments))
  const locations = ensureArray(pick("locations", company.locations))

  // Prefer settings_data for logo/form overlay so a failed companies.logo_url write
  // cannot mask a successful company_settings save (and vice versa on read).
  const logoFromSettings = pick<string | null>("logo_url", null)
  const logoFromCompany = typeof company.logo_url === "string" ? company.logo_url : null
  const resolvedLogo =
    logoFromSettings !== null && logoFromSettings !== undefined
      ? logoFromSettings
      : logoFromCompany

  return {
    id: company.id,
    name: String(pick("name", company.name || "")),
    email_address: String(pick("email_address", company.email_address || "")),
    tax_id: String(pick("tax_id", company.tax_id || "")),
    ssnit_number: String(pick("ssnit_number", company.ssnit_number || "")),
    industry: String(pick("industry", company.industry || "")),
    status: "active",
    address: String(pick("address", company.address || "")),
    phone_number: String(pick("phone_number", company.phone_number || "")),
    divisions,
    departments,
    locations,
    logo_url: resolvedLogo || null,
  }
}

async function loadCompanyBundle(service: any, companyId: string) {
  const { data: company, error } = await service.from("companies").select("*").eq("id", companyId).maybeSingle()
  if (error) throw error
  if (!company) return null

  const { data: settings } = await service
    .from("company_settings")
    .select("settings_data, fiscal_year_start, default_currency, timezone, language, company_id")
    .eq("company_id", companyId)
    .maybeSingle()

  return { company, settings: settings || null, response: buildCompanyResponse(company, settings || null) }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const bundle = await loadCompanyBundle(service, companyId)
    if (!bundle) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json({
      company: bundle.response,
      settings: bundle.settings,
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
    const logoUrl = body.logo_url === undefined ? null : body.logo_url

    const companyFields = {
      name: body.name ?? "",
      industry: body.industry ?? "",
      tax_id: body.tax_id ?? "",
      ssnit_number: body.ssnit_number ?? "",
      email_address: body.email_address ?? "",
      phone_number: body.phone_number ?? "",
      address: body.address ?? "",
      logo_url: logoUrl,
      updated_at: now,
    }

    // Full snapshot lives in company_settings so org lists/logo survive even if
    // companies.divisions/departments/locations column types differ across tenants.
    const settingsData = {
      name: companyFields.name,
      industry: companyFields.industry,
      tax_id: companyFields.tax_id,
      ssnit_number: companyFields.ssnit_number,
      email_address: companyFields.email_address,
      phone_number: companyFields.phone_number,
      address: companyFields.address,
      divisions,
      departments,
      locations,
      logo_url: logoUrl,
    }

    const errors: string[] = []

    // 1) Update companies core columns (best effort with fallback without array cols)
    {
      const fullUpdate = { ...companyFields, divisions, departments, locations }
      const { data: updated, error } = await service
        .from("companies")
        .update(fullUpdate)
        .eq("id", companyId)
        .select("id")
        .maybeSingle()

      if (error) {
        const { data: coreUpdated, error: coreError } = await service
          .from("companies")
          .update(companyFields)
          .eq("id", companyId)
          .select("id")
          .maybeSingle()

        if (coreError) {
          errors.push(`companies: ${coreError.message}`)
        } else if (!coreUpdated) {
          errors.push("companies: no row updated for company_id")
        }
      } else if (!updated) {
        errors.push("companies: no row updated for company_id")
      }
    }

    // 2) Upsert company_settings as canonical persistence for the Settings form
    {
      const { data: settingsRow, error: settingsError } = await service
        .from("company_settings")
        .upsert(
          {
            company_id: companyId,
            settings_data: settingsData,
            fiscal_year_start: body.fiscal_year_start,
            default_currency: body.default_currency,
            timezone: body.timezone,
            language: body.language,
            updated_at: now,
          },
          { onConflict: "company_id" },
        )
        .select("company_id")
        .maybeSingle()

      if (settingsError) {
        // Some older schemas may lack upsert conflict target — try update then insert
        const { error: updateError } = await service
          .from("company_settings")
          .update({
            settings_data: settingsData,
            fiscal_year_start: body.fiscal_year_start,
            default_currency: body.default_currency,
            timezone: body.timezone,
            language: body.language,
            updated_at: now,
          })
          .eq("company_id", companyId)

        if (updateError) {
          const { error: insertError } = await service.from("company_settings").insert({
            company_id: companyId,
            settings_data: settingsData,
            fiscal_year_start: body.fiscal_year_start,
            default_currency: body.default_currency,
            timezone: body.timezone,
            language: body.language,
            created_at: now,
            updated_at: now,
          })
          if (insertError) errors.push(`company_settings: ${insertError.message}`)
        }
      } else if (!settingsRow) {
        // upsert without returning rows can still succeed; verify by reload below
      }
    }

    const bundle = await loadCompanyBundle(service, companyId)
    if (!bundle) {
      return NextResponse.json(
        { success: false, error: "Company not found after save", errors },
        { status: 404 },
      )
    }

    // Verify critical fields stuck in the merged response
    const saved = bundle.response
    const logoMismatch =
      logoUrl &&
      saved.logo_url !== logoUrl &&
      // data URLs can be huge; accept if both start the same
      !(typeof saved.logo_url === "string" && typeof logoUrl === "string" && saved.logo_url.slice(0, 64) === logoUrl.slice(0, 64))

    if (logoMismatch || (body.name && saved.name !== body.name)) {
      errors.push("Saved company snapshot did not reflect submitted values")
    }

    if (errors.length && (logoMismatch || !bundle.settings)) {
      return NextResponse.json(
        { success: false, error: errors.join("; "), errors, company: saved },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      company_id: companyId,
      company: saved,
      warnings: errors.length ? errors : undefined,
    })
  } catch (err) {
    return jsonError(err, "Failed to save company settings")
  }
}
