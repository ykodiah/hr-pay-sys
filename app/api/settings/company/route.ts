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
  const logoFromSettings = pick<string | null>("logo_url", null)
  const logoFromCompany = typeof company.logo_url === "string" ? company.logo_url : null
  const resolvedLogo =
    logoFromSettings !== null && logoFromSettings !== undefined ? logoFromSettings : logoFromCompany

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

    const warnings: string[] = []
    let companiesSaved = false
    let settingsSaved = false

    // 1) Best-effort companies update (core fields, then with org arrays)
    {
      const { error: coreError } = await service.from("companies").update(companyFields).eq("id", companyId)
      if (coreError) {
        warnings.push(`companies: ${coreError.message}`)
      } else {
        companiesSaved = true
        const { error: arrayError } = await service
          .from("companies")
          .update({ divisions, departments, locations, updated_at: now })
          .eq("id", companyId)
        if (arrayError) warnings.push(`companies.org_lists: ${arrayError.message}`)
      }
    }

    // 2) Canonical settings snapshot
    {
      const { error: upsertError } = await service.from("company_settings").upsert(
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

      if (!upsertError) {
        settingsSaved = true
      } else {
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

        if (!updateError) {
          settingsSaved = true
        } else {
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
          if (insertError) warnings.push(`company_settings: ${insertError.message}`)
          else settingsSaved = true
        }
      }
    }

    if (!companiesSaved && !settingsSaved) {
      return NextResponse.json(
        {
          success: false,
          error: warnings.join("; ") || "Failed to save company settings",
          warnings,
        },
        { status: 500 },
      )
    }

    const bundle = await loadCompanyBundle(service, companyId)
    if (!bundle) {
      return NextResponse.json({ success: false, error: "Company not found after save", warnings }, { status: 404 })
    }

    // Soft verification only — never turn a successful write into a red error toast.
    return NextResponse.json({
      success: true,
      company_id: companyId,
      company: bundle.response,
      warnings: warnings.length ? warnings : undefined,
    })
  } catch (err) {
    return jsonError(err, "Failed to save company settings")
  }
}
