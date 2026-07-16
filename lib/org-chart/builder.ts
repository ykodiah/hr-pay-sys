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
  nodes: OrgNode[]
  edges: OrgEdge[]
  layout: { columns: number; rows: number }
  generated_at: string
}

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
  // Referenced as someone else's head_of_department
  return all.some((other) => other.head_of_department === emp.id)
}

function isSupervisor(emp: OrgEmployee, all: OrgEmployee[]) {
  const role = String(emp.special_role ?? "").toLowerCase()
  if (role.includes("supervisor") || role.includes("manager") || role.includes("lead")) return true
  return all.some((other) => other.direct_supervisor === emp.id)
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

  const nodes: OrgNode[] = []
  const edges: OrgEdge[] = []
  const byDept = new Map<string, OrgEmployee[]>()

  for (const emp of filtered) {
    const dept = emp.department || "General"
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(emp)
  }

  const departments = Array.from(byDept.keys()).sort()
  const colWidth = 220
  const rowHeight = 110
  let col = 0

  for (const dept of departments) {
    const members = byDept.get(dept) || []
    // Heads first, then supervisors, then others
    const sorted = [...members].sort((a, b) => {
      const score = (e: OrgEmployee) =>
        (isHead(e, filtered) ? 0 : 2) + (isSupervisor(e, filtered) ? 0 : 1)
      return score(a) - score(b)
    })

    sorted.forEach((emp, row) => {
      let type: OrgNode["type"] = "employee"
      if (isHead(emp, filtered)) type = row === 0 && col === 0 ? "ceo" : "department_head"
      else if (isSupervisor(emp, filtered)) type = "supervisor"

      nodes.push({
        id: emp.id,
        type,
        label: displayName(emp),
        position: emp.position || "",
        department: dept,
        employeeCode: emp.employee_id || "",
        x: col * colWidth,
        y: row * rowHeight,
      })

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
    })

    col += 1
  }

  return {
    type: chartType,
    style: chartStyle,
    nodes,
    edges,
    layout: { columns: Math.max(1, departments.length), rows: Math.max(1, ...Array.from(byDept.values()).map((m) => m.length)) },
    generated_at: new Date().toISOString(),
  }
}

export function buildPreviewSvg(data: OrgChartData, title: string) {
  const width = Math.max(640, data.layout.columns * 220)
  const height = Math.max(360, data.layout.rows * 110 + 80)
  const nodeRects = data.nodes
    .slice(0, 40)
    .map((n) => {
      const fill =
        n.type === "ceo"
          ? "#065f46"
          : n.type === "department_head"
            ? "#0f766e"
            : n.type === "supervisor"
              ? "#0891b2"
              : "#334155"
      return `<g transform="translate(${n.x + 20},${n.y + 50})">
  <rect width="180" height="70" rx="8" fill="${fill}"/>
  <text x="90" y="28" text-anchor="middle" fill="#fff" font-size="12" font-family="Arial">${escapeXml(n.label.slice(0, 22))}</text>
  <text x="90" y="48" text-anchor="middle" fill="#d1fae5" font-size="10" font-family="Arial">${escapeXml((n.position || n.department).slice(0, 24))}</text>
</g>`
    })
    .join("")

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="24" y="32" fill="#0f172a" font-size="18" font-family="Arial" font-weight="700">${escapeXml(title)}</text>
  <text x="24" y="52" fill="#64748b" font-size="12" font-family="Arial">${data.nodes.length} people · ${data.edges.length} reporting lines · ${data.style}</text>
  ${nodeRects}
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function hashEmployeeSet(employees: OrgEmployee[]) {
  const ids = employees.map((e) => `${e.id}:${e.direct_supervisor ?? ""}:${e.department ?? ""}`).sort()
  let h = 0
  const str = ids.join("|")
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return `h${Math.abs(h)}`
}
