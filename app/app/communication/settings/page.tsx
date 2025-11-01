"use client"

import { useEffect, useReducer, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, RefreshCcw, Save, ShieldCheck, Wrench } from "lucide-react"
import { TemplateManager } from "@/components/communication/template-manager"
import { SnippetManager } from "@/components/communication/snippet-manager"

type ChannelType = "email" | "sms" | "whatsapp" | "push" | "teams" | "slack" | "webhook"

interface CredentialField {
  key: string
  label: string
  placeholder?: string
  required?: boolean
}

interface ConfigField {
  key: string
  label: string
  placeholder?: string
  type?: string
  required?: boolean
}

interface ChannelDescriptor {
  type: ChannelType
  title: string
  description: string
  providerHint: string
  credentialFields: CredentialField[]
  configFields: ConfigField[]
}

const CHANNEL_CONFIG: ChannelDescriptor[] = [
  {
    type: "email",
    title: "Transactional Email",
    description: "Configure SendGrid, AWS SES, Mailgun or any SMTP-based provider for payslips and announcements.",
    providerHint: "SendGrid",
    credentialFields: [{ key: "apiKey", label: "API Key", placeholder: "SG.xxxxx", required: true }],
    configFields: [
      { key: "fromEmail", label: "Default From Email", placeholder: "payroll@company.com", required: true, type: "email" },
      { key: "fromName", label: "From Name", placeholder: "Payroll Team" },
      { key: "replyTo", label: "Reply-To Email", placeholder: "hr@company.com", type: "email" },
    ],
  },
  {
    type: "sms",
    title: "SMS Gateway",
    description: "Use Twilio, Infobip or local aggregators to send time-sensitive payroll alerts.",
    providerHint: "Twilio",
    credentialFields: [
      { key: "accountSid", label: "Account SID", required: true },
      { key: "authToken", label: "Auth Token", required: true },
    ],
    configFields: [
      { key: "senderId", label: "Sender ID", placeholder: "COMPANY" },
      { key: "countryCode", label: "Default Country Code", placeholder: "+233" },
    ],
  },
  {
    type: "whatsapp",
    title: "WhatsApp Business",
    description: "Deliver conversational notifications and self-service automation via WhatsApp.",
    providerHint: "Meta Business / Twilio",
    credentialFields: [
      { key: "businessAccountId", label: "Business Account ID", required: true },
      { key: "accessToken", label: "Access Token", required: true },
    ],
    configFields: [
      { key: "phoneNumber", label: "Registered Number", placeholder: "+233541234567", required: true },
      { key: "fallbackTemplate", label: "Fallback Template", placeholder: "PAYROLL_ALERT" },
    ],
  },
  {
    type: "push",
    title: "Mobile Push",
    description: "Enable push notifications for in-app and mobile experiences.",
    providerHint: "Firebase Cloud Messaging",
    credentialFields: [
      { key: "serviceAccount", label: "Service Account JSON", required: true },
    ],
    configFields: [
      { key: "defaultTopic", label: "Default Topic", placeholder: "all-employees" },
    ],
  },
  {
    type: "teams",
    title: "Microsoft Teams",
    description: "Send payroll and HR alerts directly into Teams channels.",
    providerHint: "Azure AD App",
    credentialFields: [
      { key: "clientId", label: "Client ID", required: true },
      { key: "clientSecret", label: "Client Secret", required: true },
      { key: "tenantId", label: "Tenant ID", required: true },
    ],
    configFields: [
      { key: "defaultChannelWebhook", label: "Default Channel Webhook", placeholder: "https://" },
    ],
  },
  {
    type: "slack",
    title: "Slack",
    description: "Pipe urgent payroll alerts into Slack channels or DMs.",
    providerHint: "Slack App",
    credentialFields: [
      { key: "botToken", label: "Bot Token", required: true },
      { key: "signingSecret", label: "Signing Secret", required: true },
    ],
    configFields: [
      { key: "defaultChannel", label: "Default Channel", placeholder: "#payroll-alerts" },
    ],
  },
  {
    type: "webhook",
    title: "Generic Webhook",
    description: "Deliver outbound events to custom endpoints for bespoke integrations.",
    providerHint: "Custom Endpoint",
    credentialFields: [
      { key: "secret", label: "Signing Secret", required: true },
    ],
    configFields: [
      { key: "endpoint", label: "Endpoint URL", placeholder: "https://hooks.company.com/payroll", required: true },
      { key: "httpMethod", label: "HTTP Method", placeholder: "POST" },
    ],
  },
]

