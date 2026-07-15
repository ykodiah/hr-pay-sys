import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface ImportRow {
  first_name: string
  last_name: string
  email: string
  employee_id?: string
  department?: string
  position?: string
  basic_salary?: string | number
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

  if (!row.first_name?.trim())
    errors.push({ row: rowIndex, field: "first_name", message: "First name is required" })

  if (!row.last_name?.trim())
    errors.push({ row: rowIndex, field: "last_name", message: "Last name is required" })

  if (!row.email?.trim()) {
    errors.push({ row: rowIndex, field: "email", message: "Email is required" })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push({ row: rowIndex, field: "email", message: "Invalid email format" })
  }

  if (row.basic_salary && Number(row.basic_salary) <= 0) {
    errors.push({ row: rowIndex, field: "basic_salary", message: "Salary must be greater than 0" })
  }

  return errors
}

/** Parse simple CSV text into rows. */
function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: any = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? "" })
    return row as ImportRow
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const file       = formData.get("file") as File | null
    const company_id = formData.get("company_id") as string | null
    const preview    = formData.get("preview") === "true"

    if (!file || !company_id) {
      return NextResponse.json({ error: "file and company_id are required" }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 })
    }

    // Validate all rows
    const allErrors: ImportError[] = []
    rows.forEach((row, i) => {
      const errs = validateRow(row, i + 2) // +2 because row 1 = header
      allErrors.push(...errs)
    })

    // Preview mode: return validation results without importing
    if (preview) {
      return NextResponse.json({
        total_rows:   rows.length,
        valid_rows:   rows.length - new Set(allErrors.map((e) => e.row)).size,
        error_rows:   new Set(allErrors.map((e) => e.row)).size,
        errors:       allErrors,
        sample:       rows.slice(0, 5),
      })
    }

    // Check for duplicate emails in DB
    const emails = rows.map((r) => r.email).filter(Boolean)
    const { data: existing } = await supabase
      .from("employees")
      .select("personal_email, corporate_email")
      .or(emails.map((e) => `personal_email.eq.${e}`).join(","))

    const existingEmails = new Set(
      (existing ?? []).flatMap((e: any) => [e.personal_email, e.corporate_email].filter(Boolean))
    )

    // Log the import
    const { data: importLog } = await supabase
      .from("employee_import_log")
      .insert({
        company_id,
        imported_by: user.id,
        filename:    file.name,
        total_rows:  rows.length,
        status:      "processing",
      })
      .select()
      .single()

    const importId    = importLog?.id
    const successIds: string[] = []
    const importErrors: ImportError[] = [...allErrors]

    // Only insert rows that passed validation and don't duplicate
    for (let i = 0; i < rows.length; i++) {
      const row     = rows[i]
      const rowNum  = i + 2
      const rowErrs = allErrors.filter((e) => e.row === rowNum)
      if (rowErrs.length > 0) continue

      if (existingEmails.has(row.email)) {
        importErrors.push({ row: rowNum, field: "email", message: `Email already exists: ${row.email}` })
        continue
      }

      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .insert({
          company_id,
          first_name:      row.first_name.trim(),
          last_name:       row.last_name.trim(),
          full_name:       `${row.first_name.trim()} ${row.last_name.trim()}`,
          display_name:    `${row.first_name.trim()} ${row.last_name.trim()}`,
          personal_email:  row.email.trim().toLowerCase(),
          employee_id:     row.employee_id?.trim() || null,
          department:      row.department?.trim()  || null,
          position:        row.position?.trim()    || null,
          phone:           row.phone?.trim()       || null,
          ghana_card_number: row.ghana_card_number?.trim() || null,
          date_of_joining: row.date_of_joining     || null,
          status:          "Active",
        })
        .select("id")
        .single()

      if (empErr) {
        importErrors.push({ row: rowNum, field: "general", message: empErr.message })
        continue
      }

      successIds.push(emp.id)
      existingEmails.add(row.email)

      // Insert financial record if salary present
      if (row.basic_salary && Number(row.basic_salary) > 0) {
        await supabase.from("employee_financial").insert({
          employee_id:   emp.id,
          basic_salary:  Number(row.basic_salary),
        })
      }
    }

    // Update import log
    if (importId) {
      await supabase
        .from("employee_import_log")
        .update({
          success_rows:  successIds.length,
          error_rows:    importErrors.length,
          status:        "completed",
          error_details: importErrors,
          created_rows:  successIds,
          completed_at:  new Date().toISOString(),
        })
        .eq("id", importId)
    }

    return NextResponse.json({
      import_id:    importId,
      total_rows:   rows.length,
      success_rows: successIds.length,
      error_rows:   new Set(importErrors.map((e) => e.row)).size,
      errors:       importErrors,
      created_ids:  successIds,
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
