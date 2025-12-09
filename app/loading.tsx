import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
