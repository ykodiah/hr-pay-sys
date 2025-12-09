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
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, Save, Download, Sparkles } from "lucide-react"

interface Employee {
  id: string
  employee_id: string
  full_name: string
  position: string
  department: string
  direct_supervisor?: string
  head_of_department?: string
  subsidiary_id?: string
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
      },
      {
        id: "emp-002",
        employee_id: "EMP002",
        full_name: "Ama Osei",
        position: "Chief Technology Officer",
        department: "Technology",
        direct_supervisor: "emp-001",
        head_of_department: "true",
      },
      {
        id: "emp-003",
        employee_id: "EMP003",
        full_name: "Kofi Mensah",
        position: "HR Director",
        department: "Human Resources",
        direct_supervisor: "emp-001",
        head_of_department: "true",
      },
      {
        id: "emp-004",
        employee_id: "EMP004",
        full_name: "Akosua Boateng",
        position: "Senior Developer",
        department: "Technology",
        direct_supervisor: "emp-002",
      },
      {
        id: "emp-005",
        employee_id: "EMP005",
        full_name: "Yaw Appiah",
        position: "HR Manager",
        department: "Human Resources",
        direct_supervisor: "emp-003",
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
        chart_data: { nodes: mockEmployees, edges: [] },
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

      // Generate chart structure using AI/ML logic
      const chartData = await generateChartStructure(filteredEmployees, chartType, chartStyle)

      setPreviewChart({
        name: chartName,
        description: chartDescription,
        chart_type: chartType,
        chart_style: chartStyle,
        subsidiary_id: selectedSubsidiary === "all" ? null : selectedSubsidiary,
        chart_data: chartData,
        preview_image: generatePreviewImage(chartData, chartStyle),
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

  const generateChartStructure = async (employees: Employee[], type: string, style: string) => {
    const structure: any = {
      type,
      style,
      nodes: [],
      edges: [],
      layout: {},
    }

    const departments = [...new Set(employees.map((emp) => emp.department))]
    const hierarchy: any = {}

    employees.forEach((emp) => {
      if (!hierarchy[emp.department]) {
        hierarchy[emp.department] = {
          department: emp.department,
          head: null,
          supervisors: [],
          employees: [],
        }
      }

      if (emp.head_of_department && !hierarchy[emp.department].head) {
        hierarchy[emp.department].head = emp
      } else if (emp.direct_supervisor) {
        hierarchy[emp.department].supervisors.push(emp)
      } else {
        hierarchy[emp.department].employees.push(emp)
      }
    })

    let nodeId = 0
    Object.values(hierarchy).forEach((dept: any) => {
      if (dept.head) {
        structure.nodes.push({
          id: `node-${nodeId++}`,
          data: {
            label: dept.head.full_name,
            position: dept.head.position,
            department: dept.head.department,
            type: "head",
            employee_id: dept.head.id,
          },
          position: { x: 0, y: 0 },
          style: getNodeStyle(style, "head"),
        })
      }

      dept.supervisors.forEach((supervisor: Employee) => {
        structure.nodes.push({
          id: `node-${nodeId++}`,
          data: {
            label: supervisor.full_name,
            position: supervisor.position,
            department: supervisor.department,
            type: "supervisor",
            employee_id: supervisor.id,
          },
          position: { x: 0, y: 0 },
          style: getNodeStyle(style, "supervisor"),
        })
      })

      dept.employees.forEach((employee: Employee) => {
        structure.nodes.push({
          id: `node-${nodeId++}`,
          data: {
            label: employee.full_name,
            position: employee.position,
            department: employee.department,
            type: "employee",
            employee_id: employee.id,
          },
          position: { x: 0, y: 0 },
          style: getNodeStyle(style, "employee"),
        })
      })
    })

    structure.nodes.forEach((node: any) => {
      const employee = employees.find((emp) => emp.id === node.data.employee_id)
      if (employee?.direct_supervisor) {
        const supervisorNode = structure.nodes.find((n: any) => n.data.employee_id === employee.direct_supervisor)
        if (supervisorNode) {
          structure.edges.push({
            id: `edge-${node.id}-${supervisorNode.id}`,
            source: supervisorNode.id,
            target: node.id,
            style: getEdgeStyle(style),
          })
        }
      }
    })

    structure.layout = calculateLayout(structure.nodes, structure.edges, type)

    return structure
  }

  const getNodeStyle = (style: string, nodeType: string) => {
    const baseStyles = {
      modern: {
        head: {
          backgroundColor: "#1e40af",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          border: "none",
          minWidth: "120px",
          textAlign: "center" as const,
        },
        supervisor: {
          backgroundColor: "#3b82f6",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          border: "none",
          minWidth: "100px",
          textAlign: "center" as const,
        },
        employee: {
          backgroundColor: "#e5e7eb",
          color: "#374151",
          borderRadius: "6px",
          padding: "8px",
          border: "1px solid #d1d5db",
          minWidth: "80px",
          textAlign: "center" as const,
        },
      },
      classic: {
        head: {
          backgroundColor: "#7c2d12",
          color: "#ffffff",
          borderRadius: "4px",
          padding: "16px",
          border: "none",
          minWidth: "120px",
          textAlign: "center" as const,
        },
        supervisor: {
          backgroundColor: "#a16207",
          color: "#ffffff",
          borderRadius: "4px",
          padding: "12px",
          border: "none",
          minWidth: "100px",
          textAlign: "center" as const,
        },
        employee: {
          backgroundColor: "#f3f4f6",
          color: "#1f2937",
          borderRadius: "4px",
          padding: "8px",
          border: "1px solid #d1d5db",
          minWidth: "80px",
          textAlign: "center" as const,
        },
      },
      minimal: {
        head: {
          backgroundColor: "#ffffff",
          color: "#111827",
          border: "2px solid #111827",
          padding: "16px",
          borderRadius: "4px",
          minWidth: "120px",
          textAlign: "center" as const,
        },
        supervisor: {
          backgroundColor: "#ffffff",
          color: "#374151",
          border: "1px solid #374151",
          padding: "12px",
          borderRadius: "4px",
          minWidth: "100px",
          textAlign: "center" as const,
        },
        employee: {
          backgroundColor: "#ffffff",
          color: "#6b7280",
          border: "1px solid #d1d5db",
          padding: "8px",
          borderRadius: "4px",
          minWidth: "80px",
          textAlign: "center" as const,
        },
      },
      corporate: {
        head: {
          backgroundColor: "#059669",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "16px",
          border: "none",
          minWidth: "120px",
          textAlign: "center" as const,
        },
        supervisor: {
          backgroundColor: "#10b981",
          color: "#ffffff",
          borderRadius: "6px",
          padding: "12px",
          border: "none",
          minWidth: "100px",
          textAlign: "center" as const,
        },
        employee: {
          backgroundColor: "#ecfdf5",
          color: "#065f46",
          borderRadius: "4px",
          padding: "8px",
          border: "1px solid #a7f3d0",
          minWidth: "80px",
          textAlign: "center" as const,
        },
      },
    }

    const styleGroup = baseStyles[style as keyof typeof baseStyles] || baseStyles.modern
    const nodeStyle = styleGroup[nodeType as keyof typeof styleGroup] || styleGroup.employee

    return {
      ...nodeStyle,
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
      display: "block",
      boxSizing: "border-box" as const,
    }
  }

  const getEdgeStyle = (style: string) => {
    const edgeStyles = {
      modern: {
        stroke: "#3b82f6",
        strokeWidth: "2px",
        fill: "none",
      },
      classic: {
        stroke: "#a16207",
        strokeWidth: "1px",
        fill: "none",
      },
      minimal: {
        stroke: "#6b7280",
        strokeWidth: "1px",
        strokeDasharray: "5,5",
        fill: "none",
      },
      corporate: {
        stroke: "#10b981",
        strokeWidth: "2px",
        fill: "none",
      },
    }

    return edgeStyles[style as keyof typeof edgeStyles] || edgeStyles.modern
  }

  const calculateLayout = (nodes: any[], edges: any[], type: string) => {
    const layout = { algorithm: type, spacing: { x: 200, y: 150 } }

    nodes.forEach((node, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      node.position = {
        x: col * layout.spacing.x,
        y: row * layout.spacing.y,
      }
    })

    return layout
  }

  const generatePreviewImage = (chartData: any, style: string) => {
    const nodeCount = chartData?.nodes?.length || 0
    const styleText = style || "modern"

    const svgContent = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
        <text x="200" y="140" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fill="#374151">
          ${nodeCount} Employees
        </text>
        <text x="200" y="160" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#6b7280">
          ${styleText.charAt(0).toUpperCase() + styleText.slice(1)} Style
        </text>
      </svg>
    `

    return `data:image/svg+xml;base64,${btoa(svgContent)}`
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
          preview_image: previewChart.preview_image,
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
    } catch (error) {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizational Charts</h1>
          <p className="text-gray-600">Create and manage AI-powered organizational charts</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI-Powered
        </Badge>
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
                  <Label htmlFor="chartName">Chart Name *</Label>
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
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>Type:</strong> {chart.chart_type}
                    </p>
                    <p>
                      <strong>Style:</strong> {chart.chart_style}
                    </p>
                    <p>
                      <strong>Employees:</strong> {chart.chart_data?.nodes?.length || 0}
                    </p>
                    <p>
                      <strong>Created:</strong> {new Date(chart.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
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
                    <Button variant="outline" size="sm">
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chart Preview</DialogTitle>
            <DialogDescription>Review your generated organizational chart before saving</DialogDescription>
          </DialogHeader>
          {previewChart && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{previewChart.name}</h3>
                <p className="text-sm text-gray-600">{previewChart.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>
                    <strong>Type:</strong> {previewChart.chart_type}
                  </span>
                  <span>
                    <strong>Style:</strong> {previewChart.chart_style}
                  </span>
                  <span>
                    <strong>Employees:</strong> {previewChart.chart_data?.nodes?.length || 0}
                  </span>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-white min-h-[300px] flex items-center justify-center">
                {previewChart.preview_image ? (
                  <img
                    src={previewChart.preview_image || "/placeholder.svg"}
                    alt="Chart Preview"
                    className="max-w-full max-h-[300px]"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Chart preview will be displayed here</p>
                    <p className="text-sm">Generated with {previewChart.chart_data?.nodes?.length || 0} employees</p>
                  </div>
                )}
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
    </div>
  )
}
