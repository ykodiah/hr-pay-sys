import { type NextRequest, NextResponse } from "next/server"
import { storeEmployeeDocumentFile } from "@/lib/employees/document-upload"

const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
])

function isAllowedFile(file: File) {
  const name = (file.name || "").toLowerCase()
  if (ALLOWED_MIME.has(file.type)) return true
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif")
  )
}

/** Upload HR / policy documents (PDF, DOC/DOCX, text, images). */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, DOC, DOCX, TXT, or image files." },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    const stored = await storeEmployeeDocumentFile(file, file.name || "document")
    return NextResponse.json({
      url: stored.fileUrl,
      storage: stored.storage,
      content: stored.fileContent,
    })
  } catch (error) {
    console.error("[upload/document]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}
