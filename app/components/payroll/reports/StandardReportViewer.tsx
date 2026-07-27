"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StandardReportViewerProps {
  title: string
  companyName: string
  erNumber: string
  payPeriod: string
  columns: Array<{
    key: string
    label: string
    format?: (value: any) => string
  }>
  rows: Array<any>
  totalRows: number
  generatedAt: string
  footerNote?: string
}

export function StandardReportViewer({
  title,
  companyName,
  erNumber,
  payPeriod,
  columns,
  rows,
  totalRows,
  generatedAt,
  footerNote,
}: StandardReportViewerProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{companyName}</CardDescription>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>ER NO: {erNumber}</span>
            <span>Period: {payPeriod}</span>
            <span className="text-xs">Generated: {new Date(generatedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available for this period
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key} className="font-semibold">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                        {columns.map((col) => (
                          <TableCell key={col.key} className="py-2">
                            {col.format ? col.format(row[col.key]) : row[col.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between text-sm font-medium bg-muted p-3 rounded-md">
                <span>Total Rows: {totalRows}</span>
                {footerNote && <span className="text-xs text-muted-foreground">{footerNote}</span>}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
