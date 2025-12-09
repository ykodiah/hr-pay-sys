"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, Mail, MoreHorizontal, Phone, Trash2, User } from "lucide-react"

interface EmployeeCardProps {
  employee: {
    id: string
    employee_id?: string
    employeeId?: string
    display_name?: string
    full_name?: string
    first_name?: string
    last_name?: string
    position?: string
    department?: string
    division?: string
    location?: string
    subsidiary?: string
    supervisor?: string
    headOfDepartment?: string
    previousSubsidiary?: string
    previousDivision?: string
    previousDepartment?: string
    corporate_email?: string
    personal_email?: string
    phone?: string
    status?: string
    profile_picture?: string
    salary?: number
    monthly_salary?: number
    annual_salary?: number
    date_of_joining?: string
    contract_type?: string
    pendingTransfer?: {
      targetSubsidiaryId?: string
      targetSubsidiaryName?: string
      targetDivision?: string
      targetDepartment?: string
      transferType?: string
      effectiveDate?: string
      returnDate?: string
      reason?: string
    }
    transferEffectiveDate?: string
    transferType?: string
    transferNotes?: string
    expectedReturnDate?: string
  }
  variant?: "full" | "compact" | "minimal"
  showActions?: boolean
  showSalary?: boolean
  onView?: (employee: any) => void
  onEdit?: (employee: any) => void
  onDelete?: (employee: any) => void
  onEmail?: (employee: any) => void
  formatCurrency?: (amount: number) => string
}

export function EmployeeCard({
  employee,
  variant = "full",
  showActions = true,
  showSalary = true,
  onView,
  onEdit,
  onDelete,
  onEmail,
  formatCurrency = (amount) => `GH₵ ${amount.toLocaleString()}`,
}: EmployeeCardProps) {
  const getEmployeeName = () => {
    return (
      employee.display_name ||
      employee.full_name ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      "Unknown Employee"
    )
  }

  const getEmployeeId = () => {
    return employee.employee_id || employee.employeeId || "N/A"
  }

  const getEmployeeInitials = () => {
    const name = getEmployeeName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getSalary = () => {
    return employee.salary || employee.monthly_salary || 0
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "on leave":
        return "bg-blue-100 text-blue-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  // </CHANGE>

  const toTitleCase = (value: string) =>
    value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

  if (variant === "full") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={
                    employee.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${getEmployeeName()}`
                  }
                  alt={getEmployeeName()}
                />
                <AvatarFallback className="bg-emerald-100 text-emerald-700">{getEmployeeInitials()}</AvatarFallback>
              </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{getEmployeeName()}</h3>
                  <p className="text-gray-600">{employee.position || "No Position"}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>{employee.division || "No Division"}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{employee.department || "No Department"}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>ID: {getEmployeeId()}</span>
                  </div>
                </div>
            </div>
            <div className="flex items-center space-x-6">
              {showSalary && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Monthly Salary</p>
                  <p className="text-sm font-medium">{formatCurrency(getSalary())}</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <Badge
                  variant={employee.status === "Active" ? "default" : "secondary"}
                  className={getStatusColor(employee.status)}
                >
                  {employee.status || "Unknown"}
                </Badge>
              </div>
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(employee)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Employee
                      </DropdownMenuItem>
                    )}
                    {onEmail && (
                      <DropdownMenuItem onClick={() => onEmail(employee)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem className="text-red-600" onClick={() => onDelete(employee)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Employee
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
              <div className="space-y-1">
                <p className="font-medium text-gray-700">Subsidiary</p>
                <p>{employee.subsidiary || "No subsidiary assigned"}</p>
                {employee.previousSubsidiary && (
                  <p className="text-xs text-gray-500">Previous: {employee.previousSubsidiary}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-700">Supervisor chain</p>
                <p>{employee.supervisor || "Supervisor not set"}</p>
                {employee.headOfDepartment && <p className="text-xs text-gray-500">HOD: {employee.headOfDepartment}</p>}
              </div>
            </div>
            {employee.pendingTransfer && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-semibold">Transfer awaiting approval</p>
                <p className="mt-1">
                  Requested move to {employee.pendingTransfer.targetSubsidiaryName || employee.pendingTransfer.targetSubsidiaryId}
                  {employee.pendingTransfer.targetDivision && ` • ${employee.pendingTransfer.targetDivision}`}
                  {employee.pendingTransfer.targetDepartment && ` / ${employee.pendingTransfer.targetDepartment}`}
                </p>
                <p className="mt-1">
                  Effective {employee.pendingTransfer.effectiveDate || "TBC"} • {toTitleCase(employee.pendingTransfer.transferType || "permanent")}
                </p>
                {employee.pendingTransfer.returnDate && (
                  <p className="mt-1">Expected return {employee.pendingTransfer.returnDate}</p>
                )}
                {employee.pendingTransfer.reason && (
                  <p className="mt-1 italic">Reason: {employee.pendingTransfer.reason}</p>
                )}
              </div>
            )}
            {!employee.pendingTransfer && employee.transferEffectiveDate && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <p className="font-semibold">Transfer scheduled</p>
                <p className="mt-1">
                  Effective {employee.transferEffectiveDate}
                  {employee.transferType && ` • ${toTitleCase(employee.transferType)}`}
                </p>
                {employee.expectedReturnDate && (
                  <p className="mt-1">Return by {employee.expectedReturnDate}</p>
                )}
                {employee.transferNotes && (
                  <p className="mt-1 italic">Notes: {employee.transferNotes}</p>
                )}
              </div>
            )}
        </CardContent>
      </Card>
    )
  }
  // </CHANGE>

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={
                    employee.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${getEmployeeName()}`
                  }
                  alt={getEmployeeName()}
                />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                  {getEmployeeInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{getEmployeeName()}</CardTitle>
                <CardDescription className="text-sm">{employee.position || "No Position"}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className={getStatusColor(employee.status)}>
              {employee.status || "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{employee.department || "No Department"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">ID:</span>
              <span>{getEmployeeId()}</span>
            </div>
            {employee.corporate_email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{employee.corporate_email}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>{employee.phone}</span>
              </div>
            )}
            {showSalary && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-gray-500">Monthly Salary:</span>
                <span className="font-medium">{formatCurrency(getSalary())}</span>
              </div>
            )}
          </div>
          {showActions && (
            <div className="mt-4 flex space-x-2">
              {onView && (
                <Button size="sm" variant="outline" onClick={() => onView(employee)} className="flex-1">
                  View Profile
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(employee)} className="flex-1">
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
  // </CHANGE>

  if (variant === "minimal") {
    return (
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={
                    employee.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${getEmployeeName()}`
                  }
                  alt={getEmployeeName()}
                />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                  {getEmployeeInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{getEmployeeName()}</p>
                <p className="text-xs text-gray-500">{employee.position || "No Position"}</p>
              </div>
            </div>
            <Badge variant="secondary" className={`text-xs ${getStatusColor(employee.status)}`}>
              {employee.status || "Unknown"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }
  // </CHANGE>

  return null
}
