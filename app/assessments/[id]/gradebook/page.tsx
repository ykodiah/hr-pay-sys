import { notFound } from "next/navigation"
import { getAssessmentById } from "@/lib/actions/assessments"
import { Gradebook } from "@/components/assessments/gradebook"

interface GradebookPageProps {
  params: {
    id: string
  }
}

export default async function GradebookPage({ params }: GradebookPageProps) {
  const { assessment, error } = await getAssessmentById(params.id)

  if (error || !assessment) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
        <p className="text-gray-600 mt-2">Enter and manage student scores</p>
      </div>

      <Gradebook assessment={assessment} />
    </div>
  )
}
