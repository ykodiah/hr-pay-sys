// @ts-nocheck
"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"

import { useCurrency } from "@/lib/currency-context"
import {
  gradeCatalog,
  approvalMatrix,
  PromotionCase,
  computeSalaryDelta,
  evaluateEligibility,
  generatePromotionLetter,
} from "@/lib/promotions"

import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast, useToast } from "@/hooks/use-toast"
import {
  createPromotionCase as createPromotionCaseMutation,
  getPromotionEmployees,
  loadPromotionEmployees,
  listPromotionCases,
  persistPromotionCase as syncPromotionCase,
  type PromotionEmployeeProfile,
} from "@/lib/api/promotions-service"
import { cn } from "@/lib/utils"

import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from "lucide-react"

const toDisplayGrade = (gradeCode: string) => {
  if (!gradeCode) return "Unknown"
  const grade = gradeCatalog.find((entry) => entry.gradeCode === gradeCode)
  if (!grade) return gradeCode
  const numeric = gradeCode.replace(/[^0-9]/g, "")
  return numeric ? `Grade ${numeric}` : gradeCode
}

const APPROVER_DIRECTORY: Record<string, string> = {
  "Line Manager": "Ama Koomson",
  "Head of Department": "Kwesi Nyarko",
  "HR Director": "Efua Bediako",
  "Finance Director": "Yaw Sarfo",
  "Managing Director": "Nana Akoto",
}

