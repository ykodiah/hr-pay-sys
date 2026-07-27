"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
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

const REPORT_COLUMNS: Record<string, Array<{ key: string; label: string; format?: (v: any) => string }>> = {
  ssnit_tier1: [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'ssnit_number', label: 'SSNIT Number' },
    { key: 'nia_number', label: 'NIA Number' },
    { key: 'surname', label: 'Surname' },
    { key: 'first_name', label: 'First Name' },
    { key: 'other_names', label: 'Other Names' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'tier1_contribution', label: '13.50% (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'code', label: 'Code' },
  ],
  ssnit_tier2: [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'ssnit_number', label: 'SSNIT Number' },
    { key: 'nia_number', label: 'NIA Number' },
    { key: 'surname', label: 'Surname' },
    { key: 'first_name', label: 'First Name' },
    { key: 'other_names', label: 'Other Names' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'tier2_contribution', label: '5% (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'code', label: 'Code' },
  ],
  provident_fund: [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'ssnit_number', label: 'SSNIT Number' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'pf_contribution', label: 'PF Deducted (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'pf_percentage', label: 'Percentage (%)', format: (v) => (v as number).toFixed(2) },
  ],
  paye: [
    { key: 'staff_id', label: 'Staff ID' },
    { key: 'tin_number', label: 'TIN' },
    { key: 'full_name', label: 'Employee Name' },
    { key: 'category', label: 'Category' },
    { key: 'basic_salary', label: 'Basic Salary (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'total_allowances', label: 'Allowances (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'overtime_income', label: 'OT Income (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'basic_tax', label: 'Basic Tax (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'total_tax_payable', label: 'Total Tax (GHS)', format: (v) => (v as number).toFixed(2) },
    { key: 'net_pay', label: 'Net Pay (GHS)', format: (v) => (v as number).toFixed(2) },
  ],
}

export default function PayrollReportsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [companyId, setCompanyId] = useState<string>('')
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Get company ID on mount
  useEffect(() => {
    const getCompanyId = async () => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: emp } = await supabase
          .from('employees')
          .select('company_id')
          .eq('id', user.user.id)
          .single()

        if (emp?.company_id) {
          setCompanyId(emp.company_id)
        }
      } catch (err) {
        console.error('[v0] Failed to get company:', err)
      }
    }

    getCompanyId()
  }, [supabase, router])

  const generateReport = useCallback(async () => {
    if (!selectedReport || !selectedPeriod || !companyId) {
      setError('Please select a report type and period')
      return
    }

    setLoading(true)
    setError('')
    setReport(null)

    try {
      const response = await fetch(`/api/payroll/reports/${selectedReport}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          payPeriod: selectedPeriod,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      const data = await response.json()
      setReport(data.report)
      toast({ title: 'Success', description: 'Report generated successfully' })
    } catch (err: any) {
      const message = err.message || 'Failed to generate report'
      setError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
      console.error('[v0] Report generation error:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedReport, selectedPeriod, companyId])

  const handleExportPDF = async () => {
    if (!report) return
    try {
      // PDF export via print: user can save as PDF from print dialog
      window.print()
      toast({ title: 'Info', description: 'Use browser print dialog to save as PDF', variant: 'default' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' })
    }
  }

  const handleExportExcel = async () => {
    if (!report || !selectedReport) return
    try {
      if (selectedReport === 'allowances') {
        exportAllowancesReportToExcel(
          {
            reportType: report.reportType,
            companyName: report.companyName,
            erNumber: report.erNumber,
            payPeriod: report.payPeriod,
            generatedAt: report.generatedAt,
          },
          report.sections || []
        )
      } else if (selectedReport === 'deductions') {
        exportDeductionsReportToExcel(
          {
            reportType: report.reportType,
            companyName: report.companyName,
            erNumber: report.erNumber,
            payPeriod: report.payPeriod,
            generatedAt: report.generatedAt,
          },
          report.sections || []
        )
      } else {
        exportStandardReportToExcel(
          {
            reportType: report.reportType,
            companyName: report.companyName,
            erNumber: report.erNumber,
            payPeriod: report.payPeriod,
            generatedAt: report.generatedAt,
          },
          REPORT_COLUMNS[selectedReport as keyof typeof REPORT_COLUMNS] || [],
          report.rows || []
        )
      }
      toast({ title: 'Success', description: 'Report exported to Excel', variant: 'default' })
    } catch (err) {
      console.error('[v0] Excel export error:', err)
      toast({ title: 'Error', description: 'Failed to export Excel', variant: 'destructive' })
    }
  }

  const handleExportCSV = async () => {
    if (!report || !selectedReport) return
    try {
      if (selectedReport === 'allowances') {
        exportAllowancesReportToCSV(
          {
            reportType: report.reportType,
            companyName: report.companyName,
            erNumber: report.erNumber,
            payPeriod: report.payPeriod,
            generatedAt: report.generatedAt,
          },
          report.sections || []
        )
      } else if (selectedReport === 'deductions') {
        exportDeductionsReportToCSV(
          {
            reportType: report.reportType,
            companyName: report.companyName,
            erNumber: report.erNumber,
            payPeriod: report.payPeriod,
            generatedAt: report.generatedAt,
          },
          report.sections || []
        )
      } else {
        exportStandardReportToCSV(
          {
            reportType: report.reportType,
            companyName: report.companyName,
            erNumber: report.erNumber,
            payPeriod: report.payPeriod,
            generatedAt: report.generatedAt,
          },
          REPORT_COLUMNS[selectedReport as keyof typeof REPORT_COLUMNS] || [],
          report.rows || []
        )
      }
      toast({ title: 'Success', description: 'Report exported to CSV', variant: 'default' })
    } catch (err) {
      console.error('[v0] CSV export error:', err)
      toast({ title: 'Error', description: 'Failed to export CSV', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Ghana Payroll Reports</h1>
          <p className="text-muted-foreground mt-1">Generate statutory and operational payroll reports</p>
        </div>

        {/* Selectors */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ReportSelector selectedReport={selectedReport} onSelectReport={setSelectedReport} />
          <PeriodSelector selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
        </div>

        {/* Generate Button */}
        <div>
          <Button
            onClick={() => startTransition(generateReport)}
            disabled={!selectedReport || !selectedPeriod || loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              'Generate Report'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Display */}
        {report && (
          <div className="space-y-4">
            {/* Export Buttons */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Report</h2>
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

            {/* Render appropriate viewer based on report type */}
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
                columns={REPORT_COLUMNS[selectedReport as keyof typeof REPORT_COLUMNS] || []}
                rows={report.rows || []}
                totalRows={report.totalRows}
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
