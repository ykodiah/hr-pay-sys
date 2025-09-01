"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface Subsidiary {
  id: string
  name: string
  tax_id: string
  ssnit_number: string
  industry: string
  status: string
  email_address: string
  phone_number: string
  address: string
  divisions: string[]
  departments: string[]
  locations: string[]
}

interface SubsidiaryFormProps {
  subsidiary?: Subsidiary | null
  onSave: (data: any) => void
  onCancel: () => void
}

export default function SubsidiaryForm({ subsidiary, onSave, onCancel }: SubsidiaryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    tax_id: "",
    ssnit_number: "",
    industry: "Technology",
    email: "",
    phone: "",
    address: "",
    divisions: [] as string[],
    departments: [] as string[],
    locations: [] as string[],
  })

  const [newDivision, setNewDivision] = useState("")
  const [newDepartment, setNewDepartment] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (subsidiary) {
      setFormData({
        name: subsidiary.name || "",
        tax_id: subsidiary.tax_id || "",
        ssnit_number: subsidiary.ssnit_number || "",
        industry: subsidiary.industry || "Technology",
        email: subsidiary.email_address || "",
        phone: subsidiary.phone_number || "",
        address: subsidiary.address || "",
        divisions: subsidiary.divisions || [],
        departments: subsidiary.departments || [],
        locations: subsidiary.locations || [],
      })
    }
  }, [subsidiary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave(formData)
    } catch (error) {
      console.error("Error saving subsidiary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addDivision = () => {
    if (newDivision.trim() && !formData.divisions.includes(newDivision.trim())) {
      setFormData({
        ...formData,
        divisions: [...formData.divisions, newDivision.trim()],
      })
      setNewDivision("")
    }
  }

  const removeDivision = (division: string) => {
    setFormData({
      ...formData,
      divisions: formData.divisions.filter((d) => d !== division),
    })
  }

  const addDepartment = () => {
    if (newDepartment.trim() && !formData.departments.includes(newDepartment.trim())) {
      setFormData({
        ...formData,
        departments: [...formData.departments, newDepartment.trim()],
      })
      setNewDepartment("")
    }
  }

  const removeDepartment = (department: string) => {
    setFormData({
      ...formData,
      departments: formData.departments.filter((d) => d !== department),
    })
  }

  const addLocation = () => {
    if (newLocation.trim() && !formData.locations.includes(newLocation.trim())) {
      setFormData({
        ...formData,
        locations: [...formData.locations, newLocation.trim()],
      })
      setNewLocation("")
    }
  }

  const removeLocation = (location: string) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter((l) => l !== location),
    })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subsidiary ? "Edit Subsidiary" : "Add New Subsidiary"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subsidiary Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter subsidiary name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID *</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="Enter tax ID"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ssnit_number">SSNIT Number *</Label>
              <Input
                id="ssnit_number"
                value={formData.ssnit_number}
                onChange={(e) => setFormData({ ...formData, ssnit_number: e.target.value })}
                placeholder="Enter SSNIT number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter subsidiary address"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Divisions</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newDivision}
                  onChange={(e) => setNewDivision(e.target.value)}
                  placeholder="Add division"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addDivision())}
                />
                <Button type="button" onClick={addDivision} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.divisions.map((division, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {division}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeDivision(division)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Departments</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Add department"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addDepartment())}
                />
                <Button type="button" onClick={addDepartment} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.departments.map((department, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {department}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeDepartment(department)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Locations</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Add location"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                />
                <Button type="button" onClick={addLocation} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.locations.map((location, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {location}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeLocation(location)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : subsidiary ? "Update Subsidiary" : "Create Subsidiary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
