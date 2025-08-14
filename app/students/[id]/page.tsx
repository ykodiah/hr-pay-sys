import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Mail, Phone, MapPin, User, GraduationCap, Heart } from "lucide-react"
import { getStudentById } from "@/lib/actions/students"
import Link from "next/link"

interface StudentDetailPageProps {
  params: {
    id: string
  }
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { student, error } = await getStudentById(params.id)

  if (error || !student) {
    notFound()
  }

  const fullName = `${student.first_name} ${student.last_name}`
  const initials = `${student.first_name[0]}${student.last_name[0]}`
  const currentEnrollment = student.enrollments?.find((e: any) => e.terms?.is_current)
  const primaryGuardian = student.student_guardians?.find((sg: any) => sg.is_primary)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/placeholder.svg" alt={fullName} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-600">Student ID: {student.student_no}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
              {currentEnrollment && (
                <Badge variant="outline">
                  {currentEnrollment.classes?.grades?.name} - {currentEnrollment.classes?.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/students/${student.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Student
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <p className="capitalize">{student.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p>{new Date(student.dob).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Admission Date</p>
                    <p>{new Date(student.admission_dt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Enrollment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Current Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentEnrollment ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Class</p>
                      <p>
                        {currentEnrollment.classes?.grades?.name} - {currentEnrollment.classes?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Academic Year</p>
                      <p>{currentEnrollment.terms?.academic_yr}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Term</p>
                      <p>Term {currentEnrollment.terms?.term_no}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No current enrollment</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Primary Guardian */}
          {primaryGuardian && (
            <Card>
              <CardHeader>
                <CardTitle>Primary Guardian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {primaryGuardian.guardians.first_name[0]}
                      {primaryGuardian.guardians.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {primaryGuardian.guardians.first_name} {primaryGuardian.guardians.last_name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{primaryGuardian.relationship}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-1" />
                      {primaryGuardian.guardians.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-1" />
                      {primaryGuardian.guardians.email}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic History</CardTitle>
              <CardDescription>Student's enrollment and academic progress</CardDescription>
            </CardHeader>
            <CardContent>
              {student.enrollments && student.enrollments.length > 0 ? (
                <div className="space-y-4">
                  {student.enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {enrollment.classes?.grades?.name} - {enrollment.classes?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {enrollment.terms?.academic_yr} - Term {enrollment.terms?.term_no}
                          </p>
                        </div>
                        <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                          {enrollment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No enrollment history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>Parents and guardians responsible for the student</CardDescription>
            </CardHeader>
            <CardContent>
              {student.student_guardians && student.student_guardians.length > 0 ? (
                <div className="space-y-6">
                  {student.student_guardians.map((sg: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {sg.guardians.first_name[0]}
                              {sg.guardians.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">
                              {sg.guardians.first_name} {sg.guardians.last_name}
                            </h4>
                            <p className="text-sm text-gray-500 capitalize">{sg.relationship}</p>
                          </div>
                        </div>
                        {sg.is_primary && <Badge variant="default">Primary</Badge>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {sg.guardians.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {sg.guardians.email}
                        </div>
                        {sg.guardians.national_id && (
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            ID: {sg.guardians.national_id}
                          </div>
                        )}
                        {sg.guardians.address && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {sg.guardians.address}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No guardian information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Medical Information
              </CardTitle>
              <CardDescription>Health conditions, allergies, and medical notes</CardDescription>
            </CardHeader>
            <CardContent>
              {student.medical_flags ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Medical Conditions & Allergies</h4>
                  <p className="text-yellow-700">{JSON.stringify(student.medical_flags)}</p>
                </div>
              ) : (
                <p className="text-gray-500">No medical information recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
