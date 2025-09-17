"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Edit,
  MoreHorizontal,
  FileText,
  Clock,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  hireDate: string
  position: string
  department: string
  division: string
  location: string
  salary: number
  status: "active" | "inactive"
  profilePicture?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

interface EmployeeProfileProps {
  employee: Employee
  onEdit?: (employee: Employee) => void
  onViewPayslips?: (employeeId: string) => void
  onViewLeave?: (employeeId: string) => void
  className?: string
}

export function EmployeeProfile({
  employee,
  onEdit,
  onViewPayslips,
  onViewLeave,
  className = "",
}: EmployeeProfileProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={employee.profilePicture || "/placeholder.svg"}
                alt={`${employee.firstName} ${employee.lastName}`}
              />
              <AvatarFallback className="text-lg font-semibold bg-emerald-100 text-emerald-700">
                {getInitials(employee.firstName, employee.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <p className="text-gray-600">{employee.position}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={employee.status === "active" ? "default" : "secondary"}>{employee.status}</Badge>
                <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(employee)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
              )}
              {onViewPayslips && (
                <DropdownMenuItem onClick={() => onViewPayslips(employee.id)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  View Payslips
                </DropdownMenuItem>
              )}
              {onViewLeave && (
                <DropdownMenuItem onClick={() => onViewLeave(employee.id)}>
                  <Clock className="mr-2 h-4 w-4" />
                  Leave History
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{employee.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 md:col-span-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{employee.address}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Employment Details */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Employment Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Division</p>
                <p className="font-medium">{employee.division}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{employee.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Salary</p>
                <p className="font-medium">{formatCurrency(employee.salary)}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Important Dates */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Important Dates</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Hire Date</p>
                <p className="font-medium">{formatDate(employee.hireDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        {employee.emergencyContact && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{employee.emergencyContact.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{employee.emergencyContact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium">{employee.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(employee)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
          {onViewPayslips && (
            <Button variant="outline" onClick={() => onViewPayslips(employee.id)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Payslips
            </Button>
          )}
          {onViewLeave && (
            <Button variant="outline" onClick={() => onViewLeave(employee.id)}>
              <Clock className="mr-2 h-4 w-4" />
              Leave History
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Default export for convenience
export default EmployeeProfile
