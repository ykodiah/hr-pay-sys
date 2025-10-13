"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Download, Maximize2 } from "lucide-react"

interface OrgChartNode {
  id: string
  data: {
    label: string
    position: string
    department: string
    type: "head" | "supervisor" | "employee"
    employee_id: string
  }
  position: { x: number; y: number }
  style: any
}

interface OrgChartEdge {
  id: string
  source: string
  target: string
  style: any
}

interface OrgChartViewerProps {
  chartData: any
  style: string
  showControls?: boolean
}

export function OrgChartViewer({ chartData, style, showControls = true }: OrgChartViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const nodes: OrgChartNode[] = chartData?.nodes || []
  const edges: OrgChartEdge[] = chartData?.edges || []

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleExport = () => {
    const svgElement = document.querySelector("#org-chart-svg")
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "organizational-chart.svg"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white rounded-lg shadow-md p-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} title="Reset View">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px bg-gray-300 mx-1" />
          <Button variant="ghost" size="sm" onClick={handleExport} title="Export as SVG">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="p-8 overflow-auto" style={{ minHeight: "500px", maxHeight: "600px" }}>
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "top left",
            transition: "transform 0.2s ease",
          }}
        >
          <svg id="org-chart-svg" width="100%" height="600" className="overflow-visible">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Draw edges (connections) */}
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source)
              const targetNode = nodes.find((n) => n.id === edge.target)

              if (!sourceNode || !targetNode) return null

              const x1 = sourceNode.position.x + 100
              const y1 = sourceNode.position.y + 40
              const x2 = targetNode.position.x + 100
              const y2 = targetNode.position.y

              const midY = (y1 + y2) / 2

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
                    stroke={edge.style.stroke}
                    strokeWidth={edge.style.strokeWidth}
                    strokeDasharray={edge.style.strokeDasharray}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx={x2} cy={y2} r="3" fill={edge.style.stroke} />
                </g>
              )
            })}

            {/* Draw nodes */}
            {nodes.map((node) => {
              const nodeStyle = node.style
              const width = 200
              const height = 80

              return (
                <g key={node.id}>
                  <foreignObject x={node.position.x} y={node.position.y} width={width} height={height}>
                    <div
                      style={{
                        ...nodeStyle,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      className="hover:scale-105 hover:shadow-lg"
                    >
                      <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>{node.data.label}</div>
                      <div style={{ fontSize: "12px", opacity: 0.8 }}>{node.data.position}</div>
                      <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>{node.data.department}</div>
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No chart data available</p>
            <p className="text-sm">Generate a chart to see the visualization</p>
          </div>
        </div>
      )}
    </div>
  )
}
