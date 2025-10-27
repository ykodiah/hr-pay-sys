import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileQuestion } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileQuestion className="h-6 w-6 text-gray-600" />
            <CardTitle>Page Not Found</CardTitle>
          </div>
          <CardDescription>The page you&apos;re looking for doesn't exist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            The page you&apos;re trying to access may have been moved, deleted, or never existed.
          </p>
          <div className="flex flex-col space-y-2">
            <Link href="/">
              <Button className="w-full">Go to homepage</Button>
            </Link>
            <Link href="/app">
              <Button variant="outline" className="w-full bg-transparent">
                Go to dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
