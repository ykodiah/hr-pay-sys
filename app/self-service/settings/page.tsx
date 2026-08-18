"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Bell, Shield, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { fetcher, patchJson, postJson, relativeTime } from "@/lib/self-service/use-portal"
import { PageHeader, StatusBadge, LoadingBlock, ErrorBlock, EmptyState } from "@/components/self-service/portal-ui"

const PREF_FLAGS = [
  { key: "payroll_notifications", label: "Payroll updates", hint: "Payslip released, salary changes" },
  { key: "leave_notifications", label: "Leave updates", hint: "Approvals, rejections, balance changes" },
  { key: "attendance_alerts", label: "Attendance alerts", hint: "Missed clock-ins and corrections" },
  { key: "promotion_notifications", label: "Promotions and reviews", hint: "Performance and progression news" },
  { key: "system_maintenance_alerts", label: "System notices", hint: "Planned downtime and maintenance" },
  { key: "email_digest", label: "Email digest", hint: "A single daily summary email" },
  { key: "sms_alerts", label: "SMS alerts", hint: "Text messages for urgent items" },
  { key: "push_notifications", label: "Push notifications", hint: "Browser and mobile push" },
] as const

type Prefs = Record<string, boolean>

type AccountResponse = {
  account: {
    login_email?: string | null
    status?: string | null
    must_change_password?: boolean | null
    last_login_at?: string | null
    can_access_admin?: boolean | null
  }
  preferences: Prefs
  activity: { action: string; detail: string | null; created_at: string; ip_address: string | null }[]
}

export default function SettingsPage() {
  const { data, error, isLoading, mutate } = useSWR<AccountResponse>("/api/self-service/account", fetcher)

  const [prefs, setPrefs] = useState<Prefs>({})
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" })

  useEffect(() => {
    if (data?.preferences) setPrefs(data.preferences as Prefs)
  }, [data?.preferences])

  async function savePreferences() {
    setSavingPrefs(true)
    try {
      await patchJson("/api/self-service/account", prefs)
      toast.success("Notification preferences saved")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not save preferences")
    } finally {
      setSavingPrefs(false)
    }
  }

  async function changePassword() {
    if (!passwords.current || !passwords.next) {
      toast.error("Enter your current and new password")
      return
    }
    if (passwords.next.length < 10) {
      toast.error("Your new password must be at least 10 characters")
      return
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords do not match")
      return
    }
    setChangingPassword(true)
    try {
      await postJson("/api/self-service/account", {
        current_password: passwords.current,
        new_password: passwords.next,
      })
      toast.success("Password updated")
      setPasswords({ current: "", next: "", confirm: "" })
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not change password")
    } finally {
      setChangingPassword(false)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading account settings" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />

  const account = data?.account
  const activity = data?.activity ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your login, password and notification preferences." />

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification preferences</CardTitle>
              <CardDescription>Choose what the portal tells you about and how.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {PREF_FLAGS.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <Label htmlFor={flag.key} className="text-sm font-medium">
                      {flag.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{flag.hint}</p>
                  </div>
                  <Switch
                    id={flag.key}
                    checked={Boolean(prefs[flag.key])}
                    onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [flag.key]: checked }))}
                  />
                </div>
              ))}
              <div className="pt-4">
                <Button onClick={savePreferences} disabled={savingPrefs}>
                  {savingPrefs ? "Saving..." : "Save preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your account</CardTitle>
              <CardDescription>Details of the login linked to your employee record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Login email</p>
                <p className="mt-1 text-sm font-medium text-card-foreground">{account?.login_email || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={account?.status} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Last sign-in</p>
                <p className="mt-1 text-sm text-card-foreground">
                  {account?.last_login_at ? relativeTime(account.last_login_at) : "First session"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin console</p>
                <p className="mt-1 text-sm text-card-foreground">
                  {account?.can_access_admin ? "Access granted" : "Employee portal only"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change password</CardTitle>
              <CardDescription>
                {account?.must_change_password
                  ? "You are required to set a new password before continuing."
                  : "Use at least 10 characters that you do not use elsewhere."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex max-w-md flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.next}
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                />
              </div>
              <Button onClick={changePassword} disabled={changingPassword} className="self-start">
                {changingPassword ? "Updating..." : "Update password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent portal activity</CardTitle>
              <CardDescription>The last actions recorded on your account.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No activity recorded"
                  description="Actions you take in the portal will be listed here for your own audit trail."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {activity.map((entry, i) => (
                    <li key={`${entry.created_at}-${i}`} className="flex items-center justify-between gap-4 px-6 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize text-card-foreground">
                          {entry.action.replace(/_/g, " ")}
                        </p>
                        {entry.detail ? (
                          <p className="truncate text-xs text-muted-foreground">{entry.detail}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">{relativeTime(entry.created_at)}</p>
                        {entry.ip_address ? (
                          <p className="text-xs text-muted-foreground">{entry.ip_address}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
