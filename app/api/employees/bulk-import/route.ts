import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

interface ImportRow {
  first_name: string
  last_name: string
  email?: string
  personal_email?: string
  employee_id?: string
  department?: string
  position?: string
  basic_salary?: string | number
  monthly_salary?: string | number
  date_of_joining?: string
  phone?: string
  ghana_card_number?: string
}

interface ImportError {
  row: number
  field: string
  message: string
}

function validateRow(row: ImportRow, rowIndex: number): ImportError[] {
  const errors: ImportError[] = []
  const email = row.email || row.personal_email

  if (!row.first_name?.trim())
    errors.push({ row: rowIndex, field: "first_name", message: "First name is required" })

  if (!row.last_name?.trim())
    errors.push({ row: rowIndex, field: "last_name", message: "Last name is required" })

  if (!email?.trim()) {
    errors.push({ row: rowIndex, field: "email", message: "Email is required" })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    errors.push({ row: rowIndex, field: "email", message: "Invalid email format" })
  }

  const salary = Number(row.monthly_salary ?? row.basic_salary ?? 0)
  if ((row.basic_salary != null || row.monthly_salary != null) && salary <= 0) {
    errors.push({ row: rowIndex, field: "basic_salary", message: "Salary must be greater than 0" })
  }

  return errors
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: any = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ""
    })
    return row as ImportRow
  })
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = await createClient()
    const contentType = request.headers.get("content-type") || ""

    let rows: ImportRow[] = []
    let company_id: string | null = null
    let preview = false
    let filename = "import.csv"

    if (contentType.includes("application/json")) {
      const body = await request.json()
      rows = Array.isArray(body.rows) ? body.rows : []
      company_id = body.company_id ?? null
      preview = Boolean(body.preview)
      filename = body.filename || filename
    } else {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      company_id = (formData.get("company_id") as string | null) ?? null
      preview = formData.get("preview") === "true"
      if (file) {
        filename = file.name
        rows = parseCSV(await file.text())
      }
    }

    if (!company_id) {
      const resolved = await resolveCompanyId(supabase, user.isDemo ? null : user.id)
      company_id = resolved?.companyId ?? null
    }

    if (!company_id) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }
    if (!rows.length) {
      return NextResponse.json({ error: "No data rows found" }, { status: 400 })
    }

    const allErrors: ImportError[] = []
    rows.forEach((row, i) => {
      allErrors.push(...validateRow(row, i + 2))
    })

    if (preview) {
      return NextResponse.json({
        total_rows: rows.length,
        valid_rows: rows.length - new Set(allErrors.map((e) => e.row)).size,
        error_rows: new Set(allErrors.map((e) => e.row)).size,
        errors: allErrors,
        sample: rows.slice(0, 5),
      })
    }

    const emails = rows
      .map((r) => (r.email || r.personal_email || "").toLowerCase())
      .filter(Boolean)

    const { data: existing } = await supabase
      .from("employees")
      .select("personal_email, corporate_email")
      .eq("company_id", company_id)

    const existingEmails = new Set(
      (existing ?? []).flatMap((e) =>
        [e.personal_email, e.corporate_email].filter(Boolean).map((x: string) => x.toLowerCase()),
      ),
    )

    let importId: string | null = null
    try {
      const { data: log } = await supabase
        .from("employee_import_log")
        .insert({
          company_id,
          filename,
          total_rows: rows.length,
          status: "processing",
          created_by: user.isDemo ? null : user.id,
        })
        .select("id")
        .single()
      importId = log?.id ?? null
    } catch {
      /* optional table */
    }

    const importErrors: ImportError[] = [...allErrors]
    const successIds: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      if (allErrors.some((e) => e.row === rowNum)) continue

      const email = String(row.email || row.personal_email || "")
        .trim()
        .toLowerCase()
      if (existingEmails.has(email)) {
        importErrors.push({ row: rowNum, field: "email", message: `Email already exists: ${email}` })
        continue
      }

      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .insert({
          company_id,
          first_name: row.first_name.trim(),
          last_name: row.last_name.trim(),
          full_name: `${row.first_name.trim()} ${row.last_name.trim()}`,
          display_name: `${row.first_name.trim()} ${row.last_name.trim()}`,
          personal_email: email,
          employee_id: row.employee_id?.trim() || null,
          department: row.department?.trim() || null,
          position: row.position?.trim() || null,
          phone: row.phone?.trim() || null,
          ghana_card_number: row.ghana_card_number?.trim() || null,
          date_of_joining: row.date_of_joining || null,
          status: "Active",
        })
        .select("id")
        .single()

      if (empErr) {
        importErrors.push({ row: rowNum, field: "general", message: empErr.message })
        continue
      }

      successIds.push(emp.id)
      existingEmails.add(email)

      const monthly = Number(row.monthly_salary ?? row.basic_salary ?? 0)
      if (monthly > 0) {
        await supabase.from("employee_financial").upsert(
          {
            employee_id: emp.id,
            monthly_salary: monthly,
            annual_salary: monthly * 12,
            bank_name: "Pending",
            bank_account_number: "Pending",
            ssnit_number: "Pending",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "employee_id" },
        )
      }
    }

    if (importId) {
      await supabase
        .from("employee_import_log")
        .update({
          success_rows: successIds.length,
          error_rows: importErrors.length,
          status: "completed",
          error_details: importErrors,
          created_rows: successIds,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId)
    }

    return NextResponse.json({
      success: true,
      total_rows: rows.length,
      success_rows: successIds.length,
      error_rows: importErrors.length,
      errors: importErrors,
      created_ids: successIds,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 },
    )
  }
}
