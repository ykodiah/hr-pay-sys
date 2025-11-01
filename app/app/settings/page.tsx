"use client"

import { useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Shield, Users, Building2, BarChart3 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TemplateManager } from "@/components/communication/template-manager"
import { SnippetManager } from "@/components/communication/snippet-manager"

interface MetricCardProps {
  title: string
  value: string
  deltaLabel: string
  icon: React.ComponentType<{ className?: string }>
  deltaValue: number
}

function MetricCard({ title, value, deltaLabel, icon: Icon, deltaValue }: MetricCardProps) {
  const deltaText = `${deltaValue > 0 ? "+" : ""}${deltaValue}% ${deltaLabel}`
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
          <p className={`text-xs ${deltaValue >= 0 ? "text-emerald-600" : "text-red-500"}`}>{deltaText}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
    </Card>
  )
}

function ChannelHealthSummary() {
  const channels = useMemo(
    () => [
      {
        key: "email",
        name: "Transactional Email",
        status: "healthy",
        provider: "SendGrid",
        updated: new Date().toISOString(),
      },
      {
        key: "sms",
        name: "SMS Alerts",
        status: "warning",
        provider: "Twilio",
        updated: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        key: "slack",
        name: "Slack Notifications",
        status: "healthy",
        provider: "Payroll Alerts Workspace",
        updated: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ],
    [],
  )

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Channel health</CardTitle>
        <CardDescription>Connection status for core delivery providers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map((channel) => (
          <div key={channel.key} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{channel.name}</p>
                <Badge variant={channel.status === "healthy" ? "secondary" : "destructive"} className="capitalize">
                  {channel.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Provider: {channel.provider}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(channel.updated), { addSuffix: true })}
            </p>
          </div>
        ))}
        <Button variant="outline" className="w-full md:w-auto">
          View audit log
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Workspace settings</h1>
        <p className="max-w-2xl text-muted-foreground">
          Maintain secure delivery channels, reusable templates, and governance controls for the Akwaaba HR communication stack.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active employees" value="482" deltaLabel="vs last month" icon={Users} deltaValue={4.2} />
        <MetricCard title="Connected channels" value="6" deltaLabel="uptime" icon={Building2} deltaValue={99.5} />
        <MetricCard title="Automation coverage" value="72%" deltaLabel="journeys templated" icon={BarChart3} deltaValue={8.0} />
        <MetricCard title="Security posture" value="Low risk" deltaLabel="alerts resolved" icon={Shield} deltaValue={12.4} />
      </section>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          <ChannelHealthSummary />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="snippets">
          <SnippetManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

