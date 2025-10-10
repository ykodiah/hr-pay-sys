import { Logo } from "@/components/logo"

export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <Logo variant="full" size="lg" />
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