type IntegrationStatus = "pending" | "active" | "error" | "disabled"

interface IntegrationState {
  id?: string
  providerName: string
  providerIdentifier: string
  displayLabel: string
  configuration: Record<string, string>
  credentials: Record<string, string>
  hasCredentials: boolean
  rotateCredentials: boolean
  isActive: boolean
  status: IntegrationStatus
  lastValidatedAt?: string | null
  validationError?: string | null
  saving: boolean
  testing: boolean
  dirty: boolean
}

type IntegrationAction =
  | { type: "hydrate"; payload: Partial<IntegrationState> }
  | { type: "updateField"; field: keyof IntegrationState; value: any }
  | { type: "updateConfig"; key: string; value: string }
  | { type: "updateCredential"; key: string; value: string }
  | { type: "toggleRotate"; value: boolean }
  | { type: "setSaving"; value: boolean }
  | { type: "setTesting"; value: boolean }
  | { type: "markClean" }

const defaultIntegrationState: IntegrationState = {
  providerName: "",
  providerIdentifier: "",
  displayLabel: "",
  configuration: {},
  credentials: {},
  hasCredentials: false,
  rotateCredentials: false,
  isActive: false,
  status: "pending",
  lastValidatedAt: null,
  validationError: null,
  saving: false,
  testing: false,
  dirty: false,
}

const initialState = CHANNEL_CONFIG.reduce<Record<ChannelType, IntegrationState>>((acc, channel) => {
  acc[channel.type] = { ...defaultIntegrationState }
  return acc
}, {} as Record<ChannelType, IntegrationState>)

type ChannelsAction =
  | { type: "hydrate"; channel: ChannelType; payload: Partial<IntegrationState> }
  | { type: "updateField"; channel: ChannelType; field: keyof IntegrationState; value: any }
  | { type: "updateConfig"; channel: ChannelType; key: string; value: string }
  | { type: "updateCredential"; channel: ChannelType; key: string; value: string }
  | { type: "toggleRotate"; channel: ChannelType; value: boolean }
  | { type: "setSaving"; channel: ChannelType; value: boolean }
  | { type: "setTesting"; channel: ChannelType; value: boolean }

function channelsReducer(state: Record<ChannelType, IntegrationState>, action: ChannelsAction) {
  const next = { ...state }
  const current = next[action.channel] ?? { ...defaultIntegrationState }

  switch (action.type) {
    case "hydrate":
      next[action.channel] = {
        ...current,
        ...action.payload,
        configuration: action.payload.configuration ?? current.configuration ?? {},
        hasCredentials: action.payload.hasCredentials ?? current.hasCredentials,
        rotateCredentials: false,
        credentials: {},
        dirty: false,
      }
      return next
    case "updateField":
      next[action.channel] = { ...current, [action.field]: action.value, dirty: true }
      return next
    case "updateConfig":
      next[action.channel] = {
        ...current,
        configuration: { ...(current.configuration ?? {}), [action.key]: action.value },
        dirty: true,
      }
      return next
    case "updateCredential":
      next[action.channel] = {
        ...current,
        credentials: { ...(current.credentials ?? {}), [action.key]: action.value },
        rotateCredentials: true,
        dirty: true,
      }
      return next
    case "toggleRotate":
      next[action.channel] = {
        ...current,
        rotateCredentials: action.value,
        credentials: action.value ? current.credentials ?? {} : {},
        dirty: true,
      }
      return next
    case "setSaving":
      next[action.channel] = { ...current, saving: action.value }
      return next
    case "setTesting":
      next[action.channel] = { ...current, testing: action.value }
      return next
    default:
      return state
  }
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const variant = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    disabled: "bg-slate-100 text-slate-600",
  }[status]

  const label = {
    active: "Active",
    pending: "Pending",
    error: "Error",
    disabled: "Disabled",
  }[status]

  return <Badge className={`${variant} font-medium`}>{label}</Badge>
}

