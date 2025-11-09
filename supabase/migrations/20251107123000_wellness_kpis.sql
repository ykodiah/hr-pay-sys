-- Enable required extension for UUID generation
create extension if not exists "pgcrypto";

-- Employee wellbeing snapshots capture rolling wellness metrics tied to attendance behaviour
create table if not exists public.employee_wellbeing_snapshots (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  employee_hris_id text,
  period_start date not null,
  period_end date not null,
  recovery_score numeric(5, 2),
  stress_score numeric(5, 2),
  engagement_score numeric(5, 2),
  fatigue_index numeric(5, 2),
  hydration_score numeric(5, 2),
  sleep_hours numeric(5, 2),
  last_check_in timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_wellbeing_snapshots_employee_idx
  on public.employee_wellbeing_snapshots (employee_id);

create index if not exists employee_wellbeing_snapshots_period_idx
  on public.employee_wellbeing_snapshots (period_end desc);

-- Maintain updated_at automatically
create or replace function public.set_employee_wellbeing_snapshots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_employee_wellbeing_snapshots_updated_at on public.employee_wellbeing_snapshots;
create trigger trg_employee_wellbeing_snapshots_updated_at
before update on public.employee_wellbeing_snapshots
for each row execute function public.set_employee_wellbeing_snapshots_updated_at();

-- Wellness nudge actions log manual interventions on burnout alerts
create table if not exists public.wellness_nudge_actions (
  id uuid primary key default gen_random_uuid(),
  nudge_id text not null,
  employee_id uuid references public.employees(id) on delete set null,
  employee_hris_id text,
  action_type text not null check (action_type in ('scheduled', 'acknowledged')),
  metadata jsonb,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists wellness_nudge_actions_nudge_idx
  on public.wellness_nudge_actions (nudge_id);

create index if not exists wellness_nudge_actions_action_type_idx
  on public.wellness_nudge_actions (action_type, performed_at desc);
