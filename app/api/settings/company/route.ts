// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import {
  ensureArray,
  ensureUserCompanyBinding,
  isUnresolvedTenant,
  jsonError,
  resolveTenantContext,
} from "@/lib/settings/resolve-tenant"

type CompanyRow = Record<string, any>

function emptyCompanyResponse(email = "") {
  return {
    id: "",
    name: "",
    email_address: email,
    tax_id: "",
    ssnit_number: "",
    industry: "",
    status: "active",
    address: "",
    phone_number: "",
    divisions: [] as string[],
    departments: [] as string[],
    locations: [] as string[],
    logo_url: null as string | null,
  }
}

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
    email_address: String(pick("email_address", company.email_address || company.email || "")),
    tax_id: String(pick("tax_id", company.tax_id || "")),
    ssnit_number: String(pick("ssnit_number", company.ssnit_number || "")),
    industry: String(pick("industry", company.industry || "")),
    status: "active",
    address: String(pick("address", company.address || "")),
    phone_number: String(pick("phone_number", company.phone_number || company.phone || "")),
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

  let settings: any = null
  // Prefer company_id lookup (canonical). Fall back for legacy schemas.
  {
    const { data, error: settingsError } = await service
      .from("company_settings")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle()
    if (!settingsError) {
      settings = data
    } else {
      // Legacy: company_settings.id == companies.id, or settings_data embedded on companies
      const { data: byId } = await service.from("company_settings").select("*").eq("id", companyId).maybeSingle()
      settings = byId || null
      if (!settings && company.settings_data) {
        settings = { settings_data: company.settings_data, company_id: companyId }
      }
    }
  }

  return { company, settings: settings || null, response: buildCompanyResponse(company, settings || null) }
}

