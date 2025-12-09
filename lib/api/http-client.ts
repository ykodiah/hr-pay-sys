const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "")

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

type RequestOptions = RequestInit & {
  parse?: "json" | "text" | "raw"
}

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

export async function httpRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { parse = "json", headers, ...rest } = options
  const target = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`

  const response = await fetch(target, {
    ...rest,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
  })

  let payload: any = null

  try {
    if (parse === "json") {
      payload = await response.json()
    } else if (parse === "text") {
      payload = await response.text()
    } else {
      payload = response
    }
  } catch (error) {
    // ignore body parsing errors for empty responses
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload?.error ? payload.error : response.statusText
    throw new ApiError(message || "Request failed", response.status, payload)
  }

  return payload as T
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
