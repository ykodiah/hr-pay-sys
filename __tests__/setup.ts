/**
 * Test Setup File
 * 
 * This file runs before all tests and sets up the test environment.
 * Run this with: npm test
 */

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
process.env.NODE_ENV = "test"

// Global test utilities
global.console = {
  ...console,
  // Suppress console output during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error output visible
  error: console.error,
}

// Mock fetch globally if needed
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn()
}

// Suppress React warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render") || args[0].includes("Not implemented: HTMLFormElement.prototype.submit"))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
