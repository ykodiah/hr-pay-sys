import { notFound } from "next/navigation"
import { StudentForm } from "@/components/students/student-form"
import { getStudentById } from "@/lib/actions/students"

interface EditStudentPageProps {
  params: {
    id: string
  }
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { student, error } = await getStudentById(params.id)

  if (error || !student) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
        <p className="text-gray-600 mt-2">
          Update information for {student.first_name} {student.last_name}
        </p>
      </div>

      <StudentForm student={student} mode="edit" />
    </div>
  )
}
