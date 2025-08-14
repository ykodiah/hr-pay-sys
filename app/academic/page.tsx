import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function AcademicPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Academic Management</h1>
        <p className="text-gray-600 mt-2">Manage your school's academic structure and curriculum</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grade Levels</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">From Grade 1 to 12</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">Across all grades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Core & elective subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Term</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Term 2</div>
            <p className="text-xs text-muted-foreground">2024/2025 Academic Year</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
              Classes & Grades
            </CardTitle>
            <CardDescription>Manage grade levels, class sections, and student capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/academic/classes">Manage Classes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              Subjects
            </CardTitle>
            <CardDescription>Create subjects and assign them to classes with teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/academic/subjects">Manage Subjects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Academic Terms
            </CardTitle>
            <CardDescription>Set up academic years, terms, and important dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/academic/terms">Manage Terms</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-orange-600" />
              Timetable
            </CardTitle>
            <CardDescription>Create and manage class schedules and periods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/academic/timetable">Coming Soon</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
