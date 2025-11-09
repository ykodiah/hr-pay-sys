"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Bell, CheckCircle, AlertTriangle, Clock, Filter } from "lucide-react"

interface Alert {
  id: string
  rule_id: string
  employee_id: string
  alert_type: string
  severity: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  metadata: any
  status: "pending" | "sent" | "acknowledged" | "resolved" | "escalated"
  sent_at: string | null
  acknowledged_at: string | null
  resolved_at: string | null
  escalated_at: string | null
  created_at: string
  employee?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
  rule?: {
    rule_name: string
    severity: string
    notification_channels: string[]
  }
}

interface AlertRule {
  id: string
  rule_name: string
  rule_type: string
  alert_category: string
  trigger_condition: any
  severity: string
  notification_channels: string[]
  recipient_roles: string[]
  is_auto_escalate: boolean
  escalation_delay_hours: number
  is_active: boolean
  template_key: string
}

export default function AlertsManagementPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false)
  const [responseNote, setResponseNote] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchAlerts()
    fetchRules()
  }, [])

  async function fetchAlerts() {
    try {
      const response = await fetch("/api/attendance/alerts")
      const data = await response.json()
      if (data.success) {
        setAlerts(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRules() {
    try {
      const response = await fetch("/api/attendance/alerts/rules")
      const data = await response.json()
      if (data.success) {
        setRules(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error)
    }
  }

  async function handleAcknowledgeAlert() {
    if (!selectedAlert) return

    try {
      const response = await fetch("/api/attendance/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: selectedAlert.id,
          action: "acknowledge",
          response_note: responseNote,
        }),
      })

      if (response.ok) {
        toast({ title: "Alert acknowledged", description: "The alert has been acknowledged successfully." })
        setShowAcknowledgeDialog(false)
        setResponseNote("")
        fetchAlerts()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to acknowledge alert", variant: "destructive" })
    }
  }

  async function handleResolveAlert(alertId: string) {
    try {
      const response = await fetch("/api/attendance/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alertId,
          action: "resolve",
        }),
      })

      if (response.ok) {
        toast({ title: "Alert resolved", description: "The alert has been marked as resolved." })
        fetchAlerts()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to resolve alert", variant: "destructive" })
    }
  }

  async function handleToggleRule(ruleId: string, isActive: boolean) {
    try {
      const response = await fetch("/api/attendance/alerts/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rule_id: ruleId,
          is_active: isActive,
        }),
      })

      if (response.ok) {
        toast({ title: "Rule updated", description: `Alert rule has been ${isActive ? "enabled" : "disabled"}.` })
        fetchRules()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update rule", variant: "destructive" })
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus !== "all" && alert.status !== filterStatus) return false
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false
    return true
  })

  const alertStats = {
    total: alerts.length,
    pending: alerts.filter((a) => a.status === "pending").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
    critical: alerts.filter((a) => a.severity === "critical").length,
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "sent":
        return <Bell className="w-4 h-4" />
      case "acknowledged":
        return <CheckCircle className="w-4 h-4" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "escalated":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
        <p className="text-muted-foreground">Manage attendance, overtime, and compliance alerts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{alertStats.acknowledged}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alertStats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Severity</Label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(alert.status)}
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        <Badge variant="outline">{alert.alert_type.replace(/_/g, " ")}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{alert.title}</h3>
                      <p className="text-muted-foreground mt-1">{alert.message}</p>
                      {alert.employee && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Employee: {alert.employee.first_name} {alert.employee.last_name} ({alert.employee.employee_id}
                          )
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Created {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {alert.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert)
                            setShowAcknowledgeDialog(true)
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {(alert.status === "acknowledged" || alert.status === "pending") && (
                        <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {rule.rule_name}
                        <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Type: {rule.rule_type} • Category: {rule.alert_category}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div>
                      <span className="font-medium">Channels:</span> {rule.notification_channels.join(", ")}
                    </div>
                    <div>
                      <span className="font-medium">Recipients:</span> {rule.recipient_roles.join(", ")}
                    </div>
                    {rule.is_auto_escalate && (
                      <div>
                        <span className="font-medium">Auto-escalate:</span> Yes (after {rule.escalation_delay_hours}{" "}
                        hours)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>View resolved and archived alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts
                  .filter((a) => a.status === "resolved")
                  .map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Resolved {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Resolved
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Acknowledge Dialog */}
      <Dialog open={showAcknowledgeDialog} onOpenChange={setShowAcknowledgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>Provide a response or note about this alert</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Response Note</Label>
              <Textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="Add any notes or actions taken..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcknowledgeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledgeAlert}>Acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
