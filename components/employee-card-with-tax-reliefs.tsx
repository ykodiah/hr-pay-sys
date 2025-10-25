"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  Edit, 
  Eye, 
  Mail, 
  MoreHorizontal, 
  Phone, 
  Trash2, 
  User, 
  Receipt, 
  Plus,
  Check,
  X,
  Calculator,
  DollarSign
} from "lucide-react"

interface TaxRelief {
  id: number
  name: string
  description: string
  amount: number
  currency: string
  isActive: boolean
  category: string
  graCode?: string
  isMandatory?: boolean
  maxAmount?: number
  maxChildren?: number
  minAge?: number
}

interface EmployeeCardWithTaxReliefsProps {
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
    age?: number
    children_count?: number
    is_married?: boolean
    has_disability?: boolean
    is_blind?: boolean
    assigned_tax_reliefs?: TaxRelief[]
  }
  availableTaxReliefs: TaxRelief[]
  onAssignTaxReliefs?: (employeeId: string, reliefs: TaxRelief[]) => void
  onRemoveTaxRelief?: (employeeId: string, reliefId: number) => void
  variant?: "full" | "compact" | "minimal"
  showActions?: boolean
  showSalary?: boolean
  showTaxReliefs?: boolean
  onView?: (employee: any) => void
  onEdit?: (employee: any) => void
  onDelete?: (employee: any) => void
  onEmail?: (employee: any) => void
  formatCurrency?: (amount: number) => string
}

