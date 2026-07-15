export * from "./logger"
export * from "./api-error-handler"

export type { ErrorLog, ErrorLevel } from "./logger"

import { errorLogger } from "./logger"

// Initialize error logger on app start
export async function initializeErrorHandling() {
  try {
    await errorLogger.initialize()
  } catch (err) {
    console.error("Failed to initialize error handling:", err)
  }
}
