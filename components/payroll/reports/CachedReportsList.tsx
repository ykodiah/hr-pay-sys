'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export interface CachedReport {
  id: string
  reportType: string
  payPeriod: string
  generatedAt: string
  companyName: string
  totalRows: number
  reportData: Record<string, unknown>
}

interface CachedReportsListProps {
  reports: CachedReport[]
  onDelete?: (id: string) => void
  onView?: (report: CachedReport) => void
  onDownload?: (report: CachedReport, format: 'pdf' | 'excel' | 'csv') => void
}

export function CachedReportsList({ reports, onDelete, onView, onDownload }: CachedReportsListProps) {
  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports Queue</CardTitle>
          <CardDescription>Reports will appear here after generation</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No reports generated yet for this session</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Reports Queue</CardTitle>
        <CardDescription>View and download previously generated reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">{report.reportType}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Period: {report.payPeriod} | {report.companyName} | {report.totalRows} rows
                </p>
                <p className="text-xs text-muted-foreground">
                  Generated: {format(new Date(report.generatedAt), 'MMM dd, yyyy h:mm a')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(report)}
                    className="text-xs"
                  >
                    View
                  </Button>
                )}
                {onDownload && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(report, 'pdf')}
                      className="text-xs gap-1"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(report, 'excel')}
                      className="text-xs gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Excel
                    </Button>
                  </>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(report.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
