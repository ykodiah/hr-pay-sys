import { SignUpForm } from "@/components/auth/signup-form"
import { GraduationCap } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6">
            <GraduationCap className="h-8 w-8" />
            <span className="text-2xl font-bold">SchoolHub</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create Your School</h2>
          <p className="mt-2 text-sm text-gray-600">Set up your school management system in minutes</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
