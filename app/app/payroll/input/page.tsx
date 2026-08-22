"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import {
  calculateGhanaTax,
  DEFAULT_TAX_RATES,
  round2,
  type TaxRates,
  type TaxReliefItem,
} from "@/lib/ghana-tax/engine"
import {
  RefreshCw,
  Save,
  ClipboardList,
  ArrowRight,
  Database,
  Calculator,
} from "lucide-react"
import Link from "next/link"

type PayInputRow = {
  employee_id: string
  employee_code: string
  full_name: string
  department: string | null
  master: {
    basic_salary: number
    transport_allowance: number
    housing_allowance: number
    medical_allowance: number
    meal_allowance: number
    communication_allowance: number
    uniform_allowance: number
    other_allowances: number
    card_allowances?: number
    card_deductions?: number
    component_bonus?: number
    component_backpay?: number
    separate_backpay?: number
    tier2_applicable: boolean
    tier3_applicable: boolean
    provident_fund_rate?: number
  }
  input: {
    id: string | null
    basic_salary: number | null
    transport_allowance: number | null
    housing_allowance: number | null
    medical_allowance: number | null
    meal_allowance: number | null
    communication_allowance: number | null
    uniform_allowance: number | null
    other_allowances: number | null
    overtime_amount: number
    bonus_amount: number
    loan_deduction: number
    advance_deduction: number
    other_deductions: number
    tier2_applicable: boolean
    tier3_applicable: boolean
    tier3_employee_rate: number
    apply_to_master: boolean
    notes: string
    status: string
  }
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

function effectiveBasic(row: PayInputRow) {
  return row.input.basic_salary ?? row.master.basic_salary
}

/** Matches Process Payroll worksheet: master/input allowances + employee card allowances. */
function effectiveAllowances(row: PayInputRow) {
  return (
    (row.input.transport_allowance ?? row.master.transport_allowance) +
    (row.input.housing_allowance ?? row.master.housing_allowance) +
    (row.input.medical_allowance ?? row.master.medical_allowance) +
    (row.input.meal_allowance ?? row.master.meal_allowance) +
    (row.input.communication_allowance ?? row.master.communication_allowance) +
    (row.input.uniform_allowance ?? row.master.uniform_allowance) +
    (row.input.other_allowances ?? row.master.other_allowances) +
    Number(row.master.card_allowances ?? 0)
  )
}

/** Period other deductions + employee card deductions (same as Process Payroll). */
function effectiveOtherDeductions(row: PayInputRow) {
  return Number(row.input.other_deductions ?? 0) + Number(row.master.card_deductions ?? 0)
}

function effectiveBonus(row: PayInputRow) {
  return (
    Number(row.input.bonus_amount ?? 0) +
    Number(row.master.component_bonus ?? 0) +
    Number(row.master.component_backpay ?? 0)
  )
}

export default function PayInputsPage() {
  const [companyId, setCompanyId] = useState("")
  const [payPeriod, setPayPeriod] = useState(currentPeriod())
  const [rows, setRows] = useState<PayInputRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [taxRates, setTaxRates] = useState<TaxRates>(DEFAULT_TAX_RATES)
  const [reliefsByEmployee, setReliefsByEmployee] = useState<Record<string, TaxReliefItem[]>>({})

  const resolveCompany = useCallback(async () => {
    const id = await resolveClientCompanyId()
    setCompanyId(id)
    return id
  }, [])

  const loadTaxRates = useCallback(async (cid: string, period: string) => {
    try {
      const year = Number(period.slice(0, 4)) || new Date().getFullYear()
      const res = await fetch(
        `/api/settings/tax?company_id=${encodeURIComponent(cid)}&tax_year=${year}`,
        { cache: "no-store", credentials: "include" },
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return
      setTaxRates({
        ...DEFAULT_TAX_RATES,
        ssnit: json.ssnit ?? DEFAULT_TAX_RATES.ssnit,
        tier2: json.tier2 ?? DEFAULT_TAX_RATES.tier2,
        tier3: json.tier3 ?? DEFAULT_TAX_RATES.tier3,
        paye_bands: json.paye_bands ?? DEFAULT_TAX_RATES.paye_bands,
        paye_bands_are_monthly: json.paye_bands_are_monthly ?? true,
      })
    } catch {
      // keep defaults
    }
  }, [])

  const loadReliefs = useCallback(async (cid: string, period: string) => {
    try {
      const year = Number(period.slice(0, 4)) || new Date().getFullYear()
      const res = await fetch(
        `/api/payroll/tax-reliefs?company_id=${encodeURIComponent(cid)}&tax_year=${year}&mode=payroll_map`,
        { cache: "no-store", credentials: "include" },
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReliefsByEmployee({})
        return
      }
      setReliefsByEmployee(json.by_employee || {})
    } catch {
      setReliefsByEmployee({})
    }
  }, [])

  const loadRows = useCallback(async (cid: string, period: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/payroll/input?company_id=${encodeURIComponent(cid)}&pay_period=${encodeURIComponent(period)}`,
        { cache: "no-store" },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load pay inputs")
      startTransition(() => {
        setRows(json.rows ?? [])
        setLastSyncedAt(json.meta?.fetched_at ?? new Date().toISOString())
      })
    } catch (error: any) {
      toast({
        title: "Could not load Pay Inputs",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const cid = companyId || (await resolveCompany())
      if (cid) {
        await Promise.all([
          loadRows(cid, payPeriod),
          loadTaxRates(cid, payPeriod),
          loadReliefs(cid, payPeriod),
        ])
      } else setLoading(false)
    })()
  }, [companyId, payPeriod, resolveCompany, loadRows, loadTaxRates, loadReliefs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        (r.employee_code ?? "").toLowerCase().includes(q) ||
        (r.department ?? "").toLowerCase().includes(q),
    )
  }, [rows, search])

  const updateRow = (employeeId: string, patch: Partial<PayInputRow["input"]>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.employee_id === employeeId ? { ...r, input: { ...r.input, ...patch } } : r,
      ),
    )
  }

  /** Same calculation path as Process Payroll worksheet (Tier 2 excluded from cash). */
  const previewNet = (row: PayInputRow) => {
    const tax = calculateGhanaTax(
      {
        monthly_basic: effectiveBasic(row),
        monthly_allowances: { other: effectiveAllowances(row) },
        monthly_overtime: row.input.overtime_amount,
        monthly_bonus: effectiveBonus(row),
        tier2_applicable: row.input.tier2_applicable,
        tier3_applicable: row.input.tier3_applicable,
        tier3_employee_rate: row.input.tier3_employee_rate || undefined,
        annual_tax_reliefs: reliefsByEmployee[row.employee_id] || [],
        other_deductions: {
          loan: row.input.loan_deduction,
          advance: row.input.advance_deduction,
          other: effectiveOtherDeductions(row),
        },
      },
      {
        ...taxRates,
        tier3: {
          employee_rate: row.input.tier3_employee_rate || taxRates.tier3?.employee_rate || 0,
          employer_rate: taxRates.tier3?.employer_rate || 0,
        },
      },
    )
    return tax
  }

  const handleSave = async (applyMasterDefault = false) => {
    if (!companyId) return
    setSaving(true)
    try {
      const payload = {
        company_id: companyId,
        pay_period: payPeriod,
        pay_period_start: `${payPeriod}-01`,
        rows: rows.map((r) => ({
          employee_id: r.employee_id,
          basic_salary: r.input.basic_salary,
          transport_allowance: r.input.transport_allowance,
          housing_allowance: r.input.housing_allowance,
          medical_allowance: r.input.medical_allowance,
          meal_allowance: r.input.meal_allowance,
          communication_allowance: r.input.communication_allowance,
          uniform_allowance: r.input.uniform_allowance,
          other_allowances: r.input.other_allowances,
          overtime_amount: r.input.overtime_amount,
          bonus_amount: r.input.bonus_amount,
          loan_deduction: r.input.loan_deduction,
          advance_deduction: r.input.advance_deduction,
          other_deductions: r.input.other_deductions,
          tier2_applicable: r.input.tier2_applicable,
          tier3_applicable: r.input.tier3_applicable,
          tier3_employee_rate: r.input.tier3_employee_rate,
          apply_to_master: applyMasterDefault || r.input.apply_to_master,
          notes: r.input.notes,
          status: "approved",
        })),
      }

      const res = await fetch("/api/payroll/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Save failed")

      toast({
        title: "Pay Inputs saved",
        description: `${json.saved} employee row(s) synced for ${payPeriod}.`,
      })
      await loadRows(companyId, payPeriod)
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-6 w-6 text-emerald-700" />
            <h1 className="text-2xl font-semibold tracking-tight">Pay Inputs</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Period overrides for overtime, loans, and one-off amounts. Active{" "}
            <Link href="/app/payroll/components" className="underline underline-offset-2">
              Pay Components
            </Link>{" "}
            are the source of truth for allowances, bonuses, backpay, deductions, and provident fund —
            those amounts are merged in automatically and are not duplicated from master “other”.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/payroll">
              Process Payroll <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            disabled={loading || isPending || !companyId}
            onClick={() =>
              companyId &&
              Promise.all([
                loadRows(companyId, payPeriod),
                loadTaxRates(companyId, payPeriod),
                loadReliefs(companyId, payPeriod),
              ])
            }
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            disabled={saving || !companyId || !rows.length}
            onClick={() => handleSave(false)}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save period inputs"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pay period</p>
            <Input
              type="month"
              className="mt-1"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-lg font-semibold">{rows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calculator className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="text-xs text-muted-foreground">DB sync</p>
              <p className="text-sm font-medium">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              className="mt-1"
              placeholder="Name, ID, or department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Period worksheet</CardTitle>
          <CardDescription>
            Leave salary/allowance fields blank to use the employee master. Preview includes assigned tax
            reliefs and employee-module card deductions. Overtime tax is remitted with PAYE. Tier 2 (5%)
            is not deducted here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading pay inputs…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No employees for this company.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Basic (override)</TableHead>
                    <TableHead>OT amount</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Loan</TableHead>
                    <TableHead>Advance</TableHead>
                    <TableHead>Other ded.</TableHead>
                    <TableHead className="text-right">Tax Relief</TableHead>
                    <TableHead className="text-right">Preview PAYE</TableHead>
                    <TableHead className="text-right">Preview net</TableHead>
                    <TableHead>Sync master</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const preview = previewNet(row)
                    const monthlyRelief = round2((preview.annual_tax_reliefs || 0) / 12)
                    const cardDed = Number(row.master.card_deductions ?? 0)
                    return (
                      <TableRow key={row.employee_id}>
                        <TableCell>
                          <div className="font-medium">{row.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.employee_code} · {row.department || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Master basic: GHS {row.master.basic_salary.toLocaleString()}
                          </div>
                          {row.input.tier3_applicable && (
                            <div className="text-xs text-emerald-700 mt-0.5">
                              Tier 3/PF {row.input.tier3_employee_rate || 0}%
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-28"
                            placeholder={String(row.master.basic_salary)}
                            value={row.input.basic_salary ?? ""}
                            onChange={(e) =>
                              updateRow(row.employee_id, {
                                basic_salary: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24"
                            value={row.input.overtime_amount}
                            onChange={(e) =>
                              updateRow(row.employee_id, { overtime_amount: Number(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24"
                            value={row.input.bonus_amount}
                            onChange={(e) =>
                              updateRow(row.employee_id, { bonus_amount: Number(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24"
                            value={row.input.loan_deduction}
                            onChange={(e) =>
                              updateRow(row.employee_id, { loan_deduction: Number(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24"
                            value={row.input.advance_deduction}
                            onChange={(e) =>
                              updateRow(row.employee_id, { advance_deduction: Number(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24"
                            value={row.input.other_deductions}
                            onChange={(e) =>
                              updateRow(row.employee_id, { other_deductions: Number(e.target.value) || 0 })
                            }
                          />
                          {cardDed > 0 && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              + card {cardDed.toFixed(2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm font-medium">{monthlyRelief.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">monthly</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm font-medium text-red-600">
                            {round2(preview.monthly_total_paye_withheld).toLocaleString()}
                          </div>
                          {preview.monthly_overtime_tax > 0 && (
                            <div className="text-xs text-muted-foreground">
                              incl. OT tax {preview.monthly_overtime_tax.toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-semibold text-emerald-700">
                            {round2(preview.monthly_net_pay).toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={row.input.apply_to_master}
                              onCheckedChange={(checked) =>
                                updateRow(row.employee_id, { apply_to_master: Boolean(checked) })
                              }
                            />
                            <Label className="text-xs text-muted-foreground">Update master</Label>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
