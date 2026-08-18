"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EmployeeAIChatbox } from "@/components/employee-ai-chatbox"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import {
  usePortalMe,
  usePortalResource,
  portalMutate,
  relativeTime,
} from "@/lib/self-service/use-portal"
import {
  User,
  FileText,
  Calendar,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  Home,
  Target,
  Star,
  BookOpen,
  Award,
  ChevronDown,
  AlertTriangle,
  DoorOpen,
  Clock,
  Menu,
  ShieldCheck,
  CheckCheck,
  Loader2,
} from "lucide-react"

const NAV_SECTIONS = [
  {
    title: "Personal",
    items: [
      { name: "Dashboard", href: "/self-service", icon: Home },
      { name: "My Profile", href: "/self-service/profile", icon: User },
      { name: "Payslips", href: "/self-service/payslips", icon: FileText },
    ],
  },
  {
    title: "Performance",
    items: [
      { name: "My Goals", href: "/self-service/goals", icon: Target },
      { name: "Performance Reviews", href: "/self-service/performance", icon: Star },
    ],
  },
  {
    title: "Learning",
    items: [
      { name: "My Courses", href: "/self-service/courses", icon: BookOpen },
      { name: "Certifications", href: "/self-service/certifications", icon: Award },
    ],
  },
  {
    title: "Requests",
    items: [
      { name: "Leave Requests", href: "/self-service/leave", icon: Calendar },
      { name: "Overtime", href: "/self-service/overtime", icon: Clock },
      { name: "Loans", href: "/self-service/loans", icon: CreditCard },
      { name: "Grievances", href: "/self-service/grievances", icon: AlertTriangle },
    ],
  },
  {
    title: "Support",
    items: [
      { name: "Exit Process", href: "/self-service/exit-process", icon: DoorOpen },
      { name: "Account Settings", href: "/self-service/settings", icon: Settings },
    ],
  },
]

function initials(name?: string | null) {
  if (!name) return "EM"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-6 p-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          {section.items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-emerald-50 font-medium text-emerald-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const { data: me, error, isLoading } = usePortalMe()
  const { data: inbox, mutate: refreshInbox } = usePortalResource<{
    notifications: any[]
    unread: number
  }>(me ? "/api/self-service/notifications" : null)

  const employee = me?.employee
  const notifications = inbox?.notifications || []
  const unread = inbox?.unread || 0

  const displayName = employee?.full_name || "Employee"
  const avatarInitials = useMemo(() => initials(displayName), [displayName])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await createClient().auth.signOut()
    } catch {
      // ignore — still clear local state
    }
    document.cookie = "demo-session=; path=/; max-age=0"
    window.location.href = "/auth/login"
  }

  const markRead = async (id?: string) => {
    await portalMutate("/api/self-service/notifications", "PATCH", id ? { id } : {})
    refreshInbox()
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Portal unavailable</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-3">
              <span>{error.message}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push("/auth/login")}>
                  Sign in again
                </Button>
                <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-0">
                <SheetTitle className="sr-only">Employee portal navigation</SheetTitle>
                <div className="flex items-center gap-2 border-b p-4">
                  <Logo variant="icon" size="sm" />
                  <span className="text-lg font-bold">Employee Portal</span>
                </div>
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/self-service" className="flex items-center gap-2">
              <Logo variant="icon" size="sm" />
              <span className="text-lg font-bold text-slate-900">AkwaabaHRPay</span>
            </Link>
            <span className="hidden text-sm text-slate-500 sm:inline">
              {me?.company_name ? `${me.company_name} · Employee Portal` : "Employee Portal"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {me?.can_access_admin && (
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 sm:inline-flex"
                onClick={() => router.push("/app")}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin portal
              </Button>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs">
                      {unread}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <p className="text-xs text-slate-500">
                      {unread > 0 ? `${unread} unread` : "You are all caught up"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => markRead()}>
                      <CheckCheck className="h-4 w-4" />
                      Mark all
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markRead(n.id)
                          if (n.action_url) router.push(n.action_url)
                        }}
                        className={`flex w-full flex-col items-start gap-1 border-b p-4 text-left transition-colors hover:bg-slate-50 ${
                          n.read_at ? "" : "bg-emerald-50/40"
                        }`}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900">{n.title}</span>
                          {!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                        </div>
                        <span className="text-sm text-slate-600">{n.message}</span>
                        <span className="text-xs text-slate-400">{relativeTime(n.created_at)}</span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee?.profile_picture || undefined} alt="" />
                    <AvatarFallback>{avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium leading-tight text-slate-900">
                      {isLoading ? "Loading…" : displayName}
                    </p>
                    <p className="text-xs leading-tight text-slate-500">
                      {employee?.position || employee?.employee_id || ""}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {me?.portal?.login_email || employee?.corporate_email || ""}
                  </p>
                  {employee?.employee_id && (
                    <p className="mt-1 text-xs text-slate-400">Staff ID {employee.employee_id}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/self-service/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/self-service/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account settings
                </DropdownMenuItem>
                {me?.can_access_admin && (
                  <DropdownMenuItem onClick={() => router.push("/app")}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Switch to admin portal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-rose-600 focus:text-rose-600"
                >
                  {signingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {me?.portal?.must_change_password && pathname !== "/self-service/settings" && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-900">
              You are still using the temporary password issued by HR. Set your own password now.
            </p>
            <Button size="sm" onClick={() => router.push("/self-service/settings")}>
              Change password
            </Button>
          </div>
        </div>
      )}

      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
          <div className="sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto">
            <NavLinks />
            <div className="border-t p-4">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full justify-start text-slate-700 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>

      <EmployeeAIChatbox />
    </div>
  )
}
