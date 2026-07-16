/**
 * In-memory demo database used when Supabase env vars are missing.
 * Lets Process / Approvals / Reports / Export work end-to-end in local & cloud agents.
 */

export type DemoRow = Record<string, any>

type DemoDb = {
  companies: DemoRow[]
  employees: DemoRow[]
  employee_financial: DemoRow[]
  employee_loans: DemoRow[]
  employee_allowances: DemoRow[]
  employee_deductions: DemoRow[]
  payroll_pay_inputs: DemoRow[]
  payroll_runs: DemoRow[]
  payroll_items: DemoRow[]
  payslips: DemoRow[]
  compliance_reports: DemoRow[]
}

declare global {
  // eslint-disable-next-line no-var
  var __akwaabaDemoDb: DemoDb | undefined
}

const DEMO_COMPANY_ID = "11111111-1111-1111-1111-111111111111"

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

function seedDb(): DemoDb {
  const companyId = DEMO_COMPANY_ID
  const employees = [
    {
      id: "e-1001",
      company_id: companyId,
      employee_id: "EMP001",
      first_name: "Ama",
      last_name: "Mensah",
      preferred_name: "Ama Mensah",
      department: "Finance",
      position: "Accountant",
      status: "Active",
      hire_date: "2022-03-01",
      ssnit_number: "C12345678901",
      ghana_card_number: "GHA-123456789-1",
    },
    {
      id: "e-1002",
      company_id: companyId,
      employee_id: "EMP002",
      first_name: "Kojo",
      last_name: "Owusu",
      preferred_name: "Kojo Owusu",
      department: "Operations",
      position: "Supervisor",
      status: "Active",
      hire_date: "2021-07-15",
      ssnit_number: "C22345678901",
      ghana_card_number: "GHA-223456789-2",
    },
    {
      id: "e-1003",
      company_id: companyId,
      employee_id: "EMP003",
      first_name: "Efua",
      last_name: "Boateng",
      preferred_name: "Efua Boateng",
      department: "HR",
      position: "HR Officer",
      status: "Active",
      hire_date: "2023-01-10",
      ssnit_number: "C32345678901",
      ghana_card_number: "GHA-323456789-3",
    },
  ]

  const financial = employees.map((e, i) => ({
    id: `fin-${e.id}`,
    employee_id: e.id,
    company_id: companyId,
    monthly_salary: [4500, 3800, 3200][i],
    transport_allowance: [200, 150, 100][i],
    housing_allowance: [300, 200, 150][i],
    medical_allowance: 50,
    meal_allowance: 80,
    communication_allowance: 40,
    uniform_allowance: 0,
    other_allowances: 0,
    tier2_employee_contribution: 0,
    tier2_employer_contribution: 0,
    tier3_contribution: 0,
    provident_fund_enrolled: i === 0,
    provident_fund_rate: i === 0 ? 5 : 0,
    bank_name: ["GCB Bank", "Ecobank", "Absa"][i],
    bank_account_number: [`00${i + 1}2345678`, `00${i + 2}3456789`, `00${i + 3}4567890`][i],
    ssnit_number: e.ssnit_number,
  }))

  return {
    companies: [
      {
        id: companyId,
        name: "Akwaaba Demo Company Ltd",
        address: "Accra, Ghana",
        phone: "+233 30 000 0000",
        email: "hr@akwaaba-demo.gh",
        tin: "C0000000001",
        ssnit_employer_number: "E000000001",
      },
    ],
    employees,
    employee_financial: financial,
    employee_loans: [
      {
        id: "loan-1",
        company_id: companyId,
        employee_id: "e-1002",
        monthly_payment: 150,
        remaining_balance: 1800,
        amount_paid: 200,
        status: "active",
        auto_deduct: true,
        created_at: new Date().toISOString(),
      },
    ],
    employee_allowances: [],
    employee_deductions: [],
    payroll_pay_inputs: [],
    payroll_runs: [],
    payroll_items: [],
    payslips: [],
    compliance_reports: [],
  }
}

export function getDemoDb(): DemoDb {
  if (!globalThis.__akwaabaDemoDb) {
    globalThis.__akwaabaDemoDb = seedDb()
  }
  return globalThis.__akwaabaDemoDb
}

export function resetDemoDb() {
  globalThis.__akwaabaDemoDb = seedDb()
}

