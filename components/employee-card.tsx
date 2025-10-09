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
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">{employee.department || "No Department"}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">ID: {getEmployeeId()}</span>
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
