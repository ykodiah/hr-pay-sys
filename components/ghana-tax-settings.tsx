"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Calculator,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Percent,
  DollarSign,
  Shield,
  FileText,
  Info,
  ChevronRight,
  RotateCcw,
} from "lucide-react"
import {
  calculateGhanaTax,
  GRA_2025_PAYE_BANDS,
  GRA_2025_SSNIT,
  GRA_2025_TIER2,
  type PAYEBand,
  type TaxRates,
  type EmployeePayInput,
  type TaxCalculationResult,
} from "@/lib/ghana-tax/engine"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaxBandRow {
  id?: string
  band_order: number
  rate: number
  threshold_amount: number
  is_remaining_amount: boolean
  description: string
}

interface TaxRateRow {
  id?: string
  rate_type: "ssnit" | "tier2" | "tier3"
  employee_rate: number
  employer_rate: number
}

interface Props {
  companyId: string
  taxYear?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number) {
  return new Intl.NumberFormat("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function pct(n: number) {
  return `${n.toFixed(2)}%`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TaxBandEditor({
  bands,
  onChange,
  onSave,
  onReset,
  saving,
}: {
  bands: TaxBandRow[]
  onChange: (bands: TaxBandRow[]) => void
  onSave: () => void
  onReset: () => void
  saving: boolean
}) {
  const handleFieldChange = (index: number, field: keyof TaxBandRow, value: string | number | boolean) => {
    const updated = bands.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    onChange(updated)
  }

  const totalThreshold = bands.filter((b) => !b.is_remaining_amount).reduce((s, b) => s + b.threshold_amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Annual progressive tax bands per GRA Income Tax (Amendment) Act, 2023 (Act 1094).
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total annual income covered by finite bands: GHS {fmt(totalThreshold)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to GRA defaults
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save bands
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground w-14">#</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Rate (%)</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Annual threshold (GHS)</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Type</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Description</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((band, index) => (
              <tr key={index} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="py-2 px-4">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {band.band_order}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={band.rate}
                      onChange={(e) => handleFieldChange(index, "rate", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20 text-right"
                    />
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </td>
                <td className="py-2 px-4">
                  {band.is_remaining_amount ? (
                    <span className="text-muted-foreground italic text-xs">Remaining</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">GHS</span>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={band.threshold_amount}
                        onChange={(e) =>
                          handleFieldChange(index, "threshold_amount", parseFloat(e.target.value) || 0)
                        }
                        className="h-8 w-28 text-right"
                      />
                    </div>
                  )}
                </td>
                <td className="py-2 px-4">
                  {band.is_remaining_amount ? (
                    <Badge variant="secondary" className="text-xs">Remaining</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Standard</Badge>
                  )}
                </td>
                <td className="py-2 px-4 text-muted-foreground text-xs">{band.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SSNITRatesEditor({
  rates,
  onChange,
  onSave,
  saving,
}: {
  rates: TaxRateRow[]
  onChange: (rates: TaxRateRow[]) => void
  onSave: () => void
  saving: boolean
}) {
  const handleChange = (rateType: string, field: "employee_rate" | "employer_rate", value: number) => {
    const updated = rates.map((r) => (r.rate_type === rateType ? { ...r, [field]: value } : r))
    onChange(updated)
  }

  const rateLabels: Record<string, { label: string; subtitle: string; color: string }> = {
    ssnit: { label: "SSNIT Tier 1", subtitle: "Social Security & National Insurance Trust", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
    tier2: { label: "SSNIT Tier 2 (NHIA)", subtitle: "National Health Insurance Authority", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
    tier3: { label: "Tier 3 Provident Fund", subtitle: "Voluntary — configure per company policy", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Contribution rates applied on employee basic salary. Tier 3 is voluntary — set to 0 to disable.
        </p>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Save rates
        </Button>
      </div>

      <div className="grid gap-4">
        {rates.map((rate) => {
          const meta = rateLabels[rate.rate_type]
          const total = rate.employee_rate + rate.employer_rate
          return (
            <div key={rate.rate_type} className="rounded-lg border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">{meta?.label}</p>
                  <p className="text-xs text-muted-foreground">{meta?.subtitle}</p>
                </div>
                <Badge className={`text-xs font-semibold ${meta?.color}`}>
                  Total: {pct(total)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Employee contribution</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={rate.employee_rate}
                      onChange={(e) =>
                        handleChange(rate.rate_type, "employee_rate", parseFloat(e.target.value) || 0)
                      }
                      className="h-9 w-24 text-right"
                    />
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Employer contribution</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={rate.employer_rate}
                      onChange={(e) =>
                        handleChange(rate.rate_type, "employer_rate", parseFloat(e.target.value) || 0)
                      }
                      className="h-9 w-24 text-right"
                    />
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LiveCalculator({ bands, rates }: { bands: TaxBandRow[]; rates: TaxRateRow[] }) {
  const [basic, setBasic] = useState(5000)
  const [transport, setTransport] = useState(500)
  const [housing, setHousing] = useState(1000)
  const [overtime, setOvertime] = useState(0)
  const [result, setResult] = useState<TaxCalculationResult | null>(null)

  const runCalculation = useCallback(() => {
    const taxRates: TaxRates = {
      paye_bands: bands.map((b) => ({
        band_order: b.band_order,
        rate: b.rate,
        threshold_amount: b.threshold_amount,
        is_remaining_amount: b.is_remaining_amount,
        description: b.description,
      })),
      ssnit: rates.find((r) => r.rate_type === "ssnit")
        ? { employee_rate: rates.find((r) => r.rate_type === "ssnit")!.employee_rate, employer_rate: rates.find((r) => r.rate_type === "ssnit")!.employer_rate }
        : GRA_2025_SSNIT,
      tier2: rates.find((r) => r.rate_type === "tier2")
        ? { employee_rate: rates.find((r) => r.rate_type === "tier2")!.employee_rate, employer_rate: rates.find((r) => r.rate_type === "tier2")!.employer_rate }
        : GRA_2025_TIER2,
      tier3: { employee_rate: 0, employer_rate: 0 },
    }
    const input: EmployeePayInput = {
      monthly_basic: basic,
      monthly_allowances: { transport, housing },
      monthly_overtime: overtime,
    }
    setResult(calculateGhanaTax(input, taxRates))
  }, [basic, transport, housing, overtime, bands, rates])

  useEffect(() => {
    runCalculation()
  }, [runCalculation])

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Live tax preview using the currently configured rates. Changes to bands and rates reflect here instantly.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Basic salary (GHS/mo)", value: basic, set: setBasic },
          { label: "Transport allowance", value: transport, set: setTransport },
          { label: "Housing allowance", value: housing, set: setHousing },
          { label: "Overtime pay", value: overtime, set: setOvertime },
        ].map(({ label, value, set }) => (
          <div key={label} className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Input
              type="number"
              min={0}
              step={100}
              value={value}
              onChange={(e) => set(parseFloat(e.target.value) || 0)}
              className="h-9"
            />
          </div>
        ))}
      </div>

      {result && (
        <div className="space-y-3">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Gross pay", value: result.monthly_gross, color: "text-foreground" },
              { label: "PAYE tax", value: result.monthly_paye_tax, color: "text-destructive" },
              { label: "Net pay", value: result.monthly_net_pay, color: "text-green-600 dark:text-green-400" },
              { label: "Employer cost", value: result.monthly_total_employer_cost, color: "text-amber-600 dark:text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">{label} / month</p>
                <p className={`text-lg font-semibold font-mono ${color}`}>GHS {fmt(value)}</p>
              </div>
            ))}
          </div>

          {/* SSNIT / Tier breakdown */}
          <div className="rounded-lg border p-4 space-y-2 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Social contributions breakdown</p>
            {[
              { label: "SSNIT employee (5.5%)", value: result.monthly_ssnit_employee },
              { label: "SSNIT employer (13%)", value: result.monthly_ssnit_employer },
              { label: "Tier 2 employee (5%)", value: result.monthly_tier2_employee },
              { label: "Tier 2 employer (5%)", value: result.monthly_tier2_employer },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-medium">GHS {fmt(value)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Annual taxable income</span>
              <span className="font-mono font-medium">GHS {fmt(result.annual_taxable_income)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Annual PAYE tax</span>
              <span className="font-mono font-medium text-destructive">GHS {fmt(result.annual_paye_tax)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Effective tax rate</span>
              <Badge variant="outline" className="font-mono">{pct(result.effective_tax_rate)}</Badge>
            </div>
          </div>

          {/* PAYE band breakdown */}
          {result.paye_band_breakdown.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PAYE band-by-band (annual)</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {result.paye_band_breakdown.map((b) => (
                    <tr key={b.band_order} className="border-b last:border-0">
                      <td className="py-2 px-4 text-muted-foreground">{b.description}</td>
                      <td className="py-2 px-4 text-right font-mono">GHS {fmt(b.taxable_in_band)}</td>
                      <td className="py-2 px-4 text-center">
                        <ChevronRight className="h-3 w-3 text-muted-foreground inline" />
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-medium text-destructive">GHS {fmt(b.tax_in_band)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GhanaTaxSettings({ companyId, taxYear }: Props) {
  const year = taxYear ?? new Date().getFullYear()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [savingBands, setSavingBands] = useState(false)
  const [savingRates, setSavingRates] = useState(false)
  const [bands, setBands] = useState<TaxBandRow[]>([])
  const [taxRates, setTaxRates] = useState<TaxRateRow[]>([])

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [bandsRes, ratesRes] = await Promise.all([
        supabase
          .from("paye_tax_bands")
          .select("id, band_order, rate, threshold_amount, is_remaining_amount, description")
          .eq("company_id", companyId)
          .eq("tax_year", year)
          .eq("is_active", true)
          .order("band_order", { ascending: true }),
        supabase
          .from("tax_rates")
          .select("id, rate_type, employee_rate, employer_rate")
          .eq("company_id", companyId)
          .eq("is_active", true),
      ])

      if (bandsRes.data && bandsRes.data.length > 0) {
        setBands(
          bandsRes.data.map((b) => ({
            id: b.id,
            band_order: b.band_order,
            rate: Number(b.rate),
            threshold_amount: Number(b.threshold_amount),
            is_remaining_amount: b.is_remaining_amount ?? false,
            description: b.description ?? "",
          }))
        )
      } else {
        // Fallback to GRA defaults
        setBands(
          GRA_2025_PAYE_BANDS.map((b) => ({
            band_order: b.band_order,
            rate: b.rate,
            threshold_amount: b.threshold_amount,
            is_remaining_amount: b.is_remaining_amount,
            description: b.description,
          }))
        )
      }

      if (ratesRes.data && ratesRes.data.length > 0) {
        setTaxRates(
          ratesRes.data.map((r) => ({
            id: r.id,
            rate_type: r.rate_type as "ssnit" | "tier2" | "tier3",
            employee_rate: Number(r.employee_rate),
            employer_rate: Number(r.employer_rate),
          }))
        )
      } else {
        setTaxRates([
          { rate_type: "ssnit", employee_rate: 5.5, employer_rate: 13 },
          { rate_type: "tier2", employee_rate: 5, employer_rate: 5 },
          { rate_type: "tier3", employee_rate: 0, employer_rate: 0 },
        ])
      }

      setLoading(false)
    }
    load()
  }, [companyId, year])

  // Save PAYE bands
  const saveBands = async () => {
    setSavingBands(true)
    const rows = bands.map((b) => ({
      company_id: companyId,
      band_order: b.band_order,
      rate: b.rate,
      threshold_amount: b.threshold_amount,
      is_remaining_amount: b.is_remaining_amount,
      description: b.description,
      tax_year: year,
      effective_date: `${year}-01-01`,
      currency_code: "GHS",
      is_active: true,
    }))

    const { error } = await supabase
      .from("paye_tax_bands")
      .upsert(rows, { onConflict: "company_id,tax_year,band_order" })

    setSavingBands(false)
    if (error) {
      toast({ title: "Error saving bands", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "PAYE bands saved", description: `${year} tax bands updated successfully.` })
    }
  }

  // Reset bands to GRA defaults
  const resetBands = () => {
    setBands(
      GRA_2025_PAYE_BANDS.map((b) => ({
        band_order: b.band_order,
        rate: b.rate,
        threshold_amount: b.threshold_amount,
        is_remaining_amount: b.is_remaining_amount,
        description: b.description,
      }))
    )
    toast({ title: "Reset to GRA 2025 defaults", description: "Save to persist the reset." })
  }

  // Save SSNIT / Tier rates
  const saveRates = async () => {
    setSavingRates(true)
    const rows = taxRates.map((r) => ({
      company_id: companyId,
      rate_type: r.rate_type,
      employee_rate: r.employee_rate,
      employer_rate: r.employer_rate,
      tax_year: year,
      effective_date: `${year}-01-01`,
      is_active: true,
      ...(r.id ? { id: r.id } : {}),
    }))

    const { error } = await supabase
      .from("tax_rates")
      .upsert(rows, { onConflict: "company_id,rate_type" })

    setSavingRates(false)
    if (error) {
      toast({ title: "Error saving rates", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "SSNIT/Tier rates saved", description: "Contribution rates updated successfully." })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Ghana Tax Engine</h2>
            <Badge variant="outline" className="text-xs">{year}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure PAYE bands, SSNIT/Tier contributions, and tax reliefs per GRA Act 1094.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          GRA 2025 rates loaded
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-3 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Changes to tax rates affect all future payroll calculations. Always verify against the latest GRA gazette notice before saving.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="paye">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paye" className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            PAYE Bands
          </TabsTrigger>
          <TabsTrigger value="ssnit" className="flex items-center gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" />
            SSNIT / Tiers
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-1.5 text-xs">
            <Calculator className="h-3.5 w-3.5" />
            Live Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paye" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                PAYE Progressive Tax Bands
              </CardTitle>
              <CardDescription>Annual income brackets and corresponding tax rates (GHS).</CardDescription>
            </CardHeader>
            <CardContent>
              <TaxBandEditor
                bands={bands}
                onChange={setBands}
                onSave={saveBands}
                onReset={resetBands}
                saving={savingBands}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssnit" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                SSNIT & Tier Contribution Rates
              </CardTitle>
              <CardDescription>Employee and employer contribution percentages applied on basic salary.</CardDescription>
            </CardHeader>
            <CardContent>
              <SSNITRatesEditor
                rates={taxRates}
                onChange={setTaxRates}
                onSave={saveRates}
                saving={savingRates}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Live Tax Calculator
              </CardTitle>
              <CardDescription>Preview tax calculations with the current configuration.</CardDescription>
            </CardHeader>
            <CardContent>
              <LiveCalculator bands={bands} rates={taxRates} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
