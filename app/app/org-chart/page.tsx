"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, Save, Download, Sparkles, Users, Building2, TrendingUp } from "lucide-react"

interface Employee {
  id: string
  employee_id: string
  full_name: string
  position: string
  department: string
  direct_supervisor?: string
  head_of_department?: string
  subsidiary_id?: string
  profile_picture?: string
}

interface OrgChart {
  id: string
  name: string
  description: string
  chart_type: string
  chart_style: string
  company_id?: string
  subsidiary_id?: string
  chart_data: any
  preview_image?: string
  is_active: boolean
  created_at: string
  user_id?: string
}

interface OrgChartNodeProps {
  employee: Employee
  level: number
  style: string
  children?: Employee[]
}

function OrgChartNode({ employee, level, style, children }: OrgChartNodeProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getNodeStyle = () => {
    const isHead = level === 0
    const isSupervisor = level === 1

    const styles = {
      modern: {
        head: "bg-blue-700 text-white border-blue-800",
        supervisor: "bg-blue-500 text-white border-blue-600",
        employee: "bg-gray-100 text-gray-800 border-gray-300",
      },
      classic: {
        head: "bg-amber-800 text-white border-amber-900",
        supervisor: "bg-amber-600 text-white border-amber-700",
        employee: "bg-gray-50 text-gray-900 border-gray-300",
      },
      minimal: {
        head: "bg-white text-gray-900 border-2 border-gray-900",
        supervisor: "bg-white text-gray-700 border border-gray-700",
        employee: "bg-white text-gray-600 border border-gray-300",
      },
      corporate: {
        head: "bg-emerald-700 text-white border-emerald-800",
        supervisor: "bg-emerald-500 text-white border-emerald-600",
        employee: "bg-emerald-50 text-emerald-900 border-emerald-200",
      },
    }

    const styleGroup = styles[style as keyof typeof styles] || styles.modern
    if (isHead) return styleGroup.head
    if (isSupervisor) return styleGroup.supervisor
    return styleGroup.employee
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`flex flex-col items-center p-4 rounded-lg border-2 shadow-md min-w-[180px] ${getNodeStyle()}`}>
        <Avatar className="w-16 h-16 mb-2 border-2 border-white">
          <AvatarImage
            src={
              employee.profile_picture ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.full_name || "/placeholder.svg"}`
            }
            alt={employee.full_name}
          />
          <AvatarFallback className="text-lg font-semibold">{getInitials(employee.full_name)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold text-sm">{employee.full_name}</p>
          <p className="text-xs opacity-90 mt-1">{employee.position}</p>
          <p className="text-xs opacity-75 mt-0.5">{employee.department}</p>
        </div>
      </div>

      {children && children.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          <div className="w-0.5 h-8 bg-gray-400" />
          <div className="flex gap-8">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-gray-400" />
                <OrgChartNode employee={child} level={level + 1} style={style} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrganizationalChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [subsidiaries, setSubsidiaries] = useState<any[]>([])
  const [orgCharts, setOrgCharts] = useState<OrgChart[]>([])
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>("all")
  const [chartType, setChartType] = useState<string>("hierarchical")
  const [chartStyle, setChartStyle] = useState<string>("modern")
  const [chartName, setChartName] = useState<string>("")
  const [chartDescription, setChartDescription] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewChart, setPreviewChart] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [viewingChart, setViewingChart] = useState<OrgChart | null>(null)
  const [showChartView, setShowChartView] = useState(false)

  useEffect(() => {
    checkDemoMode()
  }, [])

  const checkDemoMode = () => {
    if (typeof window !== "undefined") {
      const demoSession = document.cookie
        .split("; ")
        .find((row) => row.startsWith("demo-session="))
        ?.split("=")[1]

      const isDemo = demoSession === "active"
      setIsDemoMode(isDemo)
      console.log("[v0] Demo mode detected:", isDemo)

      if (isDemo) {
        loadMockData()
      } else {
        loadData()
      }
    }
  }

  const loadMockData = () => {
    console.log("[v0] Demo mode detected, using mock org chart data")

    const mockEmployees: Employee[] = [
      {
        id: "emp-001",
        employee_id: "EMP001",
        full_name: "Kwame Asante",
        position: "Chief Executive Officer",
        department: "Executive",
        head_of_department: "true",
        profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kwame",
      },
      {
        id: "emp-002",
        employee_id: "EMP002",
        full_name: "Ama Osei",
        position: "Chief Technology Officer",
        department: "Technology",
        direct_supervisor: "emp-001",
        head_of_department: "true",
        profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ama",
      },
      {
        id: "emp-003",
        employee_id: "EMP003",
        full_name: "Kofi Mensah",
        position: "HR Director",
        department: "Human Resources",
        direct_supervisor: "emp-001",
        head_of_department: "true",
        profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kofi",
      },
      {
        id: "emp-004",
        employee_id: "EMP004",
        full_name: "Akosua Boateng",
        position: "Senior Developer",
        department: "Technology",
        direct_supervisor: "emp-002",
        profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Akosua",
      },
      {
        id: "emp-005",
        employee_id: "EMP005",
        full_name: "Yaw Appiah",
        position: "HR Manager",
        department: "Human Resources",
        direct_supervisor: "emp-003",
        profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yaw",
      },
      {
        id: "emp-006",
        employee_id: "EMP006",
        full_name: "Abena Owusu",
        position: "Junior Developer",
        department: "Technology",
        direct_supervisor: "emp-004",
        profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abena",
      },
      {
        id: "emp-007",
        employee_id: "EMP007",
        full_name: "Kwesi Darko",
        position: "HR Assistant",
        department: "Human Resources",
        direct_supervisor: "emp-005",
        profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kwesi",
      },
    ]

    const mockSubsidiaries = [
      {
        id: "sub-001",
        name: "Akwaaba Tech Ghana",
        status: "active",
      },
      {
        id: "sub-002",
        name: "Akwaaba Tech Nigeria",
        status: "active",
      },
    ]

    const mockOrgCharts: OrgChart[] = [
      {
        id: "chart-001",
        name: "Company Organizational Chart 2024",
        description: "Main company organizational structure",
        chart_type: "hierarchical",
        chart_style: "modern",
        company_id: "00000000-0000-0000-0000-000000000001",
        chart_data: { employees: mockEmployees },
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ]

    setEmployees(mockEmployees)
    setSubsidiaries(mockSubsidiaries)
    setOrgCharts(mockOrgCharts)
  }

  const loadData = async () => {
    try {
      console.log("[v0] Loading real data from database")
      const supabase = createClient()

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "Active")

      if (employeesError) throw employeesError
      setEmployees(employeesData || [])

      // Load subsidiaries
      const { data: subsidiariesData, error: subsidiariesError } = await supabase
        .from("subsidiaries")
        .select("*")
        .eq("status", "active")

      if (subsidiariesError) throw subsidiariesError
      setSubsidiaries(subsidiariesData || [])

      // Load existing org charts
      const { data: chartsData, error: chartsError } = await supabase
        .from("organizational_charts")
        .select("*")
        .order("created_at", { ascending: false })

      if (chartsError) throw chartsError
      setOrgCharts(chartsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateOrgChart = async () => {
    if (!chartName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a chart name.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // Filter employees based on selected subsidiary
      const filteredEmployees =
        selectedSubsidiary === "all"
          ? employees.filter((emp) => !emp.subsidiary_id)
          : employees.filter((emp) => emp.subsidiary_id === selectedSubsidiary)

      if (filteredEmployees.length === 0) {
        toast({
          title: "No Employees",
          description: "No employees found for the selected subsidiary.",
          variant: "destructive",
        })
        setIsGenerating(false)
        return
      }

      const chartData = {
        employees: filteredEmployees,
        hierarchy: buildHierarchy(filteredEmployees),
      }

      setPreviewChart({
        name: chartName,
        description: chartDescription,
        chart_type: chartType,
        chart_style: chartStyle,
        subsidiary_id: selectedSubsidiary === "all" ? null : selectedSubsidiary,
        chart_data: chartData,
      })

      setShowPreview(true)

      toast({
        title: "Chart Generated",
        description: "Your organizational chart has been generated successfully!",
      })
    } catch (error) {
      console.error("Error generating chart:", error)
      toast({
        title: "Generation Error",
        description: "Failed to generate organizational chart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const buildHierarchy = (employees: Employee[]) => {
    const employeeMap = new Map(employees.map((emp) => [emp.id, { ...emp, children: [] as Employee[] }]))

    const roots: Employee[] = []

    employees.forEach((emp) => {
      const employee = employeeMap.get(emp.id)
      if (!employee) return

      if (emp.direct_supervisor) {
        const supervisor = employeeMap.get(emp.direct_supervisor)
        if (supervisor) {
          supervisor.children.push(employee)
        } else {
          roots.push(employee)
        }
      } else {
        roots.push(employee)
      }
    })

    return roots
  }

  const renderHierarchy = (employees: Employee[], style: string) => {
    const hierarchy = buildHierarchy(employees)

    return (
      <div className="flex justify-center items-start p-8 overflow-auto">
        <div className="flex gap-12">
          {hierarchy.map((root) => (
            <OrgChartNode key={root.id} employee={root} level={0} style={style} children={(root as any).children} />
          ))}
        </div>
      </div>
    )
  }

  const saveChart = async () => {
    if (!previewChart) return

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Chart saving is not available in demo mode. Please sign up for full access.",
        variant: "default",
      })
      return
    }

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to save organizational charts.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] User authenticated, proceeding with chart save:", user.id)

      const { data, error } = await supabase.from("organizational_charts").insert([
        {
          name: previewChart.name,
          description: previewChart.description,
          chart_type: previewChart.chart_type,
          chart_style: previewChart.chart_style,
          company_id: "00000000-0000-0000-0000-000000000001",
          subsidiary_id: previewChart.subsidiary_id,
          chart_data: previewChart.chart_data,
          is_active: false,
          user_id: user.id,
        },
      ])

      if (error) throw error

      console.log("[v0] Chart saved successfully:", data)

      toast({
        title: "Chart Saved",
        description: "Your organizational chart has been saved successfully!",
      })

      setShowPreview(false)
      setPreviewChart(null)
      if (!isDemoMode) {
        loadData()
      }
    } catch (error: any) {
      console.error("Error saving chart:", error)
      toast({
        title: "Save Error",
        description: `Failed to save organizational chart: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const activateChart = async (chartId: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Chart activation is not available in demo mode. Please sign up for full access.",
        variant: "default",
      })
      return
    }

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to activate organizational charts.",
          variant: "destructive",
        })
        return
      }

      await supabase.from("organizational_charts").update({ is_active: false }).neq("id", chartId)

      const { error } = await supabase.from("organizational_charts").update({ is_active: true }).eq("id", chartId)

      if (error) throw error

      toast({
        title: "Chart Activated",
        description: "The organizational chart has been activated successfully!",
      })

      if (!isDemoMode) {
        loadData()
      }
    } catch (error) {
      console.error("Error activating chart:", error)
      toast({
        title: "Activation Error",
        description: "Failed to activate organizational chart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const viewChart = (chart: OrgChart) => {
    setViewingChart(chart)
    setShowChartView(true)
  }

  const exportChart = (chart: OrgChart) => {
    toast({
      title: "Export Started",
      description: "Your organizational chart is being prepared for download.",
    })

    setTimeout(() => {
      const dataStr = JSON.stringify(chart, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${chart.name.replace(/\s+/g, "_")}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Your organizational chart has been downloaded.",
      })
    }, 1000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizational Charts</h1>
          <p className="text-muted-foreground">Create and manage AI-powered organizational charts</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI-Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{new Set(employees.map((e) => e.department)).size}</p>
              </div>
              <Building2 className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saved Charts</p>
                <p className="text-2xl font-bold">{orgCharts.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Create Chart</TabsTrigger>
          <TabsTrigger value="manage">Manage Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Organizational Chart</CardTitle>
              <CardDescription>
                Use AI to automatically generate professional organizational charts based on your employee data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chartName">
                    Chart Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="chartName"
                    placeholder="e.g., Company Org Chart 2024"
                    value={chartName}
                    onChange={(e) => setChartName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="subsidiary">Subsidiary/Division</Label>
                  <Select value={selectedSubsidiary} onValueChange={setSelectedSubsidiary}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subsidiary" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Main Company</SelectItem>
                      {subsidiaries.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chartType">Chart Type</Label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hierarchical">Hierarchical</SelectItem>
                      <SelectItem value="matrix">Matrix</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="functional">Functional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chartStyle">Chart Style</Label>
                  <Select value={chartStyle} onValueChange={setChartStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="chartDescription">Description</Label>
                <textarea
                  id="chartDescription"
                  placeholder="Brief description of this organizational chart..."
                  value={chartDescription}
                  onChange={(e) => setChartDescription(e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                onClick={generateOrgChart}
                disabled={isGenerating}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Chart...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Chart
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgCharts.map((chart) => (
              <Card key={chart.id} className={`relative ${chart.is_active ? "ring-2 ring-teal-500" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{chart.name}</CardTitle>
                    {chart.is_active && (
                      <Badge variant="default" className="bg-teal-600">
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{chart.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong>Type:</strong> {chart.chart_type}
                    </p>
                    <p>
                      <strong>Style:</strong> {chart.chart_style}
                    </p>
                    <p>
                      <strong>Employees:</strong> {chart.chart_data?.employees?.length || 0}
                    </p>
                    <p>
                      <strong>Created:</strong> {new Date(chart.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => viewChart(chart)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    {!chart.is_active && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => activateChart(chart.id)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Activate
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => exportChart(chart)}>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Chart Preview</DialogTitle>
            <DialogDescription>Review your generated organizational chart before saving</DialogDescription>
          </DialogHeader>
          {previewChart && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold">{previewChart.name}</h3>
                <p className="text-sm text-muted-foreground">{previewChart.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>
                    <strong>Type:</strong> {previewChart.chart_type}
                  </span>
                  <span>
                    <strong>Style:</strong> {previewChart.chart_style}
                  </span>
                  <span>
                    <strong>Employees:</strong> {previewChart.chart_data?.employees?.length || 0}
                  </span>
                </div>
              </div>
              <div className="border rounded-lg bg-white flex-1 overflow-auto">
                {renderHierarchy(previewChart.chart_data?.employees || [], previewChart.chart_style)}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cancel
                </Button>
                <Button onClick={saveChart} className="bg-teal-600 hover:bg-teal-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Chart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showChartView} onOpenChange={setShowChartView}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingChart?.name}</DialogTitle>
            <DialogDescription>{viewingChart?.description}</DialogDescription>
          </DialogHeader>
          {viewingChart && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>Type:</strong> {viewingChart.chart_type}
                  </span>
                  <span>
                    <strong>Style:</strong> {viewingChart.chart_style}
                  </span>
                  <span>
                    <strong>Employees:</strong> {viewingChart.chart_data?.employees?.length || 0}
                  </span>
                  <span>
                    <strong>Created:</strong> {new Date(viewingChart.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="border rounded-lg bg-white flex-1 overflow-auto">
                {renderHierarchy(viewingChart.chart_data?.employees || [], viewingChart.chart_style)}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowChartView(false)}>
                  Close
                </Button>
                <Button onClick={() => exportChart(viewingChart)} className="bg-teal-600 hover:bg-teal-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Chart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
