interface SyncState {
  employees: Record<string, any>
  payslips: Record<string, any>
  leaveRequests: Record<string, any>
  notifications: any[]
  lastUpdated: Record<string, string>
}

class SyncStore {
  private state: SyncState = {
    employees: {},
    payslips: {},
    leaveRequests: {},
    notifications: [],
    lastUpdated: {},
  }

  private listeners: Set<(state: SyncState) => void> = new Set()

  subscribe(listener: (state: SyncState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState(): SyncState {
    return { ...this.state }
  }

  updateEmployee(id: string, data: any) {
    this.state.employees[id] = { ...this.state.employees[id], ...data }
    this.state.lastUpdated.employees = new Date().toISOString()
    this.notifyListeners()
  }

  updatePayslip(id: string, data: any) {
    this.state.payslips[id] = { ...this.state.payslips[id], ...data }
    this.state.lastUpdated.payslips = new Date().toISOString()
    this.notifyListeners()
  }

  updateLeaveRequest(id: string, data: any) {
    this.state.leaveRequests[id] = { ...this.state.leaveRequests[id], ...data }
    this.state.lastUpdated.leaveRequests = new Date().toISOString()
    this.notifyListeners()
  }

  addNotification(notification: any) {
    this.state.notifications.unshift({
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    })
    this.state.lastUpdated.notifications = new Date().toISOString()
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()))
  }

  // Batch update for sync operations
  batchUpdate(updates: Partial<SyncState>) {
    Object.assign(this.state, updates)
    this.state.lastUpdated = {
      ...this.state.lastUpdated,
      ...Object.keys(updates).reduce(
        (acc, key) => {
          acc[key] = new Date().toISOString()
          return acc
        },
        {} as Record<string, string>,
      ),
    }
    this.notifyListeners()
  }
}

export const syncStore = new SyncStore()
