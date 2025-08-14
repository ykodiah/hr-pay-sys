"use client"

import { useState } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { createStudent, updateStudent } from "@/lib/actions/students"

interface Guardian {
  first_name: string
  last_name: string
  email: string
  phone: string
  national_id: string
  address: string
  relationship: string
  is_primary: boolean
}

interface StudentFormProps {
  student?: any
  mode: "create" | "edit"
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {mode === "create" ? "Creating..." : "Updating..."}
        </>
      ) : mode === "create" ? (
        "Create Student"
      ) : (
        "Update Student"
      )}
    </Button>
  )
}

export function StudentForm({ student, mode }: StudentFormProps) {
  const [guardians, setGuardians] = useState<Guardian[]>(
    student?.student_guardians?.map((sg: any) => ({
      first_name: sg.guardians.first_name,
      last_name: sg.guardians.last_name,
      email: sg.guardians.email,
      phone: sg.guardians.phone,
      national_id: sg.guardians.national_id || "",
      address: sg.guardians.address || "",
      relationship: sg.relationship,
      is_primary: sg.is_primary,
    })) || [
      {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        national_id: "",
        address: "",
        relationship: "parent",
        is_primary: true,
      },
    ],
  )

  const action = mode === "create" ? createStudent : updateStudent.bind(null, student?.id)
  const [state, formAction] = useActionState(action, null)

  const addGuardian = () => {
    setGuardians([
      ...guardians,
      {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        national_id: "",
        address: "",
        relationship: "parent",
        is_primary: false,
      },
    ])
  }

  const removeGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index))
  }

  const updateGuardian = (index: number, field: keyof Guardian, value: string | boolean) => {
    const updated = [...guardians]
    updated[index] = { ...updated[index], [field]: value }
    setGuardians(updated)
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{state.error}</div>
      )}

      {state?.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">{state.success}</div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="medical">Medical & Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>Basic information about the student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" defaultValue={student?.first_name || ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" defaultValue={student?.last_name || ""} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_no">Student Number</Label>
                  <Input id="student_no" name="student_no" defaultValue={student?.student_no || ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" defaultValue={student?.gender || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" name="dob" type="date" defaultValue={student?.dob || ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admission_dt">Admission Date</Label>
                  <Input
                    id="admission_dt"
                    name="admission_dt"
                    type="date"
                    defaultValue={student?.admission_dt || ""}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={student?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Guardian Information</CardTitle>
                  <CardDescription>Parents or guardians responsible for the student</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addGuardian}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guardian
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {guardians.map((guardian, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Guardian {index + 1}</h4>
                    {guardians.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeGuardian(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={guardian.first_name}
                        onChange={(e) => updateGuardian(index, "first_name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={guardian.last_name}
                        onChange={(e) => updateGuardian(index, "last_name", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={guardian.email}
                        onChange={(e) => updateGuardian(index, "email", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={guardian.phone}
                        onChange={(e) => updateGuardian(index, "phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Select
                        value={guardian.relationship}
                        onValueChange={(value) => updateGuardian(index, "relationship", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="grandparent">Grandparent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>National ID</Label>
                      <Input
                        value={guardian.national_id}
                        onChange={(e) => updateGuardian(index, "national_id", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      value={guardian.address}
                      onChange={(e) => updateGuardian(index, "address", e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`primary-${index}`}
                      checked={guardian.is_primary}
                      onChange={(e) => updateGuardian(index, "is_primary", e.target.checked)}
                    />
                    <Label htmlFor={`primary-${index}`}>Primary Guardian</Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Information & Notes</CardTitle>
              <CardDescription>Health conditions, allergies, and special notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medical_flags">Medical Conditions & Allergies</Label>
                <Textarea
                  id="medical_flags"
                  name="medical_flags"
                  placeholder="Enter any medical conditions, allergies, or special health requirements..."
                  defaultValue={student?.medical_flags ? JSON.stringify(student.medical_flags) : ""}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden field for guardian data */}
      <input type="hidden" name="guardian_data" value={JSON.stringify(guardians)} />

      <SubmitButton mode={mode} />
    </form>
  )
}
