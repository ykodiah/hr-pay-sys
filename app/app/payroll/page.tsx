"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  Calculator,
  Calendar,
  Download,
  Eye,
  Play,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Edit,
  Save,
  RefreshCw,
  Filter,
  Search,
  FileSpreadsheet,
  ArrowRightLeft,
  Building2,
  Clock,
  Bell,
} from "lucide-react"

const calculateSSNIT = (basicSalary: number) => {
  const maxSSNITSalary = 4500 // Maximum SSNIT salary ceiling
  const ssnitSalary = Math.min(basicSalary, maxSSNITSalary)
  return {
    employee: Math.round(ssnitSalary * 0.055), // 5.5% on basic salary
    employer: Math.round(ssnitSalary * 0.13), // 13% on basic salary
    total: Math.round(ssnitSalary * 0.185),
  }
}

const calculateTier3 = (basicSalary: number, contributionRate = 0.05) => {
  return Math.round(basicSalary * contributionRate)
}

const calculatePAYE = (
  basicSalary: number,
  allowances: number,
  ssnitEmployee: number,
  tier3Employee: number,
  tier3Employer: number,
) => {
  // Calculate taxable income: (basic + allowances) - SSNIT Employee - Tier3 (both employee and employer)
  const taxableIncome = Math.max(0, basicSalary + allowances - ssnitEmployee - tier3Employee - tier3Employer)

  const taxBands = [
    { min: 0, max: 490, rate: 0 }, // First GH₵ 490: 0%
    { min: 490, max: 600, rate: 0.05 }, // Next GH₵ 110: 5%
    { min: 600, max: 730, rate: 0.1 }, // Next GH₵ 130: 10%
    { min: 730, max: 3896.67, rate: 0.175 }, // Next GH₵ 3,166.67: 17.5%
    { min: 3896.67, max: 19896.67, rate: 0.25 }, // Next GH₵ 16,000: 25%
    { min: 19896.67, max: 50416.67, rate: 0.3 }, // Next GH₵ 30,520: 30%
    { min: 50416.67, max: Number.POSITIVE_INFINITY, rate: 0.35 }, // Exceeding GH₵ 50,416.67: 35%
  ]

  let tax = 0
  let remainingIncome = taxableIncome

  for (const band of taxBands) {
    if (remainingIncome <= 0) break

    const bandWidth = band.max - band.min
    const taxableInBand = Math.min(remainingIncome, bandWidth)

    if (taxableInBand > 0) {
      tax += taxableInBand * band.rate
      remainingIncome -= taxableInBand
    }
  }

  return Math.round(tax)
}

type TransferType = "permanent" | "temporary"

type Subsidiary = {
  id: string
  name: string
  code: string
  location: string
  description?: string
  divisions: string[]
  departments: string[]
  supervisor: string
  headOfDepartment: string
}

type TransferEmployeeRecord = {
  id: number
  name: string
  fromSubsidiaryId: string
  fromSubsidiaryName: string
  fromDivision?: string
  fromDepartment?: string
}

type TransferApprovalStage = {
  role: "Supervisor" | "Head of Department"
  approver: string
  status: "pending" | "approved" | "rejected"
  actionDate?: string
  notes?: string
}

type TransferRecord = {
  id: string
  initiatedOn: string
  effectiveDate: string
  transferType: TransferType
  targetSubsidiaryId: string
  targetSubsidiaryName: string
  targetDivision?: string
  targetDepartment?: string
  reason?: string
  returnDate?: string
  approvalStatus: "pending" | "approved" | "rejected"
  approvals: TransferApprovalStage[]
  employees: TransferEmployeeRecord[]
}

type NotificationMessage = {
  id: string
  timestamp: string
  audience: "Supervisor" | "Head of Department" | "HR"
  message: string
  transferId: string
}

const subsidiaries: Subsidiary[] = [
  {
    id: "accra-hq",
    name: "Accra Headquarters",
    code: "SUB-001",
    location: "Accra",
    description: "Corporate head office",
    divisions: ["Technology", "Corporate Services"],
    departments: ["Engineering", "Finance", "Operations"],
    supervisor: "Ama Owusu",
    headOfDepartment: "Kwaku Agyeman",
  },
  {
    id: "kumasi-branch",
    name: "Kumasi Branch",
    code: "SUB-002",
    location: "Kumasi",
    description: "Northern region operations",
    divisions: ["Sales", "Support"],
    departments: ["Field Sales", "Customer Care", "Compliance"],
    supervisor: "Yaw Mensah",
    headOfDepartment: "Akosua Aboagye",
  },
  {
    id: "takoradi-ops",
    name: "Takoradi Operations Centre",
    code: "SUB-003",
    location: "Takoradi",
    description: "Western corridor services",
    divisions: ["Projects", "Service Delivery"],
    departments: ["Marine Projects", "Logistics", "Support Desk"],
    supervisor: "Kojo Ampofo",
    headOfDepartment: "Esi Serwaa",
  },
]

const getSubsidiary = (id: string) => subsidiaries.find((subsidiary) => subsidiary.id === id)

const getSubsidiaryName = (id: string) => getSubsidiary(id)?.name ?? "Unknown subsidiary"

const getSubsidiaryCode = (id: string) => getSubsidiary(id)?.code ?? "—"

const getSubsidiaryDivisions = (id: string) => getSubsidiary(id)?.divisions ?? []

const getSubsidiaryDepartments = (id: string) => getSubsidiary(id)?.departments ?? []

const getSubsidiarySupervisor = (id: string) => getSubsidiary(id)?.supervisor ?? "Assigned Supervisor"

const getSubsidiaryHeadOfDepartment = (id: string) => getSubsidiary(id)?.headOfDepartment ?? "Head of Department"

