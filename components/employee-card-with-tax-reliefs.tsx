"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Edit, Eye, Mail, MoreHorizontal, Phone, Trash2, User, Receipt, Calculator, Plus, X } from "lucide-react"
import { useState } from "react"

// Tax Relief Interface
interface TaxRelief {
  id: string
  name: string
  description: string
  category: string
  maxAmount: number
  isMandatory: boolean
  graCode: string
  maxChildren?: number
  minAge?: number
}

// Enhanced Employee Interface
interface EmployeeWithTaxReliefs {
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
  // Tax relief specific properties
  taxReliefs?: TaxRelief[]
  assignedReliefs?: string[] // Array of relief IDs
  customReliefAmounts?: { [reliefId: string]: number }
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  numberOfChildren?: number
  age?: number
  isDisabled?: boolean
  isPensioner?: boolean
}

interface EmployeeCardWithTaxReliefsProps {
  employee: EmployeeWithTaxReliefs
  variant?: "full" | "compact" | "minimal"
  showActions?: boolean
  showSalary?: boolean
  showTaxReliefs?: boolean
  onView?: (employee: any) => void
  onEdit?: (employee: any) => void
  onDelete?: (employee: any) => void
  onEmail?: (employee: any) => void
  onTaxReliefChange?: (employeeId: string, reliefs: string[], customAmounts: { [reliefId: string]: number }) => void
  formatCurrency?: (amount: number) => string
}

// Sample tax reliefs data (in a real app, this would come from your settings page)
const sampleTaxReliefs: TaxRelief[] = [
  {
    id: "relief-001",
    name: "Personal Relief",
    description: "Basic personal tax relief for all taxpayers",
    category: "Personal",
    maxAmount: 402,
    isMandatory: true,
    graCode: "PR001"
  },
  {
    id: "relief-002",
    name: "Marriage Relief",
    description: "Tax relief for married couples",
    category: "Marriage",
    maxAmount: 402,
    isMandatory: false,
    graCode: "MR001"
  },
  {
    id: "relief-003",
    name: "Child Relief",
    description: "Tax relief per child (maximum 3 children)",
    category: "Children",
    maxAmount: 90,
    isMandatory: false,
    graCode: "CR001",
    maxChildren: 3
  },
  {
    id: "relief-004",
    name: "Old Age Relief",
    description: "Tax relief for persons 60 years and above",
    category: "Age",
    maxAmount: 402,
    isMandatory: false,
    graCode: "OR001",
    minAge: 60
  },
  {
    id: "relief-005",
    name: "Disability Relief",
    description: "Tax relief for persons with disabilities",
    category: "Disability",
    maxAmount: 402,
    isMandatory: false,
    graCode: "DR001"
  },
  {
    id: "relief-006",
    name: "Dependent Relative Relief",
    description: "Tax relief for dependent relatives",
    category: "Dependents",
    maxAmount: 90,
    isMandatory: false,
    graCode: "DR002"
  }
]

