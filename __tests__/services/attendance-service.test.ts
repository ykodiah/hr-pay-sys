/**
 * Attendance Service Tests
 * 
 * Run with: npm test -- attendance-service.test.ts
 */

import { AttendanceService } from "@/lib/services/attendance-service"

describe("AttendanceService", () => {
  let attendanceService: AttendanceService

  beforeEach(() => {
    attendanceService = new AttendanceService(true)
  })

  describe("getAttendanceByDate", () => {
    it("should fetch attendance records for a specific date", async () => {
      const today = new Date().toISOString().split("T")[0]
      const result = await attendanceService.getAttendanceByDate("test-company-id", today)

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })

  describe("getEmployeeAttendance", () => {
    it("should fetch attendance records for an employee", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const endDate = new Date().toISOString().split("T")[0]

      const result = await attendanceService.getEmployeeAttendance("employee-id", startDate, endDate)

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })

  describe("recordClockIn", () => {
    it("should record a clock-in time", async () => {
      const today = new Date().toISOString().split("T")[0]
      const clockInTime = "09:00:00"

      const result = await attendanceService.recordClockIn("employee-id", today, clockInTime, "biometric")

      expect(result).toHaveProperty("success")
      if (result.success && result.data) {
        expect(result.data.clock_in).toBe(clockInTime)
        expect(result.data.status).toBe("present")
      }
    })

    it("should update clock-in if record already exists", async () => {
      const today = new Date().toISOString().split("T")[0]
      const newClockInTime = "08:55:00"

      const result = await attendanceService.recordClockIn("employee-id", today, newClockInTime, "biometric")

      expect(result).toHaveProperty("success")
    })
  })

  describe("recordClockOut", () => {
    it("should record a clock-out time", async () => {
      const today = new Date().toISOString().split("T")[0]
      const clockOutTime = "17:00:00"

      const result = await attendanceService.recordClockOut("employee-id", today, clockOutTime, "biometric")

      expect(result).toHaveProperty("success")
      if (result.success && result.data) {
        expect(result.data.clock_out).toBe(clockOutTime)
        expect(result.data).toHaveProperty("total_hours")
      }
    })
  })

  describe("markAbsent", () => {
    it("should mark employee as absent", async () => {
      const today = new Date().toISOString().split("T")[0]
      const result = await attendanceService.markAbsent("employee-id", today, "Sick leave")

      expect(result).toHaveProperty("success")
      if (result.success && result.data) {
        expect(result.data.status).toBe("absent")
      }
    })
  })

  describe("getAttendanceSummary", () => {
    it("should calculate attendance summary for a period", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const endDate = new Date().toISOString().split("T")[0]

      const result = await attendanceService.getAttendanceSummary("test-company-id", startDate, endDate)

      expect(result).toHaveProperty("success")
      if (result.success && result.data) {
        expect(result.data).toHaveProperty("totalDays")
        expect(result.data).toHaveProperty("presentDays")
        expect(result.data).toHaveProperty("absentDays")
        expect(result.data).toHaveProperty("attendanceRate")
        expect(typeof result.data.attendanceRate).toBe("number")
      }
    })
  })
})
