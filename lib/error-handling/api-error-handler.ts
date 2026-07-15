import { NextRequest, NextResponse } from "next/server"
import { errorLogger } from "./logger"

export class ApiError extends Error {
  constructor(
    public statusCode: number = 500,
    public code: string = "INTERNAL_SERVER_ERROR",
    message: string = "Internal Server Error"
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function createErrorResponse(error: Error | ApiError, statusCode = 500) {
  const code = error instanceof ApiError ? error.code : "INTERNAL_SERVER_ERROR"
  const message = error.message || "An unexpected error occurred"

  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
    },
    { status: statusCode }
  )
}

export async function handleApiError(
  error: unknown,
  request: NextRequest,
  context?: Record<string, unknown>
): Promise<NextResponse> {
  let apiError = error instanceof ApiError ? error : new ApiError()

  // Log the error
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  await errorLogger.logServerError(errorMessage, {
    ...context,
    path: request.nextUrl.pathname,
    method: request.method,
    stack: errorStack,
  })

  return createErrorResponse(apiError, apiError.statusCode)
}

// Common API errors
export class ValidationError extends ApiError {
  constructor(message: string = "Validation failed") {
    super(400, "VALIDATION_ERROR", message)
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = "Authentication required") {
    super(401, "AUTHENTICATION_ERROR", message)
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = "Insufficient permissions") {
    super(403, "AUTHORIZATION_ERROR", message)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = "Resource conflict") {
    super(409, "CONFLICT", message)
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = "Rate limit exceeded") {
    super(429, "RATE_LIMIT_EXCEEDED", message)
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = "Internal server error") {
    super(500, "INTERNAL_SERVER_ERROR", message)
  }
}
