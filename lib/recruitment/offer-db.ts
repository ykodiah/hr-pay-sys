/**
 * Safe offer DB helpers — tolerate missing migration 088 columns.
 */

import { ensureOfferCodes } from "@/lib/recruitment/offer-sync"
import { buildOfferRespondUrl } from "@/lib/recruitment/public-origin"

const SCHEMA_ERR = /column|schema cache|does not exist|could not find/i

export function isSchemaCacheError(message?: string | null) {
  return Boolean(message && SCHEMA_ERR.test(message))
}

/** Core columns that existed before 088 */
export const OFFER_CORE_COLUMNS = new Set([
  "salary",
  "currency",
  "start_date",
  "benefits",
  "terms",
  "status",
  "offer_letter_text",
  "sent_at",
  "acceptance_deadline",
  "responded_at",
  "updated_at",
  "created_by",
])

/** Prefer short_code; fall back to offer id so /o links always work */
export function offerPublicCode(offer: { id?: string; short_code?: string | null }) {
  const code = String(offer.short_code || "").trim()
  if (code) return code.toUpperCase()
  return String(offer.id || "").trim()
}

export function offerRespondUrl(offer: { id?: string; short_code?: string | null }, origin?: string | null) {
  const code = offerPublicCode(offer)
  return code ? buildOfferRespondUrl(code, origin) : null
}

/**
 * Update offer row; if PostgREST rejects unknown columns, retry with core fields only.
 */
export async function safeUpdateOffer(
  client: any,
  offerId: string,
  companyId: string,
  patch: Record<string, unknown>,
) {
  const attempt = async (payload: Record<string, unknown>) => {
    return client
      .from("recruitment_offers")
      .update(payload)
      .eq("id", offerId)
      .eq("company_id", companyId)
      .select(
        `*, application:recruitment_applications(
          id, status, candidate:recruitment_candidates(candidate_name, email),
          job:recruitment_job_postings(title, department)
        )`,
      )
      .maybeSingle()
  }

  let { data, error } = await attempt(patch)
  if (!error) return { data, error: null as any, usedLegacy: false }

  if (!isSchemaCacheError(error.message)) {
    return { data: null, error, usedLegacy: false }
  }

  const legacy: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (OFFER_CORE_COLUMNS.has(k)) legacy[k] = v
  }
  if (!Object.keys(legacy).length) {
    return {
      data: null,
      error: {
        message:
          "Offer portal columns are missing. Run scripts/088_recruitment_offers_portal.sql in Supabase, then retry.",
      },
      usedLegacy: true,
    }
  }

  const retry = await attempt(legacy)
  return { data: retry.data, error: retry.error, usedLegacy: true }
}

/**
 * Ensure offer has short_code/response_token when schema supports it.
 * Returns the codes used (short_code may be offer id if column missing).
 */
export async function ensurePersistedOfferCodes(
  client: any,
  offer: { id: string; company_id: string; short_code?: string | null; response_token?: string | null },
) {
  const codes = ensureOfferCodes(offer)
  if (offer.short_code && offer.response_token) {
    return { ...codes, short_code: String(offer.short_code).toUpperCase(), persisted: true }
  }

  const { error } = await client
    .from("recruitment_offers")
    .update({
      short_code: codes.short_code,
      response_token: codes.response_token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offer.id)
    .eq("company_id", offer.company_id)

  if (error && isSchemaCacheError(error.message)) {
    // Schema not migrated — public portal can still use offer UUID
    return {
      short_code: offer.id,
      response_token: offer.response_token || offer.id,
      persisted: false,
    }
  }

  return { ...codes, short_code: codes.short_code.toUpperCase(), persisted: !error }
}

export async function loadOfferForPublic(client: any, codeRaw: string) {
  const code = String(codeRaw || "").trim()
  if (!code) return { offer: null, error: null }

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // 1) Exact id
  if (uuidRe.test(code)) {
    const byId = await client.from("recruitment_offers").select("*").eq("id", code).maybeSingle()
    if (byId.data) return { offer: byId.data, error: byId.error }
  }

  // 2) short_code (exact, then case-insensitive via eq upper)
  const upper = code.toUpperCase()
  let res = await client.from("recruitment_offers").select("*").eq("short_code", upper).maybeSingle()
  if (res.data) return { offer: res.data, error: res.error }

  if (!isSchemaCacheError(res.error?.message)) {
    res = await client.from("recruitment_offers").select("*").eq("short_code", code).maybeSingle()
    if (res.data) return { offer: res.data, error: res.error }
  }

  // 3) response_token
  if (!isSchemaCacheError(res.error?.message)) {
    const byToken = await client
      .from("recruitment_offers")
      .select("*")
      .eq("response_token", code)
      .maybeSingle()
    if (byToken.data) return { offer: byToken.data, error: byToken.error }
  }

  // 4) Prefix of id (backfill style codes from 088 SQL)
  if (code.length >= 8 && !isSchemaCacheError(res.error?.message)) {
    const { data: rows } = await client
      .from("recruitment_offers")
      .select("*")
      .limit(50)
    const match = (rows || []).find((o: any) =>
      String(o.id || "").replace(/-/g, "").toUpperCase().startsWith(upper.replace(/-/g, "")),
    )
    if (match) return { offer: match, error: null }
  }

  if (isSchemaCacheError(res.error?.message)) {
    // short_code column missing — try id-only already done; nothing else
    return {
      offer: null,
      error: {
        message:
          "Offer portal is not fully migrated. Ask HR to run scripts/088_recruitment_offers_portal.sql (or open the link that contains the full offer id).",
      },
    }
  }

  return { offer: null, error: res.error }
}
