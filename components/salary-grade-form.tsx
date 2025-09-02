"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"

interface SalaryGrade {
  id: string
  grade_name: string
  grade_level: number
  step_1: number
  step_2: number
  step_3: number
  step_4: number
  step_5: number
}

interface SalaryGradeFormProps {
  grade?: SalaryGrade | null
  onSave: (data: any) => void
  onCancel: () => void
}

export default function SalaryGradeForm({ grade, onSave, onCancel }: SalaryGradeFormProps) {
  const [formData, setFormData] = useState({
    grade_name: "",
    grade_level: 1,
    step_1: 0,
    step_2: 0,
    step_3: 0,
    step_4: 0,
    step_5: 0,
  })

  useEffect(() => {
    if (grade) {
      setFormData({
        grade_name: grade.grade_name || "",
        grade_level: grade.grade_level || 1,
        step_1: grade.step_1 || 0,
        step_2: grade.step_2 || 0,
        step_3: grade.step_3 || 0,
        step_4: grade.step_4 || 0,
        step_5: grade.step_5 || 0,
      })
    }
  }, [grade])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "grade_name" ? value : Number(value),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="grade_name">Grade Name</Label>
          <Input
            id="grade_name"
            value={formData.grade_name}
            onChange={(e) => handleInputChange("grade_name", e.target.value)}
            placeholder="e.g., Grade 1"
            required
          />
        </div>
        <div>
          <Label htmlFor="grade_level">Grade Level</Label>
          <Input
            id="grade_level"
            type="number"
            value={formData.grade_level}
            onChange={(e) => handleInputChange("grade_level", e.target.value)}
            min="1"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Salary Steps (GH¢)</Label>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step}>
              <Label htmlFor={`step_${step}`} className="text-sm">
                Step {step}
              </Label>
              <Input
                id={`step_${step}`}
                type="number"
                value={formData[`step_${step}` as keyof typeof formData]}
                onChange={(e) => handleInputChange(`step_${step}`, e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Enter salary amounts for each step. Step 1 should be the lowest, Step 5 the highest.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          {grade ? "Update Grade" : "Save Grade"}
        </Button>
      </DialogFooter>
    </form>
  )
}
