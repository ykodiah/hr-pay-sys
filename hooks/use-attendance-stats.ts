"use client"

import { useEffect, useState } from "react"
import { getAttendanceStats, getAttendanceTrends } from "@/app/actions/attendance"

export function useAttendanceStats(startDate: string, endDate: string) {
  const [stats, setStats] = useState({
    totalRecords: 0,
    present: 0,
    absent: 0,
    late: 0,
    totalHours: 0,
    overtimeHours: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const data = await getAttendanceStats(startDate, endDate)
        setStats(data)
      } catch (error) {
        console.error("[v0] Error fetching attendance stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [startDate, endDate])

  return { stats, loading }
}

export function useAttendanceTrends(days = 30) {
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true)
      try {
        const data = await getAttendanceTrends(days)
        setTrends(data)
      } catch (error) {
        console.error("[v0] Error fetching attendance trends:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [days])

  return { trends, loading }
}