export default function CommunicationIntegrationSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [state, dispatch] = useReducer(channelsReducer, initialState)

  useEffect(() => {
    async function loadIntegrations() {
      try {
        const response = await fetch("/api/communication/integrations")
        if (!response.ok) throw new Error(await response.text())
        const payload = await response.json()
        const data = payload?.data ?? []

        data.forEach((item: any) => {
          const channel = item.channel_type as ChannelType
          dispatch({
            type: "hydrate",
            channel,
            payload: {
              id: item.id,
              providerName: item.provider_name ?? "",
              providerIdentifier: item.provider_identifier ?? "",
              displayLabel: item.display_label ?? "",
              configuration: item.configuration ?? {},
              hasCredentials: item.has_credentials ?? false,
              isActive: item.is_active ?? false,
              status: (item.status as IntegrationStatus) ?? "pending",
              lastValidatedAt: item.last_validated_at,
              validationError: item.validation_error,
            },
          })
        })
      } catch (error: any) {
        console.error("Failed to load integrations", error)
        toast({
          title: "Unable to load integrations",
          description: error?.message ?? "Check your network connection and try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadIntegrations()
  }, [dispatch, toast])

  async function handleSave(channel: ChannelDescriptor) {
    const current = state[channel.type]
    if (!current.providerName.trim()) {
      toast({ title: "Provider name required", description: "Enter the provider powering this channel." })
      return
    }

    const body: any = {
      channelType: channel.type,
      providerName: current.providerName,
      providerIdentifier: current.providerIdentifier || undefined,
      displayLabel: current.displayLabel || undefined,
      configuration: current.configuration,
      isActive: current.isActive,
      status: current.status,
    }

    if (current.rotateCredentials) {
      body.credentials = current.credentials
    }

    const url = current.id ? `/api/communication/integrations/${current.id}` : "/api/communication/integrations"
    const method = current.id ? "PATCH" : "POST"

    dispatch({ type: "setSaving", channel: channel.type, value: true })
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || "Failed to save integration")
      }

      const payload = await response.json()
      const item = payload.data
      dispatch({
        type: "hydrate",
        channel: channel.type,
        payload: {
          id: item.id,
          providerName: item.provider_name ?? current.providerName,
          providerIdentifier: item.provider_identifier ?? "",
          displayLabel: item.display_label ?? "",
          configuration: item.configuration ?? {},
          hasCredentials: item.has_credentials ?? current.hasCredentials,
          isActive: item.is_active ?? false,
          status: item.status ?? "pending",
          lastValidatedAt: item.last_validated_at,
          validationError: item.validation_error,
        },
      })

      toast({
        title: `${channel.title} saved`,
        description: "Channel configuration updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: `Failed to save ${channel.title}`,
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "setSaving", channel: channel.type, value: false })
    }
  }

  async function handleTest(channel: ChannelDescriptor) {
    const current = state[channel.type]
    dispatch({ type: "setTesting", channel: channel.type, value: true })
    try {
      const response = await fetch("/api/communication/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelType: channel.type,
          providerName: current.providerName,
          configuration: current.configuration,
          credentials: current.rotateCredentials ? current.credentials : undefined,
          integrationId: current.id,
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || "Unable to run test")
      }

      const payload = await response.json()
      toast({
        title: `${channel.title} connection healthy`,
        description: payload?.message || "Provider responded successfully.",
      })
    } catch (error: any) {
      toast({
        title: `${channel.title} test failed`,
        description: error?.message ?? "Unable to verify channel.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "setTesting", channel: channel.type, value: false })
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Communication workspace</h1>
        <p className="text-muted-foreground max-w-2xl">
          Connect outbound channels, author reusable templates, and centralize snippets for automation journeys.
        </p>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-8">
          <div className="space-y-2">
            <Badge className="bg-emerald-100 text-emerald-700">Tenant-controlled credentials</Badge>
            <p className="text-muted-foreground max-w-2xl">
              Connect your email, SMS, WhatsApp, and collaboration providers. Credentials stay encrypted, and you can rotate them at any time without involving support.
            </p>
          </div>

          <div className="grid gap-6">
            {CHANNEL_CONFIG.map((channel) => {
              const current = state[channel.type]
              const rotateEnabled = current.rotateCredentials || !current.hasCredentials
              return (
                <Card key={channel.type} className="border border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        {channel.title}
                        <StatusBadge status={current.status} />
                      </CardTitle>
                      <CardDescription className="mt-3 text-sm text-muted-foreground max-w-3xl">
                        {channel.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={current.isActive}
                          onCheckedChange={(value) =>
                            dispatch({ type: "updateField", channel: channel.type, field: "isActive", value })
                          }
                          id={`${channel.type}-active`}
                        />
                        <Label htmlFor={`${channel.type}-active`} className="text-sm font-medium">
                          {current.isActive ? "Channel active" : "Channel inactive"}
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator className="my-2" />
                  <CardContent className="space-y-6">
                    <section className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${channel.type}-provider`}>Provider name</Label>
                        <Input
                          id={`${channel.type}-provider`}
                          placeholder={channel.providerHint}
                          value={current.providerName}
                          onChange={(event) =>
                            dispatch({
                              type: "updateField",
                              channel: channel.type,
                              field: "providerName",
                              value: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${channel.type}-identifier`}>Provider identifier</Label>
                        <Input
                          id={`${channel.type}-identifier`}
                          placeholder="Account ID / workspace"
                          value={current.providerIdentifier}
                          onChange={(event) =>
                            dispatch({
                              type: "updateField",
                              channel: channel.type,
                              field: "providerIdentifier",
                              value: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${channel.type}-label`}>Display label</Label>
                        <Input
                          id={`${channel.type}-label`}
                          placeholder="Visible name to admins"
                          value={current.displayLabel}
                          onChange={(event) =>
                            dispatch({
                              type: "updateField",
                              channel: channel.type,
                              field: "displayLabel",
                              value: event.target.value,
                            })
                          }
                        />
                      </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2">
                      {channel.configFields.map((field) => (
                        <div className="space-y-2" key={`${channel.type}-config-${field.key}`}>
                          <Label htmlFor={`${channel.type}-config-${field.key}`}>{field.label}</Label>
                          <Input
                            id={`${channel.type}-config-${field.key}`}
                            type={field.type ?? "text"}
                            placeholder={field.placeholder}
                            value={current.configuration?.[field.key] ?? ""}
                            onChange={(event) =>
                              dispatch({
                                type: "updateConfig",
                                channel: channel.type,
                                key: field.key,
                                value: event.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Credential vault</h3>
                          <p className="text-sm text-muted-foreground">
                            Credentials are encrypted with your tenant secret. {current.hasCredentials ? "Rotate to update" : "Add credentials to activate."}
                          </p>
                        </div>
                        {current.hasCredentials && (
                          <Button
                            type="button"
                            variant={current.rotateCredentials ? "secondary" : "outline"}
                            size="sm"
                            onClick={() =>
                              dispatch({
                                type: "toggleRotate",
                                channel: channel.type,
                                value: !current.rotateCredentials,
                              })
                            }
                            className="gap-2"
                          >
                            <RefreshCcw className="h-4 w-4" />
                            {current.rotateCredentials ? "Cancel rotation" : "Rotate credentials"}
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {channel.credentialFields.map((field) => (
                          <div className="space-y-2" key={`${channel.type}-credential-${field.key}`}>
                            <Label htmlFor={`${channel.type}-credential-${field.key}`}>{field.label}</Label>
                            <Input
                              id={`${channel.type}-credential-${field.key}`}
                              type="password"
                              placeholder={rotateEnabled ? field.placeholder : "????????"}
                              value={rotateEnabled ? current.credentials?.[field.key] ?? "" : ""}
                              disabled={!rotateEnabled}
                              onChange={(event) =>
                                dispatch({
                                  type: "updateCredential",
                                  channel: channel.type,
                                  key: field.key,
                                  value: event.target.value,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {current.lastValidatedAt && (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            Validated {new Date(current.lastValidatedAt).toLocaleString()}
                          </span>
                        )}
                        {current.validationError && (
                          <span className="text-red-500">Last validation failed: {current.validationError}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          disabled={current.testing}
                          onClick={() => handleTest(channel)}
                        >
                          {current.testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                          Test connection
                        </Button>
                        <Button
                          type="button"
                          className="gap-2"
                          disabled={current.saving || (!current.dirty && !current.rotateCredentials)}
                          onClick={() => handleSave(channel)}
                        >
                          {current.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save settings
                        </Button>
                      </div>
                    </section>
                  </CardContent>
                </Card>
              )
            })}
          </div>
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
