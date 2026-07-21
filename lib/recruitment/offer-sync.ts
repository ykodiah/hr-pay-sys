/**
 * Sync recruitment_applications (+ history + offer events) when an offer status changes.
 */

import { generateJobShortCode } from "@/lib/recruitment/short-code"

export type OfferSyncAction = "send" | "accept" | "reject" | "withdraw" | "expire"

const APP_STATUS: Record<OfferSyncAction, string | null> = {
  send: "offer",
  accept: "hired",
  reject: "rejected",
  withdraw: "withdrawn",
  expire: "offer",
}

export async function logOfferEvent(
  client: any,
  input: {
    companyId: string
    offerId: string
    applicationId?: string | null
    eventType: string
    actorType?: string | null
    actorId?: string | null
    actorLabel?: string | null
    fromStatus?: string | null
    toStatus?: string | null
    notes?: string | null
    payload?: Record<string, unknown>
  },
) {
  try {
    await client.from("recruitment_offer_events").insert({
      company_id: input.companyId,
      offer_id: input.offerId,
      application_id: input.applicationId || null,
      event_type: input.eventType,
      actor_type: input.actorType || null,
      actor_id: input.actorId || null,
      actor_label: input.actorLabel || null,
      from_status: input.fromStatus || null,
      to_status: input.toStatus || null,
      notes: input.notes || null,
      payload: input.payload || {},
    })
  } catch (err) {
    console.warn("[offer-sync] event log skipped", err)
  }
}

export async function syncApplicationForOfferAction(
  client: any,
  input: {
    action: OfferSyncAction
    applicationId?: string | null
    actorId?: string | null
    notes?: string | null
  },
) {
  if (!input.applicationId) return null
  const nextStatus = APP_STATUS[input.action]
  if (!nextStatus) return null

  const { data: app } = await client
    .from("recruitment_applications")
    .select("id, status")
    .eq("id", input.applicationId)
    .maybeSingle()

  if (!app) return null
  if (app.status === nextStatus) return app

  const { data: updated } = await client
    .from("recruitment_applications")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", input.applicationId)
    .select("id, status")
    .maybeSingle()

  await client.from("recruitment_application_history").insert({
    application_id: input.applicationId,
    from_status: app.status,
    to_status: nextStatus,
    changed_by: input.actorId || null,
    notes: input.notes || `Offer ${input.action}`,
  })

  return updated
}

export function ensureOfferCodes(existing?: { short_code?: string | null; response_token?: string | null }) {
  return {
    short_code: existing?.short_code || generateJobShortCode(8),
    response_token: existing?.response_token || `${generateJobShortCode(12)}${generateJobShortCode(12)}`,
  }
}

export function asBenefitsList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean)
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}
