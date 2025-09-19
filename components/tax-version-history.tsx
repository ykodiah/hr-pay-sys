"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  History,
  GitBranch,
  Eye,
  RotateCcw,
  FileText,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TaxVersion {
  id: string
  versionNumber: number
  versionName: string
  status: "draft" | "active" | "superseded" | "archived"
  effectiveDate: string
  expiryDate?: string
  source: string
  sourceReference: string
  confidenceScore: number
  validationStatus: "pending" | "verified" | "failed"
  createdAt: string
  createdBy: string
  approvedAt?: string
  approvedBy?: string
  notes: string
}

interface AuditLogEntry {
  id: string
  actionType: string
  entityType: string
  changeSummary: string
  userName: string
  userRole: string
  ipAddress: string
  createdAt: string
  oldValues?: any
  newValues?: any
  metadata?: any
}

interface TaxComparison {
  fromVersion: TaxVersion
  toVersion: TaxVersion
  differences: {
    taxBands: {
      changed: boolean
      from: any[]
      to: any[]
    }
    socialSecurity: {
      changed: boolean
      from: any[]
      to: any[]
    }
  }
  impactAnalysis?: {
    affectedEmployees: number
    estimatedImpact: number
    riskLevel: "low" | "medium" | "high"
  }
}

export default function TaxVersionHistory() {
  const { toast } = useToast()
  const [selectedCountry, setSelectedCountry] = useState("ghana")
  const [selectedYear, setSelectedYear] = useState(2025)
  const [versions, setVersions] = useState<TaxVersion[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [selectedComparison, setSelectedComparison] = useState<TaxComparison | null>(null)
  const [showRollbackDialog, setShowRollbackDialog] = useState(false)

  // Sample data
  useEffect(() => {
    const sampleVersions: TaxVersion[] = [
      {
        id: "1",
        versionNumber: 3,
        versionName: "2025 Mid-Year Update",
        status: "active",
        effectiveDate: "2025-07-01",
        source: "government_api",
        sourceReference: "https://api.gra.gov.gh/v1/tax-rates/2025/mid-year",
        confidenceScore: 0.98,
        validationStatus: "verified",
        createdAt: "2025-06-15T10:30:00Z",
        createdBy: "System Auto-Update",
        approvedAt: "2025-06-16T14:20:00Z",
        approvedBy: "Tax Administrator",
        notes: "Mid-year adjustment based on economic indicators",
      },
      {
        id: "2",
        versionNumber: 2,
        versionName: "2025 Corrected Rates",
        status: "superseded",
        effectiveDate: "2025-03-01",
        expiryDate: "2025-06-30",
        source: "manual_import",
        sourceReference: "GRA Circular No. 2025/03",
        confidenceScore: 1.0,
        validationStatus: "verified",
        createdAt: "2025-02-28T16:45:00Z",
        createdBy: "HR Administrator",
        approvedAt: "2025-03-01T09:00:00Z",
        approvedBy: "Finance Director",
        notes: "Correction to band 4 rate from 17.5% to 18%",
      },
      {
        id: "3",
        versionNumber: 1,
        versionName: "2025 Initial Rates",
        status: "superseded",
        effectiveDate: "2025-01-01",
        expiryDate: "2025-02-28",
        source: "government_api",
        sourceReference: "https://api.gra.gov.gh/v1/tax-rates/2025",
        confidenceScore: 0.95,
        validationStatus: "verified",
        createdAt: "2024-12-15T12:00:00Z",
        createdBy: "System Auto-Update",
        approvedAt: "2024-12-20T10:00:00Z",
        approvedBy: "Tax Administrator",
        notes: "Initial tax rates for 2025 fiscal year",
      },
    ]

    const sampleAuditLog: AuditLogEntry[] = [
      {
        id: "1",
        actionType: "activate",
        entityType: "tax_version",
        changeSummary: "Activated 2025 Mid-Year Update (v3)",
        userName: "Tax Administrator",
        userRole: "admin",
        ipAddress: "192.168.1.100",
        createdAt: "2025-06-16T14:20:00Z",
        metadata: { previousActiveVersion: "2", newActiveVersion: "1" },
      },
      {
        id: "2",
        actionType: "approve",
        entityType: "tax_version",
        changeSummary: "Approved 2025 Mid-Year Update (v3)",
        userName: "Tax Administrator",
        userRole: "admin",
        ipAddress: "192.168.1.100",
        createdAt: "2025-06-16T14:19:00Z",
      },
      {
        id: "3",
        actionType: "create",
        entityType: "tax_version",
        changeSummary: "Created 2025 Mid-Year Update (v3) from government API",
        userName: "System Auto-Update",
        userRole: "system",
        ipAddress: "10.0.0.1",
        createdAt: "2025-06-15T10:30:00Z",
        metadata: { source: "government_api", confidence: 0.98 },
      },
      {
        id: "4",
        actionType: "supersede",
        entityType: "tax_version",
        changeSummary: "Superseded 2025 Corrected Rates (v2)",
        userName: "System",
        userRole: "system",
        ipAddress: "10.0.0.1",
        createdAt: "2025-06-16T14:20:00Z",
      },
      {
        id: "5",
        actionType: "update",
        entityType: "tax_band",
        changeSummary: "Updated band 4 rate from 17.5% to 18.5%",
        userName: "HR Administrator",
        userRole: "hr_admin",
        ipAddress: "192.168.1.105",
        createdAt: "2025-06-15T10:31:00Z",
        oldValues: { rate: 17.5 },
        newValues: { rate: 18.5 },
      },
    ]

    setVersions(sampleVersions)
    setAuditLog(sampleAuditLog)
  }, [selectedCountry, selectedYear])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "draft":
        return "secondary"
      case "superseded":
        return "outline"
      case "archived":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getValidationColor = (status: string) => {
    switch (status) {
      case "verified":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const compareVersions = async (fromVersionId: string, toVersionId: string) => {
    console.log(`[v0] Comparing versions ${fromVersionId} to ${toVersionId}`)

    // Simulate API call to compare versions
    setTimeout(() => {
      const fromVersion = versions.find((v) => v.id === fromVersionId)!
      const toVersion = versions.find((v) => v.id === toVersionId)!

      const comparison: TaxComparison = {
        fromVersion,
        toVersion,
        differences: {
          taxBands: {
            changed: true,
            from: [
              { band: 4, rate: 17.5, from: 730, to: 3896.67 },
              { band: 6, rate: 30, from: 19896.67, to: 50416.67 },
            ],
            to: [
              { band: 4, rate: 18.5, from: 730, to: 3896.67 },
              { band: 6, rate: 32, from: 19896.67, to: 52000 },
            ],
          },
          socialSecurity: {
            changed: false,
            from: [{ tier: 1, employee: 5.5, employer: 13.0 }],
            to: [{ tier: 1, employee: 5.5, employer: 13.0 }],
          },
        },
        impactAnalysis: {
          affectedEmployees: 247,
          estimatedImpact: 12500,
          riskLevel: "medium",
        },
      }

      setSelectedComparison(comparison)
    }, 1000)
  }

  const rollbackToVersion = async (versionId: string) => {
    console.log(`[v0] Rolling back to version ${versionId}`)

    try {
      // Simulate rollback process
      setTimeout(() => {
        toast({
          title: "Rollback Initiated",
          description: "Tax rates are being rolled back. This may take a few minutes.",
        })

        // Update version statuses
        setVersions((prev) =>
          prev.map((v) => ({
            ...v,
            status: v.id === versionId ? "active" : v.status === "active" ? "superseded" : v.status,
          })),
        )

        setShowRollbackDialog(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Rollback Failed",
        description: "Failed to rollback tax rates. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Tax Rate Version History
          </h2>
          <p className="text-muted-foreground">Track changes, compare versions, and manage tax rate rollbacks</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ghana">Ghana</SelectItem>
              <SelectItem value="nigeria">Nigeria</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="versions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="versions">Version History</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="comparison">Version Comparison</TabsTrigger>
          <TabsTrigger value="rollback">Rollback Management</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Tax Rate Versions - {selectedCountry.charAt(0).toUpperCase() + selectedCountry.slice(1)} {selectedYear}
              </CardTitle>
              <CardDescription>Complete history of tax rate changes with approval workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Validation</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">v{version.versionNumber}</TableCell>
                      <TableCell>{version.versionName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(version.status)}>{version.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(version.effectiveDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {version.source === "government_api" && <Shield className="h-3 w-3" />}
                          {version.source === "manual_import" && <FileText className="h-3 w-3" />}
                          <span className="text-sm">{version.source.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getValidationColor(version.validationStatus)}>
                          {version.validationStatus === "verified" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {version.validationStatus === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {version.validationStatus === "failed" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {version.validationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{version.createdBy}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          {version.status !== "active" && (
                            <Button variant="ghost" size="sm" onClick={() => rollbackToVersion(version.id)}>
                              <RotateCcw className="h-3 w-3" />
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

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete log of all tax rate changes and system actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{formatDate(entry.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.actionType}</Badge>
                      </TableCell>
                      <TableCell>{entry.entityType}</TableCell>
                      <TableCell>{entry.changeSummary}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{entry.userName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {entry.userRole}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{entry.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Version Comparison</CardTitle>
              <CardDescription>Compare different tax rate versions to understand changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">From Version</label>
                  <Select
                    onValueChange={(value) => {
                      const toVersion = versions[0]?.id
                      if (toVersion && value !== toVersion) {
                        compareVersions(value, toVersion)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.versionNumber} - {version.versionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">To Version</label>
                  <Select
                    onValueChange={(value) => {
                      const fromVersion = versions[1]?.id
                      if (fromVersion && value !== fromVersion) {
                        compareVersions(fromVersion, value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.versionNumber} - {version.versionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedComparison && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span className="font-medium">
                      Comparing v{selectedComparison.fromVersion.versionNumber}
                      <ArrowRight className="h-4 w-4 mx-2 inline" />v{selectedComparison.toVersion.versionNumber}
                    </span>
                  </div>

                  {selectedComparison.differences.taxBands.changed && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Tax bands have changed between these versions.
                        {selectedComparison.impactAnalysis && (
                          <span className="ml-2">
                            Estimated impact: {selectedComparison.impactAnalysis.affectedEmployees} employees, GH₵{" "}
                            {selectedComparison.impactAnalysis.estimatedImpact.toLocaleString()}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">From: v{selectedComparison.fromVersion.versionNumber}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedComparison.differences.taxBands.from.map((band: any, index: number) => (
                            <div key={index} className="text-sm">
                              Band {band.band}: {band.rate}% ({band.from.toLocaleString()} -{" "}
                              {band.to?.toLocaleString() || "No limit"})
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">To: v{selectedComparison.toVersion.versionNumber}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedComparison.differences.taxBands.to.map((band: any, index: number) => (
                            <div key={index} className="text-sm">
                              Band {band.band}: <span className="font-medium text-blue-600">{band.rate}%</span> (
                              {band.from.toLocaleString()} - {band.to?.toLocaleString() || "No limit"})
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rollback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rollback Management</CardTitle>
              <CardDescription>Emergency rollback capabilities for tax rate versions</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Rolling back tax rates will affect all future payroll calculations. Ensure you have proper
                  authorization before proceeding.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-semibold">Available Rollback Targets</h4>
                {versions
                  .filter((v) => v.status !== "active")
                  .map((version) => (
                    <Card key={version.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">
                              v{version.versionNumber} - {version.versionName}
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              Effective: {formatDate(version.effectiveDate)} • Created by: {version.createdBy}
                            </p>
                          </div>
                          <Button variant="outline" onClick={() => setShowRollbackDialog(true)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Rollback
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Tax Rate Rollback</DialogTitle>
            <DialogDescription>
              This action will rollback the tax rates to a previous version. This change will affect all future payroll
              calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone automatically. You will need to manually reapply any subsequent updates if
                needed.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => rollbackToVersion(versions[1]?.id)}>
                Confirm Rollback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
