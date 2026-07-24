"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  FileText,
  FlaskConical,
  Link2,
  List,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { buildJobApplyUrl, buildOfferRespondUrl } from "@/lib/recruitment/public-origin"
import { OnboardingTaskArtifactPanel } from "@/components/recruitment/onboarding-task-artifact"

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
  candidate_signature_name?: string | null
  candidate_signed_at?: string | null
  hr_signature_name?: string | null
  hr_signed_at?: string | null
  signed_letter_vault_id?: string | null
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
  hr_signature_name: string
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
  response_data?: Record<string, string> | null
  attachment_url?: string | null
  attachment_name?: string | null
  vault_document_id?: string | null
  document_type?: string | null
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
  employee_id?: string | null
  converted_at?: string | null
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
  notify_email: boolean
  notify_sms: boolean
  notify_in_app: boolean
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
  notify_email: true,
  notify_sms: false,
  notify_in_app: true,
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
  const [convertChecklist, setConvertChecklist] = useState<OnboardingChecklist | null>(null)
  const [convertPreview, setConvertPreview] = useState<any>(null)
  const [convertLoading, setConvertLoading] = useState(false)
  const [convertSaving, setConvertSaving] = useState(false)
  const [convertIncludePayroll, setConvertIncludePayroll] = useState(false)
  const [focusedOnboardingId, setFocusedOnboardingId] = useState<string | null>(null)
  const [focusOnboardingLookup, setFocusOnboardingLookup] = useState<{
    checklistId?: string
    offerId?: string
    applicationId?: string
  } | null>(null)
  const [convertDraft, setConvertDraft] = useState<{
    first_name: string
    last_name: string
    personal_email: string
    corporate_email: string
    phone: string
    position: string
    department: string
    date_of_joining: string
  } | null>(null)
  // --- Interview: staff tagging state ---
  const [interviewerSearch, setInterviewerSearch] = useState("")
  const [interviewerDropdownOpen, setInterviewerDropdownOpen] = useState(false)
  const [selectedInterviewers, setSelectedInterviewers] = useState<OrgPerson[]>([])
  const [interviewNotifyEmail, setInterviewNotifyEmail] = useState(true)
  const [interviewNotifySms, setInterviewNotifySms] = useState(false)
  const [interviewNotifyInApp, setInterviewNotifyInApp] = useState(true)

  // --- Offer: medical requirements state ---
  const [offerMedicalExpanded, setOfferMedicalExpanded] = useState<Record<string, boolean>>({})
  const [offerMedicalRequired, setOfferMedicalRequired] = useState<Record<string, boolean>>({})
  const [offerMedicalTiming, setOfferMedicalTiming] = useState<Record<string, "before" | "after">>({})
  const [offerMedicalSaving, setOfferMedicalSaving] = useState<Record<string, boolean>>({})
  const [offerMedicalSent, setOfferMedicalSent] = useState<Record<string, boolean>>({})

  // --- Probation: review board state ---
  const [probationBoard, setProbationBoard] = useState<{
    checklistId: string
    candidateName: string
    startDate: string
    probationEndDate: string
    employeeId?: string
  } | null>(null)
  const [probationDecision, setProbationDecision] = useState<"confirmed" | "non_confirmed" | "">("")
  const [probationPayDecision, setProbationPayDecision] = useState<"same" | "increase" | "">("")
  const [probationNewSalary, setProbationNewSalary] = useState("")
  const [probationNotes, setProbationNotes] = useState("")
  const [probationSaving, setProbationSaving] = useState(false)

  // --- Onboarding: queue & stage archiving state ---
  const [onboardingQueueOpen, setOnboardingQueueOpen] = useState(false)
  const [archivedStages, setArchivedStages] = useState<Record<string, string[]>>({})
  const [signOffStage, setSignOffStage] = useState<{ checklistId: string; stage: string } | null>(null)
  const [signOffSaving, setSignOffSaving] = useState(false)

  // --- Direct hire toggle in convert modal ---
  const [convertIsDirectHire, setConvertIsDirectHire] = useState(false)

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
        const nextOnboarding = body.onboarding ?? []
        setOnboarding(nextOnboarding)
        setLastSynced(new Date())
        return nextOnboarding
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load recruitment data."
        setLoadError(message)
        toast({ title: "Recruitment sync failed", description: message, variant: "destructive" })
        return [] as OnboardingChecklist[]
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

  // Resolve + scroll to the hire when navigating from Offers → Onboarding
  useEffect(() => {
    if (activeTab !== "onboarding" || !focusOnboardingLookup) return
    const match =
      (focusOnboardingLookup.checklistId &&
        onboarding.find((c) => c.id === focusOnboardingLookup.checklistId)) ||
      (focusOnboardingLookup.offerId &&
        onboarding.find((c) => c.offer_id === focusOnboardingLookup.offerId)) ||
      (focusOnboardingLookup.applicationId &&
        onboarding.find((c) => c.application_id === focusOnboardingLookup.applicationId)) ||
      null
    if (!match) return
    setFocusedOnboardingId(match.id)
    const t = window.setTimeout(() => {
      document.getElementById(`onboarding-${match.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 120)
    return () => window.clearTimeout(t)
  }, [activeTab, focusOnboardingLookup, onboarding])

  const applicationsById = useMemo(() => {
    return new Map(applications.map((application) => [application.id, application]))
  }, [applications])

  const orderedOnboarding = useMemo(() => {
    if (!focusedOnboardingId) return onboarding
    const focused = onboarding.filter((c) => c.id === focusedOnboardingId)
    const rest = onboarding.filter((c) => c.id !== focusedOnboardingId)
    return [...focused, ...rest]
  }, [onboarding, focusedOnboardingId])

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
    // Build interviewers list: tagged staff takes priority; fall back to free-text name
    const interviewersList = selectedInterviewers.length > 0
      ? selectedInterviewers.map((s) => ({ id: s.id, name: s.name, department: s.department ?? null, position: s.position ?? null }))
      : interviewForm.interviewer_name
        ? [{ id: null, name: interviewForm.interviewer_name, department: null, position: null }]
        : []
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
          interviewer_name: interviewersList.map((i) => i.name).join(", ") || null,
          interviewers: interviewersList,
          location: interviewForm.location || null,
          meeting_url: interviewForm.meeting_url || null,
          notes: interviewForm.notes || null,
          notify_email: interviewNotifyEmail,
          notify_sms: interviewNotifySms,
          notify_in_app: interviewNotifyInApp,
        }),
      },
      "Interview scheduled",
      interviewersList.length
        ? `Notifications sent to ${interviewersList.map((i) => i.name).join(", ")}.`
        : "The candidate interview has been added.",
    )
    if (scheduled) {
      setInterviewForm(initialInterviewForm)
      setSelectedInterviewers([])
      setInterviewerSearch("")
      setShowInterviewDialog(false)
    }
  }

  const handleSaveMedical = async (offerId: string) => {
    setOfferMedicalSaving((prev) => ({ ...prev, [offerId]: true }))
    try {
      await fetch("/api/recruitment/offers/medical-requirements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          offer_id: offerId,
          medical_required: offerMedicalRequired[offerId] ?? false,
          medical_timing: offerMedicalTiming[offerId] ?? "after",
        }),
      })
      toast({ title: "Medical settings saved", description: "Medical requirements updated for this offer." })
    } catch {
      toast({ title: "Error", description: "Could not save medical settings.", variant: "destructive" })
    } finally {
      setOfferMedicalSaving((prev) => ({ ...prev, [offerId]: false }))
    }
  }

  const handleSendMedicalRequest = async (offer: Offer) => {
    setOfferMedicalSaving((prev) => ({ ...prev, [offer.id]: true }))
    try {
      await fetch("/api/recruitment/offers/medical-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ offer_id: offer.id, company_id: companyId }),
      })
      setOfferMedicalSent((prev) => ({ ...prev, [offer.id]: true }))
      toast({ title: "Medical request sent", description: `${getOfferCandidateName(offer)} has been asked to submit their medical documents.` })
    } catch {
      toast({ title: "Error", description: "Could not send medical request.", variant: "destructive" })
    } finally {
      setOfferMedicalSaving((prev) => ({ ...prev, [offer.id]: false }))
    }
  }

  const handleProbationConfirm = async () => {
    if (!probationBoard || !probationDecision || !probationPayDecision) return
    setProbationSaving(true)
    try {
      await fetch("/api/recruitment/confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          checklist_id: probationBoard.checklistId,
          employee_id: probationBoard.employeeId,
          decision: probationDecision,
          pay_decision: probationPayDecision,
          new_salary: probationNewSalary ? Number(probationNewSalary) : null,
          confirmation_date: probationBoard.probationEndDate,
          notes: probationNotes,
          company_id: companyId,
        }),
      })
      if (probationDecision === "confirmed") {
        toast({ title: "Employee Confirmed!", description: `${probationBoard.candidateName} has been confirmed. Congratulatory notification sent.` })
      } else {
        toast({ title: "Non-Confirmation Recorded", description: `HR alert triggered for ${probationBoard.candidateName}.`, variant: "destructive" })
      }
      setProbationBoard(null)
      setProbationDecision("")
      setProbationPayDecision("")
      setProbationNewSalary("")
      setProbationNotes("")
    } catch {
      toast({ title: "Error", description: "Could not save confirmation decision.", variant: "destructive" })
    } finally {
      setProbationSaving(false)
    }
  }

  const handleSignOffStage = async () => {
    if (!signOffStage) return
    setSignOffSaving(true)
    try {
      await fetch("/api/recruitment/onboarding/stage-archiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ checklist_id: signOffStage.checklistId, stage: signOffStage.stage, company_id: companyId }),
      })
      setArchivedStages((prev) => ({
        ...prev,
        [signOffStage.checklistId]: [...(prev[signOffStage.checklistId] ?? []), signOffStage.stage],
      }))
      toast({ title: "Stage signed off", description: `${signOffStage.stage.replace(/_/g, " ")} stage archived.` })
      setSignOffStage(null)
    } catch {
      toast({ title: "Error", description: "Could not sign off stage.", variant: "destructive" })
    } finally {
      setSignOffSaving(false)
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
      hr_signature_name: offer.hr_signature_name || offer.signatory_name || "",
      department: offer.department || "",
    })
  }

  const saveOfferEdits = async (opts?: {
    regenerate?: boolean
    polish?: boolean
    signHr?: boolean
  }) => {
    if (!editingOffer || !offerEditForm) return
    if (opts?.signHr && !offerEditForm.hr_signature_name.trim()) {
      toast({
        title: "HR Head signature required",
        description: "Type the HR Head full name to sign this offer letter.",
        variant: "destructive",
      })
      return
    }
    setOfferSaving(true)
    try {
      const hrName =
        offerEditForm.hr_signature_name.trim() || offerEditForm.signatory_name.trim() || null
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
        signatory_name: hrName || offerEditForm.signatory_name || null,
        signatory_title: offerEditForm.signatory_title || null,
        hr_signature_name: opts?.signHr || editingOffer.hr_signed_at ? hrName : hrName,
        department: offerEditForm.department || null,
      }
      if (opts?.signHr && hrName) {
        body.hr_signature_name = hrName
        body.hr_signed_at = new Date().toISOString()
        body.signatory_name = hrName
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

      const keepEditorOpen = Boolean(opts?.regenerate || opts?.polish || opts?.signHr)
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
                hr_signature_name:
                  json.offer.hr_signature_name || json.offer.signatory_name || prev.hr_signature_name,
                signatory_name:
                  json.offer.signatory_name || prev.signatory_name,
                signatory_title: json.offer.signatory_title || prev.signatory_title,
              }
            : prev,
        )
        toast({
          title: opts?.signHr ? "HR Head signed" : opts?.polish ? "Letter polished" : "Letter regenerated",
          description: opts?.signHr
            ? "HR Head signature is on the offer letter. You can now send it for acceptance."
            : "Offer letter updated.",
        })
      } else {
        setEditingOffer(null)
        setOfferEditForm(null)
        toast({ title: "Offer saved", description: "Changes saved successfully." })
      }
      await loadRecruitment(companyId)
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
    if (action === "send") {
      const hrSigned = Boolean(offer.hr_signature_name || offer.hr_signed_at)
      if (!hrSigned) {
        toast({
          title: "HR Head must sign first",
          description: "Open Edit on the offer letter, sign as HR Head under Signatures, then send.",
          variant: "destructive",
        })
        openOfferEditor(offer)
        return
      }
    }
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
        const onboardId = json.onboarding?.id || json.onboarding?.checklist?.id || null
        setFocusOnboardingLookup({
          checklistId: onboardId || undefined,
          offerId: offer.id,
          applicationId: offer.application_id || undefined,
        })
        if (onboardId) setFocusedOnboardingId(onboardId)
        toast({
          title: "Offer accepted",
          description: onboardId
            ? `${getOfferCandidateName(offer)} moved to onboarding — continue their checklist below.`
            : `${getOfferCandidateName(offer)} accepted. If no checklist appears, run SQL 089 and try Go to onboarding.`,
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

  const goToOnboardingForOffer = async (offer: Offer) => {
    setActiveTab("onboarding")
    setFocusOnboardingLookup({
      offerId: offer.id,
      applicationId: offer.application_id || undefined,
    })
    // Resolve immediately from current state if possible
    const existing =
      onboarding.find((c) => c.offer_id === offer.id) ||
      onboarding.find((c) => c.application_id && c.application_id === offer.application_id) ||
      null
    if (existing) {
      setFocusedOnboardingId(existing.id)
    }
    const list = await loadRecruitment(companyId || offer.company_id)
    const match =
      list.find((c) => c.offer_id === offer.id) ||
      list.find((c) => c.application_id && c.application_id === offer.application_id) ||
      existing
    if (match) {
      setFocusedOnboardingId(match.id)
      toast({
        title: "Continue onboarding",
        description: `Checklist for ${getOfferCandidateName(offer)} is ready — complete the next task, then Add to employees.`,
      })
      window.setTimeout(() => {
        document.getElementById(`onboarding-${match.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 150)
    } else {
      toast({
        title: "No onboarding checklist yet",
        description:
          "Accept the offer first to auto-start onboarding. If already accepted, run SQL 089 (onboarding pipeline) and refresh.",
        variant: "destructive",
      })
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
    if (!checklist.employee_id) {
      void openHireConvert(checklist)
    }
  }

  const openHireConvert = async (checklist: OnboardingChecklist) => {
    setConvertChecklist(checklist)
    setConvertPreview(null)
    setConvertDraft(null)
    setConvertIncludePayroll(false)
    setConvertLoading(true)
    try {
      const res = await fetch("/api/recruitment/onboarding/convert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist_id: checklist.id,
          company_id: companyId,
          preview: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not load employee preview")
      setConvertPreview(json)
      const d = json.draft || {}
      setConvertDraft({
        first_name: d.first_name || "",
        last_name: d.last_name || "",
        personal_email: d.personal_email || "",
        corporate_email: d.corporate_email || "",
        phone: d.phone || "",
        position: d.position || "",
        department: d.department || "",
        date_of_joining: d.date_of_joining || "",
      })
    } catch (err) {
      toast({
        title: "Convert preview failed",
        description: err instanceof Error ? err.message : "Could not prepare employee draft",
        variant: "destructive",
      })
      setConvertChecklist(null)
    } finally {
      setConvertLoading(false)
    }
  }

  const confirmHireConvert = async () => {
    if (!convertChecklist || !convertDraft) return
    setConvertSaving(true)
    try {
      const res = await fetch("/api/recruitment/onboarding/convert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist_id: convertChecklist.id,
          company_id: companyId,
          confirm: true,
          include_payroll: convertIncludePayroll,
          link_existing: true,
          overrides: {
            first_name: convertDraft.first_name,
            last_name: convertDraft.last_name,
            personal_email: convertDraft.personal_email || null,
            corporate_email: convertDraft.corporate_email || null,
            phone: convertDraft.phone || null,
            position: convertDraft.position || null,
            department: convertDraft.department || null,
            date_of_joining: convertDraft.date_of_joining || null,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not create employee")
      toast({
        title: json.action === "linked_existing" ? "Employee linked" : "Employee created",
        description: json.message || "Hire is now on the employee list. Opening Employees…",
      })
      setConvertChecklist(null)
      setConvertPreview(null)
      setConvertDraft(null)
      await loadRecruitment(companyId)
      window.setTimeout(() => {
        window.location.assign("/app/employees")
      }, 600)
    } catch (err) {
      toast({
        title: "Conversion failed",
        description: err instanceof Error ? err.message : "Could not add employee",
        variant: "destructive",
      })
    } finally {
      setConvertSaving(false)
    }
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
                      <div className="space-y-2 col-span-2">
                        <Label>Interviewers (tag from staff list)</Label>
                        {/* Tagged interviewers chips */}
                        {selectedInterviewers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {selectedInterviewers.map((s) => (
                              <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white text-xs px-2.5 py-1">
                                {s.name}
                                {s.position ? <span className="opacity-60">· {s.position}</span> : null}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-red-300"
                                  onClick={() => setSelectedInterviewers((prev) => prev.filter((i) => i.id !== s.id))}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Staff search dropdown */}
                        <div className="relative">
                          <Input
                            placeholder="Search staff by name or department…"
                            value={interviewerSearch}
                            onFocus={() => setInterviewerDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setInterviewerDropdownOpen(false), 150)}
                            onChange={(e) => { setInterviewerSearch(e.target.value); setInterviewerDropdownOpen(true) }}
                          />
                          {interviewerDropdownOpen && (
                            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-y-auto">
                              {requestorOptions
                                .filter((p) =>
                                  !selectedInterviewers.find((s) => s.id === p.id) &&
                                  (interviewerSearch === "" ||
                                    p.name.toLowerCase().includes(interviewerSearch.toLowerCase()) ||
                                    (p.department ?? "").toLowerCase().includes(interviewerSearch.toLowerCase()))
                                )
                                .slice(0, 20)
                                .map((person) => (
                                  <button
                                    key={person.id}
                                    type="button"
                                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 text-left"
                                    onMouseDown={() => {
                                      setSelectedInterviewers((prev) => [...prev, person])
                                      setInterviewerSearch("")
                                    }}
                                  >
                                    <span className="font-medium">{person.name}</span>
                                    <span className="text-xs text-muted-foreground">{person.position ?? person.department ?? ""}</span>
                                  </button>
                                ))}
                              {requestorOptions.filter((p) =>
                                !selectedInterviewers.find((s) => s.id === p.id) &&
                                (interviewerSearch === "" || p.name.toLowerCase().includes(interviewerSearch.toLowerCase()))
                              ).length === 0 && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">No staff found</p>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Notification channels */}
                        <div className="mt-2 rounded-lg border bg-slate-50 px-3 py-2.5">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Notify interviewers via</p>
                          <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input type="checkbox" checked={interviewNotifyEmail} onChange={(e) => setInterviewNotifyEmail(e.target.checked)} className="rounded" />
                              <Mail className="h-3.5 w-3.5" /> Email
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input type="checkbox" checked={interviewNotifySms} onChange={(e) => setInterviewNotifySms(e.target.checked)} className="rounded" />
                              <MessageSquare className="h-3.5 w-3.5" /> SMS
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input type="checkbox" checked={interviewNotifyInApp} onChange={(e) => setInterviewNotifyInApp(e.target.checked)} className="rounded" />
                              <Bell className="h-3.5 w-3.5" /> In-app
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">Each interviewer receives the schedule, interview details, and a brief applicant summary.</p>
                        </div>
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
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {interview.interviewer_name
                              ? interview.interviewer_name.split(",").map((name, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 text-xs px-2 py-0.5">
                                    <UserCheck className="h-3 w-3 text-emerald-600" />
                                    {name.trim()}
                                  </span>
                                ))
                              : <span className="text-muted-foreground text-sm">Unassigned</span>}
                          </div>
                        </TableCell>
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
                              {offer.hr_signature_name || offer.hr_signed_at ? (
                                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                                  HR signed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-700 border-amber-300">
                                  HR signature needed
                                </Badge>
                              )}
                              {offer.candidate_signature_name ? (
                                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                                  Candidate signed
                                </Badge>
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

                            {/* Medical Requirements Section */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium"
                                onClick={() => setOfferMedicalExpanded((prev) => ({ ...prev, [offer.id]: !prev[offer.id] }))}
                              >
                                <span className="flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4 text-teal-600" />
                                  Medicals
                                  {offerMedicalRequired[offer.id] ? (
                                    <Badge className="text-[10px] bg-teal-100 text-teal-800 hover:bg-teal-100">
                                      {offerMedicalTiming[offer.id] === "before" ? "Required before offer" : "Required after offer"}
                                    </Badge>
                                  ) : null}
                                </span>
                                {offerMedicalExpanded[offer.id]
                                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                              </button>
                              {offerMedicalExpanded[offer.id] && (
                                <div className="border-t px-3 py-3 space-y-3">
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={offerMedicalRequired[offer.id] ?? false}
                                      onChange={(e) => setOfferMedicalRequired((prev) => ({ ...prev, [offer.id]: e.target.checked }))}
                                      className="rounded"
                                    />
                                    <span>Medical examination required for this hire</span>
                                  </label>
                                  {offerMedicalRequired[offer.id] && (
                                    <div className="space-y-2 pl-5">
                                      <p className="text-xs font-semibold text-slate-600">When must medicals be submitted?</p>
                                      <div className="flex gap-3">
                                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`medical-timing-${offer.id}`}
                                            value="before"
                                            checked={(offerMedicalTiming[offer.id] ?? "after") === "before"}
                                            onChange={() => setOfferMedicalTiming((prev) => ({ ...prev, [offer.id]: "before" }))}
                                          />
                                          <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
                                          Before offer letter is generated
                                        </label>
                                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`medical-timing-${offer.id}`}
                                            value="after"
                                            checked={(offerMedicalTiming[offer.id] ?? "after") === "after"}
                                            onChange={() => setOfferMedicalTiming((prev) => ({ ...prev, [offer.id]: "after" }))}
                                          />
                                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                                          After offer letter is generated
                                        </label>
                                      </div>
                                      {(offerMedicalTiming[offer.id] ?? "after") === "before" ? (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 space-y-2">
                                          <p className="font-medium flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Medical-first workflow</p>
                                          <p>The offer letter will be blocked until the applicant submits their medical documents. A communication will be sent to the applicant with an upload link. Once uploaded, the documents auto-fill the onboarding checklist.</p>
                                          {!offerMedicalSent[offer.id] ? (
                                            <Button
                                              size="sm"
                                              className="bg-amber-600 hover:bg-amber-700 mt-1"
                                              disabled={offerMedicalSaving[offer.id]}
                                              onClick={() => void handleSendMedicalRequest(offer)}
                                            >
                                              <Upload className="h-3.5 w-3.5" />
                                              Send medical request to applicant
                                            </Button>
                                          ) : (
                                            <p className="flex items-center gap-1.5 text-emerald-800 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Request sent — awaiting applicant submission</p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                                          <p className="font-medium flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Offer-first workflow</p>
                                          <p className="mt-0.5">The offer letter can be sent immediately. Medicals will be part of the onboarding checklist and the applicant must upload them during onboarding.</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={offerMedicalSaving[offer.id]}
                                      onClick={() => void handleSaveMedical(offer.id)}
                                    >
                                      {offerMedicalSaving[offer.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                      Save medical settings
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
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
                                title={
                                  offer.hr_signature_name || offer.hr_signed_at || offer.signatory_name
                                    ? "Send email + response link"
                                    : "HR Head must sign the letter first"
                                }
                              >
                                <Send className="h-4 w-4" />
                                {offer.hr_signature_name || offer.hr_signed_at
                                  ? "Send email + link"
                                  : "Sign HR Head, then send"}
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
                                  onClick={() => void goToOnboardingForOffer(offer)}
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
              <div className="flex items-center justify-between">
                <CardTitle>New hire onboarding</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setOnboardingQueueOpen((prev) => !prev)}
                >
                  <List className="h-4 w-4" />
                  {onboardingQueueOpen ? "Hide queue" : `Queue (${onboarding.filter((c) => c.status !== "completed").length})`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderedOnboarding.length ? (
                <div className={`flex gap-5 ${onboardingQueueOpen ? "" : ""}`}>
                  {/* Onboarding applicant queue sidebar */}
                  {onboardingQueueOpen && (
                    <div className="w-64 shrink-0 rounded-xl border bg-slate-50 flex flex-col max-h-[70vh] overflow-y-auto">
                      <div className="px-3 py-2.5 border-b">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting onboarding</p>
                      </div>
                      {onboarding.map((c) => {
                        const isActive = c.id === focusedOnboardingId
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className={`flex items-center justify-between px-3 py-2.5 text-left border-b last:border-b-0 transition-colors ${isActive ? "bg-emerald-100 text-emerald-900" : "hover:bg-white text-slate-800"}`}
                            onClick={() => {
                              if (isActive) {
                                setFocusedOnboardingId(null)
                                setFocusOnboardingLookup(null)
                              } else {
                                setFocusedOnboardingId(c.id)
                                setFocusOnboardingLookup({ checklistId: c.id })
                                setTimeout(() => document.getElementById(`onboarding-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
                              }
                            }}
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{c.candidate_name ?? "New hire"}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.job_title ?? c.stage ?? ""}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-xs tabular-nums text-muted-foreground">{c.progress ?? 0}%</span>
                              {isActive ? <ChevronDown className="h-3.5 w-3.5 text-emerald-700" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex-1 grid gap-5">
                  {focusedOnboardingId ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
                      Continue onboarding for the highlighted hire — complete remaining tasks, then{" "}
                      <strong>Add to employees</strong> to place them on the employee list.
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-7"
                        onClick={() => {
                          setFocusedOnboardingId(null)
                          setFocusOnboardingLookup(null)
                        }}
                      >
                        Clear focus
                      </Button>
                    </div>
                  ) : null}
                  {orderedOnboarding.map((checklist) => {
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
                    const nextTask = tasks.find(
                      (t) => t.status !== "completed" && t.status !== "skipped",
                    )
                    const isFocused = checklist.id === focusedOnboardingId
                    return (
                      <div
                        id={`onboarding-${checklist.id}`}
                        key={checklist.id}
                        className={`overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-sm scroll-mt-24 ${
                          isFocused
                            ? "border-emerald-500 ring-2 ring-emerald-300"
                            : "border-slate-200"
                        }`}
                      >
                        {isFocused ? (
                          <div className="bg-emerald-700 px-5 py-2 text-sm text-white">
                            Continue here
                            {nextTask ? ` · Next: ${nextTask.title}` : " · All tasks done — add to employees"}
                          </div>
                        ) : null}
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
                              {checklist.employee_id ? (
                                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                                  On employee list
                                </Badge>
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
                            <div className="flex flex-wrap justify-end gap-2">
                              {nextTask ? (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  disabled={saving}
                                  onClick={() => void handleTaskComplete(nextTask)}
                                >
                                  <Check className="h-4 w-4" />
                                  Complete next task
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={saving || checklist.status === "completed"}
                                onClick={() => void handleCompleteOnboarding(checklist)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {checklist.status === "completed" ? "Completed" : "Mark complete"}
                              </Button>
                              {checklist.employee_id ? (
                                <>
                                  <Button size="sm" variant="secondary" asChild>
                                    <a href="/app/employees">View employee list</a>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-purple-300 text-purple-800 hover:bg-purple-50"
                                    onClick={() => {
                                      const startDate = checklist.start_date ?? new Date().toISOString().slice(0, 10)
                                      const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 6)).toISOString().slice(0, 10)
                                      setProbationBoard({
                                        checklistId: checklist.id,
                                        candidateName: checklist.candidate_name ?? "Employee",
                                        startDate,
                                        probationEndDate: endDate,
                                        employeeId: checklist.employee_id ?? undefined,
                                      })
                                    }}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    Review Board
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  disabled={convertLoading}
                                  onClick={() => void openHireConvert(checklist)}
                                >
                                  <UserPlus className="h-4 w-4" />
                                  Add to employees
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          {/* Completed stages archive summary */}
                          {(archivedStages[checklist.id] ?? []).length > 0 && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                              <p className="text-xs font-semibold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Completed stages (archived)
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {(archivedStages[checklist.id] ?? []).map((s) => (
                                  <span key={s} className="rounded-full bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 border border-emerald-200">
                                    {stageLabels[s] ?? s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 items-center">
                            {stages.map((stage, idx) => {
                              const active = idx === stageIdx
                              const done = idx < stageIdx || currentStage === "completed"
                              const isArchived = (archivedStages[checklist.id] ?? []).includes(stage)
                              if (isArchived) return null
                              return (
                                <div key={stage} className="flex items-center gap-1">
                                  <div
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
                                  {done && !isArchived && (
                                    <button
                                      type="button"
                                      title="Sign off & archive this stage"
                                      className="text-emerald-600 hover:text-emerald-800 text-xs font-medium underline"
                                      onClick={() => setSignOffStage({ checklistId: checklist.id, stage })}
                                    >
                                      Sign off
                                    </button>
                                  )}
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
                                const linkedOffer =
                                  checklist.offer_id
                                    ? offers.find((o) => o.id === checklist.offer_id)
                                    : null
                                return (
                                  <div
                                    key={task.id}
                                    className={`flex flex-col gap-2 rounded-xl border bg-white p-3 ${
                                      done ? "opacity-80" : ""
                                    }`}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                                          {task.assigned_department ||
                                            task.assigned_to ||
                                            task.department ||
                                            "Unassigned"}
                                          {" · Due "}
                                          {formatDate(task.due_date)}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={done ? "secondary" : "outline"}
                                        className="shrink-0"
                                        disabled={saving || done}
                                        onClick={() => void handleTaskComplete(task)}
                                      >
                                        {done ? "Done" : "Mark complete"}
                                      </Button>
                                    </div>
                                    <OnboardingTaskArtifactPanel
                                      task={task}
                                      companyId={companyId}
                                      disabled={saving}
                                      offerSignatures={{
                                        candidate: linkedOffer?.candidate_signature_name || null,
                                        hr:
                                          linkedOffer?.hr_signature_name ||
                                          linkedOffer?.signatory_name ||
                                          null,
                                        vaultId: linkedOffer?.signed_letter_vault_id || null,
                                      }}
                                      onSaved={async () => {
                                        await loadRecruitment(companyId)
                                      }}
                                      onError={(message) =>
                                        toast({
                                          title: "Could not save task details",
                                          description: message,
                                          variant: "destructive",
                                        })
                                      }
                                    />
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

                {/* Signature section on the offer letter */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold">Signatures on this offer letter</p>
                    <p className="text-xs text-muted-foreground">
                      HR Head must sign before the letter is sent. The candidate signs on the response portal
                      when accepting.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-white p-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        HR Head (sign first)
                      </p>
                      {editingOffer.hr_signed_at || editingOffer.hr_signature_name ? (
                        <div>
                          <p className="font-serif text-xl italic text-slate-900">
                            {offerEditForm.hr_signature_name ||
                              editingOffer.hr_signature_name ||
                              editingOffer.signatory_name}
                          </p>
                          <p className="text-xs text-emerald-700">
                            Signed
                            {editingOffer.hr_signed_at
                              ? ` · ${new Date(editingOffer.hr_signed_at).toLocaleString()}`
                              : ""}
                            {offerEditForm.signatory_title
                              ? ` · ${offerEditForm.signatory_title}`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Input
                            value={offerEditForm.hr_signature_name}
                            onChange={(e) =>
                              setOfferEditForm({
                                ...offerEditForm,
                                hr_signature_name: e.target.value,
                                signatory_name: e.target.value || offerEditForm.signatory_name,
                              })
                            }
                            placeholder="Type HR Head full name"
                          />
                          <Input
                            value={offerEditForm.signatory_title}
                            onChange={(e) =>
                              setOfferEditForm({ ...offerEditForm, signatory_title: e.target.value })
                            }
                            placeholder="Title (e.g. Head of HR)"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={offerSaving || !offerEditForm.hr_signature_name.trim()}
                            onClick={() => void saveOfferEdits({ signHr: true })}
                          >
                            {offerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Sign as HR Head
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="rounded-lg border bg-white p-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Candidate (signs on accept)
                      </p>
                      {editingOffer.candidate_signature_name ? (
                        <div>
                          <p className="font-serif text-xl italic text-slate-900">
                            {editingOffer.candidate_signature_name}
                          </p>
                          <p className="text-xs text-emerald-700">
                            Signed
                            {editingOffer.candidate_signed_at
                              ? ` · ${new Date(editingOffer.candidate_signed_at).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Awaiting candidate signature on the offer portal after send.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
              <div className="grid gap-4 sm:grid-cols-2 rounded-xl border bg-slate-50 p-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    HR Head signature
                  </p>
                  {offerPreview.hr_signature_name || offerPreview.signatory_name ? (
                    <>
                      <p className="font-serif text-xl italic">
                        {offerPreview.hr_signature_name || offerPreview.signatory_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {offerPreview.signatory_title || "HR Head"}
                        {offerPreview.hr_signed_at
                          ? ` · ${new Date(offerPreview.hr_signed_at).toLocaleString()}`
                          : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-amber-700">Not signed yet — sign before sending</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Candidate signature
                  </p>
                  {offerPreview.candidate_signature_name ? (
                    <>
                      <p className="font-serif text-xl italic">{offerPreview.candidate_signature_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {offerPreview.candidate_signed_at
                          ? new Date(offerPreview.candidate_signed_at).toLocaleString()
                          : "Signed"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Candidate signs on the portal when accepting
                    </p>
                  )}
                </div>
              </div>
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

      {/* Hire → employee convert preview */}
      <Dialog
        open={Boolean(convertChecklist)}
        onOpenChange={(open) => {
          if (!open) {
            setConvertChecklist(null)
            setConvertPreview(null)
            setConvertDraft(null)
            setConvertIsDirectHire(false)
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add hire to employee list</DialogTitle>
          </DialogHeader>
          {convertLoading ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing employee draft…
            </div>
          ) : convertDraft ? (
            <div className="space-y-4">
              {/* Hire path toggle */}
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Employee addition method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium text-left transition-colors ${!convertIsDirectHire ? "border-slate-900 bg-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                    onClick={() => setConvertIsDirectHire(false)}
                  >
                    <UserPlus className="h-4 w-4 mb-1" />
                    Via recruitment portal
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">Prefilled from offer &amp; onboarding</p>
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium text-left transition-colors ${convertIsDirectHire ? "border-slate-900 bg-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                    onClick={() => setConvertIsDirectHire(true)}
                  >
                    <Users className="h-4 w-4 mb-1" />
                    Direct hire
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">No prior recruitment process</p>
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {convertIsDirectHire
                  ? "Fill in employee details manually. Financial details from this form will be synced to the employee card."
                  : "Details are prefilled from the offer and candidate profile. Financial details from onboarding are auto-captured to the employee card."
                }
              </p>

              {convertPreview?.conflicts?.already_converted || convertPreview?.conflicts?.existing_employee ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  {convertPreview?.conflicts?.already_converted
                    ? "This onboarding is already linked to an employee."
                    : `An employee with this email already exists (${convertPreview.conflicts.existing_employee.employee_id}). Confirming will link that record instead of creating a duplicate.`}
                </div>
              ) : null}

              {convertPreview?.missing_fields?.length ? (
                <p className="text-xs text-amber-700">
                  Review missing fields: {convertPreview.missing_fields.join(", ")}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input
                    value={convertDraft.first_name}
                    onChange={(e) => setConvertDraft({ ...convertDraft, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input
                    value={convertDraft.last_name}
                    onChange={(e) => setConvertDraft({ ...convertDraft, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Personal email</Label>
                  <Input
                    type="email"
                    value={convertDraft.personal_email}
                    onChange={(e) => setConvertDraft({ ...convertDraft, personal_email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Corporate email (optional)</Label>
                  <Input
                    type="email"
                    value={convertDraft.corporate_email}
                    onChange={(e) => setConvertDraft({ ...convertDraft, corporate_email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={convertDraft.phone}
                    onChange={(e) => setConvertDraft({ ...convertDraft, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start / joining date</Label>
                  <Input
                    type="date"
                    value={convertDraft.date_of_joining}
                    onChange={(e) => setConvertDraft({ ...convertDraft, date_of_joining: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Input
                    value={convertDraft.position}
                    onChange={(e) => setConvertDraft({ ...convertDraft, position: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input
                    value={convertDraft.department}
                    onChange={(e) => setConvertDraft({ ...convertDraft, department: e.target.value })}
                  />
                </div>
              </div>

              {/* Financial auto-capture summary */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Financial data auto-capture
                </p>
                {convertPreview?.draft?.suggested_monthly_salary != null ? (
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-900">
                    <div>
                      <p className="text-xs text-blue-700">Monthly salary</p>
                      <p className="font-semibold">{convertPreview.draft.currency || "GHS"} {Number(convertPreview.draft.suggested_monthly_salary).toLocaleString()}</p>
                    </div>
                    {convertPreview.draft.bank_name ? (
                      <div>
                        <p className="text-xs text-blue-700">Bank</p>
                        <p className="font-medium">{convertPreview.draft.bank_name}</p>
                      </div>
                    ) : null}
                    {convertPreview.draft.bank_account_number ? (
                      <div>
                        <p className="text-xs text-blue-700">Account no.</p>
                        <p className="font-medium">{convertPreview.draft.bank_account_number}</p>
                      </div>
                    ) : null}
                    {convertPreview.draft.ssnit_number ? (
                      <div>
                        <p className="text-xs text-blue-700">SSNIT</p>
                        <p className="font-medium">{convertPreview.draft.ssnit_number}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-blue-700">Financial details from onboarding checklist will be auto-synced to the employee card and self-service portal (read-only for employee, editable by HR).</p>
                )}
              </div>

              {/* Direct hire: manual salary / bank / SSNIT fields */}
              {convertIsDirectHire && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
                  <p className="text-xs font-semibold text-slate-700">Financial details (direct hire)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Monthly salary</Label>
                      <Input placeholder="e.g. 5000" type="number" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Currency</Label>
                      <Select defaultValue="GHS">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">GHS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Bank name</Label>
                      <Input placeholder="e.g. GCB Bank" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Account number</Label>
                      <Input placeholder="Account number" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">SSNIT number</Label>
                      <Input placeholder="SSNIT number" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">TIN</Label>
                      <Input placeholder="Tax identification number" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">These will auto-populate the employee card financial tab and sync to the employee self-service portal (read-only).</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConvertChecklist(null)
                    setConvertPreview(null)
                    setConvertDraft(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={convertSaving || !convertDraft.first_name || !convertDraft.last_name}
                  onClick={() => void confirmHireConvert()}
                >
                  {convertSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {convertPreview?.conflicts?.existing_employee ? "Link existing employee" : "Create employee"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No draft available.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Probation Review Board */}
      <Dialog open={Boolean(probationBoard)} onOpenChange={(open) => !open && setProbationBoard(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-700" />
              Probation Review Board
            </DialogTitle>
          </DialogHeader>
          {probationBoard && (
            <div className="space-y-5">
              <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 space-y-1">
                <p className="font-semibold text-purple-900">{probationBoard.candidateName}</p>
                <p className="text-sm text-purple-800">Start date: {formatDate(probationBoard.startDate)}</p>
                <p className="text-sm text-purple-800 font-medium">Probation ends: {formatDate(probationBoard.probationEndDate)} <Badge className="ml-1 bg-purple-200 text-purple-900 text-[10px] hover:bg-purple-200">6-month period</Badge></p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Confirmation Decision <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${probationDecision === "confirmed" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 hover:border-slate-300"}`}
                    onClick={() => setProbationDecision("confirmed")}
                  >
                    <CheckCircle2 className={`h-5 w-5 mx-auto mb-1 ${probationDecision === "confirmed" ? "text-emerald-600" : "text-slate-400"}`} />
                    Confirm
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${probationDecision === "non_confirmed" ? "border-red-400 bg-red-50 text-red-900" : "border-slate-200 hover:border-slate-300"}`}
                    onClick={() => setProbationDecision("non_confirmed")}
                  >
                    <XCircle className={`h-5 w-5 mx-auto mb-1 ${probationDecision === "non_confirmed" ? "text-red-500" : "text-slate-400"}`} />
                    Do not confirm
                  </button>
                </div>
              </div>

              {probationDecision === "confirmed" && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Pay Increase Decision <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${probationPayDecision === "same" ? "border-slate-500 bg-slate-50 text-slate-900" : "border-slate-200 hover:border-slate-300"}`}
                      onClick={() => setProbationPayDecision("same")}
                    >
                      Same pay
                    </button>
                    <button
                      type="button"
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${probationPayDecision === "increase" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 hover:border-slate-300"}`}
                      onClick={() => setProbationPayDecision("increase")}
                    >
                      Pay increase
                    </button>
                  </div>
                  {probationPayDecision === "increase" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="new-salary">New monthly salary</Label>
                      <Input
                        id="new-salary"
                        type="number"
                        placeholder="e.g. 6500"
                        value={probationNewSalary}
                        onChange={(e) => setProbationNewSalary(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="prob-notes">Review notes</Label>
                <Textarea
                  id="prob-notes"
                  rows={3}
                  placeholder="Performance summary, comments…"
                  value={probationNotes}
                  onChange={(e) => setProbationNotes(e.target.value)}
                />
              </div>

              {probationDecision === "confirmed" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  Confirmation date will be auto-calculated as exactly 6 months from start date ({formatDate(probationBoard.probationEndDate)}). A congratulatory notification will be triggered on the employee dashboard.
                </div>
              )}
              {probationDecision === "non_confirmed" && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
                  An HR alert will be triggered for termination proceedings. The employee portal will be notified accordingly.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setProbationBoard(null)}>Cancel</Button>
                <Button
                  className={probationDecision === "confirmed" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                  disabled={probationSaving || !probationDecision || !probationPayDecision}
                  onClick={() => void handleProbationConfirm()}
                >
                  {probationSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit decision
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stage sign-off confirmation dialog */}
      <Dialog open={Boolean(signOffStage)} onOpenChange={(open) => !open && setSignOffStage(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign off stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign off <strong className="capitalize">{signOffStage?.stage?.replace(/_/g, " ")}</strong>? The detailed form will be archived and only a summary will be displayed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSignOffStage(null)}>Cancel</Button>
              <Button
                className="bg-slate-900 hover:bg-slate-800"
                disabled={signOffSaving}
                onClick={() => void handleSignOffStage()}
              >
                {signOffSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign off &amp; archive
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
