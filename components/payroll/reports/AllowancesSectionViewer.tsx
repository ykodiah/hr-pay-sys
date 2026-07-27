"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AllowanceSection {
  allowance_type: string
  rows: Array<{
    staff_id: string
    full_name: string
    amount_issued: number
  }>
  subtotal: number
}

interface AllowancesSectionViewerProps {
  companyName: string
  erNumber: string
  payPeriod: string
  sections: AllowanceSection[]
  generatedAt: string
}

export function AllowancesSectionViewer({
  companyName,
  erNumber,
  payPeriod,
  sections,
  generatedAt,
}: AllowancesSectionViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.length > 0 ? [sections[0].allowance_type] : [])
  )

  const toggleSection = (allowanceType: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(allowanceType)) {
      newExpanded.delete(allowanceType)
    } else {
      newExpanded.add(allowanceType)
    }
    setExpandedSections(newExpanded)
  }

  const formatCurrency = (value: number) => value.toFixed(2)
  const totalAllowances = sections.reduce((sum, s) => sum + s.subtotal, 0)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>ALLOWANCE REPORT FOR {payPeriod}</CardTitle>
          <CardDescription>{companyName}</CardDescription>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>ER NO: {erNumber}</span>
            <span className="text-xs">Generated: {new Date(generatedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No allowances data available for this period
            </div>
          ) : (
            <>
              {sections.map((section) => (
                <div key={section.allowance_type} className="border rounded-lg">
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 py-3 font-semibold hover:bg-muted"
                    onClick={() => toggleSection(section.allowance_type)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.has(section.allowance_type) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="uppercase">{section.allowance_type}</span>
                      <span className="text-sm text-muted-foreground">
                        ({section.rows.length} employees)
                      </span>
                    </div>
                    <span className="font-mono">GHS {formatCurrency(section.subtotal)}</span>
                  </Button>

                  {expandedSections.has(section.allowance_type) && (
                    <div className="p-4 border-t">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Staff ID</TableHead>
                              <TableHead>Full Name</TableHead>
                              <TableHead className="text-right">Amount Issued (GHS)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.rows.map((row, idx) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                                <TableCell className="font-mono text-sm">{row.staff_id}</TableCell>
                                <TableCell>{row.full_name}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(row.amount_issued)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-3 flex justify-end bg-muted/30 p-2 rounded-md">
                        <span className="text-sm font-semibold">
                          Subtotal: <span className="font-mono">GHS {formatCurrency(section.subtotal)}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-6 p-4 bg-primary/10 rounded-md border-2 border-primary">
                <div className="flex justify-end font-bold text-lg">
                  <span>Total Allowances: <span className="font-mono text-primary">GHS {formatCurrency(totalAllowances)}</span></span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
