"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  CreditCard,
  Smartphone,
  Building2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Settings,
  DollarSign,
  TrendingUp,
  FileText,
  Wallet,
} from "lucide-react"

interface PaymentBatch {
  id: string
  batchNumber: string
  payrollPeriod: string
  totalAmount: number
  employeeCount: number
  status: "draft" | "pending" | "processing" | "completed" | "failed"
  paymentMethod: "bank" | "mobile_money" | "mixed"
  createdDate: string
  processedDate?: string
  approvedBy?: string
  bankFile?: string
  mobileMoneyFile?: string
}

interface PaymentRecord {
  id: string
  batchId: string
  employeeId: string
  employeeName: string
  employeeAvatar: string
  department: string
  paymentMethod: "bank_transfer" | "mtn_momo" | "vodafone_cash" | "airteltigo_money"
  accountNumber: string
  bankName?: string
  amount: number
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  transactionId?: string
  failureReason?: string
  processedAt?: string
}

interface MobileMoneyProvider {
  id: string
  name: string
  code: string
  logo: string
  isActive: boolean
  apiEndpoint: string
  fees: {
    fixed: number
    percentage: number
    maxFee: number
  }
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("batches")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBatch, setSelectedBatch] = useState<PaymentBatch | null>(null)
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false)

  const [paymentBatches] = useState<PaymentBatch[]>([
    {
      id: "1",
      batchNumber: "PAY-2025-001",
      payrollPeriod: "January 2025",
      totalAmount: 344492,
      employeeCount: 247,
      status: "completed",
      paymentMethod: "mixed",
      createdDate: "2025-01-28",
      processedDate: "2025-01-30",
      approvedBy: "John Doe",
      bankFile: "bank_payments_jan2025.csv",
      mobileMoneyFile: "momo_payments_jan2025.json",
    },
    {
      id: "2",
      batchNumber: "PAY-2025-002",
      payrollPeriod: "February 2025",
      totalAmount: 356780,
      employeeCount: 250,
      status: "processing",
      paymentMethod: "mixed",
      createdDate: "2025-02-28",
      approvedBy: "Jane Smith",
    },
    {
      id: "3",
      batchNumber: "PAY-2025-003",
      payrollPeriod: "March 2025",
      totalAmount: 362150,
      employeeCount: 252,
      status: "draft",
      paymentMethod: "mixed",
      createdDate: "2025-03-15",
    },
  ])

  const [paymentRecords] = useState<PaymentRecord[]>([
    {
      id: "1",
      batchId: "1",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Technology",
      paymentMethod: "mtn_momo",
      accountNumber: "0244123456",
      amount: 4500,
      status: "completed",
      transactionId: "MTN2025013012345",
      processedAt: "2025-01-30 14:30:00",
    },
    {
      id: "2",
      batchId: "1",
      employeeId: "EMP002",
      employeeName: "Ama Osei",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Human Resources",
      paymentMethod: "bank_transfer",
      accountNumber: "1234567890",
      bankName: "GCB Bank",
      amount: 3200,
      status: "completed",
      transactionId: "GCB2025013098765",
      processedAt: "2025-01-30 14:25:00",
    },
    {
      id: "3",
      batchId: "2",
      employeeId: "EMP003",
      employeeName: "Kofi Mensah",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Marketing",
      paymentMethod: "vodafone_cash",
      accountNumber: "0208987654",
      amount: 2800,
      status: "processing",
      processedAt: "2025-02-28 16:15:00",
    },
    {
      id: "4",
      batchId: "2",
      employeeId: "EMP004",
      employeeName: "Akosua Boateng",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Finance",
      paymentMethod: "bank_transfer",
      accountNumber: "9876543210",
      bankName: "Ecobank Ghana",
      amount: 3800,
      status: "failed",
      failureReason: "Invalid account number",
      processedAt: "2025-02-28 16:20:00",
    },
  ])

  const [mobileMoneyProviders] = useState<MobileMoneyProvider[]>([
    {
      id: "1",
      name: "MTN Mobile Money",
      code: "MTN_MOMO",
      logo: "/placeholder.svg?height=40&width=40",
      isActive: true,
      apiEndpoint: "https://api.mtn.com/momo",
      fees: { fixed: 0, percentage: 0.01, maxFee: 5 },
    },
    {
      id: "2",
      name: "Vodafone Cash",
      code: "VODAFONE_CASH",
      logo: "/placeholder.svg?height=40&width=40",
      isActive: true,
      apiEndpoint: "https://api.vodafone.com.gh/cash",
      fees: { fixed: 0, percentage: 0.015, maxFee: 8 },
    },
    {
      id: "3",
      name: "AirtelTigo Money",
      code: "AIRTELTIGO_MONEY",
      logo: "/placeholder.svg?height=40&width=40",
      isActive: true,
      apiEndpoint: "https://api.airteltigo.com.gh/money",
      fees: { fixed: 0, percentage: 0.012, maxFee: 6 },
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "processing":
        return "bg-blue-100 text-blue-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700"
      case "draft":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <Building2 className="w-4 h-4" />
      case "mtn_momo":
      case "vodafone_cash":
      case "airteltigo_money":
        return <Smartphone className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Bank Transfer"
      case "mtn_momo":
        return "MTN MoMo"
      case "vodafone_cash":
        return "Vodafone Cash"
      case "airteltigo_money":
        return "AirtelTigo Money"
      default:
        return method
    }
  }

  const handleProcessBatch = (batch: PaymentBatch) => {
    setSelectedBatch(batch)
    setIsProcessingDialogOpen(true)
  }

  const filteredBatches = paymentBatches.filter((batch) => {
    const matchesSearch =
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.payrollPeriod.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const paymentStats = {
    totalBatches: paymentBatches.length,
    completedBatches: paymentBatches.filter((b) => b.status === "completed").length,
    totalAmount: paymentBatches.reduce((sum, b) => sum + b.totalAmount, 0),
    successfulPayments: paymentRecords.filter((p) => p.status === "completed").length,
    failedPayments: paymentRecords.filter((p) => p.status === "failed").length,
    processingPayments: paymentRecords.filter((p) => p.status === "processing").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Process salary payments via bank transfers and mobile money.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Batch
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{paymentStats.totalBatches}</div>
                <p className="text-sm text-gray-600">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{paymentStats.completedBatches}</div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {(paymentStats.totalAmount / 1000).toFixed(0)}K
                </div>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{paymentStats.successfulPayments}</div>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{paymentStats.processingPayments}</div>
                <p className="text-sm text-gray-600">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{paymentStats.failedPayments}</div>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="batches">Payment Batches</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="mobile-money">Mobile Money</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Payment Batches Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Payment Batches</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Payroll Period</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                      <TableCell>{batch.payrollPeriod}</TableCell>
                      <TableCell>{batch.employeeCount}</TableCell>
                      <TableCell className="font-medium">GHS {batch.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {batch.paymentMethod === "mixed" ? (
                            <>
                              <Building2 className="w-3 h-3" />
                              <Smartphone className="w-3 h-3" />
                              <span className="text-sm">Mixed</span>
                            </>
                          ) : batch.paymentMethod === "bank" ? (
                            <>
                              <Building2 className="w-3 h-3" />
                              <span className="text-sm">Bank</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3 h-3" />
                              <span className="text-sm">Mobile Money</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(batch.createdDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3" />
                          </Button>
                          {batch.status === "draft" && (
                            <Button variant="outline" size="sm" onClick={() => handleProcessBatch(batch)}>
                              <Send className="w-3 h-3" />
                            </Button>
                          )}
                          {batch.status === "completed" && (
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Payment Transactions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Account/Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Processed At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={record.employeeAvatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {record.employeeName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.employeeName}</p>
                            <p className="text-sm text-gray-500">{record.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(record.paymentMethod)}
                          <span className="text-sm">{getPaymentMethodName(record.paymentMethod)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        <div>
                          <p>{record.accountNumber}</p>
                          {record.bankName && <p className="text-xs text-gray-500">{record.bankName}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">GHS {record.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        {record.failureReason && <p className="text-xs text-red-600 mt-1">{record.failureReason}</p>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.transactionId || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {record.processedAt ? new Date(record.processedAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3" />
                          </Button>
                          {record.status === "failed" && (
                            <Button variant="outline" size="sm">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile-money" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>Mobile Money Providers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mobileMoneyProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-gray-500">
                          Fee: {provider.fees.percentage * 100}% (Max: GHS {provider.fees.maxFee})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={provider.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
                      >
                        {provider.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Mobile Money Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">MTN MoMo</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-2">65%</p>
                    <p className="text-sm text-blue-600">of payments</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-800">Vodafone Cash</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">25%</p>
                    <p className="text-sm text-red-600">of payments</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-orange-800">AirtelTigo</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 mt-2">10%</p>
                    <p className="text-sm text-orange-600">of payments</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-800">Total Fees</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">GHS 1,245</p>
                    <p className="text-sm text-emerald-600">this month</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Mobile Money Transactions</h4>
                  {paymentRecords
                    .filter((r) => r.paymentMethod !== "bank_transfer")
                    .slice(0, 3)
                    .map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={record.employeeAvatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {record.employeeName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{record.employeeName}</p>
                            <p className="text-xs text-gray-500">{getPaymentMethodName(record.paymentMethod)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">GHS {record.amount.toLocaleString()}</p>
                          <Badge className={getStatusColor(record.status)} size="sm">
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment Reconciliation</h2>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import Bank Statement
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto Reconcile
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reconciled</p>
                    <p className="text-2xl font-bold text-green-600">95%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discrepancies</p>
                    <p className="text-2xl font-bold text-red-600">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">January 2025 Payroll</h4>
                    <p className="text-sm text-gray-500">247 payments • GHS 344,492</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-700">Reconciled</Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">February 2025 Payroll</h4>
                    <p className="text-sm text-gray-500">250 payments • GHS 356,780</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Bonus Payments - Q4 2024</h4>
                    <p className="text-sm text-gray-500">180 payments • GHS 125,000</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-100 text-red-700">Discrepancy</Badge>
                    <Button variant="outline" size="sm">
                      <AlertTriangle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Bank Integration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Bank</Label>
                  <Select defaultValue="gcb">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gcb">GCB Bank</SelectItem>
                      <SelectItem value="ecobank">Ecobank Ghana</SelectItem>
                      <SelectItem value="absa">Absa Bank Ghana</SelectItem>
                      <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment File Format</Label>
                  <Select defaultValue="csv">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV Format</SelectItem>
                      <SelectItem value="excel">Excel Format</SelectItem>
                      <SelectItem value="xml">XML Format</SelectItem>
                      <SelectItem value="json">JSON Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-generate Bank Files</Label>
                    <p className="text-sm text-gray-500">Automatically create bank payment files</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <span>Payment Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Payment Method</Label>
                  <Select defaultValue="mixed">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer Only</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money Only</SelectItem>
                      <SelectItem value="mixed">Mixed (Employee Choice)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Processing Day</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="28">28th of Month</SelectItem>
                      <SelectItem value="30">30th of Month</SelectItem>
                      <SelectItem value="last">Last Working Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Split Payments</Label>
                    <p className="text-sm text-gray-500">Allow multiple payment methods per employee</p>
                  </div>
                  <Checkbox />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Notifications</Label>
                    <p className="text-sm text-gray-500">Send SMS notifications for payments</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Processing Dialog */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Payment Batch</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <PaymentProcessingDialog batch={selectedBatch} onClose={() => setIsProcessingDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentProcessingDialog({ batch, onClose }: { batch: PaymentBatch; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  const processingSteps = [
    "Validating payment data",
    "Generating bank payment files",
    "Processing mobile money payments",
    "Sending payment instructions",
    "Updating payment status",
    "Generating confirmation reports",
  ]

  const handleProcess = () => {
    setIsProcessing(true)
    setProcessingStep(0)

    const interval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev >= processingSteps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            setIsProcessing(false)
            onClose()
            toast({
              title: "Payments Processed",
              description: `Successfully processed ${batch.employeeCount} payments for ${batch.payrollPeriod}.`,
            })
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Process {batch.batchNumber}</h3>
        <p className="text-gray-600">
          This will process payments for {batch.employeeCount} employees totaling GHS{" "}
          {batch.totalAmount.toLocaleString()}
        </p>
      </div>

      {!isProcessing ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Payment Breakdown:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div>Bank Transfers: 150 employees</div>
              <div>MTN Mobile Money: 60 employees</div>
              <div>Vodafone Cash: 25 employees</div>
              <div>AirtelTigo Money: 12 employees</div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-900">Processing Notes:</p>
            </div>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• Bank payments will be processed via secure file transfer</li>
              <li>• Mobile money payments will be processed in real-time</li>
              <li>• All employees will receive SMS notifications</li>
              <li>• Failed payments will be flagged for manual review</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleProcess} className="bg-emerald-600 hover:bg-emerald-700">
              <Send className="w-4 h-4 mr-2" />
              Process Payments
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Processing Payments...</h4>
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
