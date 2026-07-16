export type OrgEmployee = {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  display_name?: string | null
  position?: string | null
  department?: string | null
  subsidiary_id?: string | null
  direct_supervisor?: string | null
  head_of_department?: string | null
  special_role?: string | null
  employee_id?: string | null
}

export type OrgNode = {
  id: string
  type: "ceo" | "department_head" | "supervisor" | "employee"
  label: string
  position: string
  department: string
  employeeCode: string
  x: number
  y: number
  level: number
}

export type OrgEdge = {
  id: string
  source: string
  target: string
  relation: "reports_to" | "department_head"
}

export type OrgChartData = {
  type: string
  style: string
  scope: string
  nodes: OrgNode[]
  edges: OrgEdge[]
  layout: { columns: number; rows: number; width: number; height: number }
  generated_at: string
}

const COL_WIDTH = 220
const ROW_HEIGHT = 110

function displayName(emp: OrgEmployee) {
  return (
    emp.full_name ||
    emp.display_name ||
    `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() ||
    emp.employee_id ||
    emp.id.slice(0, 8)
  )
}

function isHead(emp: OrgEmployee, all: OrgEmployee[]) {
  const role = String(emp.special_role ?? "").toLowerCase()
  if (role.includes("head") || role.includes("director") || role.includes("ceo") || role.includes("chief")) {
    return true
  }
  return all.some((other) => other.head_of_department === emp.id)
}

function isSupervisor(emp: OrgEmployee, all: OrgEmployee[]) {
  const role = String(emp.special_role ?? "").toLowerCase()
  if (role.includes("supervisor") || role.includes("manager") || role.includes("lead")) return true
  return all.some((other) => other.direct_supervisor === emp.id)
}

function nodeType(emp: OrgEmployee, all: OrgEmployee[], isRoot: boolean): OrgNode["type"] {
  if (isRoot && (isHead(emp, all) || isSupervisor(emp, all))) return "ceo"
  if (isHead(emp, all)) return "department_head"
  if (isSupervisor(emp, all)) return "supervisor"
  return "employee"
}

function stylePalette(style: string) {
  switch (style) {
    case "classic":
      return { bg: "#faf6ef", title: "#1c1917", muted: "#78716c", edge: "#a8a29e", ceo: "#7c2d12", head: "#9a3412", sup: "#b45309", emp: "#44403c" }
    case "minimal":
      return { bg: "#ffffff", title: "#111827", muted: "#6b7280", edge: "#d1d5db", ceo: "#111827", head: "#374151", sup: "#4b5563", emp: "#6b7280" }
    case "corporate":
      return { bg: "#f1f5f9", title: "#0f172a", muted: "#64748b", edge: "#94a3b8", ceo: "#1e3a8a", head: "#1d4ed8", sup: "#2563eb", emp: "#475569" }
    default:
      return { bg: "#f8fafc", title: "#0f172a", muted: "#64748b", edge: "#94a3b8", ceo: "#065f46", head: "#0f766e", sup: "#0891b2", emp: "#334155" }
  }
}

/** Hierarchical layout driven by reporting edges. */
function layoutHierarchy(filtered: OrgEmployee[], edges: OrgEdge[]) {
  const ids = new Set(filtered.map((e) => e.id))
  const children = new Map<string, string[]>()
  const hasParent = new Set<string>()

  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) continue
    if (!children.has(edge.source)) children.set(edge.source, [])
    children.get(edge.source)!.push(edge.target)
    hasParent.add(edge.target)
  }

  const roots = filtered.filter((e) => !hasParent.has(e.id)).sort((a, b) => {
    const score = (e: OrgEmployee) => (isHead(e, filtered) ? 0 : 2) + (isSupervisor(e, filtered) ? 0 : 1)
    return score(a) - score(b) || displayName(a).localeCompare(displayName(b))
  })

  const positions = new Map<string, { x: number; y: number; level: number }>()
  let nextLeafX = 0

  const place = (id: string, level: number): number => {
    const kids = (children.get(id) ?? []).filter((k) => ids.has(k))
    if (kids.length === 0) {
      const x = nextLeafX
      nextLeafX += 1
      positions.set(id, { x, y: level, level })
      return x
    }
    const childXs = kids.map((kid) => place(kid, level + 1))
    const x = (Math.min(...childXs) + Math.max(...childXs)) / 2
    positions.set(id, { x, y: level, level })
    return x
  }

  for (const root of roots) place(root.id, 0)

  // Orphans that somehow weren't placed
  for (const emp of filtered) {
    if (!positions.has(emp.id)) {
      positions.set(emp.id, { x: nextLeafX, y: 0, level: 0 })
      nextLeafX += 1
    }
  }

  return positions
}

function layoutByDepartment(filtered: OrgEmployee[]) {
  const byDept = new Map<string, OrgEmployee[]>()
  for (const emp of filtered) {
    const dept = emp.department || "General"
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(emp)
  }

  const departments = Array.from(byDept.keys()).sort()
  const positions = new Map<string, { x: number; y: number; level: number }>()
  departments.forEach((dept, col) => {
    const members = [...(byDept.get(dept) || [])].sort((a, b) => {
      const score = (e: OrgEmployee) => (isHead(e, filtered) ? 0 : 2) + (isSupervisor(e, filtered) ? 0 : 1)
      return score(a) - score(b)
    })
    members.forEach((emp, row) => {
      positions.set(emp.id, { x: col, y: row, level: row })
    })
  })
  return { positions, columns: Math.max(1, departments.length) }
}

/** Build org chart nodes/edges from employees. */
export function buildOrgChartData(
  employees: OrgEmployee[],
  options: { chartType?: string; chartStyle?: string; scope?: "all" | "parent" | string } = {},
): OrgChartData {
  const chartType = options.chartType || "hierarchical"
  const chartStyle = options.chartStyle || "modern"
  const scope = options.scope || "all"

  let filtered = employees
  if (scope === "parent") {
    filtered = employees.filter((e) => !e.subsidiary_id)
  } else if (scope && scope !== "all") {
    filtered = employees.filter((e) => e.subsidiary_id === scope)
  }

  const edges: OrgEdge[] = []
  for (const emp of filtered) {
    if (emp.direct_supervisor && filtered.some((e) => e.id === emp.direct_supervisor)) {
      edges.push({
        id: `${emp.direct_supervisor}->${emp.id}`,
        source: emp.direct_supervisor,
        target: emp.id,
        relation: "reports_to",
      })
    } else if (
      emp.head_of_department &&
      emp.head_of_department !== emp.id &&
      filtered.some((e) => e.id === emp.head_of_department)
    ) {
      edges.push({
        id: `${emp.head_of_department}->${emp.id}:hod`,
        source: emp.head_of_department,
        target: emp.id,
        relation: "department_head",
      })
    }
  }

  const useHierarchy = chartType === "hierarchical" || chartType === "matrix"
  let positions: Map<string, { x: number; y: number; level: number }>
  let columns: number

  if (useHierarchy && edges.length > 0) {
    positions = layoutHierarchy(filtered, edges)
    const xs = Array.from(positions.values()).map((p) => p.x)
    columns = Math.max(1, Math.ceil(Math.max(...xs, 0) + 1))
  } else {
    const deptLayout = layoutByDepartment(filtered)
    positions = deptLayout.positions
    columns = deptLayout.columns
  }

  const roots = new Set(
    filtered
      .filter((e) => !edges.some((edge) => edge.target === e.id))
      .map((e) => e.id),
  )

  const nodes: OrgNode[] = filtered.map((emp) => {
    const pos = positions.get(emp.id) || { x: 0, y: 0, level: 0 }
    return {
      id: emp.id,
      type: nodeType(emp, filtered, roots.has(emp.id)),
      label: displayName(emp),
      position: emp.position || "",
      department: emp.department || "General",
      employeeCode: emp.employee_id || "",
      x: pos.x * COL_WIDTH,
      y: pos.y * ROW_HEIGHT,
      level: pos.level,
    }
  })

  const maxX = Math.max(0, ...nodes.map((n) => n.x))
  const maxY = Math.max(0, ...nodes.map((n) => n.y))
  const rows = Math.max(1, ...nodes.map((n) => n.level + 1), 1)

  return {
    type: chartType,
    style: chartStyle,
    scope,
    nodes,
    edges,
    layout: {
      columns,
      rows,
      width: Math.max(640, maxX + COL_WIDTH + 40),
      height: Math.max(360, maxY + ROW_HEIGHT + 80),
    },
    generated_at: new Date().toISOString(),
  }
}

export function buildPreviewSvg(data: OrgChartData, title: string) {
  const palette = stylePalette(data.style)
  const width = data.layout.width || Math.max(640, data.layout.columns * COL_WIDTH)
  const height = data.layout.height || Math.max(360, data.layout.rows * ROW_HEIGHT + 80)
  const byId = new Map(data.nodes.map((n) => [n.id, n]))

  const edgeLines = data.edges
    .map((edge) => {
      const source = byId.get(edge.source)
      const target = byId.get(edge.target)
      if (!source || !target) return ""
      const x1 = source.x + 110
      const y1 = source.y + 50 + 70
      const x2 = target.x + 110
      const y2 = target.y + 50
      const midY = (y1 + y2) / 2
      const dash = edge.relation === "department_head" ? ' stroke-dasharray="4 3"' : ""
      return `<path d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}" fill="none" stroke="${palette.edge}" stroke-width="1.5"${dash}/>`
    })
    .join("")

  const nodeRects = data.nodes
    .map((n) => {
      const fill =
        n.type === "ceo"
          ? palette.ceo
          : n.type === "department_head"
            ? palette.head
            : n.type === "supervisor"
              ? palette.sup
              : palette.emp
      return `<g transform="translate(${n.x + 20},${n.y + 50})">
  <rect width="180" height="70" rx="8" fill="${fill}"/>
  <text x="90" y="28" text-anchor="middle" fill="#fff" font-size="12" font-family="Arial,sans-serif">${escapeXml(n.label.slice(0, 22))}</text>
  <text x="90" y="48" text-anchor="middle" fill="#e2e8f0" font-size="10" font-family="Arial,sans-serif">${escapeXml((n.position || n.department).slice(0, 24))}</text>
</g>`
    })
    .join("")

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${palette.bg}"/>
  <text x="24" y="32" fill="${palette.title}" font-size="18" font-family="Arial,sans-serif" font-weight="700">${escapeXml(title)}</text>
  <text x="24" y="52" fill="${palette.muted}" font-size="12" font-family="Arial,sans-serif">${data.nodes.length} people · ${data.edges.length} reporting lines · ${escapeXml(data.style)}</text>
  ${edgeLines}
  ${nodeRects}
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function hashEmployeeSet(employees: OrgEmployee[]) {
  const ids = employees
    .map(
      (e) =>
        `${e.id}:${e.direct_supervisor ?? ""}:${e.head_of_department ?? ""}:${e.department ?? ""}:${e.position ?? ""}:${e.subsidiary_id ?? ""}`,
    )
    .sort()
  let h = 0
  const str = ids.join("|")
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return `h${Math.abs(h)}`
}
