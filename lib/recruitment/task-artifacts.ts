/** Which onboarding tasks need typed fields and/or file uploads. */

export type TaskFieldDef = {
  key: string
  label: string
  type: "text" | "email" | "tel" | "textarea" | "bank"
  required?: boolean
  placeholder?: string
}

export type TaskArtifactConfig = {
  requiresUpload: boolean
  uploadLabel?: string
  documentType?: string
  fields: TaskFieldDef[]
  /** Linked to offer Candidate + HR signatures */
  linkedOfferSignature?: boolean
}

export function getOnboardingTaskArtifactConfig(task: {
  title?: string | null
  stage?: string | null
  description?: string | null
  document_type?: string | null
}): TaskArtifactConfig {
  const title = String(task.title || "").toLowerCase()
  const stage = String(task.stage || "").toLowerCase()

  if (title.includes("employee information") || title.includes("tax form")) {
    return {
      requiresUpload: true,
      uploadLabel: "Ghana Card / ID / tax form copy",
      documentType: task.document_type || "ghana-card",
      fields: [
        { key: "full_legal_name", label: "Full legal name", type: "text", required: true },
        { key: "phone", label: "Phone", type: "tel", required: true },
        { key: "emergency_contact", label: "Emergency contact name & phone", type: "text", required: true },
        {
          key: "ghana_card_number",
          label: "Ghana Card number",
          type: "text",
          required: true,
          placeholder: "GHA-XXXXXXXXX-X",
        },
      ],
    }
  }

  if (title.includes("sign employment") || title.includes("contract")) {
    return {
      requiresUpload: false,
      linkedOfferSignature: true,
      documentType: task.document_type || "employment-contract",
      fields: [],
    }
  }

  if (title.includes("payroll") || title.includes("ssnit") || title.includes("banking")) {
    return {
      requiresUpload: false,
      documentType: task.document_type || "bank-details",
      fields: [
        { key: "bank_name", label: "Bank name", type: "bank", required: true },
        { key: "account_number", label: "Account number", type: "text", required: true },
        { key: "account_name", label: "Account name", type: "text", required: true },
        { key: "ssnit_number", label: "SSNIT number", type: "text", required: true },
      ],
    }
  }

  if (title.includes("welcome") || stage === "welcome") {
    return {
      requiresUpload: false,
      fields: [
        {
          key: "logistics_notes",
          label: "First-day logistics notes",
          type: "textarea",
          placeholder: "Location, dress code, who to meet…",
        },
      ],
    }
  }

  if (title.includes("orientation")) {
    return {
      requiresUpload: false,
      fields: [
        {
          key: "orientation_notes",
          label: "Orientation session notes",
          type: "textarea",
        },
      ],
    }
  }

  if (title.includes("day-one") || title.includes("check-in") || stage === "day_one") {
    return {
      requiresUpload: false,
      fields: [
        {
          key: "checkin_notes",
          label: "Day-one check-in notes / 30-day goals",
          type: "textarea",
        },
      ],
    }
  }

  if (stage === "documents" || stage === "accounts") {
    return {
      requiresUpload: true,
      uploadLabel: "Upload supporting document",
      documentType: task.document_type || "onboarding-document",
      fields: [{ key: "notes", label: "Notes", type: "textarea" }],
    }
  }

  return { requiresUpload: false, fields: [] }
}

export function validateTaskArtifactInput(
  config: TaskArtifactConfig,
  fields: Record<string, string>,
  hasFile: boolean,
) {
  const missing: string[] = []
  for (const field of config.fields) {
    if (field.required && !String(fields[field.key] || "").trim()) {
      missing.push(field.label)
    }
  }
  if (config.requiresUpload && !hasFile && !config.linkedOfferSignature) {
    // Upload required only when no prior attachment — caller can pass hasFile=true if already attached
    missing.push(config.uploadLabel || "Document upload")
  }
  return missing
}
