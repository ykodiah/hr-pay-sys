import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const AUTH_TAG_BYTES = 16
const IV_BYTES = 12

function getEncryptionKey() {
  const secret = process.env.COMMUNICATION_CREDENTIAL_SECRET
  if (!secret) {
    throw new Error(
      "COMMUNICATION_CREDENTIAL_SECRET is not set. Please configure a 32+ character secret for encrypting channel credentials."
    )
  }

  return createHash("sha256").update(secret).digest()
}

function serializeEncryptedPayload(iv: Buffer, authTag: Buffer, encrypted: Buffer) {
  return [iv, authTag, encrypted].map((buf) => buf.toString("base64")).join(".")
}

function deserializeEncryptedPayload(payload: string) {
  const parts = payload.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted credential payload format")
  }

  return {
    iv: Buffer.from(parts[0], "base64"),
    authTag: Buffer.from(parts[1], "base64"),
    encrypted: Buffer.from(parts[2], "base64")
  }
}

export type CredentialMap = Record<string, string>

export function encryptCredentials(secrets: CredentialMap) {
  const sanitizedEntries = Object.entries(secrets).filter(([, value]) => value !== undefined && value !== "")

  if (sanitizedEntries.length === 0) {
    throw new Error("No credential values provided to encrypt")
  }

  const payload = JSON.stringify(Object.fromEntries(sanitizedEntries))
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv)

  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return serializeEncryptedPayload(iv, authTag, encrypted)
}

export function decryptCredentials(payload: string | null): CredentialMap {
  if (!payload) {
    return {}
  }

  const { iv, authTag, encrypted } = deserializeEncryptedPayload(payload)
  if (iv.length !== IV_BYTES) {
    throw new Error("Invalid IV length for credential payload")
  }
  if (authTag.length !== AUTH_TAG_BYTES) {
    throw new Error("Invalid auth tag length for credential payload")
  }

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
  return JSON.parse(decrypted)
}

export function maskCredentialValue(value: string, visible = 4) {
  if (!value) return ""
  const safeVisible = Math.max(1, Math.min(visible, Math.floor(value.length / 2)))
  const start = value.slice(0, safeVisible)
  const end = value.slice(-safeVisible)
  return `${start}${"*".repeat(Math.max(4, value.length - safeVisible * 2))}${end}`
}

export function redactCredentialsMap(secrets: CredentialMap) {
  return Object.fromEntries(Object.entries(secrets).map(([key, val]) => [key, maskCredentialValue(val)]))
}

export function hasStoredCredentials(payload?: string | null) {
  return Boolean(payload && payload.length > 0)
}
