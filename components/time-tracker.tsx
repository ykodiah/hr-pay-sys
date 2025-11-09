"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface TimeTrackerProps {
  startTime: string // HH:MM format
  breakStart?: string | null
  breakEnd?: string | null
  className?: string
}

export function TimeTracker({ startTime, breakStart, breakEnd, className }: TimeTrackerProps) {
  const [elapsed, setElapsed] = useState("0h 0m 0s")

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(`2000-01-01T${startTime}`)
      const now = new Date()
      const currentTimeStr = now.toTimeString().split(" ")[0].slice(0, 5)
      const current = new Date(`2000-01-01T${currentTimeStr}`)

      let totalSeconds = Math.floor((current.getTime() - start.getTime()) / 1000)

      // Subtract break time
      if (breakStart && breakEnd) {
        const bStart = new Date(`2000-01-01T${breakStart}`)
        const bEnd = new Date(`2000-01-01T${breakEnd}`)
        const breakSeconds = Math.floor((bEnd.getTime() - bStart.getTime()) / 1000)
        totalSeconds -= breakSeconds
      } else if (breakStart && !breakEnd) {
        const bStart = new Date(`2000-01-01T${breakStart}`)
        const breakSeconds = Math.floor((current.getTime() - bStart.getTime()) / 1000)
        totalSeconds -= breakSeconds
      }

      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      setElapsed(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, breakStart, breakEnd])

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-3">
          <Clock className="h-5 w-5 text-primary animate-pulse" />
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{elapsed}</p>
            <p className="text-xs text-muted-foreground">Time Worked Today</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
