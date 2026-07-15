import { createClient } from "@/lib/supabase/server"

export type ErrorLevel = "info" | "warning" | "error" | "critical"

export interface ErrorLog {
  id?: string
  level: ErrorLevel
  message: string
  context?: Record<string, unknown>
  stack?: string
  userId?: string
  url?: string
  timestamp?: string
  resolved?: boolean
}

export class ErrorLogger {
  private static instance: ErrorLogger
  private initialized = false

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  async initialize() {
    if (this.initialized) return
    this.initialized = true
  }

  async logError(error: ErrorLog): Promise<void> {
    try {
      const client = await createClient()

      // Check if table exists by attempting to insert
      const { error: insertError } = await client.from("error_logs").insert([
        {
          level: error.level,
          message: error.message,
          context: error.context,
          stack: error.stack,
          user_id: error.userId,
          url: error.url,
          created_at: error.timestamp || new Date().toISOString(),
          resolved: false,
        },
      ])

      if (insertError) {
        console.error("Failed to log error to database:", insertError)
      }
    } catch (err) {
      // Fallback to console if database logging fails
      console.error("Error logging failed:", err)
    }
  }

  async logClientError(error: Error | string, context?: Record<string, unknown>): Promise<void> {
    const message = typeof error === "string" ? error : error.message
    const stack = error instanceof Error ? error.stack : undefined

    await this.logError({
      level: "error",
      message,
      stack,
      context: {
        ...context,
        source: "client",
      },
      url: typeof window !== "undefined" ? window.location.href : undefined,
    })
  }

  async logServerError(error: Error | string, context?: Record<string, unknown>): Promise<void> {
    const message = typeof error === "string" ? error : error.message
    const stack = error instanceof Error ? error.stack : undefined

    await this.logError({
      level: "error",
      message,
      stack,
      context: {
        ...context,
        source: "server",
      },
    })
  }

  async logWarning(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.logError({
      level: "warning",
      message,
      context: {
        ...context,
        source: "application",
      },
    })
  }

  async logCritical(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.logError({
      level: "critical",
      message,
      context: {
        ...context,
        source: "application",
      },
    })

    // Send alert for critical errors
    // This could integrate with your notification system
  }

  async getErrorLogs(
    limit = 100,
    level?: ErrorLevel
  ): Promise<{ data: ErrorLog[] | null; error: unknown } | null> {
    try {
      const client = await createClient()

      let query = client.from("error_logs").select("*").order("created_at", { ascending: false })

      if (level) {
        query = query.eq("level", level)
      }

      query = query.limit(limit)

      return await query
    } catch (err) {
      console.error("Failed to fetch error logs:", err)
      return null
    }
  }

  async markErrorAsResolved(errorId: string): Promise<void> {
    try {
      const client = await createClient()

      await client.from("error_logs").update({ resolved: true }).eq("id", errorId)
    } catch (err) {
      console.error("Failed to mark error as resolved:", err)
    }
  }
}

export const errorLogger = ErrorLogger.getInstance()
