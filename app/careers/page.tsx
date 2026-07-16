"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Briefcase, Loader2, ArrowLeft, Building2 } from "lucide-react"

type PublicJob = {
  id: string
  company_id: string
  company_name?: string | null
  slug?: string | null
  title: string
  description?: string | null
  requirements?: unknown
  benefits?: unknown
  salary_min?: number | null
  salary_max?: number | null
  currency?: string | null
  location?: string | null
  department?: string | null
  employment_type?: string | null
  published_at?: string | null
  views_count?: number | null
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
  if (!min && !max) return "Competitive"
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`
  return `${currency} ${(min || max).toLocaleString()}`
}

function CareersContent() {
  const searchParams = useSearchParams()
  const jobKey = searchParams.get("job") || ""

  const [jobs, setJobs] = useState<PublicJob[]>([])
  const [selected, setSelected] = useState<PublicJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({
    candidate_name: "",
    email: "",
    phone: "",
    location: "",
    experience_text: "",
    skills: "",
    education: "",
    previous_company: "",
    cover_letter: "",
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setSuccess(null)
      try {
        if (jobKey) {
          const res = await fetch(`/api/careers/jobs?job=${encodeURIComponent(jobKey)}`, { cache: "no-store" })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || "Job not found")
          if (!cancelled) {
            setSelected(json.job)
            setJobs([json.job])
          }
        } else {
          const res = await fetch("/api/careers/jobs", { cache: "no-store" })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || "Failed to load jobs")
          if (!cancelled) {
            setJobs(json.jobs ?? [])
            setSelected(null)
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load careers")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [jobKey])

  const requirements = useMemo(() => asList(selected?.requirements), [selected])
  const benefits = useMemo(() => asList(selected?.benefits), [selected])

  const submitApplication = async () => {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/careers/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: selected.id,
          ...form,
          source: "careers",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Application failed")
      setSuccess(`Application submitted for ${json.job_title || selected.title}.`)
      setForm({
        candidate_name: "",
        email: "",
        phone: "",
        location: "",
        experience_text: "",
        skills: "",
        education: "",
        previous_company: "",
        cover_letter: "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit application")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfdf5,_#ffffff_55%)]">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AkwaabaHRPay</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/careers">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Open roles</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="space-y-3">
          <Badge className="bg-emerald-100 text-emerald-800">Careers</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {selected ? selected.title : "Open positions"}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            {selected
              ? `${selected.company_name || "Company"} · Live role from the recruitment database`
              : "Browse published job postings synced from recruitment. Apply in one step."}
          </p>
        </section>

        {loading && (
          <div className="py-20 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading roles…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{success}</div>
        )}

        {!loading && !selected && (
          <div className="grid gap-4">
            {jobs.length === 0 ? (
              <div className="rounded-xl border bg-white p-10 text-center text-gray-600">
                No published roles right now. Check back soon.
              </div>
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/careers?job=${encodeURIComponent(job.slug || job.id)}`}
                  className="rounded-xl border bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                      <p className="text-sm text-gray-600 flex flex-wrap gap-3 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.company_name || "Company"}
                        </span>
                        {job.department && <span>{job.department}</span>}
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.employment_type}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-emerald-700">{salaryLabel(job)}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {!loading && selected && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-xl border bg-white p-6 space-y-5">
              <Link href="/careers" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
                <ArrowLeft className="h-4 w-4" /> All roles
              </Link>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 flex flex-wrap gap-3">
                  <span>{selected.company_name || "Company"}</span>
                  {selected.department && <span>{selected.department}</span>}
                  {selected.location && <span>{selected.location}</span>}
                  {selected.employment_type && <span>{selected.employment_type}</span>}
                  <span>{salaryLabel(selected)}</span>
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selected.description || "No description provided."}
                </p>
              </div>
              {requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {requirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {benefits.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Benefits</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {benefits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-xl border bg-white p-6 space-y-4 h-fit">
              <h3 className="text-lg font-semibold">Apply now</h3>
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={form.candidate_name}
                  onChange={(e) => setForm((f) => ({ ...f, candidate_name: e.target.value }))}
                  placeholder="Ama Mensah"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ama@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Skills (comma separated)</Label>
                <Input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Experience</Label>
                <Textarea
                  rows={3}
                  value={form.experience_text}
                  onChange={(e) => setForm((f) => ({ ...f, experience_text: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cover letter</Label>
                <Textarea
                  rows={4}
                  value={form.cover_letter}
                  onChange={(e) => setForm((f) => ({ ...f, cover_letter: e.target.value }))}
                />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting || !form.candidate_name || !form.email}
                onClick={() => void submitApplication()}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit application
              </Button>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default function CareersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading careers…
        </div>
      }
    >
      <CareersContent />
    </Suspense>
  )
}
