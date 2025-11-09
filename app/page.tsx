import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, TrendingUp, CalendarDays } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">HR Payroll System</h1>
        <p className="text-xl text-muted-foreground">Comprehensive attendance management with AI-powered insights</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/clock">
            <Button size="lg" variant="outline">
              <Clock className="mr-2 h-5 w-5" />
              Employee Clock-In
            </Button>
          </Link>
          <Link href="/overtime">
            <Button size="lg" variant="outline">
              <TrendingUp className="mr-2 h-5 w-5" />
              Overtime Management
            </Button>
          </Link>
          <Link href="/shifts">
            <Button size="lg" variant="outline">
              <CalendarDays className="mr-2 h-5 w-5" />
              Shift Scheduling
            </Button>
          </Link>
          <Link href="/attendance">
            <Button size="lg">
              Go to Attendance
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
