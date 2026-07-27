"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"
import { useState } from "react"

interface PeriodSelectorProps {
  selectedPeriod: string
  onSelectPeriod: (period: string) => void
}

export function PeriodSelector({ selectedPeriod, onSelectPeriod }: PeriodSelectorProps) {
  const [month, setMonth] = useState(selectedPeriod.split('-')[0] || '')
  const [year, setYear] = useState(selectedPeriod.split('-')[1] || new Date().getFullYear().toString())

  const handleApply = () => {
    if (month && year) {
      const paddedMonth = month.padStart(2, '0')
      onSelectPeriod(`${paddedMonth}-${year}`)
    }
  }

  // Get current month and year for default
  const currentDate = new Date()
  const currentMonth = (currentDate.getMonth() + 1).toString()
  const currentYear = currentDate.getFullYear().toString()

  // Generate last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return {
      value: m.toString(),
      label: new Date(2024, m - 1).toLocaleString('default', { month: 'long' }),
    }
  })

  // Generate years (current and previous 5)
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const y = currentDate.getFullYear() - i
    return y.toString()
  })

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Pay Period
        </CardTitle>
        <CardDescription>Select the month and year for the report</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3 items-end">
          <div>
            <Label htmlFor="month">Month</Label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select month</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select year</option>
              {yearOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleApply}
            disabled={!month || !year}
            className="w-full"
          >
            Apply
          </Button>
        </div>

        {selectedPeriod && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">
              Selected: <span className="text-primary">{selectedPeriod}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
