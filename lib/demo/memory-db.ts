/**
 * In-memory demo database used when Supabase env vars are missing.
 * Lets Process / Approvals / Reports / Export work end-to-end in local & cloud agents.
 */

export type DemoRow = Record<string, any>

type DemoDb = {
  companies: DemoRow[]
  employees: DemoRow[]
  employee_financial: DemoRow[]
  loan_types: DemoRow[]
  employee_loans: DemoRow[]
  loan_amortization_schedule: DemoRow[]
  payroll_loan_payments: DemoRow[]
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
    loan_types: [
      {
        id: "lt-personal",
        company_id: companyId,
        code: "PERSONAL",
        name: "Personal Loan",
        description: "General purpose staff loan",
        interest_type: "reducing_balance",
        annual_interest_rate: 10,
        min_amount: 100,
        max_amount: 20000,
        min_tenure_months: 3,
        max_tenure_months: 24,
        default_tenure_months: 12,
        processing_fee_type: "fixed",
        processing_fee_amount: 50,
        insurance_fee_type: "percentage",
        insurance_fee_amount: 1,
        admin_fee_type: "fixed",
        admin_fee_amount: 0,
        requires_approval: true,
        auto_approve_max_amount: 500,
        approval_roles: ["admin", "finance_manager"],
        min_service_months: 3,
        min_monthly_salary: 0,
        max_loan_multiplier: 3,
        is_active: true,
        created_by: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "lt-advance",
        company_id: companyId,
        code: "SALARY_ADVANCE",
        name: "Salary Advance",
        description: "Short-term advance against salary",
        interest_type: "fixed",
        annual_interest_rate: 0,
        min_amount: 50,
        max_amount: 5000,
        min_tenure_months: 1,
        max_tenure_months: 6,
        default_tenure_months: 3,
        processing_fee_type: "fixed",
        processing_fee_amount: 0,
        insurance_fee_type: "fixed",
        insurance_fee_amount: 0,
        admin_fee_type: "fixed",
        admin_fee_amount: 0,
        requires_approval: true,
        auto_approve_max_amount: 1000,
        approval_roles: ["admin"],
        min_service_months: 1,
        min_monthly_salary: 0,
        max_loan_multiplier: 1,
        is_active: true,
        created_by: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "lt-emergency",
        company_id: companyId,
        code: "EMERGENCY",
        name: "Emergency Loan",
        description: "Urgent staff support loan",
        interest_type: "reducing_balance",
        annual_interest_rate: 5,
        min_amount: 100,
        max_amount: 10000,
        min_tenure_months: 2,
        max_tenure_months: 12,
        default_tenure_months: 6,
        processing_fee_type: "fixed",
        processing_fee_amount: 25,
        insurance_fee_type: "fixed",
        insurance_fee_amount: 0,
        admin_fee_type: "fixed",
        admin_fee_amount: 0,
        requires_approval: true,
        auto_approve_max_amount: 0,
        approval_roles: ["admin", "finance_manager"],
        min_service_months: 0,
        min_monthly_salary: 0,
        max_loan_multiplier: 2,
        is_active: true,
        created_by: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    employee_loans: [
      {
        id: "loan-1",
        company_id: companyId,
        employee_id: "e-1002",
        loan_type_id: "lt-advance",
        loan_type: "Salary Advance",
        purpose: "School fees",
        principal: 2000,
        interest_rate: 0,
        repayment_months: 12,
        monthly_payment: 150,
        remaining_balance: 1800,
        amount_paid: 200,
        expected_total_payment: 2000,
        total_interest: 0,
        last_payment_date: "2026-02-01",
        last_payment_amount: 150,
        start_date: "2026-01-01",
        end_date: "2026-12-01",
        status: "active",
        auto_deduct: true,
        notes: "Demo active loan",
        approved_by: "demo-user",
        approved_at: new Date().toISOString(),
        disbursed_at: new Date().toISOString(),
        created_by: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "loan-2",
        company_id: companyId,
        employee_id: "e-1001",
        loan_type_id: "lt-personal",
        loan_type: "Personal Loan",
        purpose: "Medical expenses",
        principal: 1500,
        interest_rate: 5,
        repayment_months: 6,
        monthly_payment: 254.56,
        remaining_balance: 1500,
        amount_paid: 0,
        expected_total_payment: 1527.36,
        total_interest: 27.36,
        start_date: "2026-08-01",
        end_date: "2027-01-01",
        status: "pending",
        auto_deduct: true,
        notes: "Awaiting HR approval",
        created_by: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "loan-3",
        company_id: companyId,
        employee_id: "e-1002",
        loan_type_id: "lt-emergency",
        loan_type: "Emergency Loan",
        purpose: "Second active loan for multi-loan employee",
        principal: 600,
        interest_rate: 5,
        repayment_months: 3,
        monthly_payment: 203.39,
        remaining_balance: 600,
        amount_paid: 0,
        expected_total_payment: 610.17,
        total_interest: 10.17,
        start_date: "2026-08-01",
        end_date: "2026-11-01",
        status: "active",
        auto_deduct: true,
        notes: "Demo second loan",
        approved_by: "demo-user",
        approved_at: new Date().toISOString(),
        disbursed_at: new Date().toISOString(),
        created_by: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    payroll_loan_payments: [],
    loan_amortization_schedule: [
      {
        id: "las-1",
        loan_id: "loan-1",
        month_number: 1,
        due_date: "2026-02-01",
        payment_amount: 150,
        principal_portion: 150,
        interest_portion: 0,
        balance_remaining: 1850,
        paid_amount: 150,
        paid_date: "2026-02-01",
        status: "paid",
        payslip_id: null,
      },
      {
        id: "las-2",
        loan_id: "loan-1",
        month_number: 2,
        due_date: "2026-03-01",
        payment_amount: 150,
        principal_portion: 150,
        interest_portion: 0,
        balance_remaining: 1700,
        paid_amount: 0,
        paid_date: null,
        status: "pending",
        payslip_id: null,
      },
      {
        id: "las-3a",
        loan_id: "loan-3",
        month_number: 1,
        due_date: "2026-09-01",
        payment_amount: 203.39,
        principal_portion: 200.89,
        interest_portion: 2.5,
        balance_remaining: 399.11,
        paid_amount: 0,
        paid_date: null,
        status: "pending",
        payslip_id: null,
      },
      {
        id: "las-3b",
        loan_id: "loan-3",
        month_number: 2,
        due_date: "2026-10-01",
        payment_amount: 203.39,
        principal_portion: 201.73,
        interest_portion: 1.66,
        balance_remaining: 197.38,
        paid_amount: 0,
        paid_date: null,
        status: "pending",
        payslip_id: null,
      },
      {
        id: "las-3c",
        loan_id: "loan-3",
        month_number: 3,
        due_date: "2026-11-01",
        payment_amount: 198.2,
        principal_portion: 197.38,
        interest_portion: 0.82,
        balance_remaining: 0,
        paid_amount: 0,
        paid_date: null,
        status: "pending",
        payslip_id: null,
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
  | { type: "ilike"; col: string; val: unknown }
  | { type: "like"; col: string; val: unknown }

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
        case "ilike":
        case "like": {
          const pattern = String(f.val ?? "")
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/%/g, ".*")
            .replace(/_/g, ".")
          const re = new RegExp(`^${pattern}$`, f.type === "ilike" ? "i" : undefined)
          return re.test(String(v ?? ""))
        }
        default:
          return true
      }
    }),
  )
}

function parseEmbeds(select: string): { embed: string; table: string }[] {
  const embeds: { embed: string; table: string }[] = []
  // Supports: employees(...), employees!fk_name(...), alias:employees(...)
  const re = /(?:(\w+)\s*:\s*)?(\w+)(?:!\w+)?\s*\(/g
  let m: RegExpExecArray | null
  while ((m = re.exec(select))) {
    const alias = m[1]
    const table = m[2]
    if (!table || table === "count") continue
    embeds.push({ embed: alias || table, table })
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
    like(col: string, val: unknown) {
      state.filters.push({ type: "like", col, val })
      return builder
    },
    ilike(col: string, val: unknown) {
      state.filters.push({ type: "ilike", col, val })
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
