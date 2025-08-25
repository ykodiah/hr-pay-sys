export class EmployeeDataService {
  private static instance: EmployeeDataService
  private storageKey = "akwaaba-employees"
  private auditKey = "akwaaba-employee-audit"

  static getInstance(): EmployeeDataService {
    if (!EmployeeDataService.instance) {
      EmployeeDataService.instance = new EmployeeDataService()
    }
    return EmployeeDataService.instance
  }

  saveEmployee(employeeData: any): string {
    try {
      const employees = this.getAllEmployees()
      const newEmployee = {
        ...employeeData,
        id: employees.length + 1,
        employeeId: `EMP${String(employees.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      employees.push(newEmployee)
      localStorage.setItem(this.storageKey, JSON.stringify(employees))

      // Audit trail
      this.logAuditEvent("CREATE", newEmployee.employeeId, newEmployee)

      return newEmployee.employeeId
    } catch (error) {
      console.error("[v0] Failed to save employee:", error)
      throw new Error("Failed to save employee data")
    }
  }

  getAllEmployees(): any[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("[v0] Failed to load employees:", error)
      return []
    }
  }

  updateEmployee(employeeId: string, updates: any): void {
    try {
      const employees = this.getAllEmployees()
      const index = employees.findIndex((emp) => emp.employeeId === employeeId)

      if (index !== -1) {
        employees[index] = {
          ...employees[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem(this.storageKey, JSON.stringify(employees))
        this.logAuditEvent("UPDATE", employeeId, updates)
      }
    } catch (error) {
      console.error("[v0] Failed to update employee:", error)
      throw new Error("Failed to update employee data")
    }
  }

  private logAuditEvent(action: string, employeeId: string, data: any): void {
    try {
      const auditLog = JSON.parse(localStorage.getItem(this.auditKey) || "[]")
      auditLog.push({
        id: Date.now().toString(),
        action,
        employeeId,
        data,
        timestamp: new Date().toISOString(),
        user: "HR Admin", // In real app, get from auth context
      })

      // Keep only last 1000 audit entries
      if (auditLog.length > 1000) {
        auditLog.splice(0, auditLog.length - 1000)
      }

      localStorage.setItem(this.auditKey, JSON.stringify(auditLog))
    } catch (error) {
      console.error("[v0] Failed to log audit event:", error)
    }
  }

  getAuditLog(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.auditKey) || "[]")
    } catch (error) {
      console.error("[v0] Failed to load audit log:", error)
      return []
    }
  }
}
