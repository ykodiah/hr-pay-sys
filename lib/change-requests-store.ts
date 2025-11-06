export type ChangeFieldDiff = {
  path: string
  label: string
  previousValue: string | null
  newValue: string | null
  pii?: boolean
}

export type ChangeRequest = {
  id: string
  employeeId: string
  employeeName: string
  submittedAt: string
  status: "pending" | "verifying" | "approved" | "declined"
  reason: string
  sections: string[]
  diffs: ChangeFieldDiff[]
  attachments: { id: string; name: string; type: string }[]
  reviewerNotes?: string
  approvedBy?: string
  approvedAt?: string
}

let changeRequests: ChangeRequest[] = [
  {
    id: "CR-2025-001",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    submittedAt: "2025-01-18T09:42:00Z",
    status: "pending",
    reason: "Updated bank and emergency contact details after relocation.",
    sections: ["Bank", "Emergency Contacts"],
    diffs: [
      {
        path: "bank.account_number",
        label: "Account number",
        previousValue: "233001234567",
        newValue: "233006543210",
        pii: true,
      },
      {
        path: "bank.bank_name",
        label: "Bank",
        previousValue: "GCB Bank",
        newValue: "Absa Bank",
      },
      {
        path: "emergency_contacts[0].phone",
        label: "Emergency phone",
        previousValue: "+233 20 444 5566",
        newValue: "+233 50 888 9911",
        pii: true,
      },
    ],
    attachments: [
      { id: "att-1", name: "bank_letter.pdf", type: "Bank letter" },
      { id: "att-2", name: "ghana_card_scan.jpg", type: "KYC" },
    ],
  },
  {
    id: "CR-2025-002",
    employeeId: "EMP014",
    employeeName: "Selorm Adjei",
    submittedAt: "2025-01-12T13:05:00Z",
    status: "verifying",
    reason: "Updated home address and dependants after marriage.",
    sections: ["Identity", "Family"],
    diffs: [
      {
        path: "identity.address",
        label: "Residential address",
        previousValue: "23 Burma Camp Rd, Accra",
        newValue: "12 Independence Ave, Accra",
      },
      {
        path: "family.dependants",
        label: "Dependants",
        previousValue: "1",
        newValue: "2",
      },
    ],
    attachments: [{ id: "att-3", name: "marriage_certificate.pdf", type: "Supporting document" }],
  },
]

export function getChangeRequests() {
  return changeRequests
}

export function addChangeRequest(request: ChangeRequest) {
  changeRequests = [request, ...changeRequests]
}

export function updateChangeRequestStatus(
  requestId: string,
  status: ChangeRequest["status"],
  reviewer: { name: string; notes?: string },
) {
  changeRequests = changeRequests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status,
          reviewerNotes: reviewer.notes,
          approvedBy: reviewer.name,
          approvedAt: new Date().toISOString(),
        }
      : request,
  )
}