export default function PromotionsPage() {
  const { formatAmount } = useCurrency()
  const { toast: pushToast } = useToast()

  const [promotionEmployees, setPromotionEmployees] = useState(() => getPromotionEmployees())
  const [cases, setCases] = useState<PromotionCase[]>([])
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pipeline")
  const [wizardOpen, setWizardOpen] = useState(false)
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null)

  const departments = useMemo(() => {
    const set = new Set<string>(cases.map((promo) => promo.department))
    if (set.size === 0) {
      promotionEmployees.forEach((employee) => set.add(employee.department))
    }
    return Array.from(set)
  }, [cases, promotionEmployees])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const employees = await loadPromotionEmployees()
        setPromotionEmployees(employees)
        const payload = await listPromotionCases()
        setCases(payload)
      } catch (error) {
        console.error("Failed to load promotion cases", error)
        pushToast({
          variant: "destructive",
          title: "Unable to load promotions",
          description: "Showing cached cases while the backend is unreachable.",
        })
      } finally {
        setIsLoadingCases(false)
      }
    }

    bootstrap()
  }, [pushToast])

  const filteredCases = useMemo(() => {
    return cases.filter((promotionCase) => {
      const matchesStatus = statusFilter === "all" || promotionCase.status === statusFilter
      const matchesDepartment = departmentFilter === "all" || promotionCase.department === departmentFilter
      const matchesSearch =
        promotionCase.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promotionCase.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promotionCase.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promotionCase.toGrade.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesDepartment && matchesSearch
    })
  }, [cases, departmentFilter, searchTerm, statusFilter])

  const pipelineStats = useMemo(() => {
    const approved = cases.filter((c) => c.status === "approved")
    const inReview = cases.filter((c) => c.status === "in-review")
    const rejected = cases.filter((c) => c.status === "rejected")
    const draft = cases.filter((c) => c.status === "draft")
    const deltaTotal = approved.reduce((sum, c) => sum + (c.compensationDelta.proposedBase - c.compensationDelta.currentBase), 0)
    return { approved: approved.length, inReview: inReview.length, rejected: rejected.length, draft: draft.length, deltaTotal }
  }, [cases])

  const detailCase = detailCaseId ? cases.find((item) => item.id === detailCaseId) ?? null : null

  const openWizard = () => setWizardOpen(true)
  const closeWizard = () => setWizardOpen(false)

  const handleCreateCase = async (promotionCase: PromotionCase) => {
    try {
      const persisted = await createPromotionCaseMutation(promotionCase)
      setCases((previous) => [persisted, ...previous.filter((item) => item.id !== persisted.id)])
      setStatusFilter("all")
      setDepartmentFilter("all")
      setSearchTerm("")
      setDetailCaseId(persisted.id)
      pushToast({
        title: "Promotion case submitted",
        description:
          persisted.status === "draft"
            ? "Eligibility gaps detected – saved as draft for HR to review."
            : "Routing approvals and notifying stakeholders.",
      })
    } catch (error) {
      console.error("Failed to submit promotion case", error)
      pushToast({
        variant: "destructive",
        title: "Submission failed",
        description: "We could not save the promotion case. Please try again.",
      })
    }
  }

  const handleStageDecision = async (caseId: string, role: string, decision: "approve" | "reject", comment?: string) => {
    let updatedRecord: PromotionCase | null = null

    setCases((previous) =>
      previous.map((promotionCase) => {
        if (promotionCase.id !== caseId || promotionCase.status === "approved" || promotionCase.status === "rejected") {
          return promotionCase
        }

        const approvals = promotionCase.approvals.map((stage) =>
          stage.role === role && stage.status === "pending"
            ? {
                ...stage,
                status: decision === "approve" ? "approved" : "rejected",
                decidedAt: new Date().toISOString(),
                comment,
              }
            : stage,
        )

        let status: PromotionCase["status"] = promotionCase.status
        let letterUrl = promotionCase.letterUrl

        if (decision === "reject") {
          status = "rejected"
          if (letterUrl) {
            URL.revokeObjectURL(letterUrl)
            letterUrl = undefined
          }
        } else {
          const pendingStage = approvals.find((stage) => stage.status === "pending")
          if (!pendingStage) {
            status = "approved"
            const content = generatePromotionLetter({ ...promotionCase, approvals, status })
            if (letterUrl) {
              URL.revokeObjectURL(letterUrl)
            }
            const blob = new Blob([content], { type: "text/plain" })
            letterUrl = URL.createObjectURL(blob)
          } else {
            status = "in-review"
          }
        }

        const record = { ...promotionCase, approvals, status, letterUrl }
        updatedRecord = record
        return record
      }),
    )

    pushToast({
      title: decision === "approve" ? "Approval recorded" : "Promotion rejected",
      description:
        decision === "approve"
          ? `${role} approved the case.`
          : `${role} rejected the case${comment ? ` – ${comment}` : ""}.`,
      variant: decision === "approve" ? "default" : "destructive",
    })

    if (updatedRecord) {
      try {
        await syncPromotionCase(updatedRecord)
      } catch (error) {
        console.error("Failed to sync promotion case", error)
        pushToast({
          variant: "destructive",
          title: "Sync failed",
          description: "Decision saved locally but not synced to the backend.",
        })
      }
    }
  }

  return (
    <AuthGuard>
      <RoleGuard requiredRoles={["hr-admin", "hr-manager", "finance-director"]}>
        <div className="space-y-6">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Promotion Workflow</h1>
              <p className="text-muted-foreground">Manage grade progressions, salary scales, and delegated approvals across the group.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export pipeline
              </Button>
              <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={openWizard}>
                    <ArrowUpRight className="h-4 w-4" />
                    New promotion
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create promotion case</DialogTitle>
                  </DialogHeader>
                  <PromotionWizard
                    employees={promotionEmployees}
                    onSubmit={handleCreateCase}
                    onClose={closeWizard}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="grades">Salary scales</TabsTrigger>
              <TabsTrigger value="workflow">Approval map</TabsTrigger>
              <TabsTrigger value="analytics">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="space-y-6">
              {isLoadingCases ? (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
                    Loading promotion pipeline…
                  </CardContent>
                </Card>
              ) : (
                <>
                  <PipelineStats stats={pipelineStats} formatAmount={formatAmount} />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                      <div className="relative md:w-1/3">
                        <Input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search by name, ID, department or grade"
                          className="pl-8"
                        />
                        <Eye className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                        <div className="flex flex-col">
                          <Label className="text-xs uppercase text-muted-foreground">Status</Label>
                          <div className="flex gap-2">
                            {[
                              { value: "all", label: "All" },
                              { value: "in-review", label: "In review" },
                              { value: "draft", label: "Draft" },
                              { value: "approved", label: "Approved" },
                              { value: "rejected", label: "Rejected" },
                            ].map((item) => (
                              <Button
                                key={item.value}
                                size="sm"
                                variant={statusFilter === item.value ? "default" : "outline"}
                                onClick={() => setStatusFilter(item.value)}
                              >
                                {item.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <Label className="text-xs uppercase text-muted-foreground">Department</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={departmentFilter === "all" ? "default" : "outline"}
                              onClick={() => setDepartmentFilter("all")}
                            >
                              All
                            </Button>
                            {departments.map((dept) => (
                              <Button
                                key={dept}
                                size="sm"
                                variant={departmentFilter === dept ? "default" : "outline"}
                                onClick={() => setDepartmentFilter(dept)}
                              >
                                {dept}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Promotion cases</CardTitle>
                        <span className="text-sm text-muted-foreground">{filteredCases.length} case(s)</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {filteredCases.length === 0 && (
                        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                          No promotion cases meet the current filters. Adjust your filters or create a new request.
                        </div>
                      )}
                      {filteredCases.map((promotionCase) => (
                        <PromotionCaseCard
                          key={promotionCase.id}
                          promotionCase={promotionCase}
                          formatAmount={formatAmount}
                          onView={() => setDetailCaseId(promotionCase.id)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="grades">
              <SalaryGradesPanel />
            </TabsContent>

            <TabsContent value="workflow">
              <WorkflowPanel />
            </TabsContent>

            <TabsContent value="analytics">
              <PromotionInsights cases={cases} formatAmount={formatAmount} />
            </TabsContent>
          </Tabs>

          <Dialog open={Boolean(detailCase)} onOpenChange={(open) => !open && setDetailCaseId(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Promotion case</DialogTitle>
              </DialogHeader>
              {detailCase && (
                <PromotionCaseDetail
                  promotionCase={detailCase}
                  onDecision={handleStageDecision}
                  formatAmount={formatAmount}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}

function PipelineStats({
  stats,
  formatAmount,
}: {
  stats: { approved: number; inReview: number; rejected: number; draft: number; deltaTotal: number }
  formatAmount: (value: number) => string
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard title="In review" value={stats.inReview} icon={<Clock className="h-5 w-5 text-orange-600" />} tone="warning" />
      <StatCard title="Approved" value={stats.approved} icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} tone="success" />
      <StatCard title="Draft" value={stats.draft} icon={<ShieldCheck className="h-5 w-5 text-blue-600" />} tone="info" />
      <StatCard
        title="Annualised salary impact"
        value={formatAmount(stats.deltaTotal)}
        icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
        tone="accent"
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  tone: "warning" | "success" | "info" | "accent"
}) {
  const borderClass =
    tone === "warning"
      ? "border-orange-200"
      : tone === "success"
        ? "border-emerald-200"
        : tone === "info"
          ? "border-blue-200"
          : "border-purple-200"

  return (
    <Card className={cn("border-2", borderClass)}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-full bg-muted p-3">{icon}</div>
      </CardContent>
    </Card>
  )
}

function PromotionCaseCard({
  promotionCase,
  formatAmount,
  onView,
}: {
  promotionCase: PromotionCase
  formatAmount: (value: number) => string
  onView: () => void
}) {
  const delta = promotionCase.compensationDelta.proposedBase - promotionCase.compensationDelta.currentBase
  const firstPendingStage = promotionCase.approvals.find((stage) => stage.status === "pending")

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 transition hover:border-emerald-200 hover:shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{promotionCase.employeeName.split(" ").map((part) => part[0]).join("")}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">{promotionCase.employeeName}</h3>
            <PromotionStatusBadge status={promotionCase.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {promotionCase.employeeId} • {promotionCase.department}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              {toDisplayGrade(promotionCase.fromGrade)} → {toDisplayGrade(promotionCase.toGrade)}
            </span>
            <span>Effective {format(new Date(promotionCase.effectiveDate), "dd MMM yyyy")}</span>
            <span className={cn("font-medium", delta >= 0 ? "text-emerald-600" : "text-red-600")}>{formatAmount(delta)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-col gap-3 md:w-[220px]">
        <div className="text-xs text-muted-foreground">
          <strong>Next route:</strong>{" "}
          {firstPendingStage ? `${firstPendingStage.role} (${firstPendingStage.approverName})` : "Completed"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onView}>
            <Eye className="h-4 w-4" /> View case
          </Button>
        </div>
      </div>
    </div>
  )
}

function PromotionStatusBadge({ status }: { status: PromotionCase["status"] }) {
  const config: Record<PromotionCase["status"], { label: string; className: string }> = {
    "in-review": { label: "In review", className: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
    approved: { label: "Approved", className: "bg-blue-50 text-blue-700 border border-blue-100" },
    rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border border-red-100" },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  }

  const settings = config[status] ?? config["draft"]
  return <Badge className={cn("px-2 py-1 text-xs", settings.className)}>{settings.label}</Badge>
}

function PromotionCaseDetail({
  promotionCase,
  onDecision,
  formatAmount,
}: {
  promotionCase: PromotionCase
  onDecision: (caseId: string, role: string, decision: "approve" | "reject", comment?: string) => void
  formatAmount: (value: number) => string
}) {
  const [comment, setComment] = useState("")
  const pendingStage = promotionCase.approvals.find((stage) => stage.status === "pending")
  const canAct = Boolean(pendingStage) && promotionCase.status === "in-review"
  const delta = promotionCase.compensationDelta.proposedBase - promotionCase.compensationDelta.currentBase

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{promotionCase.employeeName}</h2>
          <p className="text-sm text-muted-foreground">
            {promotionCase.employeeId} • {promotionCase.department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PromotionStatusBadge status={promotionCase.status} />
          <Badge variant="outline" className="gap-1 text-xs">
            <ArrowRight className="h-3 w-3" /> Effective {format(new Date(promotionCase.effectiveDate), "dd MMM yyyy")}
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Current position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Grade" value={toDisplayGrade(promotionCase.fromGrade)} />
            <Row label="Step" value={`Step ${promotionCase.fromStep}`} />
            <Row label="Base salary" value={formatAmount(promotionCase.compensationDelta.currentBase)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Proposed position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Grade" value={toDisplayGrade(promotionCase.toGrade)} highlight />
            <Row label="Step" value={`Step ${promotionCase.toStep}`} highlight />
            <Row label="New salary" value={formatAmount(promotionCase.compensationDelta.proposedBase)} highlight />
            <Row label="Salary change" value={formatAmount(delta)} highlight tone={delta >= 0 ? "positive" : "negative"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Eligibility review</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {promotionCase.eligibility.map((rule) => (
            <div
              key={rule.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              {rule.passed ? (
                <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-1 h-4 w-4 flex-shrink-0 text-red-600" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{rule.label}</p>
                <p className="text-xs text-muted-foreground">{rule.details}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Supporting attachments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {promotionCase.attachments.map((file) => (
            <Badge key={file} variant="outline" className="gap-1 text-xs">
              <FileText className="h-3 w-3" /> {file}
            </Badge>
          ))}
          {promotionCase.attachments.length === 0 && <p className="text-sm text-muted-foreground">No attachments uploaded.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Approval route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {promotionCase.approvals.map((stage) => (
            <div key={`${promotionCase.id}-${stage.role}`} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{stage.role}</p>
                <p className="text-xs text-muted-foreground">{stage.approverName}</p>
                {stage.comment && <p className="mt-1 text-xs text-muted-foreground">Comment: {stage.comment}</p>}
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <PromotionStatusBadge status={stage.status === "approved" ? "approved" : stage.status === "rejected" ? "rejected" : "in-review"} />
                {stage.decidedAt && <div>{format(new Date(stage.decidedAt), "dd MMM yyyy")}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Business justification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{promotionCase.reason}</p>
        </CardContent>
      </Card>

      {promotionCase.letterUrl && (
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <a href={promotionCase.letterUrl} download={`${promotionCase.employeeId}-promotion-letter.txt`}>
              <Download className="h-4 w-4" /> Download promotion letter
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">Generated automatically upon final approval.</p>
        </div>
      )}

      {canAct && pendingStage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Approval action ({pendingStage.role})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approver-comment" className="text-xs uppercase text-muted-foreground">
                Comment (optional)
              </Label>
              <Textarea
                id="approver-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add notes for the audit trail"
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onDecision(promotionCase.id, pendingStage.role, "approve", comment || undefined)}
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onDecision(promotionCase.id, pendingStage.role, "reject", comment || undefined)}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, highlight = false, tone }: { label: string; value: string; highlight?: boolean; tone?: "positive" | "negative" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium",
          highlight && "text-foreground",
          tone === "positive" && "text-emerald-600",
          tone === "negative" && "text-red-600",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function SalaryGradesPanel() {
  const { formatAmount } = useCurrency()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Salary grades & steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gradeCatalog.map((grade) => (
          <div key={grade.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{toDisplayGrade(grade.gradeCode)}</h3>
                <p className="text-xs uppercase text-muted-foreground">Band: {grade.band}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Steps {grade.minStep} – {grade.maxStep}
              </Badge>
            </div>
            <Separator className="my-3" />
            <div className="grid gap-3 md:grid-cols-5">
              {grade.steps.map((step) => (
                <div key={`${grade.id}-${step.step}`} className="rounded-md bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground">Step {step.step}</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatAmount(step.basePay)}</p>
                  <p className="text-[10px] text-muted-foreground">Effective {format(new Date(step.effectiveFrom), "MMM yyyy")}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function WorkflowPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Approval workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {approvalMatrix.map((stage, index) => (
          <div key={stage.role} className="flex items-center gap-4 rounded-lg border p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{stage.role}</p>
              <p className="text-xs text-muted-foreground">Stage {stage.stage} in approval map</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PromotionInsights({ cases, formatAmount }: { cases: PromotionCase[]; formatAmount: (value: number) => string }) {
  const approved = cases.filter((promotionCase) => promotionCase.status === "approved")
  const averageIncrease =
    approved.length > 0
      ? Math.round(
          approved.reduce(
            (sum, promotionCase) => sum + (promotionCase.compensationDelta.proposedBase - promotionCase.compensationDelta.currentBase),
            0,
          ) / approved.length,
        )
      : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved promotions</p>
                <p className="text-2xl font-semibold text-foreground">{approved.length}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average salary uplift</p>
                <p className="text-2xl font-semibold text-emerald-600">{formatAmount(averageIncrease)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending approvals</p>
                <p className="text-2xl font-semibold text-foreground">{cases.filter((item) => item.status === "in-review").length}</p>
              </div>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">DEI distribution by grade (snapshot)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Dashboards for diversity, equity & inclusion will surface once HR analytics feeds are connected.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type WizardState = {
  employeeId: string
  effectiveDate: string
  reason: string
  newGrade: string
  newStep: number
  trainingCompleted: boolean
  hasDisciplinary: boolean
  payrollLocked: boolean
  attachments: string[]
}

function PromotionWizard({
  employees,
  onSubmit,
  onClose,
}: {
  employees: PromotionEmployeeProfile[]
  onSubmit: (promotionCase: PromotionCase) => void
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const [attachmentInput, setAttachmentInput] = useState("")
  const [state, setState] = useState<WizardState>(() => ({
    employeeId: "",
    effectiveDate: "",
    reason: "",
    newGrade: gradeCatalog[0]?.gradeCode ?? "",
    newStep: gradeCatalog[0]?.minStep ?? 1,
    trainingCompleted: true,
    hasDisciplinary: false,
    payrollLocked: false,
    attachments: [],
  }))

  const selectedEmployee = useMemo(() => employees.find((employee) => employee.id === state.employeeId) ?? null, [employees, state.employeeId])

  const eligibility = useMemo(() => {
    if (!selectedEmployee) {
      return []
    }
    return evaluateEligibility(
      selectedEmployee.grade,
      selectedEmployee.step,
      selectedEmployee.tenureMonths,
      selectedEmployee.appraisalScore,
      state.trainingCompleted,
      state.hasDisciplinary,
      state.payrollLocked,
    )
  }, [selectedEmployee, state.trainingCompleted, state.hasDisciplinary, state.payrollLocked])

  const salaryPreview = useMemo(() => {
    if (!selectedEmployee) {
      return null
    }
    const delta = computeSalaryDelta(selectedEmployee.grade, selectedEmployee.step, state.newGrade, state.newStep)
    return delta
  }, [selectedEmployee, state.newGrade, state.newStep])

  const steps = ["Employee", "Movement", "Eligibility", "Review"]

  const canContinue = () => {
    if (step === 0) {
      return Boolean(selectedEmployee) && Boolean(state.effectiveDate)
    }
    if (step === 1) {
      return Boolean(state.newGrade) && Boolean(state.newStep)
    }
    if (step === 2) {
      return true
    }
    return true
  }

  const handleAddAttachment = () => {
    const trimmed = attachmentInput.trim()
    if (!trimmed) return
    setState((previous) => ({ ...previous, attachments: [...previous.attachments, trimmed] }))
    setAttachmentInput("")
  }

  const handleSubmit = () => {
    if (!selectedEmployee) {
      toast({
        variant: "destructive",
        title: "Select an employee",
        description: "Choose which employee is being promoted before submitting.",
      })
      return
    }

    const compensationDelta = computeSalaryDelta(selectedEmployee.grade, selectedEmployee.step, state.newGrade, state.newStep)
    const eligibilityResults = eligibility
    const allPassed = eligibilityResults.every((result) => result.passed)
    const newCase: PromotionCase = {
      id: `PC-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      department: selectedEmployee.department,
      fromGrade: selectedEmployee.grade,
      fromStep: selectedEmployee.step,
      toGrade: state.newGrade,
      toStep: state.newStep,
      effectiveDate: state.effectiveDate,
      reason: state.reason || "Promotion request raised from self-service",
      status: allPassed ? "in-review" : "draft",
      initiatedBy: "You",
      initiatedAt: new Date().toISOString(),
      attachments: state.attachments,
      eligibility: eligibilityResults,
        approvals: approvalMatrix.map((stage) => ({
          stage: stage.stage,
          role: stage.role,
          approverName: APPROVER_DIRECTORY[stage.role] ?? stage.role,
          status: "pending",
        })),
      compensationDelta: {
        currentBase: compensationDelta.currentBase,
        proposedBase: compensationDelta.proposedBase,
        currency: compensationDelta.currency,
      },
    }

    onSubmit(newCase)
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        {steps.map((label, index) => {
          const active = step === index
          const complete = step > index
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
                  complete && "border-emerald-200 bg-emerald-600 text-white",
                  active && !complete && "border-emerald-400 text-emerald-600",
                  !active && !complete && "border-muted text-muted-foreground",
                )}
              >
                {complete ? <CheckCircle className="h-3 w-3" /> : index + 1}
              </div>
              <span className={cn("text-xs uppercase", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              {index < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          )
        })}
      </div>

      {step === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <select
              id="employee"
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={state.employeeId}
              onChange={(event) => {
                const employeeId = event.target.value
                const employee = employees.find((profile) => profile.id === employeeId)
                setState((previous) => ({
                  ...previous,
                  employeeId,
                  newGrade: employee?.grade ?? previous.newGrade,
                  newStep: employee?.step ? Math.max(1, employee.step + 1) : previous.newStep,
                  trainingCompleted: employee?.trainingCompleted ?? previous.trainingCompleted,
                  hasDisciplinary: employee?.hasDisciplinary ?? previous.hasDisciplinary,
                }))
              }}
            >
              <option value="" disabled>
                -- Select an employee --
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.id})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="effectiveDate">Effective date</Label>
            <Input
              id="effectiveDate"
              type="date"
              value={state.effectiveDate}
              onChange={(event) => setState((previous) => ({ ...previous, effectiveDate: event.target.value }))}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="reason">Business justification</Label>
            <Textarea
              id="reason"
              rows={4}
              placeholder="Why should this employee progress to the next grade?"
              value={state.reason}
              onChange={(event) => setState((previous) => ({ ...previous, reason: event.target.value }))}
            />
          </div>
        </div>
      )}

      {step === 1 && selectedEmployee && (
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Current grade & step</Label>
                <p className="text-sm font-medium text-foreground">
                  {toDisplayGrade(selectedEmployee.grade)} • Step {selectedEmployee.step}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Target grade</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={state.newGrade}
                  onChange={(event) => {
                    const gradeCode = event.target.value
                    const grade = gradeCatalog.find((entry) => entry.gradeCode === gradeCode)
                    setState((previous) => ({
                      ...previous,
                      newGrade: gradeCode,
                      newStep: grade ? Math.min(Math.max(previous.newStep, grade.minStep), grade.maxStep) : previous.newStep,
                    }))
                  }}
                >
                  {gradeCatalog.map((grade) => (
                    <option key={grade.id} value={grade.gradeCode}>
                      {toDisplayGrade(grade.gradeCode)} ({grade.band})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Target step</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={state.newStep}
                  onChange={(event) => setState((previous) => ({ ...previous, newStep: Number(event.target.value) }))}
                >
                  {gradeCatalog
                    .find((grade) => grade.gradeCode === state.newGrade)?.steps.map((step) => (
                      <option key={`${state.newGrade}-step-${step.step}`} value={step.step}>
                        Step {step.step} ({format(new Date(step.effectiveFrom), "MMM yyyy")})
                      </option>
                    ))}
                </select>
              </div>
              {salaryPreview && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Salary projection</Label>
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">
                      Current base: <span className="font-medium text-foreground">{formatAmount(salaryPreview.currentBase)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Proposed base: <span className="font-medium text-emerald-600">{formatAmount(salaryPreview.proposedBase)}</span>
                    </p>
                    <Separator className="my-2" />
                    <p className="text-sm font-semibold text-emerald-600">
                      Δ {formatAmount(salaryPreview.proposedBase - salaryPreview.currentBase)} per month
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Eligibility flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ToggleRow
                label="Training completed"
                description="Mandatory leadership or technical curriculum fulfilled"
                checked={state.trainingCompleted}
                onCheckedChange={(checked) => setState((previous) => ({ ...previous, trainingCompleted: checked }))}
              />
              <ToggleRow
                label="No disciplinary flags"
                description="Confirm no open disciplinary or PIP actions"
                checked={!state.hasDisciplinary}
                onCheckedChange={(checked) => setState((previous) => ({ ...previous, hasDisciplinary: !checked }))}
              />
              <ToggleRow
                label="Payroll period open"
                description="Finance confirms the effective payroll period is editable"
                checked={!state.payrollLocked}
                onCheckedChange={(checked) => setState((previous) => ({ ...previous, payrollLocked: !checked }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Supporting documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. appraisal-2024.pdf"
                  value={attachmentInput}
                  onChange={(event) => setAttachmentInput(event.target.value)}
                />
                <Button type="button" onClick={handleAddAttachment} className="gap-2">
                  <Upload className="h-4 w-4" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {state.attachments.length === 0 && <p className="text-muted-foreground">No files added yet.</p>}
                {state.attachments.map((attachment) => (
                  <Badge key={attachment} variant="outline">
                    {attachment}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Eligibility summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {eligibility.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                    {item.passed ? (
                      <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.details}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 3 && selectedEmployee && salaryPreview && (
        <div className="space-y-4 text-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="Employee" value={`${selectedEmployee.name} (${selectedEmployee.id})`} />
              <Row label="Effective date" value={state.effectiveDate ? format(new Date(state.effectiveDate), "dd MMM yyyy") : "TBC"} />
              <Row label="Current grade" value={`${toDisplayGrade(selectedEmployee.grade)} • Step ${selectedEmployee.step}`} />
              <Row label="Proposed grade" value={`${toDisplayGrade(state.newGrade)} • Step ${state.newStep}`} highlight />
              <Row label="Salary delta" value={`${salaryPreview.proposedBase - salaryPreview.currentBase >= 0 ? "+" : ""}${salaryPreview.proposedBase - salaryPreview.currentBase} GHS`} highlight />
              <Row label="Attachments" value={`${state.attachments.length} file(s)`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Eligibility outcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eligibility.every((item) => item.passed) ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> All mandatory checks passed. Case will route automatically.
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                  <AlertCircle className="h-4 w-4" /> One or more checks failed. Case will be saved as draft for HR to review.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button disabled={!canContinue()} onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
              Continue
            </Button>
          ) : (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
              Submit case
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onCheckedChange }: { label: string; description: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
