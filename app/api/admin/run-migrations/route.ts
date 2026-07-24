import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// One-time migration endpoint. Run once from browser to apply schema changes.
// POST /api/admin/run-migrations
export async function POST() {
  const supabase = createServiceClient()

  const migrations: { sql: string; description: string }[] = [
    {
      description: "Add archived_stages array to onboarding checklists",
      sql: `ALTER TABLE public.recruitment_onboarding_checklists ADD COLUMN IF NOT EXISTS archived_stages TEXT[] DEFAULT '{}'`,
    },
    {
      description: "Widen employees.position to varchar(500)",
      sql: `ALTER TABLE public.employees ALTER COLUMN position TYPE character varying(500) USING position::character varying(500)`,
    },
    {
      description: "Widen employees.department to varchar(500)",
      sql: `ALTER TABLE public.employees ALTER COLUMN department TYPE character varying(500) USING department::character varying(500)`,
    },
    {
      description: "Widen employees.location to varchar(500)",
      sql: `ALTER TABLE public.employees ALTER COLUMN location TYPE character varying(500) USING location::character varying(500)`,
    },
    {
      description: "Widen employees.contract_type to varchar(200)",
      sql: `ALTER TABLE public.employees ALTER COLUMN contract_type TYPE character varying(200) USING contract_type::character varying(200)`,
    },
    {
      description: "Widen employees.notice_period to varchar(200)",
      sql: `ALTER TABLE public.employees ALTER COLUMN notice_period TYPE character varying(200) USING notice_period::character varying(200)`,
    },
    {
      description: "Add assessment_sent_at to interviews",
      sql: `ALTER TABLE public.recruitment_interviews ADD COLUMN IF NOT EXISTS assessment_sent_at TIMESTAMPTZ`,
    },
    {
      description: "Add assessment_completed_at to interviews",
      sql: `ALTER TABLE public.recruitment_interviews ADD COLUMN IF NOT EXISTS assessment_completed_at TIMESTAMPTZ`,
    },
    {
      description: "Add applicant_result to interviews",
      sql: `ALTER TABLE public.recruitment_interviews ADD COLUMN IF NOT EXISTS applicant_result TEXT`,
    },
    {
      description: "Add result_notified_at to interviews",
      sql: `ALTER TABLE public.recruitment_interviews ADD COLUMN IF NOT EXISTS result_notified_at TIMESTAMPTZ`,
    },
    {
      description: "Add assessment_form JSONB to interviews",
      sql: `ALTER TABLE public.recruitment_interviews ADD COLUMN IF NOT EXISTS assessment_form JSONB`,
    },
    {
      description: "Add ai_score_override to applications",
      sql: `ALTER TABLE public.recruitment_applications ADD COLUMN IF NOT EXISTS ai_score_override NUMERIC`,
    },
    {
      description: "Add ai_score_override_at to applications",
      sql: `ALTER TABLE public.recruitment_applications ADD COLUMN IF NOT EXISTS ai_score_override_at TIMESTAMPTZ`,
    },
    {
      description: "Add ai_score_override_by to applications",
      sql: `ALTER TABLE public.recruitment_applications ADD COLUMN IF NOT EXISTS ai_score_override_by TEXT`,
    },
    {
      description: "Create recruitment_medical_uploads table",
      sql: `CREATE TABLE IF NOT EXISTS public.recruitment_medical_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        application_id UUID,
        offer_id UUID,
        applicant_name TEXT,
        applicant_email TEXT,
        file_url TEXT NOT NULL,
        file_name TEXT,
        uploaded_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT
      )`,
    },
    {
      description: "Create recruitment_interview_assessments table",
      sql: `CREATE TABLE IF NOT EXISTS public.recruitment_interview_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        interview_id UUID NOT NULL,
        application_id UUID,
        assessor_name TEXT NOT NULL,
        assessor_title TEXT,
        assessor_email TEXT,
        assessment_data JSONB,
        overall_score NUMERIC,
        recommendation TEXT,
        notes TEXT,
        signed_off_at TIMESTAMPTZ,
        signed_off_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
    },
  ]

  const results: { description: string; ok: boolean; error?: string }[] = []

  for (const { sql, description } of migrations) {
    // Use Supabase's exec_sql RPC if available, else try the raw approach
    const { error } = await (supabase as any).rpc("exec_sql", { sql })
    if (error) {
      // If the exec_sql RPC doesn't exist, just mark as needing manual apply
      results.push({ description, ok: false, error: error.message })
    } else {
      results.push({ description, ok: true })
    }
  }

  const allOk = results.every((r) => r.ok)
  return NextResponse.json({ allOk, results })
}
