import { NextRequest, NextResponse } from "next/server"
import { getLoanTypes, createLoanType } from "@/lib/services/loan-advanced-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get("company_id")

    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 })
    }

    const loanTypes = await getLoanTypes(companyId)
    return NextResponse.json(loanTypes)
  } catch (error) {
    console.error("[v0] Loan types error:", error)
    return NextResponse.json({ error: "Failed to fetch loan types" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const loanType = await createLoanType(body.company_id, {
      ...body,
      created_by: user.id,
    })

    return NextResponse.json(loanType, { status: 201 })
  } catch (error) {
    console.error("[v0] Create loan type error:", error)
    return NextResponse.json({ error: "Failed to create loan type" }, { status: 500 })
  }
}