export function EmployeeCardWithTaxReliefs({
  employee,
  availableTaxReliefs,
  onAssignTaxReliefs,
  onRemoveTaxRelief,
  variant = "full",
  showActions = true,
  showSalary = true,
  showTaxReliefs = true,
  onView,
  onEdit,
  onDelete,
  onEmail,
  formatCurrency = (amount) => `GH₵ ${amount.toLocaleString()}`,
}: EmployeeCardWithTaxReliefsProps) {
  const [isTaxReliefDialogOpen, setIsTaxReliefDialogOpen] = useState(false)
  const [selectedReliefs, setSelectedReliefs] = useState<TaxRelief[]>(
    employee.assigned_tax_reliefs || []
  )
  const [customAmounts, setCustomAmounts] = useState<Record<number, number>>({})

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

  const isEligibleForRelief = (relief: TaxRelief) => {
    // Check age requirements
    if (relief.minAge && employee.age && employee.age < relief.minAge) {
      return false
    }

    // Check disability requirements
    if (relief.category === "Disability" && !employee.has_disability) {
      return false
    }

    if (relief.name === "Blind Relief" && !employee.is_blind) {
      return false
    }

    // Check family requirements
    if (relief.category === "Family" && relief.name === "Spouse Relief" && !employee.is_married) {
      return false
    }

    if (relief.category === "Family" && relief.name === "Child Relief" && (!employee.children_count || employee.children_count === 0)) {
      return false
    }

    return true
  }

  const getEligibleReliefs = () => {
    return availableTaxReliefs.filter(relief => 
      relief.isActive && isEligibleForRelief(relief)
    )
  }

  const calculateTotalTaxRelief = () => {
    return selectedReliefs.reduce((total, relief) => {
      const amount = customAmounts[relief.id] || relief.amount
      return total + amount
    }, 0)
  }

  const handleReliefToggle = (relief: TaxRelief, checked: boolean) => {
    if (checked) {
      setSelectedReliefs([...selectedReliefs, relief])
      setCustomAmounts({ ...customAmounts, [relief.id]: relief.amount })
    } else {
      setSelectedReliefs(selectedReliefs.filter(r => r.id !== relief.id))
      const newCustomAmounts = { ...customAmounts }
      delete newCustomAmounts[relief.id]
      setCustomAmounts(newCustomAmounts)
    }
  }

  const handleCustomAmountChange = (reliefId: number, amount: number) => {
    setCustomAmounts({ ...customAmounts, [reliefId]: amount })
  }

  const handleSaveTaxReliefs = () => {
    if (onAssignTaxReliefs) {
      const reliefsWithCustomAmounts = selectedReliefs.map(relief => ({
        ...relief,
        amount: customAmounts[relief.id] || relief.amount
      }))
      onAssignTaxReliefs(employee.id, reliefsWithCustomAmounts)
    }
    setIsTaxReliefDialogOpen(false)
  }

  const handleRemoveRelief = (reliefId: number) => {
    if (onRemoveTaxRelief) {
      onRemoveTaxRelief(employee.id, reliefId)
    }
    setSelectedReliefs(selectedReliefs.filter(r => r.id !== reliefId))
  }

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
              {showTaxReliefs && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Tax Reliefs</p>
                  <p className="text-sm font-medium text-green-600">
                    {formatCurrency(calculateTotalTaxRelief())}
                  </p>
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
                    {showTaxReliefs && (
                      <Dialog open={isTaxReliefDialogOpen} onOpenChange={setIsTaxReliefDialogOpen}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Receipt className="w-4 h-4 mr-2" />
                            Manage Tax Reliefs
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Manage Tax Reliefs - {getEmployeeName()}</DialogTitle>
                            <DialogDescription>
                              Assign and configure tax reliefs for this employee. Only eligible reliefs are shown.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Current Tax Reliefs */}
                            {selectedReliefs.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-3">Current Tax Reliefs</h4>
                                <div className="space-y-2">
                                  {selectedReliefs.map((relief) => (
                                    <div key={relief.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">{relief.name}</span>
                                          <Badge variant="secondary">{relief.category}</Badge>
                                          {relief.isMandatory && (
                                            <Badge variant="outline" className="text-xs">Mandatory</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">{relief.description}</p>
                                        {relief.graCode && (
                                          <p className="text-xs text-gray-500">GRA Code: {relief.graCode}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          type="number"
                                          value={customAmounts[relief.id] || relief.amount}
                                          onChange={(e) => handleCustomAmountChange(relief.id, Number.parseFloat(e.target.value) || 0)}
                                          className="w-24 text-right"
                                          step="0.01"
                                          min="0"
                                          max={relief.maxAmount || relief.amount}
                                        />
                                        <span className="text-sm text-gray-500">{relief.currency}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRemoveRelief(relief.id)}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-green-800">Total Tax Relief:</span>
                                    <span className="font-bold text-green-800 text-lg">
                                      {formatCurrency(calculateTotalTaxRelief())}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Available Tax Reliefs */}
                            <div>
                              <h4 className="font-medium mb-3">Available Tax Reliefs</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {getEligibleReliefs().map((relief) => (
                                  <div key={relief.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                    <Checkbox
                                      checked={selectedReliefs.some(r => r.id === relief.id)}
                                      onCheckedChange={(checked) => handleReliefToggle(relief, checked as boolean)}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium">{relief.name}</span>
                                        <Badge variant="secondary">{relief.category}</Badge>
                                        {relief.isMandatory && (
                                          <Badge variant="outline" className="text-xs">Mandatory</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600">{relief.description}</p>
                                      <div className="flex items-center space-x-4 mt-1">
                                        <span className="text-sm text-green-600 font-medium">
                                          {relief.currency} {relief.amount.toLocaleString()}
                                        </span>
                                        {relief.graCode && (
                                          <span className="text-xs text-gray-500">GRA: {relief.graCode}</span>
                                        )}
                                        {relief.maxChildren && (
                                          <span className="text-xs text-blue-600">Max: {relief.maxChildren} children</span>
                                        )}
                                        {relief.minAge && (
                                          <span className="text-xs text-blue-600">Min age: {relief.minAge}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                              <Button
                                variant="outline"
                                onClick={() => setIsTaxReliefDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleSaveTaxReliefs}>
                                <Check className="w-4 h-4 mr-2" />
                                Save Tax Reliefs
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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

          {/* Tax Reliefs Summary */}
          {showTaxReliefs && selectedReliefs.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Assigned Tax Reliefs</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(calculateTotalTaxRelief())}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedReliefs.map((relief) => (
                  <Badge key={relief.id} variant="outline" className="text-xs">
                    {relief.name} ({relief.currency} {relief.amount.toLocaleString()})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Compact and minimal variants would follow similar patterns...
  // For brevity, I'll include a simplified version

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
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
              <h3 className="font-semibold">{getEmployeeName()}</h3>
              <p className="text-sm text-gray-600">{employee.position || "No Position"}</p>
            </div>
          </div>
          <div className="text-right">
            {showTaxReliefs && selectedReliefs.length > 0 && (
              <div className="text-sm">
                <p className="text-gray-500">Tax Reliefs</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(calculateTotalTaxRelief())}
                </p>
              </div>
            )}
            <Badge variant="secondary" className={getStatusColor(employee.status)}>
              {employee.status || "Unknown"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}