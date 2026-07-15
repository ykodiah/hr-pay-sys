"use client"

import React, { ReactNode } from "react"
import { errorLogger } from "@/lib/error-handling/logger"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: "page" | "section" | "component"
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    try {
      await errorLogger.logClientError(error, {
        level: this.props.level || "component",
        componentStack: errorInfo.componentStack,
      })
    } catch (err) {
      console.error("Failed to log error:", err)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} level={this.props.level} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
  level?: "page" | "section" | "component"
}

function ErrorFallback({ error, onReset, level = "component" }: ErrorFallbackProps) {
  const isPageLevel = level === "page"
  const isSectionLevel = level === "section"

  if (isPageLevel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="inline-block p-4 bg-red-100 rounded-full">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            We&apos;re sorry for the inconvenience. An unexpected error has occurred. Please try again or contact support
            if the problem persists.
          </p>
          {error && process.env.NODE_ENV === "development" && (
            <details className="text-left bg-gray-50 p-4 rounded mb-6 text-sm">
              <summary className="cursor-pointer font-mono text-gray-700 font-medium">Error details</summary>
              <pre className="mt-2 overflow-auto text-gray-600 text-xs whitespace-pre-wrap break-words">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          <div className="space-y-2">
            <button
              onClick={onReset}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="block px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to homepage
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (isSectionLevel) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Section Error</h3>
            <p className="mt-1 text-sm text-red-700">
              This section encountered an error and could not be loaded.
            </p>
            {error && process.env.NODE_ENV === "development" && (
              <p className="mt-2 text-xs text-red-600 font-mono">{error.message}</p>
            )}
            <button
              onClick={onReset}
              className="mt-3 inline-flex px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-700 rounded">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm">An error occurred</span>
      <button onClick={onReset} className="text-xs font-medium underline hover:no-underline">
        Retry
      </button>
    </div>
  )
}