export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export { DEMO_COMPANY_ID, uid }

type Filter =
  | { type: "eq"; col: string; val: unknown }
  | { type: "neq"; col: string; val: unknown }
  | { type: "in"; col: string; val: unknown[] }
  | { type: "gte"; col: string; val: unknown }
  | { type: "lte"; col: string; val: unknown }
  | { type: "gt"; col: string; val: unknown }
  | { type: "lt"; col: string; val: unknown }

function applyFilters(rows: DemoRow[], filters: Filter[]): DemoRow[] {
  return rows.filter((row) =>
    filters.every((f) => {
      const v = row[f.col]
      switch (f.type) {
        case "eq":
          return v === f.val
        case "neq":
          return v !== f.val
        case "in":
          return f.val.includes(v)
        case "gte":
          return v >= (f.val as any)
        case "lte":
          return v <= (f.val as any)
        case "gt":
          return v > (f.val as any)
        case "lt":
          return v < (f.val as any)
        default:
          return true
      }
    }),
  )
}

function parseEmbeds(select: string): { embed: string; table: string }[] {
  const embeds: { embed: string; table: string }[] = []
  const re = /(\w+)\s*:\s*(\w+)\s*\(/g
  let m: RegExpExecArray | null
  while ((m = re.exec(select))) {
    embeds.push({ embed: m[1], table: m[2] })
  }
  return embeds
}

function attachEmbeds(db: DemoDb, table: string, rows: DemoRow[], select: string): DemoRow[] {
  const embeds = parseEmbeds(select)
  if (!embeds.length) return rows

  return rows.map((row) => {
    const out = { ...row }
    for (const { embed, table: childTable } of embeds) {
      const child = (db as any)[childTable] as DemoRow[] | undefined
      if (!child) {
        out[embed] = null
        continue
      }
      if (childTable === "employee_financial" || embed === "financial") {
        const match = child.filter((c) => c.employee_id === row.id || c.employee_id === row.employee_id)
        out[embed] = match[0] ?? null
      } else if (childTable === "employees" || embed === "employee") {
        const match = child.filter((c) => c.id === row.employee_id)
        out[embed] = match[0] ?? null
      } else if (childTable === "companies" || embed === "company") {
        const match = child.filter((c) => c.id === row.company_id)
        out[embed] = match[0] ?? null
      } else {
        out[embed] = child.filter((c) => c.employee_id === row.id || c.company_id === row.company_id)
      }
    }
    return out
  })
}

export function createMemoryQueryBuilder(table: string) {
  const db = getDemoDb()
  if (!(table in db)) {
    ;(db as any)[table] = []
  }

  const state: {
    op: "select" | "insert" | "update" | "upsert" | "delete"
    select: string
    filters: Filter[]
    orderBy?: { col: string; ascending: boolean }
    limitN?: number
    payload?: DemoRow | DemoRow[]
    single: boolean
    maybeSingle: boolean
    countExact: boolean
    onConflict?: string
  } = {
    op: "select",
    select: "*",
    filters: [],
    single: false,
    maybeSingle: false,
    countExact: false,
  }

  const execute = (): { data: any; error: any; count: number | null } => {
    try {
      const store: DemoRow[] = (db as any)[table] ?? []

      if (state.op === "select") {
        let rows = applyFilters(store, state.filters)
        if (state.orderBy) {
          const { col, ascending } = state.orderBy
          rows = [...rows].sort((a, b) => {
            if (a[col] === b[col]) return 0
            if (a[col] == null) return 1
            if (b[col] == null) return -1
            return (a[col] > b[col] ? 1 : -1) * (ascending ? 1 : -1)
          })
        }
        if (state.limitN != null) rows = rows.slice(0, state.limitN)
        rows = attachEmbeds(db, table, rows, state.select)
        if (state.single || state.maybeSingle) {
          if (!rows.length) {
            return state.maybeSingle
              ? { data: null, error: null, count: null }
              : { data: null, error: { message: "No rows found" }, count: null }
          }
          return { data: rows[0], error: null, count: null }
        }
        return { data: rows, error: null, count: state.countExact ? rows.length : null }
      }

      if (state.op === "insert") {
        const rows = Array.isArray(state.payload) ? state.payload : [state.payload!]
        const inserted = rows.map((r) => {
          const row = {
            id: r.id || uid(table.slice(0, 3)),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...r,
          }
          store.push(row)
          return row
        })
        if (state.single || state.maybeSingle) {
          return { data: inserted[0], error: null, count: inserted.length }
        }
        return { data: inserted, error: null, count: inserted.length }
      }

      if (state.op === "update") {
        const matched = applyFilters(store, state.filters)
        for (const row of matched) {
          Object.assign(row, state.payload, { updated_at: new Date().toISOString() })
        }
        const data = attachEmbeds(db, table, matched, state.select)
        if (state.single || state.maybeSingle) {
          return { data: data[0] ?? null, error: data[0] ? null : { message: "No rows found" }, count: matched.length }
        }
        return { data, error: null, count: matched.length }
      }

      if (state.op === "upsert") {
        const rows = Array.isArray(state.payload) ? state.payload : [state.payload!]
        const conflictKeys = (state.onConflict || "id").split(",").map((s) => s.trim())
        const upserted: DemoRow[] = []
        for (const r of rows) {
          const idx = store.findIndex((existing) =>
            conflictKeys.every((k) => existing[k] != null && existing[k] === r[k]),
          )
          if (idx >= 0) {
            store[idx] = { ...store[idx], ...r, updated_at: new Date().toISOString() }
            upserted.push(store[idx])
          } else {
            const row = {
              id: r.id || uid(table.slice(0, 3)),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...r,
            }
            store.push(row)
            upserted.push(row)
          }
        }
        if (state.single || state.maybeSingle) {
          return { data: upserted[0], error: null, count: upserted.length }
        }
        return { data: upserted, error: null, count: upserted.length }
      }

      if (state.op === "delete") {
        const matched = applyFilters(store, state.filters)
        const ids = new Set(matched.map((r) => r.id))
        ;(db as any)[table] = store.filter((r) => !ids.has(r.id))
        return { data: matched, error: null, count: matched.length }
      }

      return { data: null, error: null, count: null }
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "memory db error" },
        count: null,
      }
    }
  }

  const builder: any = {
    select(columns = "*", opts?: { count?: string }) {
      state.select = columns
      if (opts?.count === "exact") state.countExact = true
      return builder
    },
    insert(payload: DemoRow | DemoRow[]) {
      state.op = "insert"
      state.payload = payload
      return builder
    },
    update(payload: DemoRow, opts?: { count?: string }) {
      state.op = "update"
      state.payload = payload
      if (opts?.count === "exact") state.countExact = true
      return builder
    },
    upsert(payload: DemoRow | DemoRow[], opts?: { onConflict?: string }) {
      state.op = "upsert"
      state.payload = payload
      state.onConflict = opts?.onConflict
      return builder
    },
    delete() {
      state.op = "delete"
      return builder
    },
    eq(col: string, val: unknown) {
      state.filters.push({ type: "eq", col, val })
      return builder
    },
    neq(col: string, val: unknown) {
      state.filters.push({ type: "neq", col, val })
      return builder
    },
    in(col: string, val: unknown[]) {
      state.filters.push({ type: "in", col, val })
      return builder
    },
    gte(col: string, val: unknown) {
      state.filters.push({ type: "gte", col, val })
      return builder
    },
    lte(col: string, val: unknown) {
      state.filters.push({ type: "lte", col, val })
      return builder
    },
    gt(col: string, val: unknown) {
      state.filters.push({ type: "gt", col, val })
      return builder
    },
    lt(col: string, val: unknown) {
      state.filters.push({ type: "lt", col, val })
      return builder
    },
    like() {
      return builder
    },
    ilike() {
      return builder
    },
    is(col: string, val: unknown) {
      state.filters.push({ type: "eq", col, val })
      return builder
    },
    contains() {
      return builder
    },
    order(col: string, opts?: { ascending?: boolean }) {
      state.orderBy = { col, ascending: opts?.ascending !== false }
      return builder
    },
    limit(n: number) {
      state.limitN = n
      return builder
    },
    range() {
      return builder
    },
    single() {
      state.single = true
      return execute()
    },
    maybeSingle() {
      state.maybeSingle = true
      return execute()
    },
    then(resolve: (value: any) => unknown, reject?: (reason: any) => unknown) {
      return Promise.resolve(execute()).then(resolve, reject)
    },
  }

  return builder
}
