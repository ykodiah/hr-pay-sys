import {
  addChangeRequest as addChangeRequestToStore,
  ChangeRequest,
  getChangeRequests as getChangeRequestsFromStore,
  updateChangeRequestStatus as updateChangeRequestInStore,
} from "@/lib/change-requests-store"

import { httpRequest, isApiError } from "./http-client"

let changeRequestCache: ChangeRequest[] = getChangeRequestsFromStore()

export async function listChangeRequests(): Promise<ChangeRequest[]> {
  try {
    const payload = await httpRequest<{ data: ChangeRequest[] }>("/change-requests", { method: "GET" })
    if (Array.isArray(payload?.data)) {
      changeRequestCache = payload.data
    }
    return structuredClone(changeRequestCache)
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Change-requests API unavailable, using fallback", error)
    }
    changeRequestCache = getChangeRequestsFromStore()
    return structuredClone(changeRequestCache)
  }
}

export async function submitChangeRequest(request: ChangeRequest): Promise<ChangeRequest> {
  try {
    const payload = await httpRequest<{ data: ChangeRequest }>("/change-requests", {
      method: "POST",
      body: JSON.stringify(request),
    })
    if (payload?.data) {
      changeRequestCache = [payload.data, ...changeRequestCache.filter((item) => item.id !== payload.data.id)]
      return payload.data
    }
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Change-request submit fallback", error)
    }
  }

  addChangeRequestToStore(request)
  changeRequestCache = getChangeRequestsFromStore()
  return request
}

export async function updateChangeRequestStatus(
  requestId: string,
  status: ChangeRequest["status"],
  reviewer: { name: string; notes?: string },
): Promise<void> {
  try {
    await httpRequest(`/change-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, reviewer }),
    })
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Change-request status fallback", error)
    }
  } finally {
    updateChangeRequestInStore(requestId, status, reviewer)
    changeRequestCache = getChangeRequestsFromStore()
  }
}
