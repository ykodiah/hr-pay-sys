import { StudentForm } from "@/components/students/student-form"

export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Student</h1>
        <p className="text-gray-600 mt-2">Create a new student record with complete information</p>
      </div>

      <StudentForm mode="create" />
    </div>
  )
}