export function EmployeeCardWithTaxReliefs({
  employee,
  variant = "full",
  showActions = true,
  showSalary = true,
  showTaxReliefs = true,
  onView,
  onEdit,
  onDelete,
  onEmail,
  onTaxReliefChange,
  formatCurrency = (amount) => `GH₵ ${amount.toLocaleString()}`,
}: EmployeeCardWithTaxReliefsProps) {
  const [isTaxReliefDialogOpen, setIsTaxReliefDialogOpen] = useState(false)
  const [selectedReliefs, setSelectedReliefs] = useState<string[]>(employee.assignedReliefs || [])
  const [customAmounts, setCustomAmounts] = useState<{ [reliefId: string]: number }>(employee.customReliefAmounts || {})

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

  // Check if employee is eligible for a specific relief
  const isEligibleForRelief = (relief: TaxRelief): boolean => {
    // Personal relief is always eligible
    if (relief.isMandatory) return true

    // Check age requirement
    if (relief.minAge && employee.age && employee.age < relief.minAge) return false

    // Check marital status for marriage relief
    if (relief.category === "Marriage" && employee.maritalStatus !== "married") return false

    // Check children count for child relief
    if (relief.category === "Children" && relief.maxChildren) {
      const childrenCount = employee.numberOfChildren || 0
      return childrenCount > 0 && childrenCount <= relief.maxChildren
    }

    // Check disability status
    if (relief.category === "Disability" && !employee.isDisabled) return false

    // Check age for old age relief
    if (relief.category === "Age" && relief.minAge && employee.age && employee.age < relief.minAge) return false

    return true
  }

  // Get eligible reliefs for this employee
  const getEligibleReliefs = (): TaxRelief[] => {
    return sampleTaxReliefs.filter(relief => isEligibleForRelief(relief))
  }

  // Calculate total tax relief amount
  const calculateTotalTaxRelief = (): number => {
    let total = 0
    selectedReliefs.forEach(reliefId => {
      const relief = sampleTaxReliefs.find(r => r.id === reliefId)
      if (relief) {
        const customAmount = customAmounts[reliefId]
        if (customAmount !== undefined) {
          total += Math.min(customAmount, relief.maxAmount)
        } else {
          total += relief.maxAmount
        }
      }
    })
    return total
  }

  // Handle relief toggle
  const handleReliefToggle = (reliefId: string, checked: boolean) => {
    if (checked) {
      setSelectedReliefs([...selectedReliefs, reliefId])
    } else {
      setSelectedReliefs(selectedReliefs.filter(id => id !== reliefId))
      // Remove custom amount when unchecking
      const newCustomAmounts = { ...customAmounts }
      delete newCustomAmounts[reliefId]
      setCustomAmounts(newCustomAmounts)
    }
  }

  // Handle custom amount change
  const handleCustomAmountChange = (reliefId: string, amount: number) => {
    setCustomAmounts({
      ...customAmounts,
      [reliefId]: amount
    })
  }

  // Save tax relief changes
  const handleSaveTaxReliefs = () => {
    if (onTaxReliefChange) {
      onTaxReliefChange(employee.id, selectedReliefs, customAmounts)
    }
    setIsTaxReliefDialogOpen(false)
  }

  // Get assigned reliefs info for display
  const getAssignedReliefsInfo = () => {
    const assignedReliefs = sampleTaxReliefs.filter(relief => selectedReliefs.includes(relief.id))
    return {
      count: assignedReliefs.length,
      totalAmount: calculateTotalTaxRelief(),
      reliefs: assignedReliefs
    }
  }

  const reliefsInfo = getAssignedReliefsInfo()

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
                  <p className="text-sm font-medium">{reliefsInfo.count} reliefs</p>
                  <p className="text-xs text-gray-500">{formatCurrency(reliefsInfo.totalAmount)}</p>
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
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Manage Tax Reliefs - {getEmployeeName()}</DialogTitle>
                            <DialogDescription>
                              Select applicable tax reliefs for this employee. Custom amounts can be set for each relief.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {getEligibleReliefs().map((relief) => (
                              <div key={relief.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      id={relief.id}
                                      checked={selectedReliefs.includes(relief.id)}
                                      onCheckedChange={(checked) => handleReliefToggle(relief.id, checked as boolean)}
                                    />
                                    <div>
                                      <Label htmlFor={relief.id} className="font-medium cursor-pointer">
                                        {relief.name}
                                      </Label>
                                      <p className="text-sm text-gray-600">{relief.description}</p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {relief.graCode}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          Max: {formatCurrency(relief.maxAmount)}
                                        </Badge>
                                        {relief.isMandatory && (
                                          <Badge variant="destructive" className="text-xs">
                                            Mandatory
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {selectedReliefs.includes(relief.id) && (
                                  <div className="ml-6 space-y-2">
                                    <Label htmlFor={`custom-${relief.id}`} className="text-sm">
                                      Custom Amount (Max: {formatCurrency(relief.maxAmount)})
                                    </Label>
                                    <Input
                                      id={`custom-${relief.id}`}
                                      type="number"
                                      value={customAmounts[relief.id] || relief.maxAmount}
                                      onChange={(e) => handleCustomAmountChange(relief.id, parseFloat(e.target.value) || 0)}
                                      min={0}
                                      max={relief.maxAmount}
                                      step={0.01}
                                      className="w-32"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                            <Separator />
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">Total Tax Reliefs</p>
                                <p className="text-sm text-gray-600">{selectedReliefs.length} reliefs selected</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-emerald-600">
                                  {formatCurrency(calculateTotalTaxRelief())}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setIsTaxReliefDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveTaxReliefs}>
                                Save Changes
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
        </CardContent>
      </Card>
    )
  }

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
            {showTaxReliefs && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-gray-500">Tax Reliefs:</span>
                <span className="font-medium">{reliefsInfo.count} reliefs ({formatCurrency(reliefsInfo.totalAmount)})</span>
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
              {showTaxReliefs && (
                <Dialog open={isTaxReliefDialogOpen} onOpenChange={setIsTaxReliefDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Receipt className="w-4 h-4 mr-1" />
                      Tax Reliefs
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Tax Reliefs - {getEmployeeName()}</DialogTitle>
                      <DialogDescription>
                        Select applicable tax reliefs for this employee.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {getEligibleReliefs().map((relief) => (
                        <div key={relief.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={relief.id}
                                checked={selectedReliefs.includes(relief.id)}
                                onCheckedChange={(checked) => handleReliefToggle(relief.id, checked as boolean)}
                              />
                              <div>
                                <Label htmlFor={relief.id} className="font-medium cursor-pointer">
                                  {relief.name}
                                </Label>
                                <p className="text-sm text-gray-600">{relief.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {relief.graCode}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    Max: {formatCurrency(relief.maxAmount)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          {selectedReliefs.includes(relief.id) && (
                            <div className="ml-6 space-y-2">
                              <Label htmlFor={`custom-${relief.id}`} className="text-sm">
                                Custom Amount (Max: {formatCurrency(relief.maxAmount)})
                              </Label>
                              <Input
                                id={`custom-${relief.id}`}
                                type="number"
                                value={customAmounts[relief.id] || relief.maxAmount}
                                onChange={(e) => handleCustomAmountChange(relief.id, parseFloat(e.target.value) || 0)}
                                min={0}
                                max={relief.maxAmount}
                                step={0.01}
                                className="w-32"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Total Tax Reliefs</p>
                          <p className="text-sm text-gray-600">{selectedReliefs.length} reliefs selected</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            {formatCurrency(calculateTotalTaxRelief())}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsTaxReliefDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTaxReliefs}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

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
                {showTaxReliefs && (
                  <p className="text-xs text-emerald-600">{reliefsInfo.count} tax reliefs</p>
                )}
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

  return null
}
