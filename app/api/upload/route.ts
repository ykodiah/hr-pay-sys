import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

const MAX_BYTES = 2 * 1024 * 1024
const MAX_INLINE_BYTES = 1.5 * 1024 * 1024

async function storeAsDataUrl(file: File) {
  if (file.size > MAX_INLINE_BYTES) {
    throw new Error("File is too large for inline storage. Configure BLOB_READ_WRITE_TOKEN.")
  }
  const buf = Buffer.from(await file.arrayBuffer())
  const b64 = buf.toString("base64")
  return `data:${file.type || "image/png"};base64,${b64}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File size must be less than 2MB" }, { status: 400 })
    }

    // Prefer Vercel Blob when configured; otherwise persist as a data URL so
    // company logos still survive save/reload without external storage.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`company-logos/${Date.now()}-${file.name}`, file, {
          access: "public",
          addRandomSuffix: true,
          contentType: file.type,
        })
        return NextResponse.json({ url: blob.url, storage: "blob" })
      } catch (err) {
        console.warn("[upload] Blob upload failed, falling back to inline data URL", err)
      }
    }

    const url = await storeAsDataUrl(file)
    return NextResponse.json({ url, storage: "inline" })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}