/** Persist settings_data — resilient to missing company_id column until 073 is applied. */
async function persistCompanySettingsRow(
  service: any,
  companyId: string,
  settingsData: Record<string, unknown>,
  extras: Record<string, unknown>,
  now: string,
): Promise<{ saved: boolean; warning?: string }> {
  const canonical = {
    company_id: companyId,
    settings_data: settingsData,
    ...extras,
    updated_at: now,
  }

  // 1) Upsert on company_id
  {
    const { error } = await service.from("company_settings").upsert(canonical, { onConflict: "company_id" })
    if (!error) return { saved: true }
    if (!/company_id|schema cache|PGRST204/i.test(String(error.message || ""))) {
      // try update/insert by company_id anyway
      const { error: updErr } = await service
        .from("company_settings")
        .update({ settings_data: settingsData, ...extras, updated_at: now })
        .eq("company_id", companyId)
      if (!updErr) return { saved: true }
    }
  }

  // 2) Legacy: row where id = companyId
  {
    const { data: existing } = await service.from("company_settings").select("id").eq("id", companyId).maybeSingle()
    if (existing?.id) {
      const { error } = await service
        .from("company_settings")
        .update({
          settings_data: settingsData,
          name: settingsData.name,
          tax_id: settingsData.tax_id,
          ssnit_number: settingsData.ssnit_number,
          industry: settingsData.industry,
          address: settingsData.address,
          phone: settingsData.phone_number,
          email: settingsData.email_address,
          logo: settingsData.logo_url,
          divisions: settingsData.divisions,
          departments: settingsData.departments,
          locations: settingsData.locations,
          updated_at: now,
        })
        .eq("id", companyId)
      if (!error) return { saved: true, warning: "Saved via legacy company_settings.id mapping. Run scripts/073_company_settings_and_payroll_hardening.sql." }
    } else {
      const { error } = await service.from("company_settings").insert({
        id: companyId,
        name: settingsData.name || "Company",
        tax_id: settingsData.tax_id || "",
        ssnit_number: settingsData.ssnit_number || "",
        industry: settingsData.industry || null,
        address: settingsData.address || null,
        phone: settingsData.phone_number || null,
        email: settingsData.email_address || null,
        logo: settingsData.logo_url || null,
        divisions: settingsData.divisions || [],
        departments: settingsData.departments || [],
        locations: settingsData.locations || [],
        settings_data: settingsData,
        company_id: companyId,
        created_at: now,
        updated_at: now,
      })
      if (!error) return { saved: true }
      // Retry without company_id / settings_data for very old schemas
      const { error: legacyErr } = await service.from("company_settings").insert({
        id: companyId,
        name: settingsData.name || "Company",
        tax_id: settingsData.tax_id || "PENDING",
        ssnit_number: settingsData.ssnit_number || "PENDING",
        industry: settingsData.industry || null,
        address: settingsData.address || null,
        phone: settingsData.phone_number || null,
        email: settingsData.email_address || null,
        logo: settingsData.logo_url || null,
        divisions: settingsData.divisions || [],
        departments: settingsData.departments || [],
        locations: settingsData.locations || [],
        created_at: now,
        updated_at: now,
      })
      if (!legacyErr) {
        return {
          saved: true,
          warning: "Saved company profile. Run scripts/073_company_settings_and_payroll_hardening.sql to enable full settings_data.",
        }
      }
    }
  }

  // 3) Last resort: embed settings_data on companies row
  {
    const { error } = await service
      .from("companies")
      .update({ settings_data: settingsData, updated_at: now })
      .eq("id", companyId)
    if (!error) {
      return {
        saved: true,
        warning: "Saved to companies.settings_data. Run scripts/073_company_settings_and_payroll_hardening.sql for company_settings.company_id.",
      }
    }
  }

  return {
    saved: false,
    warning:
      "company_settings: could not find the 'company_id' column. Run scripts/073_company_settings_and_payroll_hardening.sql in Supabase, then save again.",
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req, null, { allowUnresolved: true })
    if (ctx instanceof NextResponse) return ctx

    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({
        company: emptyCompanyResponse(),
        settings: null,
        needs_bootstrap: true,
      })
    }

    const { companyId, service } = ctx
    const bundle = await loadCompanyBundle(service, companyId)
    if (!bundle) {
      // Company id resolved but row missing — allow Company tab to recreate.
      return NextResponse.json({
        company: { ...emptyCompanyResponse(), id: companyId },
        settings: null,
        needs_bootstrap: true,
      })
    }

    return NextResponse.json({
      company: bundle.response,
      settings: bundle.settings,
      needs_bootstrap: false,
    })
  } catch (err) {
    return jsonError(err, "Failed to load company settings")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id || body.id || null, {
      allowUnresolved: true,
    })
    if (ctx instanceof NextResponse) return ctx

    const service = ctx.service
    const userId = ctx.userId
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

    let companyId: string | null = isUnresolvedTenant(ctx) ? null : ctx.companyId

    // First-time save: create the companies row, then bind the user to it.
    if (!companyId) {
      const insertPayload: Record<string, unknown> = {
        name: companyFields.name || "My Company",
        industry: companyFields.industry || null,
        tax_id: companyFields.tax_id || null,
        ssnit_number: companyFields.ssnit_number || null,
        email_address: companyFields.email_address || null,
        phone_number: companyFields.phone_number || null,
        address: companyFields.address || null,
        logo_url: logoUrl,
        created_at: now,
        updated_at: now,
      }

      let created: any = null
      let createError: any = null

      ;({ data: created, error: createError } = await service
        .from("companies")
        .insert(insertPayload)
        .select("id")
        .single())

      // Retry without optional columns some schemas lack.
      if (createError) {
        const minimal = {
          name: companyFields.name || "My Company",
          created_at: now,
          updated_at: now,
        }
        ;({ data: created, error: createError } = await service
          .from("companies")
          .insert(minimal)
          .select("id")
          .single())
      }

      if (createError || !created?.id) {
        return NextResponse.json(
          {
            success: false,
            error: createError?.message || "Failed to create company. Check companies table schema.",
          },
          { status: 500 },
        )
      }

      companyId = created.id

      // Best-effort fill of remaining fields after minimal insert.
      await service
        .from("companies")
        .update({
          ...companyFields,
          divisions,
          departments,
          locations,
          updated_at: now,
        })
        .eq("id", companyId)
    }

    await ensureUserCompanyBinding(service, userId, companyId)

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

    // 2) Settings snapshot (resilient to legacy company_settings without company_id)
    {
      const result = await persistCompanySettingsRow(
        service,
        companyId,
        settingsData,
        {
          fiscal_year_start: body.fiscal_year_start,
          default_currency: body.default_currency,
          timezone: body.timezone,
          language: body.language,
        },
        now,
      )
      settingsSaved = result.saved
      if (result.warning) warnings.push(result.warning)
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
