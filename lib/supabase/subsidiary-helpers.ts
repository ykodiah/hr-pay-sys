import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface Subsidiary {
  id: string
  name: string
  tax_id: string
  ssnit_number: string
  address: string
  phone_number: string
  email_address: string
  divisions: string[]
  departments: string[]
  locations: string[]
  status: "active" | "inactive"
  company_id: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface SubsidiaryOption {
  id: string
  name: string
  divisions: string[]
  departments: string[]
  locations: string[]
}

// Get all active subsidiaries
export async function getActiveSubsidiaries(): Promise<Subsidiary[]> {
  const { data, error } = await supabase.from("active_subsidiaries").select("*").order("name")

  if (error) {
    console.error("[v0] Error fetching active subsidiaries:", error)
    return []
  }

  return data || []
}

// Get subsidiary options for dropdowns
export async function getSubsidiaryOptions(): Promise<SubsidiaryOption[]> {
  const { data, error } = await supabase.rpc("get_subsidiary_options")

  if (error) {
    console.error("[v0] Error fetching subsidiary options:", error)
    return []
  }

  return data || []
}

// Get subsidiary by ID
export async function getSubsidiaryById(id: string): Promise<Subsidiary | null> {
  const { data, error } = await supabase.from("subsidiaries").select("*").eq("id", id).eq("status", "active").single()

  if (error) {
    console.error("[v0] Error fetching subsidiary:", error)
    return null
  }

  return data
}

// Get divisions for a subsidiary
export async function getSubsidiaryDivisions(subsidiaryId: string): Promise<string[]> {
  const subsidiary = await getSubsidiaryById(subsidiaryId)
  return subsidiary?.divisions || []
}

// Get departments for a subsidiary
export async function getSubsidiaryDepartments(subsidiaryId: string): Promise<string[]> {
  const subsidiary = await getSubsidiaryById(subsidiaryId)
  return subsidiary?.departments || []
}

// Get locations for a subsidiary
export async function getSubsidiaryLocations(subsidiaryId: string): Promise<string[]> {
  const subsidiary = await getSubsidiaryById(subsidiaryId)
  return subsidiary?.locations || []
}

// Get company data with subsidiaries
export async function getCompanyWithSubsidiaries(companyId: string) {
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single()

  if (companyError) {
    console.error("[v0] Error fetching company:", companyError)
    return null
  }

  const { data: subsidiaries, error: subsidiariesError } = await supabase
    .from("subsidiaries")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("name")

  if (subsidiariesError) {
    console.error("[v0] Error fetching subsidiaries:", subsidiariesError)
    return { ...company, subsidiaries: [] }
  }

  return { ...company, subsidiaries: subsidiaries || [] }
}
