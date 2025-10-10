import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="full" size="lg" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>We've sent you a confirmation link to complete your registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Please check your email and click the confirmation link to activate your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Don't see the email? Check your spam folder or try signing up again.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/auth/login">
                <Button className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">© 2025 AkwaabaHRPay. Made with ❤️ in Ghana.</div>
      </div>
    </div>
  )
}
