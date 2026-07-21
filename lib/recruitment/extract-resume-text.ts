/**
 * Extract plain text from uploaded CV/resume files for ATS AI screening.
 * Supports PDF (pdfjs), DOCX (mammoth), plain text, and data-URL payloads.
 */

export type ResumeExtractResult = {
  text: string
  method: "pdf" | "docx" | "text" | "data-url-text" | "data-url-pdf" | "data-url-docx" | "empty" | "unsupported"
  chars: number
  warning?: string
}

const MAX_CHARS = 50000

function cleanText(raw: string) {
  return raw
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, MAX_CHARS)
}

function guessMime(filename?: string | null, mime?: string | null) {
  const name = String(filename || "").toLowerCase()
  const type = String(mime || "").toLowerCase()
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf"
  if (
    type.includes("wordprocessingml") ||
    type.includes("msword") ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    return name.endsWith(".doc") && !name.endsWith(".docx") ? "doc" : "docx"
  }
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) return "text"
  return type || "unknown"
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Prefer legacy build for Node / serverless (no DOM worker)
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs")
  if (pdfjs.GlobalWorkerOptions) {
    try {
      // Workerless mode for API routes
      pdfjs.GlobalWorkerOptions.workerSrc = undefined
    } catch {
      /* ignore */
    }
  }

  const data = new Uint8Array(buffer)
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableWorker: true,
    isEvalSupported: false,
  })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  const maxPages = Math.min(pdf.numPages || 0, 30)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const line = (content.items || [])
      .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
      .filter(Boolean)
      .join(" ")
    if (line.trim()) pages.push(line.trim())
  }
  return pages.join("\n")
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mod: any = await import("mammoth")
  const mammoth = mod.default || mod
  const result = await mammoth.extractRawText({ buffer })
  return String(result.value || "")
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl)
  if (!match) return null
  const mime = match[1] || "application/octet-stream"
  const isBase64 = Boolean(match[2])
  const payload = match[3] || ""
  try {
    const buffer = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8")
    return { mime, buffer }
  } catch {
    return null
  }
}

export async function extractResumeTextFromBuffer(
  buffer: Buffer,
  opts?: { filename?: string | null; mimeType?: string | null },
): Promise<ResumeExtractResult> {
  if (!buffer?.length) {
    return { text: "", method: "empty", chars: 0, warning: "Empty file" }
  }

  const kind = guessMime(opts?.filename, opts?.mimeType)

  try {
    if (kind === "pdf") {
      const text = cleanText(await extractPdfText(buffer))
      return {
        text,
        method: "pdf",
        chars: text.length,
        warning: text.length < 40 ? "Very little text extracted — PDF may be scanned/image-based" : undefined,
      }
    }

    if (kind === "docx") {
      const text = cleanText(await extractDocxText(buffer))
      return { text, method: "docx", chars: text.length }
    }

    if (kind === "text") {
      const text = cleanText(buffer.toString("utf8"))
      return { text, method: "text", chars: text.length }
    }

    // Heuristic: try PDF then DOCX if mime unknown
    try {
      const text = cleanText(await extractPdfText(buffer))
      if (text.length > 40) return { text, method: "pdf", chars: text.length }
    } catch {
      /* continue */
    }
    try {
      const text = cleanText(await extractDocxText(buffer))
      if (text.length > 40) return { text, method: "docx", chars: text.length }
    } catch {
      /* continue */
    }

    return {
      text: "",
      method: "unsupported",
      chars: 0,
      warning: `Unsupported resume type (${kind}). Upload PDF or DOCX for ATS screening.`,
    }
  } catch (err) {
    return {
      text: "",
      method: kind === "pdf" ? "pdf" : kind === "docx" ? "docx" : "unsupported",
      chars: 0,
      warning: err instanceof Error ? err.message : "Resume text extraction failed",
    }
  }
}

export async function extractResumeTextFromFile(
  file: File,
): Promise<ResumeExtractResult> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return extractResumeTextFromBuffer(buffer, {
    filename: file.name,
    mimeType: file.type,
  })
}

/** Resolve readable resume text from stored candidate fields / URLs / data URLs. */
export async function resolveResumeTextForScreening(input: {
  resumeText?: string | null
  resumeContent?: string | null
  resumeUrl?: string | null
  resumeFilename?: string | null
  resumeMimeType?: string | null
}): Promise<ResumeExtractResult> {
  // Prefer dedicated extracted text
  const dedicated = String(input.resumeText || "").trim()
  if (dedicated && !dedicated.startsWith("data:") && dedicated.length > 40) {
    return { text: cleanText(dedicated), method: "text", chars: dedicated.length }
  }

  const content = String(input.resumeContent || "").trim()
  if (content && !content.startsWith("data:") && content.length > 40) {
    return { text: cleanText(content), method: "text", chars: content.length }
  }

  if (content.startsWith("data:")) {
    const parsed = parseDataUrl(content)
    if (parsed) {
      const extracted = await extractResumeTextFromBuffer(parsed.buffer, {
        filename: input.resumeFilename,
        mimeType: parsed.mime || input.resumeMimeType,
      })
      if (extracted.chars > 0) {
        return {
          ...extracted,
          method:
            extracted.method === "pdf"
              ? "data-url-pdf"
              : extracted.method === "docx"
                ? "data-url-docx"
                : "data-url-text",
        }
      }
      return extracted
    }
  }

  const url = String(input.resumeUrl || "").trim()
  if (url.startsWith("data:")) {
    const parsed = parseDataUrl(url)
    if (parsed) {
      return extractResumeTextFromBuffer(parsed.buffer, {
        filename: input.resumeFilename,
        mimeType: parsed.mime || input.resumeMimeType,
      })
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        return {
          text: "",
          method: "empty",
          chars: 0,
          warning: `Could not download resume (${res.status})`,
        }
      }
      const mime = res.headers.get("content-type") || input.resumeMimeType
      const buffer = Buffer.from(await res.arrayBuffer())
      return extractResumeTextFromBuffer(buffer, {
        filename: input.resumeFilename,
        mimeType: mime,
      })
    } catch (err) {
      return {
        text: "",
        method: "empty",
        chars: 0,
        warning: err instanceof Error ? err.message : "Resume download failed",
      }
    }
  }

  return {
    text: dedicated || (content.startsWith("data:") ? "" : content),
    method: "empty",
    chars: dedicated.length,
    warning: "No extractable resume text available",
  }
}