const formatDisplayDate = (date?: string | null) => {
  if (!date) {
    return "Immediate"
  }

  if (date.includes("T")) {
    return formatDisplayDate(date.split("T")[0])
  }

  const [year, month, day] = date.split("-").map(Number)

  if (!year || !month || !day) {
    return date
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

const formatTransferCount = (count: number) => `${count} ${count === 1 ? "employee" : "employees"}`

const normalizeStatus = (status: string) => status.toLowerCase().replace(/\s+/g, "-")

const getStatusBadgeAppearance = (status: string) => {
  const normalized = normalizeStatus(status)

  if (normalized === "processed") {
    return { variant: "default" as const, className: "bg-emerald-100 text-emerald-800" }
  }

  if (normalized === "calculated") {
    return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800" }
  }

  if (normalized === "pending-transfer") {
    return { variant: "secondary" as const, className: "bg-amber-100 text-amber-800 border-amber-200" }
  }

  if (normalized === "pending-transfer-approval") {
    return { variant: "secondary" as const, className: "bg-amber-100 text-amber-800 border-amber-200" }
  }

  if (normalized === "transfer-scheduled" || normalized === "transfer-approved") {
    return { variant: "default" as const, className: "bg-emerald-100 text-emerald-700" }
  }

  if (normalized === "on-temporary-assignment") {
    return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800" }
  }

  if (normalized === "transfer-rejected") {
    return { variant: "secondary" as const, className: "bg-red-100 text-red-700 border-red-200" }
  }

  return { variant: "outline" as const, className: "bg-gray-100 text-gray-800" }
}

const formatDateTime = (timestamp: string) =>
  new Date(timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const initialPayrollPeriods = [
  {
    id: 1,
    period: "January 2025",
    status: "Processing",
    employees: 247,
    grossPay: 485200,
    paye: 72780,
    ssnit: 43668,
    tier3: 24260,
    netPay: 344492,
    processedDate: null,
    progress: 65,
    locked: false,
  },
  {
    id: 2,
    period: "December 2024",
    status: "Completed",
    employees: 245,
    grossPay: 478900,
    paye: 71835,
    ssnit: 43101,
    tier3: 23945,
    netPay: 340019,
    processedDate: "2024-12-31",
    progress: 100,
    locked: true,
  },
  {
    id: 3,
    period: "November 2024",
    status: "Completed",
    employees: 243,
    grossPay: 472100,
    paye: 70815,
    ssnit: 42489,
    tier3: 23605,
    netPay: 335191,
    processedDate: "2024-11-30",
    progress: 100,
    locked: true,
  },
]

const initialEmployeePayroll = [
  {
    id: 1,
    name: "Kwame Asante",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Senior Software Engineer",
    employeeId: "EMP001",
    subsidiaryId: "accra-hq",
    subsidiary: getSubsidiaryName("accra-hq"),
    division: "Technology",
    department: "Engineering",
    supervisor: getSubsidiarySupervisor("accra-hq"),
    headOfDepartment: getSubsidiaryHeadOfDepartment("accra-hq"),
    basicSalary: 8500,
    allowances: {
      transport: 500,
      housing: 600,
      medical: 100,
      total: 1200,
    },
    deductions: {
      loans: 200,
      advances: 0,
      other: 0,
      welfare: 0,
      total: 200,
    },
    grossPay: 9700,
    paye: 0,
    ssnit: { employee: 0, employer: 0 },
    tier3: { employee: 0, employer: 0, employeeRate: 0.05, employerRate: 0.05 },
    netPay: 0,
    status: "Pending",
    overtimeHours: 8,
    overtimeRate: 50,
    selected: false,
  },
  {
    id: 2,
    name: "Ama Osei",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "HR Manager",
    employeeId: "EMP002",
    subsidiaryId: "kumasi-branch",
    subsidiary: getSubsidiaryName("kumasi-branch"),
    division: "Support",
    department: "Customer Care",
    supervisor: getSubsidiarySupervisor("kumasi-branch"),
    headOfDepartment: getSubsidiaryHeadOfDepartment("kumasi-branch"),
    basicSalary: 7200,
    allowances: {
      transport: 400,
      housing: 350,
      medical: 50,
      total: 800,
    },
    deductions: {
      loans: 150,
      advances: 50,
      other: 0,
      welfare: 0,
      total: 200,
    },
    grossPay: 8000,
    paye: 0,
    ssnit: { employee: 0, employer: 0 },
    tier3: { employee: 0, employer: 0, employeeRate: 0.05, employerRate: 0.05 },
    netPay: 0,
    status: "Pending",
    overtimeHours: 4,
    overtimeRate: 45,
    selected: false,
  },
  {
    id: 3,
    name: "Kofi Mensah",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Marketing Specialist",
    employeeId: "EMP003",
    subsidiaryId: "takoradi-ops",
    subsidiary: getSubsidiaryName("takoradi-ops"),
    division: "Projects",
    department: "Marine Projects",
    supervisor: getSubsidiarySupervisor("takoradi-ops"),
    headOfDepartment: getSubsidiaryHeadOfDepartment("takoradi-ops"),
    basicSalary: 5800,
    allowances: {
      transport: 300,
      housing: 100,
      medical: 0,
      total: 400,
    },
    deductions: {
      loans: 100,
      advances: 0,
      other: 25,
      welfare: 0,
      total: 125,
    },
    grossPay: 6200,
    paye: 0,
    ssnit: { employee: 0, employer: 0 },
    tier3: { employee: 0, employer: 0, employeeRate: 0.03, employerRate: 0.03 },
    netPay: 0,
    status: "Pending",
    overtimeHours: 0,
    overtimeRate: 35,
    selected: false,
  },
]

const initialTransferHistory: TransferRecord[] = [
  {
    id: "TR-2024-12-01",
    initiatedOn: "2024-12-01",
    effectiveDate: "2025-01-01",
    transferType: "permanent",
    targetSubsidiaryId: "kumasi-branch",
    targetSubsidiaryName: getSubsidiaryName("kumasi-branch"),
    targetDivision: "Support",
    targetDepartment: "Compliance",
    reason: "Align workforce with regional expansion",
    approvalStatus: "approved",
    approvals: [
      {
        role: "Supervisor",
        approver: getSubsidiarySupervisor("accra-hq"),
        status: "approved",
        actionDate: "2024-12-03",
        notes: "Cleared after knowledge transfer",
      },
      {
        role: "Head of Department",
        approver: getSubsidiaryHeadOfDepartment("accra-hq"),
        status: "approved",
        actionDate: "2024-12-04",
        notes: "Approved to support northern expansion",
      },
    ],
    employees: [
      {
        id: 105,
        name: "Yaw Boateng",
        fromSubsidiaryId: "accra-hq",
        fromSubsidiaryName: getSubsidiaryName("accra-hq"),
        fromDivision: "Technology",
        fromDepartment: "Engineering",
      },
      {
        id: 117,
        name: "Abena Koomson",
        fromSubsidiaryId: "accra-hq",
        fromSubsidiaryName: getSubsidiaryName("accra-hq"),
        fromDivision: "Corporate Services",
        fromDepartment: "Operations",
      },
    ],
  },
  {
    id: "TR-2024-10-15",
    initiatedOn: "2024-10-15",
    effectiveDate: "2024-11-01",
    transferType: "temporary",
    targetSubsidiaryId: "takoradi-ops",
    targetSubsidiaryName: getSubsidiaryName("takoradi-ops"),
    targetDivision: "Projects",
    targetDepartment: "Marine Projects",
    reason: "Support offshore project go-live",
    returnDate: "2025-02-01",
    approvalStatus: "approved",
    approvals: [
      {
        role: "Supervisor",
        approver: getSubsidiarySupervisor("kumasi-branch"),
        status: "approved",
        actionDate: "2024-10-17",
      },
      {
        role: "Head of Department",
        approver: getSubsidiaryHeadOfDepartment("kumasi-branch"),
        status: "approved",
        actionDate: "2024-10-18",
        notes: "Return to customer care by February",
      },
    ],
    employees: [
      {
        id: 202,
        name: "Esi Nyarko",
        fromSubsidiaryId: "kumasi-branch",
        fromSubsidiaryName: getSubsidiaryName("kumasi-branch"),
        fromDivision: "Support",
        fromDepartment: "Customer Care",
      },
    ],
  },
]

type TransferFormData = {
  targetSubsidiaryId: string
  effectiveDate: string
  reason: string
  transferType: TransferType
  targetDivision?: string
  targetDepartment?: string
  returnDate?: string
}

export default function PayrollPage() {
  const [payrollPeriods, setPayrollPeriods] = useState(initialPayrollPeriods)
  const [employeePayroll, setEmployeePayroll] = useState(initialEmployeePayroll)
  const [selectedPeriod, setSelectedPeriod] = useState("January 2025")
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectAll, setSelectAll] = useState(false)
  const [transferCandidates, setTransferCandidates] = useState<any[]>([])
  const [transferHistory, setTransferHistory] = useState(initialTransferHistory)
  const [notifications, setNotifications] = useState<NotificationMessage[]>([])

  const currentPeriod = payrollPeriods.find((p) => p.period === selectedPeriod)

  const calculateEmployeePayroll = (employee: any) => {
    const basicSalary = employee.basicSalary
    const allowancesTotal = employee.allowances.total
    const overtimePay = employee.overtimeHours * employee.overtimeRate
    const grossPay = basicSalary + allowancesTotal + overtimePay

    // Calculate SSNIT on basic salary only
    const ssnit = calculateSSNIT(basicSalary)

    // Calculate Tier 3 on basic salary only - check if employer contributes
    const tier3EmployeeRate = employee.tier3.employeeRate || 0
    const tier3EmployerRate = employee.tier3.employerRate || 0
    const tier3Employee = tier3EmployeeRate > 0 ? calculateTier3(basicSalary, tier3EmployeeRate) : 0
    const tier3Employer = tier3EmployerRate > 0 ? calculateTier3(basicSalary, tier3EmployerRate) : 0

    // Calculate PAYE: (basic + allowances) - SSNIT Employee - Tier3 (employee + employer)
    const paye = calculatePAYE(basicSalary, allowancesTotal, ssnit.employee, tier3Employee, tier3Employer)

    // Only include applicable deductions
    let totalDeductions = paye + ssnit.employee
    if (tier3Employee > 0) totalDeductions += tier3Employee
    if (employee.deductions.welfare > 0) totalDeductions += employee.deductions.welfare
    if (employee.deductions.loans > 0) totalDeductions += employee.deductions.loans
    if (employee.deductions.other > 0) totalDeductions += employee.deductions.other

    const netPay = grossPay - totalDeductions

    return {
      ...employee,
      grossPay,
      paye,
      ssnit: { employee: ssnit.employee, employer: ssnit.employer },
      tier3: {
        ...employee.tier3,
        employee: tier3Employee,
        employer: tier3Employer,
        employeeRate: tier3EmployeeRate,
        employerRate: tier3EmployerRate,
      },
      netPay,
      status: "Calculated",
    }
  }

  const handleCalculateSelected = () => {
    const updatedEmployees = employeePayroll.map((emp) => (emp.selected ? calculateEmployeePayroll(emp) : emp))
    setEmployeePayroll(updatedEmployees)
    toast({
      title: "Payroll Calculated",
      description: `Calculated payroll for ${employeePayroll.filter((e) => e.selected).length} employees.`,
    })
  }

  const handleCalculateAll = () => {
    const updatedEmployees = employeePayroll.map(calculateEmployeePayroll)
    setEmployeePayroll(updatedEmployees)
    toast({
      title: "Payroll Calculated",
      description: "Calculated payroll for all employees.",
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setEmployeePayroll(employeePayroll.map((emp) => ({ ...emp, selected: checked })))
  }

  const handleSelectEmployee = (employeeId: number, checked: boolean) => {
    setEmployeePayroll(employeePayroll.map((emp) => (emp.id === employeeId ? { ...emp, selected: checked } : emp)))
  }

  const handleOpenTransferDialog = (candidates: any[]) => {
    if (!candidates.length) {
      toast({
        variant: "destructive",
        title: "No employees selected",
        description: "Select at least one employee to transfer across subsidiaries.",
      })
      return
    }

    setTransferCandidates(candidates)
    setIsTransferDialogOpen(true)
  }

  const pushNotification = (audience: NotificationMessage["audience"], message: string, transferId: string) => {
    setNotifications((prev) => [
      {
        id: `NT-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        audience,
        message,
        transferId,
      },
      ...prev,
    ])
    toast({ title: `${audience} notified`, description: message })
  }

  const handleTransferConfirm = ({
    targetSubsidiaryId,
    effectiveDate,
    reason,
    transferType,
    targetDivision,
    targetDepartment,
    returnDate,
  }: TransferFormData) => {
    if (!transferCandidates.length) {
      toast({
        variant: "destructive",
        title: "No employees selected",
        description: "Select the employees you want to move and try again.",
      })
      return
    }

    const employeesToTransfer = transferCandidates.filter((employee) => employee.subsidiaryId !== targetSubsidiaryId)
    const alreadyAssignedCount = transferCandidates.length - employeesToTransfer.length

    if (!employeesToTransfer.length) {
      toast({
        variant: "destructive",
        title: "Transfer not required",
        description: "All selected employees already belong to the destination subsidiary.",
      })
      return
    }

    const targetName = getSubsidiaryName(targetSubsidiaryId)
    const normalizedEffectiveDate = effectiveDate || new Date().toISOString().split("T")[0]
    const normalizedReturnDate = transferType === "temporary" ? returnDate || "" : undefined
    const candidateIdSet = new Set(transferCandidates.map((candidate) => candidate.id))
    const transferIdSet = new Set(employeesToTransfer.map((candidate) => candidate.id))
    const destinationDivision = targetDivision || getSubsidiaryDivisions(targetSubsidiaryId)[0] || "General"
    const destinationDepartment = targetDepartment || getSubsidiaryDepartments(targetSubsidiaryId)[0] || "General"
    const supervisorName =
      transferCandidates[0]?.supervisor || getSubsidiarySupervisor(employeesToTransfer[0].subsidiaryId)
    const hodName =
      transferCandidates[0]?.headOfDepartment || getSubsidiaryHeadOfDepartment(employeesToTransfer[0].subsidiaryId)
    const transferId = `TR-${Date.now()}`

    setEmployeePayroll((prev) =>
      prev.map((employee) => {
        if (!candidateIdSet.has(employee.id)) {
          return employee
        }

        if (!transferIdSet.has(employee.id)) {
          return {
            ...employee,
            selected: false,
          }
        }

        return {
          ...employee,
          selected: false,
          status: "Pending Transfer Approval",
          pendingTransfer: {
            transferId,
            targetSubsidiaryId,
            targetSubsidiaryName: targetName,
            targetDivision: destinationDivision,
            targetDepartment: destinationDepartment,
            transferType,
            effectiveDate: normalizedEffectiveDate,
            returnDate: normalizedReturnDate,
            reason,
          },
        }
      }),
    )

    setTransferHistory((prev) => [
      {
        id: transferId,
        initiatedOn: new Date().toISOString().split("T")[0],
        effectiveDate: normalizedEffectiveDate,
        transferType,
        targetSubsidiaryId,
        targetSubsidiaryName: targetName,
        targetDivision: destinationDivision,
        targetDepartment: destinationDepartment,
        reason,
        returnDate: normalizedReturnDate,
        approvalStatus: "pending",
        approvals: [
          {
            role: "Supervisor",
            approver: supervisorName,
            status: "pending",
          },
          {
            role: "Head of Department",
            approver: hodName,
            status: "pending",
          },
        ],
        employees: employeesToTransfer.map((employee) => ({
          id: employee.id,
          name: employee.name,
          fromSubsidiaryId: employee.subsidiaryId,
          fromSubsidiaryName: employee.subsidiary,
          fromDivision: employee.division,
          fromDepartment: employee.department,
        })),
      },
      ...prev,
    ])

    pushNotification(
      "Supervisor",
      `${formatTransferCount(employeesToTransfer.length)} awaiting your approval for transfer to ${targetName}.`,
      transferId,
    )

    pushNotification(
      "Head of Department",
      `Transfer request for ${formatTransferCount(employeesToTransfer.length)} queued after supervisor review.`,
      transferId,
    )

    setTransferCandidates([])
    setIsTransferDialogOpen(false)
    setSelectAll(false)

    toast({
      title: "Transfer request submitted",
      description: `Awaiting approvals before moving ${formatTransferCount(employeesToTransfer.length)} to ${targetName}${
        alreadyAssignedCount > 0 ? ` • ${alreadyAssignedCount} already assigned` : ""
      }.`,
    })
  }

  const applyApprovedTransfer = (record: TransferRecord) => {
    setEmployeePayroll((prev) =>
      prev.map((employee) => {
        const match = record.employees.find((candidate) => candidate.id === employee.id)
        if (!match) {
          return employee
        }

        return {
          ...employee,
          subsidiaryId: record.targetSubsidiaryId,
          subsidiary: record.targetSubsidiaryName,
          division: record.targetDivision ?? employee.division,
          department: record.targetDepartment ?? employee.department,
          previousSubsidiaryId: match.fromSubsidiaryId,
          previousSubsidiary: match.fromSubsidiaryName,
          previousDivision: match.fromDivision ?? employee.division,
          previousDepartment: match.fromDepartment ?? employee.department,
          status: record.transferType === "temporary" ? "On Temporary Assignment" : "Transfer Scheduled",
          pendingTransfer: undefined,
          transferEffectiveDate: record.effectiveDate,
          transferType: record.transferType,
          transferNotes: record.reason,
          expectedReturnDate: record.returnDate,
          supervisor: getSubsidiarySupervisor(record.targetSubsidiaryId),
          headOfDepartment: getSubsidiaryHeadOfDepartment(record.targetSubsidiaryId),
        }
      }),
    )

    pushNotification(
      "HR",
      `Transfer ${record.id} fully approved. Move effective ${formatDisplayDate(record.effectiveDate)}.`,
      record.id,
    )

    toast({
      title: "Transfer approved",
      description: `All approvals captured for ${formatTransferCount(record.employees.length)}.`,
    })
  }

  const handleTransferRejection = (
    record: TransferRecord,
    notes: string | undefined,
    rejectedBy: TransferApprovalStage["role"],
  ) => {
    setEmployeePayroll((prev) =>
      prev.map((employee) => {
        const match = record.employees.find((candidate) => candidate.id === employee.id)
        if (!match) {
          return employee
        }

        return {
          ...employee,
          status: "Transfer Rejected",
          pendingTransfer: undefined,
          transferNotes: notes || record.reason,
          transferEffectiveDate: undefined,
          expectedReturnDate: undefined,
          transferType: undefined,
        }
      }),
    )

    pushNotification(
      "HR",
      `Transfer ${record.id} rejected by ${rejectedBy.toLowerCase()}. ${notes ? `Reason: ${notes}` : ""}`.trim(),
      record.id,
    )

    toast({
      variant: "destructive",
      title: "Transfer rejected",
      description: `Transfer ${record.id} marked as rejected.`,
    })
  }

  const handleApprovalAction = (
    recordId: string,
    role: TransferApprovalStage["role"],
    action: "approve" | "reject",
    notes?: string,
  ) => {
    let updatedRecord: TransferRecord | null = null
    const actionDate = new Date().toISOString().split("T")[0]

    setTransferHistory((prev) =>
      prev.map((record) => {
        if (record.id !== recordId) {
          return record
        }

        if (record.approvalStatus !== "pending") {
          updatedRecord = record
          return record
        }

        const approvals = record.approvals.map((stage) =>
          stage.role === role
            ? {
                ...stage,
                status: action === "approve" ? "approved" : "rejected",
                actionDate,
                notes,
              }
            : stage,
        )

        const approvalStatus =
          action === "reject"
            ? "rejected"
            : approvals.every((stage) => stage.status === "approved")
              ? "approved"
              : "pending"

        updatedRecord = {
          ...record,
          approvals,
          approvalStatus,
        }

        return updatedRecord
      }),
    )

    if (!updatedRecord) {
      return
    }

    if (action === "approve") {
      const remainingStage = updatedRecord.approvals.find((stage) => stage.status === "pending")

      if (remainingStage?.role === "Head of Department") {
        pushNotification(
          "Head of Department",
          `Supervisor approved transfer ${recordId}. Awaiting your decision.`,
          recordId,
        )
      }

      if (updatedRecord.approvalStatus === "approved") {
        applyApprovedTransfer(updatedRecord)
      }
    } else {
      handleTransferRejection(updatedRecord, notes, role)
    }
  }

  const filteredEmployees = employeePayroll.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.division && employee.division.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.subsidiary && employee.subsidiary.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || normalizeStatus(employee.status) === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedCount = employeePayroll.filter((e) => e.selected).length
  const latestTransfer = transferHistory[0]

  const handleExportPayslips = (format: string) => {
    // Placeholder function for exporting payslips
    console.log(`Exporting payslips in ${format} format`)
  }

  const handlePreviewReport = () => {
    // Placeholder function for previewing report
    console.log("Previewing report")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600">Manage payroll calculations with Ghana tax compliance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {payrollPeriods.map((period) => (
                <SelectItem key={period.id} value={period.period}>
                  {period.period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleCalculateAll}>
            <Calculator className="w-4 h-4 mr-2" />
            Calculate All
          </Button>
          <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Process Payroll for {selectedPeriod}</DialogTitle>
              </DialogHeader>
              <PayrollProcessDialog period={selectedPeriod} onClose={() => setIsProcessDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Period Status */}
      {currentPeriod && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentPeriod.period} Payroll</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant={currentPeriod.status === "Completed" ? "default" : "secondary"}
                    className={
                      currentPeriod.status === "Completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-orange-100 text-orange-800"
                    }
                  >
                    {currentPeriod.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{currentPeriod.employees} employees</span>
                  {currentPeriod.locked && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Locked
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">GHS {currentPeriod.netPay.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Net Pay</p>
              </div>
            </div>

            {currentPeriod.status === "Processing" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{currentPeriod.progress}%</span>
                </div>
                <Progress value={currentPeriod.progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.grossPay.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Gross Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.paye.toLocaleString()}</div>
                <p className="text-sm text-gray-600">PAYE Tax</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.ssnit.toLocaleString()}</div>
                <p className="text-sm text-gray-600">SSNIT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.tier3.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Tier 3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.netPay.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Net Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ghana Tax Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Ghana Tax Compliance Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">PAYE Calculations</p>
                <p className="text-sm text-gray-600">2025 tax bands applied</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">SSNIT Contributions</p>
                <p className="text-sm text-gray-600">13.5% employer + 5.5% employee</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">Tier 3 Provident</p>
                <p className="text-sm text-gray-600">Employee + Employer contributions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Minimum Wage Check</p>
                <p className="text-sm text-gray-600">3 employees need review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intercompany Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
            <span>Intercompany Transfer Center</span>
          </CardTitle>
          <CardDescription>Move employees between subsidiaries and keep payroll aligned.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-emerald-700">
                <span>Active Subsidiaries</span>
                <Building2 className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{subsidiaries.length}</p>
              <p className="mt-1 text-xs text-emerald-700">Configured in this payroll group</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-blue-700">
                <span>Selected Employees</span>
                <Users className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-blue-900">{selectedCount}</p>
              <p className="mt-1 text-xs text-blue-700">Ready to transfer this period</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-amber-700">
                <span>Last Transfer</span>
                <Clock className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-amber-900">
                {latestTransfer ? formatDisplayDate(latestTransfer.initiatedOn) : "—"}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {latestTransfer ? `${formatTransferCount(latestTransfer.employees.length)} moved` : "No records yet"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => handleOpenTransferDialog(employeePayroll.filter((employee) => employee.selected))}
              disabled={selectedCount === 0}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Selected ({selectedCount})
            </Button>
            <p className="text-sm text-gray-500">Tip: use the checkboxes below to choose employees for transfer.</p>
          </div>

          <Separator />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Recent transfer activity</h4>
              <span className="text-xs text-gray-500">{formatTransferCount(transferHistory.length)} total</span>
            </div>
            {transferHistory.length > 0 ? (
              <ScrollArea className="h-64 pr-3">
                <div className="space-y-3">
                  {transferHistory.map((record) => (
                    <div key={record.id} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-gray-900">
                          {toTitleCase(record.transferType)} transfer to {record.targetSubsidiaryName}
                        </span>
                        <div className="flex items-center gap-2">
                          {record.approvalStatus && (
                            <Badge
                              variant={
                                record.approvalStatus === "approved"
                                  ? "default"
                                  : record.approvalStatus === "pending"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                record.approvalStatus === "approved"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : record.approvalStatus === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700 border-red-200"
                              }
                            >
                              {toTitleCase(record.approvalStatus)}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            Effective {formatDisplayDate(record.effectiveDate)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        <p>
                          Initiated {formatDisplayDate(record.initiatedOn)} •{" "}
                          {formatTransferCount(record.employees.length)}
                        </p>
                        <p>
                          Division: {record.targetDivision || "—"} • Department: {record.targetDepartment || "—"}
                        </p>
                        {record.returnDate && <p>Expected return: {formatDisplayDate(record.returnDate)}</p>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {record.employees.map((employee) => (
                          <Badge key={`${record.id}-${employee.id}`} variant="outline" className="text-xs">
                            {employee.name} ({employee.fromSubsidiaryName} → {record.targetSubsidiaryName})
                          </Badge>
                        ))}
                      </div>
                      {record.reason && <p className="mt-2 text-xs italic text-gray-500">Reason: {record.reason}</p>}
                      <div className="mt-3 space-y-2 rounded-md bg-white/60 p-2">
                        {record.approvals.map((stage) => (
                          <div
                            key={`${record.id}-${stage.role}`}
                            className="flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-gray-700">
                                {stage.role}: {stage.approver}
                              </p>
                              {stage.notes && <p className="italic text-gray-500">Notes: {stage.notes}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  stage.status === "approved"
                                    ? "default"
                                    : stage.status === "pending"
                                      ? "secondary"
                                      : "outline"
                                }
                                className={
                                  stage.status === "approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : stage.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700 border-red-200"
                                }
                              >
                                {toTitleCase(stage.status)}
                              </Badge>
                              {stage.status === "pending" && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="xs"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleApprovalAction(record.id, stage.role, "approve")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                                    onClick={() => {
                                      const rejectionNotes = window.prompt(
                                        `Add reason for rejecting transfer ${record.id} as ${stage.role}`,
                                      )
                                      if (rejectionNotes === null) {
                                        return
                                      }
                                      handleApprovalAction(record.id, stage.role, "reject", rejectionNotes || undefined)
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {stage.status !== "pending" && stage.actionDate && (
                                <span className="text-gray-500">{formatDisplayDate(stage.actionDate)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-gray-500">No intercompany transfers recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span>Workflow Notifications</span>
          </CardTitle>
          <CardDescription>Track who has been alerted about intercompany moves.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <ScrollArea className="h-40 pr-3">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{notification.audience}</span>
                      <span className="text-blue-700">{formatDateTime(notification.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-blue-900/90">{notification.message}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-blue-600">
                      Transfer {notification.transferId}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-gray-500">Notifications will appear here as approvals progress.</p>
          )}
        </CardContent>
      </Card>

      {/* Employee Payroll Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee Payroll Details - {selectedPeriod}</CardTitle>
            <div className="flex space-x-2">
              {selectedCount > 0 && (
                <Button onClick={handleCalculateSelected} variant="outline" size="sm">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Selected ({selectedCount})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => handleOpenTransferDialog(employeePayroll.filter((employee) => employee.selected))}
                disabled={selectedCount === 0}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportPayslips("pdf")}>
                <Download className="w-4 h-4 mr-2" />
                Export Payslips (PDF)
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportPayslips("excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Payslips (Excel)
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreviewReport}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending-transfer">Pending Transfer</SelectItem>
                <SelectItem value="pending-transfer-approval">Pending Transfer Approval</SelectItem>
                <SelectItem value="calculated">Calculated</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="transfer-scheduled">Transfer Scheduled</SelectItem>
                <SelectItem value="transfer-approved">Transfer Approved</SelectItem>
                <SelectItem value="on-temporary-assignment">On Temporary Assignment</SelectItem>
                <SelectItem value="transfer-rejected">Transfer Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select All */}
          <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Select All ({filteredEmployees.length} employees)
            </Label>
          </div>

          <div className="space-y-4">
            {filteredEmployees.map((employee) => {
              const statusBadge = getStatusBadgeAppearance(employee.status)

              return (
                <div
                  key={employee.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    employee.selected ? "border-emerald-200 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={employee.selected}
                      onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                    />
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {employee.employeeId}
                        </Badge>
                        {employee.subsidiary && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-100">
                            {employee.subsidiary}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                      {employee.previousSubsidiary && employee.previousSubsidiary !== employee.subsidiary && (
                        <p className="text-xs text-gray-500">From {employee.previousSubsidiary}</p>
                      )}
                      {employee.transferEffectiveDate && (
                        <p className="text-xs text-amber-600">
                          Transfer effective {formatDisplayDate(employee.transferEffectiveDate)}
                        </p>
                      )}
                      {employee.transferNotes && (
                        <p className="text-xs text-gray-500 italic">{employee.transferNotes}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-4 text-center text-sm">
                    <div>
                      <p className="font-medium text-gray-900">GHS {employee.basicSalary.toLocaleString()}</p>
                      <p className="text-gray-500">Basic</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">GHS {employee.allowances.total.toLocaleString()}</p>
                      <p className="text-gray-500">Allowances</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">GHS {employee.grossPay.toLocaleString()}</p>
                      <p className="text-gray-500">Gross</p>
                    </div>
                    <div>
                      <p className="font-medium text-red-600">-GHS {employee.paye.toLocaleString()}</p>
                      <p className="text-gray-500">PAYE</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-600">-GHS {employee.ssnit.employee.toLocaleString()}</p>
                      <p className="text-gray-500">SSNIT</p>
                    </div>
                    <div>
                      <p className="font-medium text-purple-600">-GHS {employee.tier3.employee.toLocaleString()}</p>
                      <p className="text-gray-500">Tier 3</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-600">GHS {employee.netPay.toLocaleString()}</p>
                      <p className="text-gray-500">Net Pay</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={statusBadge.variant} className={statusBadge.className}>
                      {employee.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenTransferDialog([employee])}
                      title="Schedule intercompany transfer"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(employee)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Intercompany Transfer Dialog */}
      <Dialog
        open={isTransferDialogOpen}
        onOpenChange={(open) => {
          setIsTransferDialogOpen(open)
          if (!open) {
            setTransferCandidates([])
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {transferCandidates.length > 1
                ? `Transfer ${formatTransferCount(transferCandidates.length)}`
                : `Transfer ${transferCandidates[0]?.name ?? "Employee"}`}
            </DialogTitle>
          </DialogHeader>
          <IntercompanyTransferDialog
            employees={transferCandidates}
            subsidiaries={subsidiaries}
            onSubmit={handleTransferConfirm}
            onClose={() => {
              setIsTransferDialogOpen(false)
              setTransferCandidates([])
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Payroll Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll - {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EditEmployeePayrollForm
              employee={selectedEmployee}
              onSave={(updatedEmployee) => {
                setEmployeePayroll(
                  employeePayroll.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp)),
                )
                setIsEditDialogOpen(false)
                toast({
                  title: "Payroll Updated",
                  description: `Updated payroll for ${updatedEmployee.name}.`,
                })
              }}
              onClose={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PayrollProcessDialog({ period, onClose }: { period: string; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  const processingSteps = [
    "Validating employee data",
    "Calculating basic salaries and allowances",
    "Applying PAYE tax calculations",
    "Calculating SSNIT contributions",
    "Processing Tier 3 contributions",
    "Applying deductions and loans",
    "Generating payslips and reports",
    "Finalizing payroll",
  ]

  const handleProcess = () => {
    setIsProcessing(true)
    setProcessingStep(0)

    // Simulate processing steps
    const interval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev >= processingSteps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            setIsProcessing(false)
            onClose()
            toast({
              title: "Payroll Processed",
              description: `Successfully processed payroll for ${period}.`,
            })
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payroll for {period}</h3>
        <p className="text-gray-600">This will calculate and finalize payroll for all 247 employees</p>
      </div>

      {!isProcessing ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Processing Steps:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {processingSteps.map((step, index) => (
                <li key={index}>• {step}</li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-900">Important Notes:</p>
            </div>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• Ensure all employee data is up to date</li>
              <li>• Review minimum wage compliance before processing</li>
              <li>• This action will lock the payroll period</li>
              <li>• Payslips will be automatically generated</li>
            </ul>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-medium text-emerald-900 mb-2">Summary:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-800">Total Employees: 247</p>
                <p className="text-emerald-800">Gross Pay: GHS 485,200</p>
              </div>
              <div>
                <p className="text-emerald-800">Total Deductions: GHS 140,708</p>
                <p className="text-emerald-800">Net Pay: GHS 344,492</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleProcess} className="bg-emerald-600 hover:bg-emerald-700">
              Start Processing
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Processing Payroll...</h4>
            <p className="text-sm text-gray-600">{processingSteps[processingStep]}</p>
          </div>

          <div className="space-y-3">
            {processingSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 ${
                  index <= processingStep ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>

          <Progress value={((processingStep + 1) / processingSteps.length) * 100} className="h-2" />
        </div>
      )}
    </div>
  )
}

function EditEmployeePayrollForm({
  employee,
  onSave,
  onClose,
}: {
  employee: any
  onSave: (employee: any) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState(employee)

  const handleSave = () => {
    // Recalculate payroll with updated data
    const basicSalary = formData.basicSalary
    const allowancesTotal = formData.allowances.total
    const overtimePay = formData.overtimeHours * formData.overtimeRate
    const grossPay = basicSalary + allowancesTotal + overtimePay

    // Calculate SSNIT on basic salary only
    const ssnit = calculateSSNIT(basicSalary)

    // Calculate Tier 3 on basic salary only - check if employer contributes
    const tier3EmployeeRate = formData.tier3.employeeRate || 0
    const tier3EmployerRate = formData.tier3.employerRate || 0
    const tier3Employee = tier3EmployeeRate > 0 ? calculateTier3(basicSalary, tier3EmployeeRate) : 0
    const tier3Employer = tier3EmployerRate > 0 ? calculateTier3(basicSalary, tier3EmployerRate) : 0

    // Calculate PAYE: (basic + allowances) - SSNIT Employee - Tier3 (employee + employer)
    const paye = calculatePAYE(basicSalary, allowancesTotal, ssnit.employee, tier3Employee, tier3Employer)

    // Only include applicable deductions
    let totalDeductions = paye + ssnit.employee
    if (tier3Employee > 0) totalDeductions += tier3Employee
    if (formData.deductions.welfare > 0) totalDeductions += formData.deductions.welfare
    if (formData.deductions.loans > 0) totalDeductions += formData.deductions.loans
    if (formData.deductions.other > 0) totalDeductions += formData.deductions.other

    const netPay = grossPay - totalDeductions

    const updatedEmployee = {
      ...formData,
      grossPay,
      paye,
      ssnit: { employee: ssnit.employee, employer: ssnit.employer },
      tier3: {
        ...formData.tier3,
        employee: tier3Employee,
        employer: tier3Employer,
        employeeRate: tier3EmployeeRate,
        employerRate: tier3EmployerRate,
      },
      netPay,
      status: "Calculated",
    }

    onSave(updatedEmployee)
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="allowances">Allowances</TabsTrigger>
        <TabsTrigger value="deductions">Deductions</TabsTrigger>
        <TabsTrigger value="calculations">Calculations</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="basicSalary">Basic Salary (GHS)</Label>
            <Input
              id="basicSalary"
              type="number"
              value={formData.basicSalary}
              onChange={(e) => setFormData({ ...formData, basicSalary: Number.parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="overtimeRate">Overtime Rate (GHS/hour)</Label>
            <Input
              id="overtimeRate"
              type="number"
              value={formData.overtimeRate}
              onChange={(e) => setFormData({ ...formData, overtimeRate: Number.parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="overtimeHours">Overtime Hours</Label>
          <Input
            id="overtimeHours"
            type="number"
            value={formData.overtimeHours}
            onChange={(e) => setFormData({ ...formData, overtimeHours: Number.parseFloat(e.target.value) || 0 })}
          />
        </div>
      </TabsContent>

      <TabsContent value="allowances" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="transport">Transport Allowance</Label>
            <Input
              id="transport"
              type="number"
              value={formData.allowances.transport}
              onChange={(e) => {
                const transport = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  allowances: {
                    ...formData.allowances,
                    transport,
                    total: transport + formData.allowances.housing + formData.allowances.medical,
                  },
                })
              }}
            />
          </div>
          <div>
            <Label htmlFor="housing">Housing Allowance</Label>
            <Input
              id="housing"
              type="number"
              value={formData.allowances.housing}
              onChange={(e) => {
                const housing = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  allowances: {
                    ...formData.allowances,
                    housing,
                    total: formData.allowances.transport + housing + formData.allowances.medical,
                  },
                })
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="medical">Medical Allowance</Label>
          <Input
            id="medical"
            type="number"
            value={formData.allowances.medical}
            onChange={(e) => {
              const medical = Number.parseFloat(e.target.value) || 0
              setFormData({
                ...formData,
                allowances: {
                  ...formData.allowances,
                  medical,
                  total: formData.allowances.transport + formData.allowances.housing + medical,
                },
              })
            }}
          />
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="font-medium">Total Allowances: GHS {formData.allowances.total.toLocaleString()}</p>
        </div>
      </TabsContent>

      <TabsContent value="deductions" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loans">Loan Deductions</Label>
            <Input
              id="loans"
              type="number"
              value={formData.deductions.loans}
              onChange={(e) => {
                const loans = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  deductions: {
                    ...formData.deductions,
                    loans,
                    total:
                      loans + formData.deductions.advances + formData.deductions.other + formData.deductions.welfare,
                  },
                })
              }}
            />
          </div>
          <div>
            <Label htmlFor="advances">Salary Advances</Label>
            <Input
              id="advances"
              type="number"
              value={formData.deductions.advances}
              onChange={(e) => {
                const advances = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  deductions: {
                    ...formData.deductions,
                    advances,
                    total:
                      formData.deductions.loans + advances + formData.deductions.other + formData.deductions.welfare,
                  },
                })
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="other">Other Deductions</Label>
          <Input
            id="other"
            type="number"
            value={formData.deductions.other}
            onChange={(e) => {
              const other = Number.parseFloat(e.target.value) || 0
              setFormData({
                ...formData,
                deductions: {
                  ...formData.deductions,
                  other,
                  total: formData.deductions.loans + formData.deductions.advances + other + formData.deductions.welfare,
                },
              })
            }}
          />
        </div>
        <div>
          <Label htmlFor="welfare">Welfare Deductions</Label>
          <Input
            id="welfare"
            type="number"
            value={formData.deductions.welfare}
            onChange={(e) => {
              const welfare = Number.parseFloat(e.target.value) || 0
              setFormData({
                ...formData,
                deductions: {
                  ...formData.deductions,
                  welfare,
                  total: formData.deductions.loans + formData.deductions.advances + formData.deductions.other + welfare,
                },
              })
            }}
          />
        </div>
        <div>
          <Label htmlFor="tier3Rate">Tier 3 Contribution Rate (%)</Label>
          <Input
            id="tier3Rate"
            type="number"
            step="0.01"
            max="0.20"
            value={formData.tier3.employeeRate * 100}
            onChange={(e) =>
              setFormData({
                ...formData,
                tier3: { ...formData.tier3, employeeRate: (Number.parseFloat(e.target.value) || 0) / 100 },
              })
            }
          />
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="font-medium">Total Deductions: GHS {formData.deductions.total.toLocaleString()}</p>
        </div>
      </TabsContent>

      <TabsContent value="calculations" className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Gross Pay Calculation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>GHS {formData.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span>GHS {formData.allowances.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime:</span>
                    <span>GHS {(formData.overtimeHours * formData.overtimeRate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Gross Pay:</span>
                    <span>
                      GHS{" "}
                      {(
                        formData.basicSalary +
                        formData.allowances.total +
                        formData.overtimeHours * formData.overtimeRate
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Tax Calculations</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>PAYE Tax:</span>
                    <span className="text-red-600">
                      GHS{" "}
                      {calculatePAYE(
                        formData.basicSalary,
                        formData.allowances.total,
                        calculateSSNIT(formData.basicSalary).employee,
                        calculateTier3(formData.basicSalary, formData.tier3.employeeRate || 0.05),
                        calculateTier3(formData.basicSalary, formData.tier3.employerRate || 0.05),
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SSNIT (Employee):</span>
                    <span className="text-blue-600">
                      GHS {calculateSSNIT(formData.basicSalary).employee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tier 3 ({(formData.tier3.employeeRate * 100).toFixed(1)}%):</span>
                    <span className="text-purple-600">
                      GHS {calculateTier3(formData.basicSalary, formData.tier3.employeeRate || 0.05).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="text-gray-600">GHS {formData.deductions.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 text-emerald-800">Net Pay Summary</h4>
              <div className="text-2xl font-bold text-emerald-600">
                GHS{" "}
                {(
                  formData.basicSalary +
                  formData.allowances.total +
                  formData.overtimeHours * formData.overtimeRate -
                  calculatePAYE(
                    formData.basicSalary,
                    formData.allowances.total,
                    calculateSSNIT(formData.basicSalary).employee,
                    calculateTier3(formData.basicSalary, formData.tier3.employeeRate || 0.05),
                    calculateTier3(formData.basicSalary, formData.tier3.employerRate || 0.05),
                  ) -
                  calculateSSNIT(formData.basicSalary).employee -
                  calculateTier3(formData.basicSalary, formData.tier3.employeeRate || 0.05) -
                  formData.deductions.total
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </Tabs>
  )
}

function IntercompanyTransferDialog({
  employees,
  subsidiaries,
  onSubmit,
  onClose,
}: {
  employees: any[]
  subsidiaries: Subsidiary[]
  onSubmit: (data: TransferFormData) => void
  onClose: () => void
}) {
  const [targetSubsidiary, setTargetSubsidiary] = useState("")
  const [transferType, setTransferType] = useState<TransferType>("permanent")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [reason, setReason] = useState("")
  const [targetDivision, setTargetDivision] = useState("")
  const [targetDepartment, setTargetDepartment] = useState("")
  const [returnDate, setReturnDate] = useState("")

  useEffect(() => {
    if (!employees.length) {
      setTargetSubsidiary("")
      return
    }

    const currentSubsidiaryIds = new Set(employees.map((employee) => employee.subsidiaryId))
    const fallbackSubsidiary =
      subsidiaries.find((subsidiary) => !currentSubsidiaryIds.has(subsidiary.id))?.id || subsidiaries[0]?.id || ""

    setTargetSubsidiary(fallbackSubsidiary)
    setTransferType("permanent")
    setEffectiveDate("")
    setReason("")
    const defaultDivisions = getSubsidiaryDivisions(fallbackSubsidiary)
    const defaultDepartments = getSubsidiaryDepartments(fallbackSubsidiary)
    setTargetDivision(defaultDivisions[0] || "")
    setTargetDepartment(defaultDepartments[0] || "")
    setReturnDate("")
  }, [employees, subsidiaries])

  useEffect(() => {
    if (!targetSubsidiary) {
      setTargetDivision("")
      setTargetDepartment("")
      return
    }

    const divisions = getSubsidiaryDivisions(targetSubsidiary)
    const departments = getSubsidiaryDepartments(targetSubsidiary)

    setTargetDivision((prev) => (prev && divisions.includes(prev) ? prev : divisions[0] || ""))
    setTargetDepartment((prev) => (prev && departments.includes(prev) ? prev : departments[0] || ""))
  }, [targetSubsidiary])

  useEffect(() => {
    if (transferType === "permanent") {
      setReturnDate("")
    }
  }, [transferType])

  const handleSubmit = () => {
    if (!targetSubsidiary) {
      toast({
        variant: "destructive",
        title: "Select destination subsidiary",
        description: "Choose the subsidiary the employees should be moved to.",
      })
      return
    }

    onSubmit({
      targetSubsidiaryId: targetSubsidiary,
      effectiveDate,
      reason,
      transferType,
      targetDivision,
      targetDepartment,
      returnDate: transferType === "temporary" ? returnDate : undefined,
    })
  }

  const currentSubsidiaryList = employees.length
    ? Array.from(new Set(employees.map((employee) => employee.subsidiary || "—"))).join(", ")
    : "—"

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-700">Employees selected</h4>
        {employees.length > 0 ? (
          <ScrollArea className="mt-3 max-h-32 pr-2">
            <div className="space-y-2 text-sm text-gray-700">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{employee.name}</span>
                  <span className="text-xs text-gray-500">
                    {employee.subsidiary} • {employee.division || "—"} / {employee.department || "—"}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Select employees from the payroll table to begin.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Destination subsidiary</Label>
          <Select value={targetSubsidiary} onValueChange={setTargetSubsidiary}>
            <SelectTrigger className="w-full overflow-hidden [&>span]:truncate">
              <SelectValue placeholder="Select subsidiary" />
            </SelectTrigger>
            <SelectContent>
              {subsidiaries.map((subsidiary) => (
                <SelectItem key={subsidiary.id} value={subsidiary.id}>
                  {subsidiary.name} ({subsidiary.code}) • {subsidiary.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Target division</Label>
          <Select value={targetDivision} onValueChange={setTargetDivision}>
            <SelectTrigger className="w-full overflow-hidden [&>span]:truncate">
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {getSubsidiaryDivisions(targetSubsidiary).map((division) => (
                <SelectItem key={division} value={division}>
                  {division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Target department</Label>
          <Select value={targetDepartment} onValueChange={setTargetDepartment}>
            <SelectTrigger className="w-full overflow-hidden [&>span]:truncate">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {getSubsidiaryDepartments(targetSubsidiary).map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transfer-effective-date">Effective date</Label>
          <Input
            id="transfer-effective-date"
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
          <p className="text-xs text-gray-500">Leave blank for an immediate (current period) transfer.</p>
        </div>
      </div>

      {transferType === "temporary" && (
        <div className="space-y-2">
          <Label htmlFor="transfer-return-date">Expected return date</Label>
          <Input
            id="transfer-return-date"
            type="date"
            value={returnDate}
            min={effectiveDate || new Date().toISOString().split("T")[0]}
            onChange={(event) => setReturnDate(event.target.value)}
          />
          <p className="text-xs text-gray-500">Used to remind HR when the employee should return to their home unit.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Transfer type</Label>
        <RadioGroup
          value={transferType}
          onValueChange={(value) => setTransferType(value as TransferType)}
          className="flex flex-col gap-2 md:flex-row"
        >
          {(
            [
              {
                id: "transfer-permanent",
                value: "permanent" as TransferType,
                title: "Permanent Transfer",
                description: "Employee relocates indefinitely",
                activeClasses: "border-emerald-300 bg-emerald-50",
              },
              {
                id: "transfer-temporary",
                value: "temporary" as TransferType,
                title: "Temporary Transfer",
                description: "Employee returns to home subsidiary later",
                activeClasses: "border-blue-300 bg-blue-50",
              },
            ] as const
          ).map((option) => (
            <div
              key={option.id}
              className={`flex items-start space-x-3 rounded-lg border p-3 text-sm transition-colors ${
                transferType === option.value ? option.activeClasses : "border-gray-200"
              }`}
            >
              <RadioGroupItem id={option.id} value={option.value} className="mt-1" />
              <Label htmlFor={option.id} className="flex flex-col space-y-1 text-sm">
                <span className="font-medium text-gray-900">{option.title}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-notes">Transfer notes (optional)</Label>
        <Textarea
          id="transfer-notes"
          placeholder="Provide context so HR, payroll, and line managers understand this move."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-600">
        <div>
          <p className="font-medium text-gray-900">Current subsidiaries</p>
          <p>{currentSubsidiaryList}</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-900">Destination</p>
          <p>{targetSubsidiary ? getSubsidiaryName(targetSubsidiary) : "Select subsidiary"}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={employees.length === 0}
        >
          Confirm Transfer
        </Button>
      </div>
    </div>
  )
}
