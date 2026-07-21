"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  FileText,
  Link2,
  Loader2,
  Mail,
  MapPin,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { buildJobApplyUrl, buildOfferRespondUrl } from "@/lib/recruitment/public-origin"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

type Metrics = {
  active_jobs: number
  total_applications: number
  interviews_scheduled: number
  offers_extended: number
  requisitions: number
  onboarding_active: number
}

type Analytics = {
  funnel: Record<string, number>
  sources: Record<string, number>
}

type Requisition = {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: string | null
  priority: string | null
  status: string | null
  budget_min: number | null
  budget_max: number | null
  currency: string | null
  headcount: number | null
  requester_name: string | null
  deadline: string | null
  description: string | null
  requirements: unknown
  created_at: string | null
}

type JobPosting = {
  id: string
  requisition_id?: string | null
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
  status?: string | null
  published_at?: string | null
  expires_at?: string | null
  created_at?: string | null
  views_count?: number | null
  applications_count?: number | null
}

type OrgPerson = {
  id: string
  name: string
  department?: string | null
  position?: string | null
  special_role?: string | null
}

type Application = {
  id: string
  company_id?: string | null
  job_posting_id: string | null
  candidate_id?: string | null
  status: string | null
  score: number | null
  source: string | null
  applied_at: string | null
  notes?: string | null
  cover_letter?: string | null
  candidate_name?: string | null
  candidate_email?: string | null
  candidate_phone?: string | null
  skills?: unknown
  experience_text?: string | null
  education?: string | null
  previous_company?: string | null
  linkedin_url?: string | null
  resume_filename?: string | null
  resume_url?: string | null
  resume_content?: string | null
  resume_text?: string | null
  resume_text_chars?: number | null
  resume_text_method?: string | null
  resume_text_extracted_at?: string | null
  resume_extract_warning?: string | null
  job_title?: string | null
  department?: string | null
  location?: string | null
  employment_type?: string | null
  job_description?: string | null
  job_requirements?: unknown
  screening_score?: number | null
  screening_summary?: string | null
  screening_status?: string | null
  screened_at?: string | null
}

type Interview = {
  id: string
  application_id: string | null
  interview_type: string | null
  scheduled_at: string | null
  duration_minutes: number | null
  interviewer_name: string | null
  location: string | null
  meeting_url: string | null
  status: string | null
  notes: string | null
  feedback: string | null
  rating: number | null
  candidate_name?: string | null
  candidate_email?: string | null
  job_title?: string | null
  created_at?: string | null
}

type Offer = {
  id: string
  company_id?: string | null
  application_id: string | null
  salary: number | null
  currency: string | null
  start_date: string | null
  benefits: unknown
  terms: string | null
  status: string | null
  offer_letter_text: string | null
  acceptance_deadline: string | null
  sent_at?: string | null
  responded_at?: string | null
  created_at?: string | null
  candidate_name?: string | null
  candidate_email?: string | null
  job_title?: string | null
  department?: string | null
  short_code?: string | null
  respond_url?: string | null
  working_hours?: string | null
  probation_months?: number | null
  notice_months?: number | null
  signatory_name?: string | null
  signatory_title?: string | null
  remuneration?: any
  email_status?: string | null
  last_email_at?: string | null
  public_views?: number | null
  response_channel?: string | null
  candidate_response_note?: string | null
  ai_letter_notes?: string | null
  offer_letter_version?: number | null
}

type OfferEditForm = {
  salary: string
  currency: string
  start_date: string
  acceptance_deadline: string
  benefits: string
  remuneration_extras: string
  terms: string
  offer_letter_text: string
  working_hours: string
  probation_months: string
  notice_months: string
  signatory_name: string
  signatory_title: string
  department: string
}

type OnboardingTask = {
  id: string
  checklist_id: string
  task_type: string | null
  title: string
  description: string | null
  assigned_to: string | null
  assigned_department?: string | null
  department: string | null
  status: string | null
  due_date: string | null
  priority: string | null
  completed_at: string | null
  created_at?: string | null
  stage?: string | null
  sort_order?: number | null
}

type OnboardingChecklist = {
  id: string
  application_id: string | null
  candidate_id: string | null
  candidate_name: string | null
  start_date: string | null
  status: string | null
  progress: number | null
  tasks?: OnboardingTask[]
  created_at?: string | null
  offer_id?: string | null
  job_title?: string | null
  department?: string | null
  stage?: string | null
  progress_notes?: string | null
  auto_started?: boolean | null
  hired_at?: string | null
  buddy_name?: string | null
  manager_name?: string | null
}

type RecruitmentResponse = {
  success: boolean
  company_id: string
  metrics: Metrics
  analytics: Analytics
  requisitions: Requisition[]
  jobs: JobPosting[]
  applications: Application[]
  interviews: Interview[]
  offers: Offer[]
  onboarding: OnboardingChecklist[]
  meta?: { fetched_at?: string }
  error?: string
}

type RequisitionForm = {
  title: string
  department: string
  location: string
  employment_type: string
  priority: string
  budget_min: string
  budget_max: string
  currency: string
  headcount: string
  requester_name: string
  requester_employee_id: string
  requester_mode: string
  deadline: string
  description: string
  requirements: string
}

type JobForm = {
  requisition_id: string
  title: string
  department: string
  location: string
  employment_type: string
  salary_min: string
  salary_max: string
  currency: string
  expires_at: string
  description: string
  requirements: string
  benefits: string
}

type ApplicationForm = {
  job_posting_id: string
  candidate_name: string
  email: string
  phone: string
  location: string
  experience_text: string
  skills: string
  education: string
  previous_company: string
  linkedin_url: string
  source: string
  score: string
  cover_letter: string
  notes: string
}

type InterviewForm = {
  application_id: string
  date: string
  time: string
  interview_type: string
  duration_minutes: string
  interviewer_name: string
  location: string
  meeting_url: string
  notes: string
}

const emptyMetrics: Metrics = {
  active_jobs: 0,
  total_applications: 0,
  interviews_scheduled: 0,
  offers_extended: 0,
  requisitions: 0,
  onboarding_active: 0,
}

const emptyAnalytics: Analytics = {
  funnel: {},
  sources: {},
}

const initialRequisitionForm: RequisitionForm = {
  title: "",
  department: "",
  location: "",
  employment_type: "Full-time",
  priority: "medium",
  budget_min: "",
  budget_max: "",
  currency: "GHS",
  headcount: "1",
  requester_name: "",
  requester_employee_id: "",
  requester_mode: "",
  deadline: "",
  description: "",
  requirements: "",
}

const initialJobForm: JobForm = {
  requisition_id: "__none",
  title: "",
  department: "",
  location: "",
  employment_type: "Full-time",
  salary_min: "",
  salary_max: "",
  currency: "GHS",
  expires_at: "",
  description: "",
  requirements: "",
  benefits: "",
}

const initialApplicationForm: ApplicationForm = {
  job_posting_id: "",
  candidate_name: "",
  email: "",
  phone: "",
  location: "",
  experience_text: "",
  skills: "",
  education: "",
  previous_company: "",
  linkedin_url: "",
  source: "direct",
  score: "0",
  cover_letter: "",
  notes: "",
}

const initialInterviewForm: InterviewForm = {
  application_id: "",
  date: "",
  time: "",
  interview_type: "video",
  duration_minutes: "60",
  interviewer_name: "",
  location: "",
  meeting_url: "",
  notes: "",
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function asStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  }
  if (typeof value === "string" && value.trim()) return splitList(value)
  return []
}

