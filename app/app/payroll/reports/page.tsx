"use client"

import { useCallback, useState, useTransition } from "react"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, FileBarChart } from "lucide-react"
import { ReportSelector, type ReportType } from "@/components/payroll/reports/ReportSelector"
import { PeriodSelector } from "@/components/payroll/reports/PeriodSelector"
import { StandardReportViewer } from "@/components/payroll/reports/StandardReportViewer"
import { AllowancesSectionViewer } from "@/components/payroll/reports/AllowancesSectionViewer"
import { DeductionsSectionViewer } from "@/components/payroll/reports/DeductionsSectionViewer"
import { ExportButtons } from "@/components/payroll/reports/ExportButtons"
import {
  exportStandardReportToCSV,
  exportStandardReportToExcel,
  exportAllowancesReportToCSV,
  exportAllowancesReportToExcel,
  exportDeductionsReportToCSV,
  exportDeductionsReportToExcel,
} from "@/lib/payroll/report-export"

// Column definitions keyed by report type slug (must match ReportType values)
const REPORT_COLUMNS: Record<string, Array<{ key: string; label: string; format?: (v: any) => string }>> = {
  'ssnit-tier1': [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'ssnit_number', label: 'SSNIT Number' },
    { key: 'nia_number', label: 'NIA Number' },
    { key: 'surname', label: 'Surname' },
    { key: 'first_name', label: 'First Name' },
    { key: 'other_names', label: 'Other Names' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'tier1_contribution', label: '13.50% (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'code', label: 'Code' },
  ],
  'ssnit-tier2': [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'ssnit_number', label: 'SSNIT Number' },
    { key: 'nia_number', label: 'NIA Number' },
    { key: 'surname', label: 'Surname' },
    { key: 'first_name', label: 'First Name' },
    { key: 'other_names', label: 'Other Names' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'tier2_contribution', label: '5% (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'code', label: 'Code' },
  ],
  'provident-fund': [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'ssnit_number', label: 'SSNIT Number' },
    { key: 'nia_number', label: 'NIA Number' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'pf_contribution', label: 'PF Deducted (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'pf_percentage', label: 'Percentage (%)', format: (v) => Number(v).toFixed(2) },
  ],
  'paye': [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'tin_number', label: 'TIN' },
    { key: 'full_name', label: 'Employee Name' },
    { key: 'category', label: 'Category' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'total_allowances', label: 'Allowances (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'overtime_income', label: 'OT Income (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'basic_tax', label: 'Basic Tax (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'total_tax_payable', label: 'Total Tax (GHS)', format: (v) => Number(v).toFixed(2) },
    { key: 'net_pay', label: 'Net Pay (GHS)', format: (v) => Number(v).toFixed(2) },
  ],
}

const MULTI_SECTION_TYPES: ReportType[] = ['allowances', 'deductions']

export default function PayrollReportsPage() {
  const [, startTransition] = useTransition()

  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const generateReport = useCallback(async () => {
    if (!selectedReport || !selectedPeriod) {
      setError('Please select a report type and pay period')
      return
    }

    setLoading(true)
    setError('')
    setReport(null)

    try {
      // companyId is resolved server-side via resolveTenantContext — send empty string
      // and let the API route derive it from the session/demo cookie
      const response = await fetch(`/api/payroll/reports/${selectedReport}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: '', payPeriod: selectedPeriod }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Server error ${response.status}`)
      }

      const data = await response.json()
      setReport(data.report)
      toast({ title: 'Report generated', description: `${data.report.reportType} for ${selectedPeriod}` })
    } catch (err: any) {
      const message = err.message || 'Failed to generate report'
      setError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedReport, selectedPeriod])

  const makeExportOptions = () => ({
    reportType: report?.reportType ?? '',
    companyName: report?.companyName ?? '',
    erNumber: report?.erNumber ?? '',
    payPeriod: report?.payPeriod ?? selectedPeriod,
    generatedAt: report?.generatedAt ?? new Date().toISOString(),
  })

  const handleExportPDF = () => {
    window.print()
  }

  const handleExportExcel = () => {
    if (!report || !selectedReport) return
    const opts = makeExportOptions()
    if (selectedReport === 'allowances') {
      exportAllowancesReportToExcel(opts, report.sections || [])
    } else if (selectedReport === 'deductions') {
      exportDeductionsReportToExcel(opts, report.sections || [])
    } else {
      exportStandardReportToExcel(opts, REPORT_COLUMNS[selectedReport] || [], report.rows || [])
    }
    toast({ title: 'Excel exported' })
  }

  const handleExportCSV = () => {
    if (!report || !selectedReport) return
    const opts = makeExportOptions()
    if (selectedReport === 'allowances') {
      exportAllowancesReportToCSV(opts, report.sections || [])
    } else if (selectedReport === 'deductions') {
      exportDeductionsReportToCSV(opts, report.sections || [])
    } else {
      exportStandardReportToCSV(opts, REPORT_COLUMNS[selectedReport] || [], report.rows || [])
    }
    toast({ title: 'CSV exported' })
  }

  const canGenerate = !!selectedReport && !!selectedPeriod

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileBarChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ghana Payroll Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Generate statutory and operational payroll reports for submission
            </p>
          </div>
        </div>

        {/* Step 1 & 2 — selectors side-by-side */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ReportSelector selectedReport={selectedReport} onSelectReport={setSelectedReport} />
          <PeriodSelector selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
        </div>

        {/* Generate */}
        <Button
          onClick={() => startTransition(generateReport)}
          disabled={!canGenerate || loading}
          size="lg"
          className="w-full sm:w-auto min-w-48"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </Button>

        {/* Error */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-5 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">Error generating report</p>
                <p className="text-sm text-muted-foreground mt-0.5">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report output */}
        {report && (
          <div className="space-y-4 print:mt-0">
            <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
              <h2 className="text-lg font-semibold">{report.reportType}</h2>
              <ExportButtons
                reportType={selectedReport || ''}
                payPeriod={selectedPeriod}
                companyName={report.companyName}
                isLoading={loading}
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
              />
            </div>

            {selectedReport === 'allowances' ? (
              <AllowancesSectionViewer
                companyName={report.companyName}
                erNumber={report.erNumber}
                payPeriod={report.payPeriod}
                sections={report.sections || []}
                generatedAt={report.generatedAt}
              />
            ) : selectedReport === 'deductions' ? (
              <DeductionsSectionViewer
                companyName={report.companyName}
                erNumber={report.erNumber}
                payPeriod={report.payPeriod}
                sections={report.sections || []}
                generatedAt={report.generatedAt}
              />
            ) : (
              <StandardReportViewer
                title={report.reportType}
                companyName={report.companyName}
                erNumber={report.erNumber}
                payPeriod={report.payPeriod}
                columns={REPORT_COLUMNS[selectedReport as string] || []}
                rows={report.rows || []}
                totalRows={report.totalRows ?? (report.rows?.length ?? 0)}
                generatedAt={report.generatedAt}
                footerNote={report.notes}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
