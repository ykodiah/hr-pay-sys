import { httpRequest, isApiError } from "./http-client"

export type MeetingProvider = "Zoom" | "Microsoft Teams" | "Google Meet" | "Daily" | "Cisco Webex"
export type MeetingStatus = "scheduled" | "in-progress" | "completed"

export type MeetingRecord = {
  id: string
  title: string
  startTime: string
  durationMinutes: number
  provider: MeetingProvider
  host: string
  agenda: string[]
  participants: number
  status: MeetingStatus
  passcodeEnforced: boolean
  e2ee: boolean
  recordingEnabled: boolean
  minutesStatus: "not-started" | "processing" | "ready"
  minutesSummary?: string
}

let meetingCache: MeetingRecord[] = buildSeedMeetings()

export async function listMeetings(): Promise<MeetingRecord[]> {
  try {
    const payload = await httpRequest<{ data: MeetingRecord[] }>("/meetings", { method: "GET" })
    if (Array.isArray(payload?.data)) {
      meetingCache = payload.data
    }
    return structuredClone(meetingCache)
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Meetings API fallback", error)
    }
    return structuredClone(meetingCache)
  }
}

export async function scheduleMeeting(meeting: MeetingRecord): Promise<MeetingRecord> {
  try {
    const payload = await httpRequest<{ data: MeetingRecord }>("/meetings", {
      method: "POST",
      body: JSON.stringify(meeting),
    })
    if (payload?.data) {
      meetingCache = [payload.data, ...meetingCache.filter((entry) => entry.id !== payload.data.id)]
      return payload.data
    }
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Meetings schedule fallback", error)
    }
  }

  meetingCache = [meeting, ...meetingCache]
  return meeting
}

export async function updateMeeting(meeting: MeetingRecord): Promise<void> {
  try {
    await httpRequest(`/meetings/${meeting.id}`, {
      method: "PUT",
      body: JSON.stringify(meeting),
    })
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Meeting update fallback", error)
    }
  } finally {
    meetingCache = meetingCache.map((record) => (record.id === meeting.id ? meeting : record))
  }
}

function buildSeedMeetings(): MeetingRecord[] {
  const now = Date.now()
  return [
    {
      id: "M-9041",
      title: "Payroll harmonisation steering committee",
      startTime: new Date(now + 1000 * 60 * 45).toISOString(),
      durationMinutes: 60,
      provider: "Zoom",
      host: "Abena Owusu",
      agenda: ["Review intercompany payroll transfers", "Approve March pay cycle", "Escalations"],
      participants: 12,
      status: "scheduled",
      passcodeEnforced: true,
      e2ee: true,
      recordingEnabled: true,
      minutesStatus: "not-started",
    },
    {
      id: "M-9037",
      title: "Tax compliance alignment with GRA",
      startTime: new Date(now - 1000 * 60 * 120).toISOString(),
      durationMinutes: 45,
      provider: "Microsoft Teams",
      host: "Regina Appiah",
      agenda: ["PAYE submissions", "Tier 2 pensions", "Audit queries"],
      participants: 8,
      status: "completed",
      passcodeEnforced: true,
      e2ee: false,
      recordingEnabled: true,
      minutesStatus: "ready",
      minutesSummary:
        "GRA confirmed April schedules accepted; Finance to deliver variance report by Friday; prepare Tier 2 reconciliations for audit branch.",
    },
    {
      id: "M-9039",
      title: "Headcount approval board",
      startTime: new Date(now - 1000 * 60 * 10).toISOString(),
      durationMinutes: 30,
      provider: "Daily",
      host: "Kwame Agyeman",
      agenda: ["Approve engineering hires", "Review attrition", "Budget alignment"],
      participants: 6,
      status: "in-progress",
      passcodeEnforced: true,
      e2ee: true,
      recordingEnabled: false,
      minutesStatus: "processing",
    },
  ]
}
