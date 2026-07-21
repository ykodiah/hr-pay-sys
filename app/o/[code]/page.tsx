"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type PublicOffer = {
  id: string
  short_code: string
  status: string
  salary: number
  currency: string
  start_date?: string | null
  acceptance_deadline?: string | null
  benefits: string[]
  terms?: string | null
  working_hours?: string | null
  probation_months?: number | null
  notice_months?: number | null
  offer_letter_text?: string | null
  job_title?: string | null
  department?: string | null
  candidate_name?: string | null
  signatory_name?: string | null
  signatory_title?: string | null
  candidate_signature_name?: string | null
  candidate_signed_at?: string | null
  hr_signature_name?: string | null
  hr_signed_at?: string | null
  company?: { name?: string; address?: string; logo_url?: string | null } | null
  can_respond?: boolean
  responded_at?: string | null
}

export default function PublicOfferPage() {
  const params = useParams<{ code: string }>()
  const code = String(params?.code || "")
  const [offer, setOffer] = useState<PublicOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [signatureName, setSignatureName] = useState("")
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/offers/public/${encodeURIComponent(code)}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Offer not found")
      setOffer(json.offer)
      if (json.offer?.candidate_name) {
        setSignatureName((prev) => prev || json.offer.candidate_name)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offer")
      setOffer(null)
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    if (code) void load()
  }, [code, load])

  const respond = async (action: "accept" | "reject" | "withdraw") => {
    if (!offer) return
    if (action === "accept" && !signatureName.trim()) {
      setError("Type your full name in the signature box to accept this offer.")
      return
    }
    setSubmitting(action)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/offers/public/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note,
          candidate_signature_name: action === "accept" ? signatureName.trim() : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not submit response")
      setOffer(json.offer)
      setMessage(json.message || "Response recorded")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Response failed")
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading offer…
      </div>
    )
  }

  if (error && !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-4 text-xl font-semibold">Offer unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!offer) return null

  const salary = `${offer.currency} ${Number(offer.salary || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
  })}`
  const locked = !offer.can_respond

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
          <div className="bg-emerald-700 px-6 py-6 text-white">
            <p className="text-sm text-emerald-100">Offer of employment</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {offer.job_title || "Role"}
            </h1>
            <p className="mt-1 text-emerald-50/90">
              {offer.company?.name || "Employer"}
              {offer.department ? ` · ${offer.department}` : ""}
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {offer.status}
              </Badge>
              {offer.candidate_name ? (
                <span className="text-sm text-slate-600">For {offer.candidate_name}</span>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Remuneration</p>
                <p className="font-semibold text-emerald-800">{salary}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Start date</p>
                <p className="font-medium">{offer.start_date || "To be confirmed"}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Respond by</p>
                <p className="font-medium">{offer.acceptance_deadline || "—"}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Working hours</p>
                <p className="font-medium">{offer.working_hours || "As per company policy"}</p>
              </div>
            </div>

            {offer.benefits?.length ? (
              <div>
                <h2 className="font-medium mb-2">Benefits</h2>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {offer.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <h2 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Offer letter
              </h2>
              <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-xl border bg-slate-50 p-4 text-sm text-slate-800">
                {offer.offer_letter_text || "Letter content will appear here."}
              </pre>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-slate-200 bg-white p-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Candidate signature
                </p>
                {offer.candidate_signature_name ? (
                  <div>
                    <p className="font-serif text-xl italic text-slate-900">
                      {offer.candidate_signature_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Signed
                      {offer.candidate_signed_at
                        ? ` · ${new Date(offer.candidate_signed_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                ) : locked ? (
                  <p className="text-sm text-slate-500">Not signed</p>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="candidate-sig">Type your full legal name</Label>
                    <Input
                      id="candidate-sig"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Your full name as signature"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  HR Head signature
                </p>
                {offer.hr_signature_name ? (
                  <div>
                    <p className="font-serif text-xl italic text-slate-900">{offer.hr_signature_name}</p>
                    <p className="text-xs text-slate-500">
                      {offer.signatory_title || "HR Head"}
                      {offer.hr_signed_at
                        ? ` · ${new Date(offer.hr_signed_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Pending employer signature</p>
                )}
              </div>
            </div>

            {message ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p>{message}</p>
              </div>
            ) : null}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            {!locked ? (
              <div className="space-y-3 rounded-xl border p-4">
                <h2 className="font-medium">Your response</h2>
                <Textarea
                  rows={3}
                  placeholder="Optional note to HR"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={Boolean(submitting) || !signatureName.trim()}
                    onClick={() => void respond("accept")}
                  >
                    {submitting === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Sign & accept offer
                  </Button>
                  <Button
                    variant="outline"
                    disabled={Boolean(submitting)}
                    onClick={() => void respond("reject")}
                  >
                    {submitting === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Decline
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={Boolean(submitting)}
                    onClick={() => void respond("withdraw")}
                  >
                    {submitting === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Withdraw interest
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Signing with your typed name records acceptance and starts onboarding. Contact HR if
                  you need more time.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                This offer is marked <strong className="capitalize">{offer.status}</strong>
                {offer.responded_at
                  ? ` (responded ${new Date(offer.responded_at).toLocaleString()})`
                  : ""}
                . Contact HR for any changes.
              </p>
            )}

            {offer.company?.address ? (
              <p className="text-xs text-slate-400">{offer.company.address}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
'''
)
print("wrote", path, "bytes", path.stat().st_size)
PY