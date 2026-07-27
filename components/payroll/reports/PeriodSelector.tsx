"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"
import { useEffect, useState } from "react"

interface PeriodSelectorProps {
  selectedPeriod: string
  onSelectPeriod: (period: string) => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parsePeriodToState(period: string): { month: string; year: string } {
  // Accepts MM-YYYY format (e.g. "06-2026")
  const match = period.match(/^(\d{1,2})-(\d{4})$/)
  if (match) return { month: match[1], year: match[2] }
  return { month: '', year: '' }
}

export function PeriodSelector({ selectedPeriod, onSelectPeriod }: PeriodSelectorProps) {
  const currentDate = new Date()
  const defaultMonth = String(currentDate.getMonth() + 1)
  const defaultYear = String(currentDate.getFullYear())

  const parsed = parsePeriodToState(selectedPeriod)
  const [month, setMonth] = useState(parsed.month || defaultMonth)
  const [year, setYear] = useState(parsed.year || defaultYear)

  // Keep local state in sync if parent clears selection
  useEffect(() => {
    if (!selectedPeriod) {
      setMonth(defaultMonth)
      setYear(defaultYear)
    }
  }, [selectedPeriod, defaultMonth, defaultYear])

  const handleApply = () => {
    if (month && year) {
      const paddedMonth = month.padStart(2, '0')
      onSelectPeriod(`${paddedMonth}-${year}`)
    }
  }

  // Years: current year back 5 years
  const yearOptions = Array.from({ length: 6 }, (_, i) =>
    String(currentDate.getFullYear() - i),
  )

  const displayPeriod = selectedPeriod
    ? `${MONTH_NAMES[parseInt(selectedPeriod.split('-')[0], 10) - 1]} ${selectedPeriod.split('-')[1]}`
    : null

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
          <div className="space-y-1.5">
            <Label htmlFor="month">Month</Label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select month</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
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

        {displayPeriod && (
          <p className="mt-4 text-sm font-medium px-3 py-2 bg-muted rounded-md">
            Selected period: <span className="text-primary font-semibold">{displayPeriod}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
