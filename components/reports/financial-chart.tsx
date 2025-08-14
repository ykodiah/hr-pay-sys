"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, AlertTriangle } from "lucide-react"

interface FinancialChartProps {
  monthlyRevenue: number
  outstandingBalance: number
  monthlyTrends: Record<string, number>
}

export function FinancialChart({ monthlyRevenue, outstandingBalance, monthlyTrends }: FinancialChartProps) {
  const chartData = Object.entries(monthlyTrends).map(([month, revenue]) => ({
    month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    revenue,
  }))

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Cards */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">KES {monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">KES {outstandingBalance.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Outstanding Balance</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {((monthlyRevenue / (monthlyRevenue + outstandingBalance)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Collection Rate</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue collection over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-revenue)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
