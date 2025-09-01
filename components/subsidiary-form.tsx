"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface SubsidiaryFormProps {
  subsidiary?: any
  onSave: (data: any) => void
  onCancel: () => void
}

const SubsidiaryForm = ({ subsidiary, onSave, onCancel }: SubsidiaryFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    tax_id: "",
    ssnit_number: "",
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

  useEffect(() => {
    if (subsidiary) {
      setFormData({
        name: subsidiary.name || "",
        tax_id: subsidiary.tax_id || "",
        ssnit_number: subsidiary.ssnit_number || "",
        email: subsidiary.email_address || "",
        phone: subsidiary.phone_number || "",
        address: subsidiary.address || "",
        divisions: subsidiary.divisions || [],
        departments: subsidiary.departments || [],
        locations: subsidiary.locations || [],
      })
    }
  }, [subsidiary])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addItem = (type: "divisions" | "departments" | "locations", value: string) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], value.trim()],
      }))
      if (type === "divisions") setNewDivision("")
      if (type === "departments") setNewDepartment("")
      if (type === "locations") setNewLocation("")
    }
  }

  const removeItem = (type: "divisions" | "departments" | "locations", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tax_id">Tax ID</Label>
          <Input
            id="tax_id"
            value={formData.tax_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, tax_id: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="ssnit_number">SSNIT Number</Label>
          <Input
            id="ssnit_number"
            value={formData.ssnit_number}
            onChange={(e) => setFormData((prev) => ({ ...prev, ssnit_number: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            rows={3}
          />
        </div>
      </div>

      {/* Divisions */}
      <div>
        <Label>Divisions</Label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Add division"
            value={newDivision}
            onChange={(e) => setNewDivision(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("divisions", newDivision))}
          />
          <Button type="button" onClick={() => addItem("divisions", newDivision)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.divisions.map((division, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {division}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem("divisions", index)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div>
        <Label>Departments</Label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Add department"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("departments", newDepartment))}
          />
          <Button type="button" onClick={() => addItem("departments", newDepartment)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.departments.map((department, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {department}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem("departments", index)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
        <Label>Locations</Label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Add location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("locations", newLocation))}
          />
          <Button type="button" onClick={() => addItem("locations", newLocation)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.locations.map((location, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {location}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem("locations", index)} />
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          Save Subsidiary
        </Button>
      </div>
    </form>
  )
}

export default SubsidiaryForm
