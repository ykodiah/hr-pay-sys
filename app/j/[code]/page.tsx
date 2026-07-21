"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  Briefcase,
  Loader2,
  Building2,
  Upload,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  FileText,
} from "lucide-react"

type CompanyInfo = {
  id?: string
  name?: string | null
  address?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  logo_url?: string | null
  website?: string | null
  formatted_address?: string | null
}

type PublicJob = {
  id: string
  company_id: string
  company_name?: string | null
  company?: CompanyInfo | null
  slug?: string | null
  short_code?: string | null
  title: string
  description?: string | null
  public_summary?: string | null
  requirements?: unknown
  benefits?: unknown
  salary_min?: number | null
  salary_max?: number | null
  currency?: string | null
  location?: string | null
  department?: string | null
  employment_type?: string | null
  published_at?: string | null
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function salaryLabel(job: PublicJob) {
  const min = Number(job.salary_min || 0)
  const max = Number(job.salary_max || 0)
  const currency = job.currency || "GHS"
  if (!min && !max) return "Competitive compensation"
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`
  return `${currency} ${(min || max).toLocaleString()}`
}

function ApplyPageContent() {
  const params = useParams<{ code: string }>()
  const code = String(params?.code || "").trim()

  const [job, setJob] = useState<PublicJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resume, setResume] = useState<File | null>(null)
  const [form, setForm] = useState({
    candidate_name: "",
    email: "",
    phone: "",
    location: "",
    experience_text: "",
    skills: "",
    education: "",
    previous_company: "",
    linkedin_url: "",
    cover_letter: "",
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!code) {
        setError("Invalid job link")
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/careers/jobs?job=${encodeURIComponent(code)}`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "This role is no longer available")
        if (!cancelled) setJob(json.job)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load role")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [code])

  const requirements = useMemo(() => asList(job?.requirements), [job])
  const benefits = useMemo(() => asList(job?.benefits), [job])
  const company = job?.company
  const companyName = company?.name || job?.company_name || "Our company"
  const address = company?.formatted_address || company?.address || ""

  const submit = async () => {
    if (!job) return
    if (!form.candidate_name.trim() || !form.email.trim()) {
      setError("Name and email are required")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body = new FormData()
      body.append("job_id", job.id)
      body.append("code", job.short_code || code)
      body.append("source", "public-apply")
      Object.entries(form).forEach(([k, v]) => body.append(k, v))
      if (resume) body.append("resume", resume)

      const res = await fetch("/api/careers/applications", { method: "POST", body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Application failed")
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit application")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading opportunity…
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center space-y-3 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Role unavailable</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <Link href="/careers">
            <Button variant="outline">Browse open roles</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f8fafc_45%,_#ffffff_100%)]">
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {company?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover border" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                {companyName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{companyName}</p>
              <p className="truncate text-xs text-slate-500">Careers · Application portal</p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Open role</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        <section className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700">We&apos;re hiring</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{job.title}</h1>
            <p className="text-slate-600 max-w-3xl">
              {job.public_summary ||
                `Join ${companyName} as ${job.title}. Submit your details and CV below — your application is delivered directly to our recruitment team.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            {job.department && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border">
                <Building2 className="h-3.5 w-3.5" /> {job.department}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border">
                <Briefcase className="h-3.5 w-3.5" /> {job.employment_type}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100 text-emerald-800">
              {salaryLabel(job)}
            </span>
          </div>

          {(address || company?.phone || company?.email || company?.website) && (
            <div className="rounded-xl bg-slate-50 border px-4 py-3 text-sm text-slate-700 space-y-1">
              <p className="font-medium text-slate-900">About the employer</p>
              {address ? <p>{address}</p> : null}
              <div className="flex flex-wrap gap-4 pt-1 text-slate-600">
                {company?.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {company.phone}
                  </span>
                ) : null}
                {company?.email ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {company.email}
                  </span>
                ) : null}
                {company?.website ? (
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" /> Website
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Role overview</h2>
              <p className="mt-2 whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                {job.description || "Details will be shared during the interview process."}
              </p>
            </div>
            {requirements.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">What we&apos;re looking for</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {benefits.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">What we offer</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {benefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm h-fit space-y-4">
            {success ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <h2 className="text-xl font-semibold text-slate-900">Application received</h2>
                <p className="text-sm text-slate-600">
                  Thank you. Your application for <strong>{job.title}</strong> has been sent to {companyName}.
                  Our talent team will review it shortly. A confirmation copy has also been emailed to you when email delivery is configured.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Apply for this role</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Complete the form and upload your CV/resume. Fields marked required help us screen faster.
                  </p>
                </div>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Full name *</Label>
                    <Input
                      value={form.candidate_name}
                      onChange={(e) => setForm((f) => ({ ...f, candidate_name: e.target.value }))}
                      placeholder="Ama Mensah"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="ama@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+233…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current location</Label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="Accra, Ghana"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current / previous company</Label>
                    <Input
                      value={form.previous_company}
                      onChange={(e) => setForm((f) => ({ ...f, previous_company: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Education</Label>
                    <Input
                      value={form.education}
                      onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
                      placeholder="Degree, institution, year"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Skills (comma separated)</Label>
                    <Input
                      value={form.skills}
                      onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                      placeholder="React, Payroll, Stakeholder management"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>LinkedIn / portfolio URL</Label>
                    <Input
                      value={form.linkedin_url}
                      onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Experience summary</Label>
                    <Textarea
                      rows={3}
                      value={form.experience_text}
                      onChange={(e) => setForm((f) => ({ ...f, experience_text: e.target.value }))}
                      placeholder="Briefly describe your relevant experience"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Cover note</Label>
                    <Textarea
                      rows={3}
                      value={form.cover_letter}
                      onChange={(e) => setForm((f) => ({ ...f, cover_letter: e.target.value }))}
                      placeholder="Why are you a great fit for this role?"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>CV / Resume (PDF, DOC, DOCX — max 8MB)</Label>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-emerald-400 hover:bg-emerald-50/40 transition">
                      <Upload className="h-5 w-5 text-slate-500" />
                      <span className="text-sm text-slate-700">
                        {resume ? resume.name : "Click to upload your CV"}
                      </span>
                      {resume ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <FileText className="h-3.5 w-3.5" />
                          {(resume.size / 1024).toFixed(0)} KB
                        </span>
                      ) : null}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => setResume(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={submitting}
                  onClick={() => void submit()}
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit application
                </Button>
                <p className="text-[11px] text-center text-slate-400">
                  By submitting, you consent to {companyName} processing your data for recruitment.
                </p>
              </>
            )}
          </section>
        </div>

        <p className="pb-8 text-center text-xs text-slate-400">
          Powered by AkwaabaHRPay Applicant Tracking
        </p>
      </main>
    </div>
  )
}

export default function PublicJobApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      }
    >
      <ApplyPageContent />
    </Suspense>
  )
}
