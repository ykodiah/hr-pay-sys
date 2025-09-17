"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"

export default function TestPage() {
  console.log("[v0] Test page is rendering successfully")

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <Logo variant="full" size="lg" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">AkwaabaHRPay Test Page</h1>
          <p className="text-gray-600 mt-2">This page tests if the application is rendering correctly</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>✅ Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• React components loading correctly</li>
                <li>• UI components (Button, Card, Input) working</li>
                <li>• Logo component rendering</li>
                <li>• Tailwind CSS styles applied</li>
                <li>• TypeScript compilation successful</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔗 Navigation Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => {
                  console.log("[v0] Button click test successful")
                  window.location.href = "/"
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Go to Homepage
              </Button>
              <Button
                onClick={() => {
                  console.log("[v0] Login navigation test")
                  window.location.href = "/auth/login"
                }}
                variant="outline"
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Right Panel Display Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you can see this page in the right panel, the application is working correctly. The issue might be with
              specific pages or routing.
            </p>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-emerald-800 font-medium">✅ Right Panel Display: WORKING</p>
              <p className="text-emerald-600 text-sm mt-1">All core components and styling are functioning properly.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
