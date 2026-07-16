import { put } from "@vercel/blob"

const MAX_FALLBACK_BYTES = 1.5 * 1024 * 1024

/** Upload employee document bytes; prefer Vercel Blob, else data-URL for small files. */
export async function storeEmployeeDocumentFile(file: File | Blob, fileName: string) {
  const name = fileName || "document"
  const type = file.type || "application/octet-stream"
  const size = file.size

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`employee-docs/${Date.now()}-${name}`, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: type,
      })
      return { fileUrl: blob.url, storage: "blob" as const, fileContent: null as string | null }
    } catch (err) {
      console.warn("[employee-docs] Blob upload failed, falling back", err)
    }
  }

  if (size <= MAX_FALLBACK_BYTES) {
    const buf = Buffer.from(await file.arrayBuffer())
    const b64 = buf.toString("base64")
    const dataUrl = `data:${type};base64,${b64}`
    return { fileUrl: dataUrl, storage: "inline" as const, fileContent: dataUrl }
  }

  throw new Error(
    "File storage is not configured (BLOB_READ_WRITE_TOKEN) and file is too large for inline preview storage.",
  )
}
