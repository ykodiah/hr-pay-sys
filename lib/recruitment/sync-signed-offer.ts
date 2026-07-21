/**
 * When Candidate + HR Head have both signed an offer letter,
 * file a copy into Document Vault and link/complete the contract onboarding task.
 */

import { persistVaultDocument } from "@/lib/employees/persist-vault-document"

function bothSigned(offer: any) {
  return Boolean(
    (offer.candidate_signature_name || offer.candidate_signed_at) &&
      (offer.hr_signature_name || offer.hr_signed_at || offer.signatory_name),
  )
}

export async function syncSignedOfferToOnboarding(
  client: any,
  offer: any,
): Promise<{ vaultId: string | null; taskId: string | null; synced: boolean; warning?: string }> {
  if (!offer?.id || !offer.company_id) {
    return { vaultId: null, taskId: null, synced: false, warning: "Missing offer" }
  }

  // Prefer explicit HR signature; fall back to signatory_name from letter editor
  const hrName = offer.hr_signature_name || offer.signatory_name
  const candidateName = offer.candidate_signature_name || offer.candidate_name_snapshot
  if (!candidateName || !hrName) {
    return { vaultId: offer.signed_letter_vault_id || null, taskId: null, synced: false }
  }

  // Find checklist for this offer / application
  let checklist: any = null
  if (offer.id) {
    const { data } = await client
      .from("recruitment_onboarding_checklists")
      .select("id, company_id, employee_id, candidate_name, offer_id, application_id")
      .eq("offer_id", offer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    checklist = data
  }
  if (!checklist && offer.application_id) {
    const { data } = await client
      .from("recruitment_onboarding_checklists")
      .select("id, company_id, employee_id, candidate_name, offer_id, application_id")
      .eq("application_id", offer.application_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    checklist = data
  }

  const letterText = String(offer.offer_letter_text || "").trim()
  const signedBlock = [
    letterText,
    "",
    "— — — SIGNATURES — — —",
    `Candidate: ${candidateName}`,
    offer.candidate_signed_at ? `Signed at: ${offer.candidate_signed_at}` : "",
    `HR Head: ${hrName}${offer.signatory_title ? ` (${offer.signatory_title})` : ""}`,
    offer.hr_signed_at ? `Signed at: ${offer.hr_signed_at}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const dataUrl = `data:text/plain;charset=utf-8;base64,${Buffer.from(signedBlock, "utf8").toString("base64")}`
  const fileName = `Signed-Offer-${(offer.candidate_name_snapshot || "Hire").replace(/\s+/g, "-")}.txt`

  let vaultId = offer.signed_letter_vault_id || null
  if (!vaultId) {
    const vault = await persistVaultDocument(client, {
      employee_id: checklist?.employee_id || null,
      employee_name: checklist?.candidate_name || offer.candidate_name_snapshot || null,
      document_type: "employment-contract",
      file_name: fileName,
      file_size: Buffer.byteLength(signedBlock, "utf8"),
      file_type: "text/plain",
      file_url: dataUrl,
      status: "approved",
      notes: `Signed offer letter · checklist ${checklist?.id || "pending"}`,
      source: "recruitment-offer",
      category: "employment-contract",
      company_id: offer.company_id,
      access_level: "confidential",
      signature_status: "signed",
    })
    vaultId = vault.id

    // Best-effort checklist / task columns on vault (091)
    if (vaultId && checklist?.id) {
      await client
        .from("document_vault")
        .update({
          checklist_id: checklist.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vaultId)
    }

    await client
      .from("recruitment_offers")
      .update({
        signed_letter_vault_id: vaultId,
        hr_signature_name: hrName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offer.id)
  }

  let taskId: string | null = null
  if (checklist?.id) {
    const { data: tasks } = await client
      .from("recruitment_onboarding_tasks")
      .select("*")
      .eq("checklist_id", checklist.id)

    const contractTask = (tasks || []).find((t: any) => {
      const title = String(t.title || "").toLowerCase()
      return title.includes("sign employment") || title.includes("contract")
    })

    if (contractTask) {
      taskId = contractTask.id
      await client
        .from("recruitment_onboarding_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          attachment_url: dataUrl,
          attachment_name: fileName,
          vault_document_id: vaultId,
          document_type: "employment-contract",
          response_data: {
            ...(contractTask.response_data || {}),
            candidate_signature_name: candidateName,
            hr_signature_name: hrName,
            signed_at: new Date().toISOString(),
            offer_id: offer.id,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", contractTask.id)

      // Recompute checklist progress
      const { data: allTasks } = await client
        .from("recruitment_onboarding_tasks")
        .select("status, stage")
        .eq("checklist_id", checklist.id)
      const total = allTasks?.length ?? 0
      const done = (allTasks ?? []).filter(
        (t: any) => t.status === "completed" || t.status === "skipped",
      ).length
      const progress = total ? Math.round((done / total) * 100) : 0
      const pending = (allTasks ?? []).find(
        (t: any) => t.status !== "completed" && t.status !== "skipped",
      )
      await client
        .from("recruitment_onboarding_checklists")
        .update({
          progress,
          status: progress >= 100 ? "completed" : "in_progress",
          stage: progress >= 100 ? "completed" : pending?.stage || "documents",
          updated_at: new Date().toISOString(),
        })
        .eq("id", checklist.id)
    }
  }

  return {
    vaultId,
    taskId,
    synced: Boolean(vaultId),
    warning: !checklist ? "Onboarding checklist not found yet — vault copy saved on offer" : undefined,
  }
}

export { bothSigned }
