"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Receipt,
  DollarSign,
  TrendingUp,
  Gift,
  Minus,
} from "lucide-react"

export type ReportType = 'ssnit_tier1' | 'ssnit_tier2' | 'provident_fund' | 'paye' | 'allowances' | 'deductions'

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
    type: 'ssnit_tier1',
    label: 'SSNIT Tier 1 (13.5%)',
    description: 'Employee and employer SSNIT contributions',
    icon: Receipt,
  },
  {
    type: 'ssnit_tier2',
    label: 'SSNIT Tier 2 (5%)',
    description: 'Secondary SSNIT contributions',
    icon: TrendingUp,
  },
  {
    type: 'provident_fund',
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
    description: 'Employee allowances by type',
    icon: Gift,
  },
  {
    type: 'deductions',
    label: 'Deductions',
    description: 'Employee deductions and policy numbers',
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {REPORT_OPTIONS.map(({ type, label, description, icon: Icon }) => (
            <Button
              key={type}
              variant={selectedReport === type ? 'default' : 'outline'}
              className="h-auto flex-col items-start gap-2 p-4 text-left"
              onClick={() => onSelectReport(type)}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <span className="font-semibold">{label}</span>
              </div>
              <span className="text-xs opacity-75">{description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
