"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Users } from "lucide-react"

interface EnrollmentChartProps {
  data: Record<string, number>
  totalStudents: number
  newEnrollments: number
}

export function EnrollmentChart({ data, totalStudents, newEnrollments }: EnrollmentChartProps) {
  const chartData = Object.entries(data).map(([grade, count]) => ({
    grade,
    students: count,
  }))

  const chartConfig = {
    students: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Cards */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{newEnrollments}</p>
              <p className="text-sm text-gray-600">New This Month</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{Object.keys(data).length}</p>
              <p className="text-sm text-gray-600">Grade Levels</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Student Enrollment by Grade</CardTitle>
          <CardDescription>Current enrollment distribution across grade levels</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="grade" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="students" fill="var(--color-students)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
