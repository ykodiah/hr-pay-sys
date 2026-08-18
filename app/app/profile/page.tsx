"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Briefcase, Eye, EyeOff, KeyRound, Save, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || "Request failed")
  return body
}

export default function AdminProfilePage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/account", fetcher)
  const [profile, setProfile] = useState<any>({})
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" })
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false })

  useEffect(() => {
    if (data?.profile) setProfile(data.profile)
  }, [data])

  async function request(method: string, body: any) {
    const response = await fetch("/api/admin/account", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || "Request failed")
    return result
  }

  async function saveProfile() {
    setSaving(true)
    try {
      await request("PATCH", profile)
      toast.success("Profile updated")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not update profile")
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (passwords.next !== passwords.confirm) return toast.error("New passwords do not match")
    setSaving(true)
    try {
      await request("POST", { current_password: passwords.current, new_password: passwords.next, confirm_password: passwords.confirm })
      toast.success("Password updated")
      setPasswords({ current: "", next: "", confirm: "" })
    } catch (e: any) {
      toast.error(e?.message || "Could not update password")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="p-8">Loading profile…</div>
  if (error) return <div className="p-8 text-red-600">{(error as Error).message}</div>
  const initials = String(profile.display_name || "Admin").split(" ").slice(0, 2).map((part) => part[0]).join("")

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My admin profile</h1>
        <p className="text-sm text-slate-500">This profile is linked to the authenticated user and current organisation.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{profile.display_name}</h2>
            <p className="text-sm text-muted-foreground">{profile.role_label} · {profile.company_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            {profile.employee_code ? <p className="mt-1 text-xs text-emerald-700">Linked employee: {profile.employee_code}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserCircle className="h-4 w-4" /> Profile details</CardTitle>
          <CardDescription>Used in audit trails, approvals and administrator menus.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2"><Label>Full name</Label><Input value={profile.display_name || ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /></div>
          <div className="flex flex-col gap-2"><Label>Role label</Label><Input value={profile.role_label || ""} onChange={(e) => setProfile({ ...profile, role_label: e.target.value })} /></div>
          <div className="flex flex-col gap-2"><Label>Job title</Label><Input value={profile.job_title || ""} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} /></div>
          <div className="flex flex-col gap-2"><Label>Phone</Label><Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
          <div className="flex flex-col gap-2 sm:col-span-2"><Label>Avatar URL</Label><Input value={profile.avatar_url || ""} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} /></div>
          <div className="flex flex-col gap-2 sm:col-span-2"><Label>Bio</Label><Textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
          <div className="sm:col-span-2"><Button onClick={saveProfile} disabled={saving}><Save className="mr-2 h-4 w-4" /> Save profile</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" /> Change password</CardTitle>
          <CardDescription>Update the password for the currently logged-in administrator.</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-2xl gap-4 sm:grid-cols-3">
          {([['current', 'Current password', 'current-password'], ['next', 'New password', 'new-password'], ['confirm', 'Confirm password', 'new-password']] as const).map(([key, label, autoComplete]) => {
            const visible = showPasswords[key]
            return <div className="flex flex-col gap-2" key={key}>
              <Label htmlFor={`admin-${key}`}>{label}</Label>
              <div className="relative">
                <Input id={`admin-${key}`} type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={passwords[key]} onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })} className="pr-11" />
                <button type="button" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key] }))}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
              </div>
            </div>
          })}
          <div className="sm:col-span-3"><Button onClick={changePassword} disabled={saving || !passwords.current || !passwords.next}><KeyRound className="mr-2 h-4 w-4" /> Update password</Button></div>
        </CardContent>
      </Card>
    </div>
  )
}
