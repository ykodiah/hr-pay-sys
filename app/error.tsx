"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("[v0] Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>An error occurred while loading the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-mono">{error.message || "Unknown error"}</p>
            {error.digest && <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>}
          </div>
          <div className="flex flex-col space-y-2">
            <Button onClick={reset} className="w-full">
              Try again
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
              Go to homepage
            </Button>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>If this problem persists:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Check your internet connection</li>
              <li>Clear your browser cache</li>
              <li>Try a different browser</li>
              <li>Contact support if the issue continues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
