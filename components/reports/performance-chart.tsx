"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts"
import { GraduationCap } from "lucide-react"

interface PerformanceChartProps {
  subjectAverages: Array<{ subject: string; average: number }>
  recentAssessments: any[]
}

export function PerformanceChart({ subjectAverages, recentAssessments }: PerformanceChartProps) {
  const chartData = subjectAverages.map((item) => ({
    subject: item.subject,
    performance: item.average,
  }))

  const chartConfig = {
    performance: {
      label: "Performance %",
      color: "hsl(var(--chart-3))",
    },
  }

  const overallAverage = subjectAverages.reduce((sum, item) => sum + item.average, 0) / subjectAverages.length || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Cards */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{Math.round(overallAverage)}%</p>
              <p className="text-sm text-gray-600">Overall Average</p>
            </div>
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{subjectAverages.length}</p>
              <p className="text-sm text-gray-600">Subjects Tracked</p>
            </div>
            <GraduationCap className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{recentAssessments.length}</p>
              <p className="text-sm text-gray-600">Recent Assessments</p>
            </div>
            <GraduationCap className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Academic Performance by Subject</CardTitle>
          <CardDescription>Average performance across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Radar
                  name="Performance"
                  dataKey="performance"
                  stroke="var(--color-performance)"
                  fill="var(--color-performance)"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