function numberFromForm(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function formatDate(value?: string | null) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatMoney(currency?: string | null, min?: number | null, max?: number | null) {
  const safeCurrency = currency || "GHS"
  const hasMin = typeof min === "number" && min > 0
  const hasMax = typeof max === "number" && max > 0
  if (hasMin && hasMax) return `${safeCurrency} ${min.toLocaleString()} - ${max.toLocaleString()}`
  if (hasMin) return `${safeCurrency} ${min.toLocaleString()}+`
  if (hasMax) return `Up to ${safeCurrency} ${max.toLocaleString()}`
  return "Salary not set"
}

function statusClass(status?: string | null) {
  switch (status) {
    case "approved":
    case "published":
    case "completed":
    case "accepted":
    case "hired":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "screening":
    case "interview":
    case "scheduled":
    case "in_progress":
    case "sent":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "pending_approval":
    case "draft":
    case "new":
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "rejected":
    case "cancelled":
    case "withdrawn":
    case "archived":
      return "border-red-200 bg-red-50 text-red-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

function priorityClass(priority?: string | null) {
  switch (priority) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700"
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

function matchesSearch(fields: Array<string | null | undefined>, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return fields.some((field) => field?.toLowerCase().includes(normalized))
}

function csvEscape(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default function RecruitmentPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics)
  const [analytics, setAnalytics] = useState<Analytics>(emptyAnalytics)
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [onboarding, setOnboarding] = useState<OnboardingChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [showRequisitionDialog, setShowRequisitionDialog] = useState(false)
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [previewApplication, setPreviewApplication] = useState<Application | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [screeningApplication, setScreeningApplication] = useState<Application | null>(null)
  const [screeningLoading, setScreeningLoading] = useState(false)
  const [screeningSaving, setScreeningSaving] = useState(false)
  const [screeningResult, setScreeningResult] = useState<any>(null)
  const [screeningMeta, setScreeningMeta] = useState<{
    chars?: number
    method?: string
    warning?: string | null
    groq_configured?: boolean
  } | null>(null)
  const [overrideScore, setOverrideScore] = useState("")
  const [overrideReason, setOverrideReason] = useState("")
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [offerEditForm, setOfferEditForm] = useState<OfferEditForm | null>(null)
  const [offerSaving, setOfferSaving] = useState(false)
  const [offerPreview, setOfferPreview] = useState<Offer | null>(null)
  const [requisitionSearch, setRequisitionSearch] = useState("")
  const [requisitionStatus, setRequisitionStatus] = useState("all")
  const [jobSearch, setJobSearch] = useState("")
  const [jobStatus, setJobStatus] = useState("all")
  const [applicationSearch, setApplicationSearch] = useState("")
  const [applicationStatus, setApplicationStatus] = useState("all")
  const [requisitionForm, setRequisitionForm] = useState<RequisitionForm>(initialRequisitionForm)
  const [jobForm, setJobForm] = useState<JobForm>(initialJobForm)
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>(initialApplicationForm)
  const [interviewForm, setInterviewForm] = useState<InterviewForm>(initialInterviewForm)
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [requestorOptions, setRequestorOptions] = useState<OrgPerson[]>([])
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/employees/meta", { cache: "no-store", credentials: "include" })
        const json = await res.json()
        if (!res.ok || cancelled) return
        const deps = Array.isArray(json.departments) ? json.departments.map(String).filter(Boolean) : []
        const locs = Array.isArray(json.locations) ? json.locations.map(String).filter(Boolean) : []
        setDepartments(deps)
        setLocations(locs)
        if (json.company_id && !companyId) setCompanyId(json.company_id)

        const peopleMap = new Map<string, OrgPerson>()
        for (const list of [json.heads_of_department, json.supervisors, json.employees]) {
          for (const p of list || []) {
            if (!p?.id || !p?.name) continue
            if (!peopleMap.has(p.id)) {
              peopleMap.set(p.id, {
                id: p.id,
                name: p.name,
                department: p.department,
                position: p.position,
                special_role: p.special_role,
              })
            }
          }
        }
        // Prefer HOD/supervisors first in the list
        const hodIds = new Set((json.heads_of_department || []).map((p: any) => p.id))
        const supIds = new Set((json.supervisors || []).map((p: any) => p.id))
        const sorted = Array.from(peopleMap.values()).sort((a, b) => {
          const rank = (p: OrgPerson) => (hodIds.has(p.id) ? 0 : supIds.has(p.id) ? 1 : 2)
          return rank(a) - rank(b) || a.name.localeCompare(b.name)
        })
        setRequestorOptions(sorted)
      } catch {
        /* keep empty catalogs */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tab = searchParams.get("tab")
    const action = searchParams.get("action")
    const allowed = new Set([
      "overview",
      "requisitions",
      "jobs",
      "applications",
      "interviews",
      "offers",
      "onboarding",
      "analytics",
    ])
    if (tab && allowed.has(tab)) setActiveTab(tab)
    if (action === "add") {
      if (tab === "requisitions") setShowRequisitionDialog(true)
      if (tab === "jobs") setShowJobDialog(true)
      if (tab === "applications") setShowApplicationDialog(true)
      if (tab === "interviews") setShowInterviewDialog(true)
    }
  }, [searchParams])

  const loadRecruitment = useCallback(
    async (knownCompanyId?: string | null) => {
      setLoading(true)
      setLoadError(null)
      try {
        const resolvedId = knownCompanyId || companyId || ""
        const url = resolvedId
          ? `/api/recruitment?company_id=${encodeURIComponent(resolvedId)}`
          : "/api/recruitment"
        const response = await fetch(url, { cache: "no-store" })
        const body = (await response.json()) as RecruitmentResponse
        if (!response.ok || body.error) {
          throw new Error(body.error || "Failed to load recruitment data.")
        }

        setCompanyId(body.company_id || resolvedId)
        setMetrics(body.metrics ?? emptyMetrics)
        setAnalytics(body.analytics ?? emptyAnalytics)
        setRequisitions(body.requisitions ?? [])
        setJobs(body.jobs ?? [])
        setApplications(body.applications ?? [])
        setInterviews(body.interviews ?? [])
        setOffers(body.offers ?? [])
        setOnboarding(body.onboarding ?? [])
        setLastSynced(new Date())
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load recruitment data."
        setLoadError(message)
        toast({ title: "Recruitment sync failed", description: message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    },
    [companyId],
  )

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    void loadRecruitment()
  }, [loadRecruitment])

  const applicationsById = useMemo(() => {
    return new Map(applications.map((application) => [application.id, application]))
  }, [applications])

  const applicationsByJob = useMemo(() => {
    const counts = new Map<string, number>()
    for (const application of applications) {
      if (!application.job_posting_id) continue
      counts.set(application.job_posting_id, (counts.get(application.job_posting_id) ?? 0) + 1)
    }
    return counts
  }, [applications])

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((requisition) => {
      const statusMatches = requisitionStatus === "all" || requisition.status === requisitionStatus
      return (
        statusMatches &&
        matchesSearch(
          [requisition.title, requisition.department, requisition.location, requisition.requester_name],
          requisitionSearch,
        )
      )
    })
  }, [requisitions, requisitionSearch, requisitionStatus])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const statusMatches = jobStatus === "all" || job.status === jobStatus
      return statusMatches && matchesSearch([job.title, job.department, job.location, job.employment_type], jobSearch)
    })
  }, [jobs, jobSearch, jobStatus])

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const statusMatches = applicationStatus === "all" || application.status === applicationStatus
      return (
        statusMatches &&
        matchesSearch(
          [
            application.candidate_name,
            application.candidate_email,
            application.candidate_phone,
            application.job_title,
            application.department,
            application.source,
          ],
          applicationSearch,
        )
      )
    })
  }, [applications, applicationSearch, applicationStatus])

  const recentApplications = applications.slice(0, 5)
  const upcomingInterviews = interviews.filter((interview) => interview.status === "scheduled").slice(0, 5)

  const runMutation = async (
    path: string,
    init: RequestInit & { body?: string },
    successTitle: string,
    successDescription: string,
  ) => {
    setSaving(true)
    try {
      const response = await fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      })
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok || body.error) throw new Error(body.error || "Request failed.")
      toast({ title: successTitle, description: successDescription })
      await loadRecruitment(companyId)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed."
      toast({ title: "Action failed", description: message, variant: "destructive" })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRequisition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const created = await runMutation(
      "/api/recruitment/requisitions",
      {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          title: requisitionForm.title,
          department: requisitionForm.department || null,
          location: requisitionForm.location || null,
          employment_type: requisitionForm.employment_type,
          priority: requisitionForm.priority,
          budget_min: numberFromForm(requisitionForm.budget_min),
          budget_max: numberFromForm(requisitionForm.budget_max),
          currency: requisitionForm.currency || "GHS",
          headcount: numberFromForm(requisitionForm.headcount) ?? 1,
          requester_name: requisitionForm.requester_name || null,
          requester_employee_id:
            requisitionForm.requester_mode === "__manual__" || !requisitionForm.requester_employee_id
              ? null
              : requisitionForm.requester_employee_id,
          deadline: requisitionForm.deadline || null,
          description: requisitionForm.description || null,
          requirements: splitList(requisitionForm.requirements),
        }),
      },
      "Requisition created",
      `${requisitionForm.title} is ready for approval.`,
    )
    if (created) {
      setRequisitionForm(initialRequisitionForm)
      setShowRequisitionDialog(false)
    }
  }

  const handleApproveRequisition = async (id: string) => {
    await runMutation(
      "/api/recruitment/requisitions",
      { method: "PATCH", body: JSON.stringify({ id, status: "approved" }) },
      "Requisition approved",
      "The requisition status was updated.",
    )
  }

  const submitJob = async (status: "draft" | "published") => {
    if (!jobForm.title.trim() || !jobForm.description.trim()) {
      toast({
        title: "Job details required",
        description: "Add a title and description before saving the job.",
        variant: "destructive",
      })
      return
    }

    const created = await runMutation(
      "/api/recruitment/jobs",
      {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          requisition_id: jobForm.requisition_id === "__none" ? null : jobForm.requisition_id,
          title: jobForm.title,
          department: jobForm.department || null,
          location: jobForm.location || null,
          employment_type: jobForm.employment_type,
          salary_min: numberFromForm(jobForm.salary_min),
          salary_max: numberFromForm(jobForm.salary_max),
          currency: jobForm.currency || "GHS",
          expires_at: jobForm.expires_at || null,
          description: jobForm.description,
          requirements: splitList(jobForm.requirements),
          benefits: splitList(jobForm.benefits),
          status,
        }),
      },
      status === "published" ? "Job published" : "Job draft created",
      `${jobForm.title} was saved successfully.`,
    )
    if (created) {
      setJobForm(initialJobForm)
      setShowJobDialog(false)
    }
  }

  const handleCreateJob = async (event: FormEvent<HTMLFormElement>, status: "draft" | "published") => {
    event.preventDefault()
    await submitJob(status)
  }

  const handleJobAction = async (job: JobPosting, action: "publish" | "pause" | "duplicate" | "archive") => {
    if (action === "archive") {
      await runMutation(
        `/api/recruitment/jobs?id=${encodeURIComponent(job.id)}`,
        { method: "DELETE" },
        "Job archived",
        `${job.title} was archived.`,
      )
      return
    }

    const body =
      action === "duplicate"
        ? { id: job.id, action: "duplicate" }
        : { id: job.id, status: action === "publish" ? "published" : "paused" }

    await runMutation(
      "/api/recruitment/jobs",
      { method: "PATCH", body: JSON.stringify(body) },
      action === "duplicate" ? "Job duplicated" : action === "publish" ? "Job published" : "Job paused",
      action === "duplicate" ? `A draft copy of ${job.title} was created.` : `${job.title} was updated.`,
    )
  }

  const handleCreateApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const created = await runMutation(
      "/api/recruitment/applications",
      {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          job_posting_id: applicationForm.job_posting_id,
          candidate_name: applicationForm.candidate_name,
          email: applicationForm.email || null,
          phone: applicationForm.phone || null,
          location: applicationForm.location || null,
          experience_text: applicationForm.experience_text || null,
          skills: splitList(applicationForm.skills),
          education: applicationForm.education || null,
          previous_company: applicationForm.previous_company || null,
          linkedin_url: applicationForm.linkedin_url || null,
          source: applicationForm.source || "direct",
          score: numberFromForm(applicationForm.score) ?? 0,
          cover_letter: applicationForm.cover_letter || null,
          notes: applicationForm.notes || null,
        }),
      },
      "Application created",
      `${applicationForm.candidate_name} was added to the pipeline.`,
    )
    if (created) {
      setApplicationForm(initialApplicationForm)
      setShowApplicationDialog(false)
    }
  }

  const openApplicationPreview = async (application: Application) => {
    setPreviewLoading(true)
    setPreviewApplication(application)
    try {
      const cid = companyId || application.company_id || ""
      const qs = cid ? `?company_id=${encodeURIComponent(cid)}` : ""
      const res = await fetch(`/api/recruitment/applications/${application.id}${qs}`, {
        cache: "no-store",
        credentials: "include",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load application")
      setPreviewApplication(json.application)
      if (json.application?.company_id && !companyId) {
        setCompanyId(json.application.company_id)
      }
    } catch (err) {
      toast({
        title: "Preview failed",
        description: err instanceof Error ? err.message : "Could not load application",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const openScreeningWorkspace = async (application: Application) => {
    setScreeningApplication(application)
    setScreeningResult(null)
    setScreeningMeta(null)
    setOverrideScore(String(application.score ?? ""))
    setOverrideReason("")
    setScreeningLoading(true)
    toast({
      title: "ATS screening started",
      description: `Analyzing ${application.candidate_name || "candidate"} materials against the role requirements…`,
    })
    try {
      const cid = companyId || application.company_id || null
      const res = await fetch("/api/recruitment/applications/screen", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: application.id,
          company_id: cid,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Screening failed")
      setScreeningResult(json.result || json.screening)
      setScreeningMeta(json.resume_extract || null)
      setOverrideScore(String(json.result?.ai_score ?? json.screening?.ai_score ?? ""))
      if (cid && !companyId) setCompanyId(cid)
      await loadRecruitment(cid || companyId)
      toast({
        title: "Screening complete",
        description: `Proposed score: ${json.result?.ai_score ?? json.screening?.ai_score ?? "—"}/100`,
      })
    } catch (err) {
      toast({
        title: "Screening failed",
        description: err instanceof Error ? err.message : "Could not screen application",
        variant: "destructive",
      })
    } finally {
      setScreeningLoading(false)
    }
  }

  const saveScreeningOverride = async () => {
    if (!screeningApplication) return
    const score = Number(overrideScore)
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      toast({ title: "Invalid score", description: "Enter a score between 0 and 100.", variant: "destructive" })
      return
    }
    setScreeningSaving(true)
    try {
      const cid = companyId || screeningApplication.company_id || null
      const res = await fetch("/api/recruitment/applications/screen", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: screeningApplication.id,
          company_id: cid,
          final_score: score,
          override_reason: overrideReason || "Manual override by recruiter",
          save_only: Boolean(screeningResult),
          summary: screeningResult?.summary,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not save score")
      // If save_only was false because first run already happened with final_score, re-run with score
      if (!screeningResult) {
        /* already handled */
      }
      await loadRecruitment(cid || companyId)
      toast({ title: "Score saved", description: `Final screening score set to ${score}/100.` })
      setScreeningApplication(null)
      setScreeningResult(null)
      setScreeningMeta(null)
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save screening score",
        variant: "destructive",
      })
    } finally {
      setScreeningSaving(false)
    }
  }

  const handleApplicationAction = async (
    application: Application,
    action: "screen" | "reject" | "generate_offer" | "start_onboarding",
  ) => {
    if (action === "screen") {
      await openScreeningWorkspace(application)
      return
    }
    await runMutation(
      "/api/recruitment/applications",
      { method: "PATCH", body: JSON.stringify({ id: application.id, action }) },
      "Application updated",
      `${application.candidate_name || "Candidate"} moved through the workflow.`,
    )
  }

  const handleScheduleInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const scheduledAt =
      interviewForm.date && interviewForm.time ? new Date(`${interviewForm.date}T${interviewForm.time}`).toISOString() : ""
    const scheduled = await runMutation(
      "/api/recruitment/interviews",
      {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          application_id: interviewForm.application_id,
          scheduled_at: scheduledAt,
          interview_type: interviewForm.interview_type,
          duration_minutes: numberFromForm(interviewForm.duration_minutes) ?? 60,
          interviewer_name: interviewForm.interviewer_name || null,
          location: interviewForm.location || null,
          meeting_url: interviewForm.meeting_url || null,
          notes: interviewForm.notes || null,
        }),
      },
      "Interview scheduled",
      "The candidate interview has been added.",
    )
    if (scheduled) {
      setInterviewForm(initialInterviewForm)
      setShowInterviewDialog(false)
    }
  }

  const handleInterviewAction = async (interview: Interview, action: "complete" | "cancel") => {
    await runMutation(
      "/api/recruitment/interviews",
      { method: "PATCH", body: JSON.stringify({ id: interview.id, action }) },
      action === "complete" ? "Interview completed" : "Interview cancelled",
      `${interview.candidate_name || "Candidate"} interview was updated.`,
    )
  }

  const openOfferEditor = (offer: Offer) => {
    const rem = offer.remuneration && typeof offer.remuneration === "object" ? offer.remuneration : {}
    const extras = Array.isArray(rem.extras) ? rem.extras : []
    setEditingOffer(offer)
    setOfferEditForm({
      salary: String(offer.salary ?? 0),
      currency: offer.currency || "GHS",
      start_date: offer.start_date || "",
      acceptance_deadline: offer.acceptance_deadline || "",
      benefits: asStringList(offer.benefits).join("\n"),
      remuneration_extras: extras.map(String).join("\n"),
      terms: offer.terms || "",
      offer_letter_text: offer.offer_letter_text || "",
      working_hours: offer.working_hours || "08:00 – 17:00",
      probation_months: String(offer.probation_months ?? 3),
      notice_months: String(offer.notice_months ?? 1),
      signatory_name: offer.signatory_name || "",
      signatory_title: offer.signatory_title || "",
      department: offer.department || "",
    })
  }

  const saveOfferEdits = async (opts?: { regenerate?: boolean; polish?: boolean }) => {
    if (!editingOffer || !offerEditForm) return
    setOfferSaving(true)
    try {
      const body: Record<string, unknown> = {
        id: editingOffer.id,
        company_id: companyId || editingOffer.company_id,
        salary: Number(offerEditForm.salary) || 0,
        currency: offerEditForm.currency || "GHS",
        start_date: offerEditForm.start_date || null,
        acceptance_deadline: offerEditForm.acceptance_deadline || null,
        benefits: splitList(offerEditForm.benefits.replace(/\n/g, ",")),
        remuneration_extras: splitList(offerEditForm.remuneration_extras.replace(/\n/g, ",")),
        terms: offerEditForm.terms || null,
        offer_letter_text: offerEditForm.offer_letter_text,
        working_hours: offerEditForm.working_hours || null,
        probation_months: Number(offerEditForm.probation_months) || 3,
        notice_months: Number(offerEditForm.notice_months) || 1,
        signatory_name: offerEditForm.signatory_name || null,
        signatory_title: offerEditForm.signatory_title || null,
        department: offerEditForm.department || null,
      }
      if (opts?.regenerate) body.action = "regenerate_letter"
      if (opts?.polish) body.action = "polish_letter"

      const res = await fetch("/api/recruitment/offers", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || json.hint || "Failed to save offer")

      const keepEditorOpen = Boolean(opts?.regenerate || opts?.polish)
      if (keepEditorOpen && json.offer) {
        setEditingOffer(json.offer)
        setOfferEditForm((prev) =>
          prev
            ? {
                ...prev,
                offer_letter_text: json.offer.offer_letter_text || prev.offer_letter_text,
                benefits: asStringList(json.offer.benefits).join("\n"),
                salary: String(json.offer.salary ?? prev.salary),
                currency: json.offer.currency || prev.currency,
              }
            : prev,
        )
      } else {
        // Plain save — close dialog so the user returns to the Offers list
        setEditingOffer(null)
        setOfferEditForm(null)
      }

      toast({
        title: opts?.polish ? "Letter polished" : opts?.regenerate ? "Letter regenerated" : "Offer saved",
        description: opts?.polish
          ? json.offer?.ai_letter_notes || "AI updated the letter draft."
          : opts?.regenerate
            ? "Letter regenerated from remuneration and benefits."
            : "Remuneration, benefits, and letter were updated.",
      })

      // Refresh list in the background so the Save button isn't stuck waiting
      void loadRecruitment(companyId || editingOffer.company_id)
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save offer",
        variant: "destructive",
      })
    } finally {
      setOfferSaving(false)
    }
  }

  const handleOfferAction = async (
    offer: Offer,
    action: "send" | "accept" | "reject" | "withdraw",
  ) => {
    setSaving(true)
    try {
      const res = await fetch("/api/recruitment/offers", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offer.id,
          company_id: companyId || offer.company_id,
          action,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Offer update failed")
      await loadRecruitment(companyId)
      const emailNote =
        action === "send" && json.email
          ? ` Email: ${json.email.status}${json.email.error ? ` (${json.email.error})` : ""}.`
          : ""
      if (action === "accept") {
        toast({
          title: "Offer accepted",
          description: json.onboarding_created
            ? `${getOfferCandidateName(offer)} moved to onboarding.`
            : `${getOfferCandidateName(offer)} accepted — onboarding is ready.`,
        })
        setActiveTab("onboarding")
      } else {
        toast({
          title: "Offer updated",
          description: `Offer for ${getOfferCandidateName(offer)} marked ${action}.${emailNote}`,
        })
      }
    } catch (err) {
      toast({
        title: "Offer action failed",
        description: err instanceof Error ? err.message : "Could not update offer",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleManualOfferStatus = async (offer: Offer, status: string) => {
    await runMutation(
      "/api/recruitment/offers",
      {
        method: "PATCH",
        body: JSON.stringify({
          id: offer.id,
          company_id: companyId || offer.company_id,
          action: "set_status",
          status,
        }),
      },
      "Status updated",
      `Offer status set to ${status}. Application portal synced.`,
    )
  }

  const copyOfferLink = async (offer: Offer) => {
    const url =
      offer.respond_url ||
      (offer.short_code ? buildOfferRespondUrl(offer.short_code) : "") ||
      (offer.id ? buildOfferRespondUrl(offer.id) : "")
    if (!url) {
      toast({
        title: "No link yet",
        description: "Could not build a candidate response link for this offer.",
        variant: "destructive",
      })
      return
    }
    const absolute = url.startsWith("http") ? url : `${window.location.origin}${url}`
    await navigator.clipboard.writeText(absolute)
    toast({ title: "Link copied", description: absolute })
  }

  const handleDownloadOfferPdf = (offer: Offer) => {
    const cid = companyId || offer.company_id || ""
    const qs = cid ? `?company_id=${encodeURIComponent(cid)}` : ""
    window.open(`/api/recruitment/offers/${offer.id}/pdf${qs}`, "_blank", "noopener,noreferrer")
    toast({
      title: "Opening PDF view",
      description: "Use your browser Print dialog → Save as PDF.",
    })
  }

  const handleTaskComplete = async (task: OnboardingTask) => {
    await runMutation(
      "/api/recruitment/onboarding",
      { method: "PATCH", body: JSON.stringify({ task_id: task.id, status: "completed" }) },
      "Task completed",
      `${task.title} was marked complete.`,
    )
  }

  const handleCompleteOnboarding = async (checklist: OnboardingChecklist) => {
    await runMutation(
      "/api/recruitment/onboarding",
      { method: "PATCH", body: JSON.stringify({ id: checklist.id, action: "complete" }) },
      "Onboarding completed",
      `${checklist.candidate_name || "Candidate"} onboarding is complete.`,
    )
  }

  const getApplicationJobTitle = (application: Application) => {
    return application.job_title || jobs.find((job) => job.id === application.job_posting_id)?.title || "Role"
  }

  const getOfferCandidateName = (offer: Offer) => {
    return offer.candidate_name || applicationsById.get(offer.application_id || "")?.candidate_name || "Candidate"
  }

  const getOfferJobTitle = (offer: Offer) => {
    return offer.job_title || applicationsById.get(offer.application_id || "")?.job_title || "Role"
  }

  const getOnboardingJobTitle = (checklist: OnboardingChecklist) => {
    return (
      checklist.job_title ||
      applicationsById.get(checklist.application_id || "")?.job_title ||
      "New hire"
    )
  }

  const handleExportAnalytics = () => {
    const funnel = analytics.funnel ?? {}
    const sources = analytics.sources ?? {}
    const rows = [
      ["Recruitment Analytics Export"],
      [`Generated ${new Date().toISOString()}`],
      [],
      ["Metric", "Value"],
      ["Active Jobs", metrics.active_jobs],
      ["Total Applications", metrics.total_applications],
      ["Scheduled Interviews", metrics.interviews_scheduled],
      ["Offers Extended", metrics.offers_extended],
      ["Requisitions", metrics.requisitions],
      ["Active Onboarding", metrics.onboarding_active],
      [],
      ["Funnel Stage", "Applications"],
      ...Object.entries(funnel).map(([stage, count]) => [stage, count]),
      [],
      ["Source", "Applications"],
      ...Object.entries(sources).map(([source, count]) => [source, count]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n")}`
    downloadBlob("recruitment-analytics.csv", csv, "text/csv;charset=utf-8")
    toast({ title: "Analytics exported", description: "CSV export downloaded successfully." })
  }

  const handleShareJob = async (job: JobPosting) => {
    if (job.status !== "published") {
      toast({
        title: "Publish first",
        description: "Publish the job before sharing the public apply link.",
        variant: "destructive",
      })
      return
    }

    let shortCode = job.short_code
    if (!shortCode) {
      try {
        const res = await fetch("/api/recruitment/jobs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: job.id, action: "ensure_short_code", status: "published" }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Could not create share code")
        shortCode = json.job?.short_code
        await loadRecruitment(companyId)
      } catch (err) {
        toast({
          title: "Share failed",
          description: err instanceof Error ? err.message : "Could not create share link",
          variant: "destructive",
        })
        return
      }
    }

    const url =
      buildJobApplyUrl(String(shortCode || ""), window.location.origin) ||
      `${window.location.origin}/j/${encodeURIComponent(String(shortCode || job.slug || job.id))}`

    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Apply link copied",
        description: `Short link ready: ${url}`,
      })
    } catch {
      toast({ title: "Copy failed", description: url, variant: "destructive" })
    }
  }

  const metricCards = [
    { label: "Active Jobs", value: metrics.active_jobs, icon: Briefcase, tone: "text-emerald-600" },
    { label: "Applications", value: metrics.total_applications, icon: Users, tone: "text-blue-600" },
    { label: "Interviews", value: metrics.interviews_scheduled, icon: Calendar, tone: "text-purple-600" },
    { label: "Offers", value: metrics.offers_extended, icon: FileText, tone: "text-amber-600" },
    { label: "Requisitions", value: metrics.requisitions, icon: ClipboardCheck, tone: "text-slate-600" },
    { label: "Onboarding", value: metrics.onboarding_active, icon: UserPlus, tone: "text-teal-600" },
  ]

  const totalFunnel = Object.values(analytics.funnel ?? {}).reduce((sum, count) => sum + count, 0)
  const sourceEntries = Object.entries(analytics.sources ?? {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">
            Recruitment tracking system for requisitions, jobs, candidates and hiring workflows
          </p>
          {lastSynced ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Last synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadRecruitment(companyId)} disabled={loading || saving}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync
          </Button>
          <Dialog open={showRequisitionDialog} onOpenChange={setShowRequisitionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create requisition</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateRequisition}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="req-title">Title</Label>
                    <Input
                      id="req-title"
                      required
                      value={requisitionForm.title}
                      onChange={(event) => setRequisitionForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={requisitionForm.department || "__none__"}
                      onValueChange={(value) =>
                        setRequisitionForm((prev) => ({
                          ...prev,
                          department: value === "__none__" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select department</SelectItem>
                        {departments.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!departments.length ? (
                      <Input
                        placeholder="Type department"
                        value={requisitionForm.department}
                        onChange={(event) =>
                          setRequisitionForm((prev) => ({ ...prev, department: event.target.value }))
                        }
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select
                      value={requisitionForm.location || "__none__"}
                      onValueChange={(value) =>
                        setRequisitionForm((prev) => ({
                          ...prev,
                          location: value === "__none__" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select location</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!locations.length ? (
                      <Input
                        placeholder="Type location"
                        value={requisitionForm.location}
                        onChange={(event) =>
                          setRequisitionForm((prev) => ({ ...prev, location: event.target.value }))
                        }
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Employment type</Label>
                    <Select
                      value={requisitionForm.employment_type}
                      onValueChange={(value) => setRequisitionForm((prev) => ({ ...prev, employment_type: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={requisitionForm.priority}
                      onValueChange={(value) => setRequisitionForm((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-headcount">Headcount</Label>
                    <Input
                      id="req-headcount"
                      min="1"
                      type="number"
                      value={requisitionForm.headcount}
                      onChange={(event) => setRequisitionForm((prev) => ({ ...prev, headcount: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-budget-min">Budget min</Label>
                    <Input
                      id="req-budget-min"
                      min="0"
                      type="number"
                      value={requisitionForm.budget_min}
                      onChange={(event) => setRequisitionForm((prev) => ({ ...prev, budget_min: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-budget-max">Budget max</Label>
                    <Input
                      id="req-budget-max"
                      min="0"
                      type="number"
                      value={requisitionForm.budget_max}
                      onChange={(event) => setRequisitionForm((prev) => ({ ...prev, budget_max: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Requestor (HOD / Supervisor)</Label>
                    <Select
                      value={requisitionForm.requester_mode || "__none__"}
                      onValueChange={(value) => {
                        if (value === "__none__") {
                          setRequisitionForm((prev) => ({
                            ...prev,
                            requester_mode: "",
                            requester_employee_id: "",
                            requester_name: "",
                          }))
                          return
                        }
                        if (value === "__manual__") {
                          setRequisitionForm((prev) => ({
                            ...prev,
                            requester_mode: "__manual__",
                            requester_employee_id: "",
                          }))
                          return
                        }
                        const person = requestorOptions.find((p) => p.id === value)
                        setRequisitionForm((prev) => ({
                          ...prev,
                          requester_mode: value,
                          requester_employee_id: value,
                          requester_name: person?.name || "",
                        }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select requestor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select requestor</SelectItem>
                        {requestorOptions.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                            {person.position ? ` · ${person.position}` : ""}
                            {person.department ? ` · ${person.department}` : ""}
                          </SelectItem>
                        ))}
                        <SelectItem value="__manual__">Type name manually…</SelectItem>
                      </SelectContent>
                    </Select>
                    {requisitionForm.requester_mode === "__manual__" ? (
                      <Input
                        placeholder="Enter requestor name"
                        value={requisitionForm.requester_name}
                        onChange={(event) =>
                          setRequisitionForm((prev) => ({ ...prev, requester_name: event.target.value }))
                        }
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-deadline">Deadline</Label>
                    <Input
                      id="req-deadline"
                      type="date"
                      value={requisitionForm.deadline}
                      onChange={(event) => setRequisitionForm((prev) => ({ ...prev, deadline: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-description">Description</Label>
                  <Textarea
                    id="req-description"
                    rows={3}
                    value={requisitionForm.description}
                    onChange={(event) => setRequisitionForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-requirements">Requirements</Label>
                  <Textarea
                    id="req-requirements"
                    rows={3}
                    placeholder="One per line or comma-separated"
                    value={requisitionForm.requirements}
                    onChange={(event) => setRequisitionForm((prev) => ({ ...prev, requirements: event.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowRequisitionDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create job posting</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={(event) => void handleCreateJob(event, "draft")}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Title</Label>
                    <Input
                      id="job-title"
                      required
                      value={jobForm.title}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Requisition</Label>
                    <Select
                      value={jobForm.requisition_id}
                      onValueChange={(value) => {
                        const req = requisitions.find((r) => r.id === value)
                        setJobForm((prev) => ({
                          ...prev,
                          requisition_id: value,
                          title: prev.title || req?.title || "",
                          department: req?.department || prev.department,
                          location: req?.location || prev.location,
                          employment_type: req?.employment_type || prev.employment_type,
                        }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No requisition</SelectItem>
                        {requisitions.map((requisition) => (
                          <SelectItem key={requisition.id} value={requisition.id}>
                            {requisition.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={jobForm.department || "__none__"}
                      onValueChange={(value) =>
                        setJobForm((prev) => ({ ...prev, department: value === "__none__" ? "" : value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select department</SelectItem>
                        {departments.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!departments.length ? (
                      <Input
                        placeholder="Type department"
                        value={jobForm.department}
                        onChange={(event) => setJobForm((prev) => ({ ...prev, department: event.target.value }))}
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select
                      value={jobForm.location || "__none__"}
                      onValueChange={(value) =>
                        setJobForm((prev) => ({ ...prev, location: value === "__none__" ? "" : value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select location</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!locations.length ? (
                      <Input
                        placeholder="Type location"
                        value={jobForm.location}
                        onChange={(event) => setJobForm((prev) => ({ ...prev, location: event.target.value }))}
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Employment type</Label>
                    <Select
                      value={jobForm.employment_type}
                      onValueChange={(value) => setJobForm((prev) => ({ ...prev, employment_type: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-expires">Application deadline</Label>
                    <Input
                      id="job-expires"
                      type="date"
                      value={jobForm.expires_at}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-salary-min">Salary min</Label>
                    <Input
                      id="job-salary-min"
                      min="0"
                      type="number"
                      value={jobForm.salary_min}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, salary_min: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-salary-max">Salary max</Label>
                    <Input
                      id="job-salary-max"
                      min="0"
                      type="number"
                      value={jobForm.salary_max}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, salary_max: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-description">Description</Label>
                  <Textarea
                    id="job-description"
                    required
                    rows={4}
                    value={jobForm.description}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job-requirements">Requirements</Label>
                    <Textarea
                      id="job-requirements"
                      rows={3}
                      value={jobForm.requirements}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, requirements: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-benefits">Benefits</Label>
                    <Textarea
                      id="job-benefits"
                      rows={3}
                      value={jobForm.benefits}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, benefits: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowJobDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="outline" disabled={saving}>
                    Save draft
                  </Button>
                  <Button type="button" disabled={saving} onClick={() => void submitJob("published")}>
                    <Send className="h-4 w-4" />
                    Publish
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loadError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{loadError}</span>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {metricCards.map((metric) => {
              const Icon = metric.icon
              return (
                <Card key={metric.label}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${metric.tone}`} />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent applications</CardTitle>
                <CardDescription>Newest candidates from the database.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentApplications.length ? (
                  <div className="space-y-3">
                    {recentApplications.map((application) => (
                      <div key={application.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{application.candidate_name || "Candidate"}</p>
                          <p className="text-sm text-muted-foreground">{getApplicationJobTitle(application)}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={statusClass(application.status)}>
                            {application.status || "unknown"}
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(application.applied_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Users} title="No applications yet" description="Applications will appear here after candidates apply or are added." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming interviews</CardTitle>
                <CardDescription>Scheduled interviews sorted by the API.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingInterviews.length ? (
                  <div className="space-y-3">
                    {upcomingInterviews.map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{interview.candidate_name || "Candidate"}</p>
                          <p className="text-sm text-muted-foreground">{interview.job_title || "Role"}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p>{formatDateTime(interview.scheduled_at)}</p>
                          <p className="text-xs text-muted-foreground">{interview.interview_type || "interview"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Calendar} title="No interviews scheduled" description="Schedule interviews from the Applications or Interviews tabs." />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requisitions" className="space-y-4">
          <Card>
            <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Requisitions</CardTitle>
                <CardDescription>Search and approve hiring requests from the database.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 sm:w-72"
                    placeholder="Search requisitions"
                    value={requisitionSearch}
                    onChange={(event) => setRequisitionSearch(event.target.value)}
                  />
                </div>
                <Select value={requisitionStatus} onValueChange={setRequisitionStatus}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending_approval">Pending approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequisitions.length ? (
                <div className="grid gap-4">
                  {filteredRequisitions.map((requisition) => (
                    <div key={requisition.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{requisition.title}</h3>
                            <Badge variant="outline" className={priorityClass(requisition.priority)}>
                              {requisition.priority || "priority"}
                            </Badge>
                            <Badge variant="outline" className={statusClass(requisition.status)}>
                              {requisition.status || "unknown"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {requisition.department || "No department"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {requisition.location || "No location"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {requisition.headcount || 1} headcount
                            </span>
                            <span>{formatMoney(requisition.currency, requisition.budget_min, requisition.budget_max)}</span>
                          </div>
                          {requisition.description ? <p className="max-w-3xl text-sm">{requisition.description}</p> : null}
                          <p className="text-xs text-muted-foreground">
                            Requested by {requisition.requester_name || "Unknown"} · Created {formatDate(requisition.created_at)} · Deadline{" "}
                            {formatDate(requisition.deadline)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving || requisition.status === "approved"}
                            onClick={() => void handleApproveRequisition(requisition.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No requisitions found"
                  description="Create a requisition or adjust your search and status filters."
                  action={
                    <Button variant="outline" onClick={() => setShowRequisitionDialog(true)}>
                      <Plus className="h-4 w-4" />
                      New requisition
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Jobs</CardTitle>
                <CardDescription>Publish, pause, duplicate, share, and archive job postings.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 sm:w-72" placeholder="Search jobs" value={jobSearch} onChange={(event) => setJobSearch(event.target.value)} />
                </div>
                <Select value={jobStatus} onValueChange={setJobStatus}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredJobs.length ? (
                <div className="grid gap-4">
                  {filteredJobs.map((job) => {
                    const applicationCount = job.applications_count ?? applicationsByJob.get(job.id) ?? 0
                    return (
                      <div key={job.id} className="rounded-lg border p-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold">{job.title}</h3>
                              <Badge variant="outline" className={statusClass(job.status)}>
                                {job.status || "unknown"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.department || "No department"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location || "No location"}
                              </span>
                              <span>{job.employment_type || "Employment type not set"}</span>
                              <span>{formatMoney(job.currency, job.salary_min, job.salary_max)}</span>
                            </div>
                            {job.description ? <p className="max-w-3xl text-sm">{job.description}</p> : null}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>{applicationCount} applications</span>
                              <span>{job.views_count ?? 0} views</span>
                              <span>Published {formatDate(job.published_at)}</span>
                              {job.short_code ? (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                                  /j/{job.short_code}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" disabled={saving || job.status === "published"} onClick={() => void handleJobAction(job, "publish")}>
                              <PlayCircle className="h-4 w-4" />
                              Publish
                            </Button>
                            <Button size="sm" variant="outline" disabled={saving || job.status === "paused"} onClick={() => void handleJobAction(job, "pause")}>
                              <PauseCircle className="h-4 w-4" />
                              Pause
                            </Button>
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => void handleJobAction(job, "duplicate")}>
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={() => void handleShareJob(job)}
                              title={
                                job.short_code
                                  ? `Share /j/${job.short_code}`
                                  : "Generate short public apply link"
                              }
                            >
                              <Share2 className="h-4 w-4" />
                              Share
                            </Button>
                            <Button size="sm" variant="destructive" disabled={saving || job.status === "archived"} onClick={() => void handleJobAction(job, "archive")}>
                              <Trash2 className="h-4 w-4" />
                              Archive
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No jobs found"
                  description="Create a job posting or adjust your filters."
                  action={
                    <Button onClick={() => setShowJobDialog(true)}>
                      <Plus className="h-4 w-4" />
                      New job
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>Review candidates and trigger workflow actions.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 sm:w-72"
                    placeholder="Search applications"
                    value={applicationSearch}
                    onChange={(event) => setApplicationSearch(event.target.value)}
                  />
                </div>
                <Select value={applicationStatus} onValueChange={setApplicationStatus}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4" />
                      Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Create application</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreateApplication}>
                      <div className="space-y-2">
                        <Label>Job</Label>
                        <Select
                          value={applicationForm.job_posting_id}
                          onValueChange={(value) => setApplicationForm((prev) => ({ ...prev, job_posting_id: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a job" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs.map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="app-name">Candidate name</Label>
                          <Input
                            id="app-name"
                            required
                            value={applicationForm.candidate_name}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, candidate_name: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="app-email">Email</Label>
                          <Input
                            id="app-email"
                            type="email"
                            value={applicationForm.email}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, email: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="app-phone">Phone</Label>
                          <Input
                            id="app-phone"
                            value={applicationForm.phone}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, phone: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="app-location">Location</Label>
                          <Input
                            id="app-location"
                            value={applicationForm.location}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, location: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="app-source">Source</Label>
                          <Input
                            id="app-source"
                            value={applicationForm.source}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, source: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="app-score">Score</Label>
                          <Input
                            id="app-score"
                            min="0"
                            max="100"
                            type="number"
                            value={applicationForm.score}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, score: event.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app-experience">Experience summary</Label>
                        <Textarea
                          id="app-experience"
                          rows={2}
                          value={applicationForm.experience_text}
                          onChange={(event) => setApplicationForm((prev) => ({ ...prev, experience_text: event.target.value }))}
                          placeholder="Relevant roles, years, achievements"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app-linkedin">LinkedIn URL</Label>
                        <Input
                          id="app-linkedin"
                          type="url"
                          value={applicationForm.linkedin_url}
                          onChange={(event) => setApplicationForm((prev) => ({ ...prev, linkedin_url: event.target.value }))}
                          placeholder="https://linkedin.com/in/…"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="app-skills">Skills</Label>
                          <Textarea
                            id="app-skills"
                            rows={3}
                            value={applicationForm.skills}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, skills: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="app-education">Education</Label>
                          <Textarea
                            id="app-education"
                            rows={3}
                            value={applicationForm.education}
                            onChange={(event) => setApplicationForm((prev) => ({ ...prev, education: event.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app-notes">Notes</Label>
                        <Textarea
                          id="app-notes"
                          rows={3}
                          value={applicationForm.notes}
                          onChange={(event) => setApplicationForm((prev) => ({ ...prev, notes: event.target.value }))}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowApplicationDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving || !applicationForm.job_posting_id}>
                          Create
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {filteredApplications.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>CV</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div>
                            <button
                              type="button"
                              className="font-medium text-left text-emerald-700 hover:underline"
                              onClick={() => void openApplicationPreview(application)}
                            >
                              {application.candidate_name || "Candidate"}
                            </button>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {application.candidate_email ? (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {application.candidate_email}
                                </span>
                              ) : null}
                              <span>{formatDate(application.applied_at)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getApplicationJobTitle(application)}</TableCell>
                        <TableCell>
                          {application.resume_url ? (
                            <a
                              href={application.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {application.resume_filename || "View CV"}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">No CV</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusClass(application.status)}>
                            {application.status || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>{application.score ?? 0}%</TableCell>
                        <TableCell>{application.source || "direct"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => void handleApplicationAction(application, "screen")}>
                              Screen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={() => {
                                setInterviewForm((prev) => ({ ...prev, application_id: application.id }))
                                setShowInterviewDialog(true)
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                              Interview
                            </Button>
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => void handleApplicationAction(application, "generate_offer")}>
                              Offer
                            </Button>
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => void handleApplicationAction(application, "start_onboarding")}>
                              Onboard
                            </Button>
                            <Button size="sm" variant="destructive" disabled={saving} onClick={() => void handleApplicationAction(application, "reject")}>
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No applications found"
                  description="Create an application or adjust your search and status filters."
                  action={
                    <Button disabled={!jobs.length} onClick={() => setShowApplicationDialog(true)}>
                      <Plus className="h-4 w-4" />
                      New application
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-4">
          <Card>
            <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Interviews</CardTitle>
                <CardDescription>Schedule, complete, and cancel interviews.</CardDescription>
              </div>
              <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
                <DialogTrigger asChild>
                  <Button disabled={!applications.length}>
                    <Plus className="h-4 w-4" />
                    Schedule interview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Schedule interview</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleScheduleInterview}>
                    <div className="space-y-2">
                      <Label>Application</Label>
                      <Select
                        value={interviewForm.application_id}
                        onValueChange={(value) => setInterviewForm((prev) => ({ ...prev, application_id: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an application" />
                        </SelectTrigger>
                        <SelectContent>
                          {applications.map((application) => (
                            <SelectItem key={application.id} value={application.id}>
                              {application.candidate_name || "Candidate"} · {getApplicationJobTitle(application)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="int-date">Date</Label>
                        <Input
                          id="int-date"
                          required
                          type="date"
                          value={interviewForm.date}
                          onChange={(event) => setInterviewForm((prev) => ({ ...prev, date: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="int-time">Time</Label>
                        <Input
                          id="int-time"
                          required
                          type="time"
                          value={interviewForm.time}
                          onChange={(event) => setInterviewForm((prev) => ({ ...prev, time: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={interviewForm.interview_type}
                          onValueChange={(value) => setInterviewForm((prev) => ({ ...prev, interview_type: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="in_person">In person</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="int-duration">Duration minutes</Label>
                        <Input
                          id="int-duration"
                          min="15"
                          type="number"
                          value={interviewForm.duration_minutes}
                          onChange={(event) => setInterviewForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="int-interviewer">Interviewer</Label>
                        <Input
                          id="int-interviewer"
                          value={interviewForm.interviewer_name}
                          onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewer_name: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="int-location">Location or room</Label>
                        <Input
                          id="int-location"
                          value={interviewForm.location}
                          onChange={(event) => setInterviewForm((prev) => ({ ...prev, location: event.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="int-meeting">Meeting URL</Label>
                      <Input
                        id="int-meeting"
                        value={interviewForm.meeting_url}
                        onChange={(event) => setInterviewForm((prev) => ({ ...prev, meeting_url: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="int-notes">Notes</Label>
                      <Textarea
                        id="int-notes"
                        rows={3}
                        value={interviewForm.notes}
                        onChange={(event) => setInterviewForm((prev) => ({ ...prev, notes: event.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowInterviewDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving || !interviewForm.application_id}>
                        Schedule
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {interviews.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Interviewer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell>
                          <p className="font-medium">{interview.candidate_name || "Candidate"}</p>
                          <p className="text-xs text-muted-foreground">{interview.job_title || "Role"}</p>
                        </TableCell>
                        <TableCell>
                          <p>{formatDateTime(interview.scheduled_at)}</p>
                          <p className="text-xs text-muted-foreground">
                            {interview.interview_type || "interview"} · {interview.duration_minutes || 60} min
                          </p>
                        </TableCell>
                        <TableCell>{interview.interviewer_name || "Unassigned"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusClass(interview.status)}>
                            {interview.status || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving || interview.status !== "scheduled"}
                              onClick={() => void handleInterviewAction(interview, "complete")}
                            >
                              <Check className="h-4 w-4" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={saving || interview.status !== "scheduled"}
                              onClick={() => void handleInterviewAction(interview, "cancel")}
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={Calendar} title="No interviews" description="Schedule an interview once applications are available." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offer letters</CardTitle>
            </CardHeader>
            <CardContent>
              {offers.length ? (
                <div className="grid gap-4">
                  {offers.map((offer) => {
                    const benefits = asStringList(offer.benefits)
                    return (
                      <div key={offer.id} className="rounded-xl border bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold">{getOfferCandidateName(offer)}</h3>
                              <Badge variant="outline" className={statusClass(offer.status)}>
                                {offer.status || "draft"}
                              </Badge>
                              {offer.email_status ? (
                                <Badge variant="secondary">Email {offer.email_status}</Badge>
                              ) : null}
                              {offer.response_channel ? (
                                <Badge variant="outline">via {offer.response_channel}</Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getOfferJobTitle(offer)}
                              {offer.department ? ` · ${offer.department}` : ""}
                              {offer.candidate_email ? ` · ${offer.candidate_email}` : ""}
                            </p>
                            <div className="grid gap-2 sm:grid-cols-3 text-sm">
                              <div className="rounded-lg border bg-white px-3 py-2">
                                <p className="text-xs text-muted-foreground">Remuneration</p>
                                <p className="font-semibold text-emerald-800">
                                  {offer.currency || "GHS"} {(offer.salary ?? 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="rounded-lg border bg-white px-3 py-2">
                                <p className="text-xs text-muted-foreground">Start / deadline</p>
                                <p>Start {formatDate(offer.start_date)}</p>
                                <p className="text-xs text-muted-foreground">By {formatDate(offer.acceptance_deadline)}</p>
                              </div>
                              <div className="rounded-lg border bg-white px-3 py-2">
                                <p className="text-xs text-muted-foreground">Portal</p>
                                <p className="truncate text-xs">{offer.short_code || "—"}</p>
                                <p className="text-xs text-muted-foreground">{offer.public_views ?? 0} views</p>
                              </div>
                            </div>
                            {benefits.length ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                Benefits: {benefits.join(" · ")}
                              </p>
                            ) : null}
                            {offer.candidate_response_note ? (
                              <p className="text-xs rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900">
                                Candidate note: {offer.candidate_response_note}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openOfferEditor(offer)}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setOfferPreview(offer)}>
                                <FileText className="h-4 w-4" />
                                Preview
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDownloadOfferPdf(offer)}>
                                <Download className="h-4 w-4" />
                                PDF
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => void copyOfferLink(offer)}>
                                <Link2 className="h-4 w-4" />
                                Copy link
                              </Button>
                            </div>
                            {(() => {
                              const terminal = ["accepted", "rejected", "withdrawn", "expired"].includes(
                                String(offer.status || ""),
                              )
                              const accepted = offer.status === "accepted"
                              return (
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={saving || terminal}
                                onClick={() => void handleOfferAction(offer, "send")}
                              >
                                <Send className="h-4 w-4" />
                                Send email + link
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={accepted ? "opacity-40 pointer-events-none" : ""}
                                disabled={saving || terminal}
                                onClick={() => void handleOfferAction(offer, "accept")}
                              >
                                {accepted ? "Accepted" : "Accept"}
                              </Button>
                              {accepted ? (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => setActiveTab("onboarding")}
                                >
                                  <UserPlus className="h-4 w-4" />
                                  Go to onboarding
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={saving || terminal}
                                className={terminal && !accepted ? "opacity-40" : ""}
                                onClick={() => void handleOfferAction(offer, "reject")}
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={saving || terminal}
                                className={terminal ? "opacity-40" : ""}
                                onClick={() => void handleOfferAction(offer, "withdraw")}
                              >
                                Withdraw
                              </Button>
                            </div>
                              )
                            })()}
                            <div className="flex flex-wrap justify-end gap-2 items-center">
                              <span className="text-xs text-muted-foreground">Manual status</span>
                              <Select
                                value={offer.status || "draft"}
                                onValueChange={(value) => void handleManualOfferStatus(offer, value)}
                              >
                                <SelectTrigger className="h-8 w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["draft", "sent", "accepted", "rejected", "withdrawn", "expired"].map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No offers yet"
                  description="Generate an offer from Applications when a candidate is ready. You can then edit salary, benefits, and the letter before sending."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Active hires</p>
                <p className="text-2xl font-semibold text-emerald-700">
                  {onboarding.filter((c) => c.status === "in_progress" || c.status === "pending").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold">
                  {onboarding.filter((c) => c.status === "completed").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Avg. progress</p>
                <p className="text-2xl font-semibold">
                  {onboarding.length
                    ? Math.round(
                        onboarding.reduce((sum, c) => sum + Number(c.progress || 0), 0) / onboarding.length,
                      )
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>New hire onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              {onboarding.length ? (
                <div className="grid gap-5">
                  {onboarding.map((checklist) => {
                    const stages = [
                      "welcome",
                      "documents",
                      "accounts",
                      "payroll_setup",
                      "orientation",
                      "day_one",
                      "completed",
                    ]
                    const stageLabels: Record<string, string> = {
                      welcome: "Welcome",
                      documents: "Documents",
                      accounts: "Accounts",
                      payroll_setup: "Payroll",
                      orientation: "Orientation",
                      day_one: "Day one",
                      completed: "Done",
                    }
                    const currentStage = checklist.stage || "welcome"
                    const stageIdx = Math.max(0, stages.indexOf(currentStage))
                    const tasks = [...(checklist.tasks || [])].sort(
                      (a, b) => Number(a.sort_order ?? 999) - Number(b.sort_order ?? 999),
                    )
                    const doneCount = tasks.filter(
                      (t) => t.status === "completed" || t.status === "skipped",
                    ).length
                    return (
                      <div
                        key={checklist.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 border-b bg-white/80 p-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-semibold tracking-tight">
                                {checklist.candidate_name || "New hire"}
                              </h3>
                              <Badge variant="outline" className={statusClass(checklist.status)}>
                                {checklist.status || "in_progress"}
                              </Badge>
                              {checklist.auto_started ? (
                                <Badge variant="secondary">Auto-started</Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {checklist.job_title || getOnboardingJobTitle(checklist)}
                              {checklist.department ? ` · ${checklist.department}` : ""}
                              {" · "}Start {formatDate(checklist.start_date)}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {checklist.manager_name ? <span>Manager: {checklist.manager_name}</span> : null}
                              {checklist.buddy_name ? <span>Buddy: {checklist.buddy_name}</span> : null}
                              <span>
                                Tasks {doneCount}/{tasks.length}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-3">
                              <Progress value={checklist.progress ?? 0} className="h-2 w-40" />
                              <span className="text-sm font-semibold tabular-nums">
                                {checklist.progress ?? 0}%
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving || checklist.status === "completed"}
                              onClick={() => void handleCompleteOnboarding(checklist)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {checklist.status === "completed" ? "Completed" : "Mark onboarding complete"}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          <div className="flex flex-wrap gap-2">
                            {stages.map((stage, idx) => {
                              const active = idx === stageIdx
                              const done = idx < stageIdx || currentStage === "completed"
                              return (
                                <div
                                  key={stage}
                                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                                    done
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : active
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white text-slate-500 border-slate-200"
                                  }`}
                                >
                                  {stageLabels[stage] || stage}
                                </div>
                              )
                            })}
                          </div>

                          {checklist.progress_notes ? (
                            <p className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-950">
                              Latest note: {checklist.progress_notes}
                            </p>
                          ) : null}

                          <div className="grid gap-2">
                            {tasks.length ? (
                              tasks.map((task) => {
                                const done = task.status === "completed" || task.status === "skipped"
                                return (
                                  <div
                                    key={task.id}
                                    className={`flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row sm:items-center sm:justify-between ${
                                      done ? "opacity-70" : ""
                                    }`}
                                  >
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className={`font-medium ${done ? "line-through" : ""}`}>
                                          {task.title}
                                        </p>
                                        {task.stage ? (
                                          <Badge variant="outline" className="text-[10px] capitalize">
                                            {String(task.stage).replace(/_/g, " ")}
                                          </Badge>
                                        ) : null}
                                        <Badge variant="outline" className={statusClass(task.status)}>
                                          {task.status || "pending"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {task.description || task.task_type || "Onboarding task"}
                                        {" · "}
                                        {task.assigned_department || task.assigned_to || task.department || "Unassigned"}
                                        {" · Due "}
                                        {formatDate(task.due_date)}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={done ? "secondary" : "outline"}
                                      disabled={saving || done}
                                      onClick={() => void handleTaskComplete(task)}
                                    >
                                      {done ? "Done" : "Mark complete"}
                                    </Button>
                                  </div>
                                )
                              })
                            ) : (
                              <EmptyState
                                icon={ClipboardCheck}
                                title="No onboarding tasks"
                                description="Tasks appear when onboarding starts from an accepted offer."
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={UserPlus}
                  title="No active onboarding"
                  description="When an offer is accepted (portal or admin), the hire appears here automatically."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Hiring funnel</CardTitle>
                  <CardDescription>Derived from application statuses returned by the API.</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportAnalytics}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {Object.keys(analytics.funnel ?? {}).length ? (
                  <div className="space-y-4">
                    {Object.entries(analytics.funnel).map(([stage, count]) => (
                      <div key={stage} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{stage.replace(/_/g, " ")}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress value={totalFunnel ? Math.round((count / totalFunnel) * 100) : 0} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={BarChart3} title="No funnel data" description="Funnel analytics will populate when applications exist." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sources</CardTitle>
                <CardDescription>Candidate source distribution.</CardDescription>
              </CardHeader>
              <CardContent>
                {sourceEntries.length ? (
                  <div className="space-y-3">
                    {sourceEntries.map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm capitalize">{source}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={BarChart3} title="No source data" description="Sources will appear after applications are added." />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Application preview */}
      <Dialog open={Boolean(previewApplication)} onOpenChange={(open) => !open && setPreviewApplication(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Application preview</DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading application…
            </div>
          ) : previewApplication ? (
            <div className="space-y-5">
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{previewApplication.candidate_name || "Candidate"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {previewApplication.job_title || "Role"}
                      {previewApplication.department ? ` · ${previewApplication.department}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={statusClass(previewApplication.status)}>
                      {previewApplication.status || "unknown"}
                    </Badge>
                    <Badge variant="secondary">{previewApplication.score ?? 0}% score</Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <p><span className="text-muted-foreground">Email:</span> {previewApplication.candidate_email || "—"}</p>
                <p><span className="text-muted-foreground">Phone:</span> {previewApplication.candidate_phone || "—"}</p>
                <p><span className="text-muted-foreground">Location:</span> {previewApplication.location || "—"}</p>
                <p><span className="text-muted-foreground">Source:</span> {previewApplication.source || "—"}</p>
                <p><span className="text-muted-foreground">Education:</span> {previewApplication.education || "—"}</p>
                <p><span className="text-muted-foreground">Previous company:</span> {previewApplication.previous_company || "—"}</p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Skills:</span>{" "}
                  {asStringList(previewApplication.skills).join(", ") || "—"}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">LinkedIn:</span>{" "}
                  {previewApplication.linkedin_url ? (
                    <a
                      href={previewApplication.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline break-all"
                    >
                      {previewApplication.linkedin_url}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Experience summary</h4>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {previewApplication.experience_text?.trim() || "No experience summary provided."}
                </p>
              </div>

              {previewApplication.cover_letter ? (
                <div>
                  <h4 className="font-medium mb-1">Cover note</h4>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{previewApplication.cover_letter}</p>
                </div>
              ) : null}

              <div className="rounded-xl border bg-slate-50/80 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-medium">CV / Resume for ATS</h4>
                  {previewApplication.resume_text_chars && previewApplication.resume_text_chars > 40 ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      Readable · {previewApplication.resume_text_chars.toLocaleString()} chars
                      {previewApplication.resume_text_method ? ` · ${previewApplication.resume_text_method}` : ""}
                    </Badge>
                  ) : previewApplication.resume_text?.trim() && previewApplication.resume_text.length > 40 ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      Readable · {previewApplication.resume_text.length.toLocaleString()} chars
                    </Badge>
                  ) : previewApplication.resume_url || previewApplication.resume_filename ? (
                    <Badge variant="outline" className="text-amber-800 border-amber-300">
                      Uploaded — text will extract on screen
                    </Badge>
                  ) : (
                    <Badge variant="outline">No CV</Badge>
                  )}
                </div>
                {previewApplication.resume_extract_warning ? (
                  <p className="text-xs text-amber-700">{previewApplication.resume_extract_warning}</p>
                ) : null}
                {previewApplication.resume_url ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={previewApplication.resume_url} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4" />
                      {previewApplication.resume_filename || "View CV"}
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No CV uploaded</p>
                )}
                {previewApplication.resume_text?.trim() ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Extracted text (used by ATS AI)</p>
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-white p-3 text-xs text-slate-700">
                      {previewApplication.resume_text.slice(0, 4000)}
                      {previewApplication.resume_text.length > 4000 ? "…" : ""}
                    </pre>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setPreviewApplication(null)
                    void openScreeningWorkspace(previewApplication)
                  }}
                >
                  Run ATS screen
                </Button>
              </div>

              {previewApplication.screening_summary ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
                  <p className="font-medium text-emerald-900">Latest screening</p>
                  <p className="mt-1 text-emerald-900/80">{previewApplication.screening_summary}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ATS screening workspace */}
      <Dialog
        open={Boolean(screeningApplication)}
        onOpenChange={(open) => {
          if (!open) {
            setScreeningApplication(null)
            setScreeningResult(null)
            setScreeningMeta(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>ATS screening</DialogTitle>
          </DialogHeader>
          {screeningApplication ? (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{screeningApplication.candidate_name || "Candidate"}</p>
                <p className="text-sm text-muted-foreground">
                  {screeningApplication.job_title || getApplicationJobTitle(screeningApplication)}
                </p>
              </div>

              {screeningLoading ? (
                <div className="rounded-xl border bg-slate-50 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Screening CV / cover letter against role requirements…
                  </div>
                  <Progress value={66} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Status moves to <strong>screening</strong>. AI proposes a score; you can override before saving.
                  </p>
                </div>
              ) : null}

              {screeningResult ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">AI score</p>
                      <p className="text-2xl font-bold text-emerald-700">{screeningResult.ai_score}/100</p>
                    </div>
                    <div className="rounded-lg border p-3 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Recommendation</p>
                      <p className="text-lg font-semibold capitalize">
                        {String(screeningResult.recommendation || "").replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Model: {screeningResult.model_used}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-slate-50 p-3 text-xs text-muted-foreground space-y-1">
                    <p>
                      CV text used:{" "}
                      <span className="font-medium text-foreground">
                        {screeningResult.resume_chars_used ?? screeningMeta?.chars ?? 0} chars
                      </span>
                      {screeningMeta?.method ? ` (${screeningMeta.method})` : ""}
                    </p>
                    {screeningMeta?.warning ? <p className="text-amber-700">{screeningMeta.warning}</p> : null}
                    {screeningMeta?.groq_configured === false ||
                    String(screeningResult.model_used || "").includes("heuristic") ? (
                      <p>
                        Groq AI key not active — using heuristic scoring. Set{" "}
                        <code className="rounded bg-white px-1">GROQ_API_KEY</code> in your deployment env
                        (see docs/GROQ_API_SETUP.md). Get a free key at{" "}
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline"
                        >
                          console.groq.com/keys
                        </a>
                        .
                      </p>
                    ) : (
                      <p className="text-emerald-800">Groq AI screening active.</p>
                    )}
                  </div>

                  <p className="text-sm whitespace-pre-wrap">{screeningResult.summary}</p>

                  {screeningResult.resume_excerpt ? (
                    <div>
                      <h4 className="text-sm font-medium mb-1">CV excerpt used by ATS</h4>
                      <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-white p-3 text-xs text-slate-700">
                        {screeningResult.resume_excerpt}
                      </pre>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Strengths</h4>
                      <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                        {(screeningResult.strengths || []).map((s: string) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Gaps</h4>
                      <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                        {(screeningResult.gaps || []).map((s: string) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {screeningResult.criteria_scores ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Criteria</h4>
                      {Object.entries(screeningResult.criteria_scores).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="capitalize">{key.replace(/_/g, " ")}</span>
                            <span>{Number(value)}%</span>
                          </div>
                          <Progress value={Number(value)} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : !screeningLoading ? (
                <p className="text-sm text-muted-foreground">No screening result yet.</p>
              ) : null}

              <div className="rounded-xl border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Manual score override</h4>
                <p className="text-xs text-muted-foreground">
                  Accept the AI score or set your own. Saving keeps status as screening and updates the queue score.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Final score (0–100)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(e.target.value)}
                      disabled={screeningLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Override reason</Label>
                    <Input
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Optional"
                      disabled={screeningLoading}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setScreeningApplication(null)}>
                    Close
                  </Button>
                  <Button disabled={screeningLoading || screeningSaving} onClick={() => void saveScreeningOverride()}>
                    {screeningSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save final score
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Offer editor */}
      <Dialog
        open={Boolean(editingOffer && offerEditForm)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingOffer(null)
            setOfferEditForm(null)
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Edit offer — {editingOffer ? getOfferCandidateName(editingOffer) : "Candidate"}
            </DialogTitle>
          </DialogHeader>
          {editingOffer && offerEditForm ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {getOfferJobTitle(editingOffer)}
                {editingOffer.candidate_email ? ` · ${editingOffer.candidate_email}` : ""}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Monthly salary</Label>
                  <Input
                    type="number"
                    value={offerEditForm.salary}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, salary: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input
                    value={offerEditForm.currency}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, currency: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={offerEditForm.start_date}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Acceptance deadline</Label>
                  <Input
                    type="date"
                    value={offerEditForm.acceptance_deadline}
                    onChange={(e) =>
                      setOfferEditForm({ ...offerEditForm, acceptance_deadline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Working hours</Label>
                  <Input
                    value={offerEditForm.working_hours}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, working_hours: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input
                    value={offerEditForm.department}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, department: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Probation (months)</Label>
                  <Input
                    type="number"
                    value={offerEditForm.probation_months}
                    onChange={(e) =>
                      setOfferEditForm({ ...offerEditForm, probation_months: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notice (months)</Label>
                  <Input
                    type="number"
                    value={offerEditForm.notice_months}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, notice_months: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Signatory name</Label>
                  <Input
                    value={offerEditForm.signatory_name}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, signatory_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Signatory title</Label>
                  <Input
                    value={offerEditForm.signatory_title}
                    onChange={(e) => setOfferEditForm({ ...offerEditForm, signatory_title: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Benefits (one per line)</Label>
                <Textarea
                  rows={3}
                  value={offerEditForm.benefits}
                  onChange={(e) => setOfferEditForm({ ...offerEditForm, benefits: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Extra remuneration (allowances, transport, etc.)</Label>
                <Textarea
                  rows={2}
                  value={offerEditForm.remuneration_extras}
                  onChange={(e) =>
                    setOfferEditForm({ ...offerEditForm, remuneration_extras: e.target.value })
                  }
                  placeholder="Housing allowance GHS 500&#10;Transport allowance…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Additional terms</Label>
                <Textarea
                  rows={2}
                  value={offerEditForm.terms}
                  onChange={(e) => setOfferEditForm({ ...offerEditForm, terms: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Offer letter</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={offerSaving}
                      onClick={() => void saveOfferEdits({ regenerate: true })}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={offerSaving}
                      onClick={() => void saveOfferEdits({ polish: true })}
                    >
                      <Sparkles className="h-4 w-4" />
                      AI polish
                    </Button>
                  </div>
                </div>
                <Textarea
                  rows={14}
                  value={offerEditForm.offer_letter_text}
                  onChange={(e) =>
                    setOfferEditForm({ ...offerEditForm, offer_letter_text: e.target.value })
                  }
                  className="font-mono text-xs"
                />
                {editingOffer.ai_letter_notes ? (
                  <p className="text-xs text-muted-foreground">{editingOffer.ai_letter_notes}</p>
                ) : null}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditingOffer(null); setOfferEditForm(null) }}>
                  Cancel
                </Button>
                <Button disabled={offerSaving} onClick={() => void saveOfferEdits()}>
                  {offerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Offer preview */}
      <Dialog open={Boolean(offerPreview)} onOpenChange={(open) => !open && setOfferPreview(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Offer preview</DialogTitle>
          </DialogHeader>
          {offerPreview ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="font-semibold">{getOfferCandidateName(offerPreview)}</p>
                <p className="text-sm text-muted-foreground">{getOfferJobTitle(offerPreview)}</p>
                <p className="mt-2 text-sm">
                  {offerPreview.currency || "GHS"} {(offerPreview.salary ?? 0).toLocaleString()} · Start{" "}
                  {formatDate(offerPreview.start_date)}
                </p>
              </div>
              <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl border bg-white p-4 text-xs">
                {offerPreview.offer_letter_text || "No letter drafted yet."}
              </pre>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={() => handleDownloadOfferPdf(offerPreview)}>
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOfferPreview(null)
                    openOfferEditor(offerPreview)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => setOfferPreview(null)}>Close</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
