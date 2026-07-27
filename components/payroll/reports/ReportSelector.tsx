"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Receipt, DollarSign, TrendingUp, Gift, Minus } from "lucide-react"

// Report types match the API route slugs exactly: /api/payroll/reports/[type]
export type ReportType =
  | 'ssnit-tier1'
  | 'ssnit-tier2'
  | 'provident-fund'
  | 'paye'
  | 'allowances'
  | 'deductions'

interface ReportSelectorProps {
  selectedReport: ReportType | null
  onSelectReport: (reportType: ReportType) => void
}

const REPORT_OPTIONS: Array<{
  type: ReportType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    type: 'ssnit-tier1',
    label: 'SSNIT Tier 1 (13.5%)',
    description: 'Employer & employee SSNIT contributions',
    icon: Receipt,
  },
  {
    type: 'ssnit-tier2',
    label: 'SSNIT Tier 2 (5%)',
    description: 'Secondary SSNIT contributions',
    icon: TrendingUp,
  },
  {
    type: 'provident-fund',
    label: 'Provident Fund',
    description: 'Employee provident fund deductions',
    icon: DollarSign,
  },
  {
    type: 'paye',
    label: 'PAYE Tax',
    description: 'PAYE tax calculations and liabilities',
    icon: FileText,
  },
  {
    type: 'allowances',
    label: 'Allowances',
    description: 'Employee allowances grouped by type',
    icon: Gift,
  },
  {
    type: 'deductions',
    label: 'Deductions',
    description: 'Employee deductions with policy numbers',
    icon: Minus,
  },
]

export function ReportSelector({ selectedReport, onSelectReport }: ReportSelectorProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Select Report Type</CardTitle>
        <CardDescription>Choose which Ghana payroll report to generate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REPORT_OPTIONS.map(({ type, label, description, icon: Icon }) => (
            <Button
              key={type}
              variant={selectedReport === type ? 'default' : 'outline'}
              className="h-auto flex-col items-start gap-1.5 p-3 text-left whitespace-normal min-h-[64px]"
              onClick={() => onSelectReport(type)}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold leading-tight">{label}</span>
              </div>
              <span className="text-xs opacity-70 leading-snug">{description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
