"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useAttendanceRealtime(companyId: string) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    async function setupRealtimeSubscription() {
      // Initial fetch
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          *,
          employee:employees(id, full_name, employee_id, department, position),
          shift:attendance_shifts(shift_name, shift_code, color_code)
        `)
        .eq("company_id", companyId)
        .order("date", { ascending: false })
        .limit(100)

      if (error) {
        console.error("[v0] Error fetching attendance records:", error)
      } else {
        setRecords(data || [])
      }
      setLoading(false)

      // Setup realtime subscription
      channel = supabase
        .channel(`attendance_records_${companyId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attendance_records",
            filter: `company_id=eq.${companyId}`,
          },
          async (payload) => {
            console.log("[v0] Realtime attendance update:", payload)

            if (payload.eventType === "INSERT") {
              // Fetch full record with relations
              const { data } = await supabase
                .from("attendance_records")
                .select(`
                  *,
                  employee:employees(id, full_name, employee_id, department, position),
                  shift:attendance_shifts(shift_name, shift_code, color_code)
                `)
                .eq("id", payload.new.id)
                .single()

              if (data) {
                setRecords((prev) => [data, ...prev])
              }
            } else if (payload.eventType === "UPDATE") {
              const { data } = await supabase
                .from("attendance_records")
                .select(`
                  *,
                  employee:employees(id, full_name, employee_id, department, position),
                  shift:attendance_shifts(shift_name, shift_code, color_code)
                `)
                .eq("id", payload.new.id)
                .single()

              if (data) {
                setRecords((prev) => prev.map((record) => (record.id === data.id ? data : record)))
              }
            } else if (payload.eventType === "DELETE") {
              setRecords((prev) => prev.filter((record) => record.id !== payload.old.id))
            }
          },
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [companyId, supabase])

  return { records, loading, setRecords }
}

export function useOvertimeRealtime(companyId: string) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    async function setupRealtimeSubscription() {
      const { data, error } = await supabase
        .from("overtime_requests")
        .select(`
          *,
          employee:employees(id, full_name, employee_id, department),
          approved_by_employee:employees!overtime_requests_approved_by_fkey(full_name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching overtime requests:", error)
      } else {
        setRequests(data || [])
      }
      setLoading(false)

      channel = supabase
        .channel(`overtime_requests_${companyId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "overtime_requests",
            filter: `company_id=eq.${companyId}`,
          },
          async (payload) => {
            console.log("[v0] Realtime overtime update:", payload)

            if (payload.eventType === "INSERT") {
              const { data } = await supabase
                .from("overtime_requests")
                .select(`
                  *,
                  employee:employees(id, full_name, employee_id, department),
                  approved_by_employee:employees!overtime_requests_approved_by_fkey(full_name)
                `)
                .eq("id", payload.new.id)
                .single()

              if (data) {
                setRequests((prev) => [data, ...prev])
              }
            } else if (payload.eventType === "UPDATE") {
              const { data } = await supabase
                .from("overtime_requests")
                .select(`
                  *,
                  employee:employees(id, full_name, employee_id, department),
                  approved_by_employee:employees!overtime_requests_approved_by_fkey(full_name)
                `)
                .eq("id", payload.new.id)
                .single()

              if (data) {
                setRequests((prev) => prev.map((req) => (req.id === data.id ? data : req)))
              }
            } else if (payload.eventType === "DELETE") {
              setRequests((prev) => prev.filter((req) => req.id !== payload.old.id))
            }
          },
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [companyId, supabase])

  return { requests, loading, setRequests }
}

export function useBiometricDevicesRealtime(companyId: string) {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    async function setupRealtimeSubscription() {
      const { data, error } = await supabase
        .from("biometric_devices")
        .select("*")
        .eq("company_id", companyId)
        .order("device_name")

      if (error) {
        console.error("[v0] Error fetching devices:", error)
      } else {
        setDevices(data || [])
      }
      setLoading(false)

      channel = supabase
        .channel(`biometric_devices_${companyId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "biometric_devices",
            filter: `company_id=eq.${companyId}`,
          },
          (payload) => {
            console.log("[v0] Realtime device update:", payload)

            if (payload.eventType === "INSERT") {
              setDevices((prev) => [...prev, payload.new])
            } else if (payload.eventType === "UPDATE") {
              setDevices((prev) => prev.map((dev) => (dev.id === payload.new.id ? payload.new : dev)))
            } else if (payload.eventType === "DELETE") {
              setDevices((prev) => prev.filter((dev) => dev.id !== payload.old.id))
            }
          },
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [companyId, supabase])

  return { devices, loading, setDevices }
}
