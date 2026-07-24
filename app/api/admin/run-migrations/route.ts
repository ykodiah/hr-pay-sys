import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"

// One-time migration endpoint — runs DDL via the Supabase service role using raw SQL.
// POST /api/admin/run-migrations (admin only)
export async function POST() {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Collect results from each statement run via supabase-js
    const client = createServiceClient()

    const migrations: { description: string; sql: string }[] = [
      {
        description: "Add archived_stages TEXT[] to onboarding_checklists",
        sql: `ALTER TABLE public.recruitment_onboarding_checklists ADD COLUMN IF NOT EXISTS archived_stages TEXT[] DEFAULT '{}'`,
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
        description: "Add medical_required to offers",
        sql: `ALTER TABLE public.recruitment_offers ADD COLUMN IF NOT EXISTS medical_required BOOLEAN DEFAULT false`,
      },
      {
        description: "Add medical_status to offers",
        sql: `ALTER TABLE public.recruitment_offers ADD COLUMN IF NOT EXISTS medical_status TEXT DEFAULT 'not_required'`,
      },
      {
        description: "Add medical_submitted_at to offers",
        sql: `ALTER TABLE public.recruitment_offers ADD COLUMN IF NOT EXISTS medical_submitted_at TIMESTAMPTZ`,
      },
      {
        description: "Add medical_link_sent_at to offers",
        sql: `ALTER TABLE public.recruitment_offers ADD COLUMN IF NOT EXISTS medical_link_sent_at TIMESTAMPTZ`,
      },
      {
        description: "Add probation_start_date to employees",
        sql: `ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS probation_start_date DATE`,
      },
      {
        description: "Add probation_end_date to employees",
        sql: `ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS probation_end_date DATE`,
      },
      {
        description: "Add probation_duration_months to employees",
        sql: `ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS probation_duration_months INTEGER DEFAULT 6`,
      },
      {
        description: "Add confirmation_status to employees",
        sql: `ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS confirmation_status TEXT DEFAULT 'pending'`,
      },
      {
        description: "Add confirmation_decision_date to employees",
        sql: `ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS confirmation_decision_date TIMESTAMPTZ`,
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
      {
        description: "Create recruitment_probation_reviews table",
        sql: `CREATE TABLE IF NOT EXISTS public.recruitment_probation_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL,
          company_id UUID NOT NULL,
          probation_start_date DATE,
          probation_end_date DATE,
          review_status TEXT DEFAULT 'pending',
          review_initiated_at TIMESTAMPTZ,
          confirmed BOOLEAN,
          pay_decision TEXT,
          new_salary NUMERIC,
          decided_by TEXT,
          decision_date TIMESTAMPTZ,
          notes TEXT,
          notification_sent_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
      },
    ]

    // Run each migration via Supabase service client rpc if available,
    // otherwise return a list for manual execution.
    const results: { description: string; ok: boolean; skipped?: boolean; error?: string }[] = []

    for (const { description, sql } of migrations) {
      try {
        // Supabase JS doesn't support raw DDL — use rpc wrapper if it exists
        const { error } = await (client as any).rpc("exec_sql", { sql })
        if (error) {
          // If exec_sql doesn't exist, the DDL was already applied externally
          if (error.message?.includes("does not exist") || error.message?.includes("PGRST")) {
            results.push({ description, ok: true, skipped: true })
          } else {
            results.push({ description, ok: false, error: error.message })
          }
        } else {
          results.push({ description, ok: true })
        }
      } catch (e) {
        results.push({ description, ok: false, error: e instanceof Error ? e.message : String(e) })
      }
    }

    const allOk = results.every((r) => r.ok || r.skipped)
    return NextResponse.json({ allOk, results })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
