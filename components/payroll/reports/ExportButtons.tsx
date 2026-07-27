"use client"

import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface ExportButtonsProps {
  reportType: string
  payPeriod: string
  companyName: string
  isLoading?: boolean
  onExportPDF?: () => void
  onExportExcel?: () => void
  onExportCSV?: () => void
}

export function ExportButtons({
  reportType,
  payPeriod,
  companyName,
  isLoading = false,
  onExportPDF,
  onExportExcel,
  onExportCSV,
}: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: 'pdf' | 'excel' | 'csv', handler?: () => void) => {
    if (!handler) return

    setExporting(format)
    try {
      await handler()
    } finally {
      setExporting(null)
    }
  }

  const filename = `${reportType}_${payPeriod}_${new Date().toISOString().split('T')[0]}`

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => handleExport('pdf', onExportPDF)}
        disabled={isLoading || exporting !== null}
        variant="outline"
        className="gap-2"
      >
        {exporting === 'pdf' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Export PDF
          </>
        )}
      </Button>

      <Button
        onClick={() => handleExport('excel', onExportExcel)}
        disabled={isLoading || exporting !== null}
        variant="outline"
        className="gap-2"
      >
        {exporting === 'excel' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export Excel
          </>
        )}
      </Button>

      <Button
        onClick={() => handleExport('csv', onExportCSV)}
        disabled={isLoading || exporting !== null}
        variant="outline"
        className="gap-2"
      >
        {exporting === 'csv' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export CSV
          </>
        )}
      </Button>

      <Button
        onClick={() => window.print()}
        disabled={isLoading || exporting !== null}
        variant="outline"
        className="gap-2"
      >
        Print
      </Button>
    </div>
  )
}
