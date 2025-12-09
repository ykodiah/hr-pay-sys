-- Promotions domain ---------------------------------------------------------

create table if not exists public.promotions (
  id text primary key,
  employee_id text not null,
  employee_name text not null,
  department text not null,
  from_grade text not null,
  from_step smallint not null,
  to_grade text not null,
  to_step smallint not null,
  effective_date date not null,
  reason text,
  status text not null check (status in ('draft', 'in-review', 'approved', 'rejected')),
  initiated_by text not null,
  initiated_at timestamptz not null default timezone('utc', now()),
  compensation_delta_current numeric(14,2) not null,
  compensation_delta_proposed numeric(14,2) not null,
  compensation_currency text not null default 'GHS',
  letter_url text
);

create table if not exists public.promotion_approvals (
  id bigserial primary key,
  promotion_id text not null references public.promotions(id) on delete cascade,
  stage text not null,
  role text not null,
  approver_name text,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  comment text,
  decided_at timestamptz
);

create table if not exists public.promotion_attachments (
  id bigserial primary key,
  promotion_id text not null references public.promotions(id) on delete cascade,
  file_name text not null,
  file_url text,
  mime_type text,
  uploaded_at timestamptz not null default timezone('utc', now())
);

-- Change requests domain ----------------------------------------------------

create table if not exists public.change_requests (
  id text primary key,
  employee_id text not null,
  employee_name text not null,
  submitted_at timestamptz not null default timezone('utc', now()),
  status text not null check (status in ('pending', 'verifying', 'approved', 'declined')),
  reason text,
  reviewer_notes text,
  sections text[] not null default array[]::text[],
  approved_by text,
  approved_at timestamptz
);

create table if not exists public.change_request_diffs (
  id bigserial primary key,
  request_id text not null references public.change_requests(id) on delete cascade,
  field_path text not null,
  field_label text not null,
  previous_value text,
  new_value text,
  pii boolean not null default false
);

create table if not exists public.change_request_attachments (
  id bigserial primary key,
  request_id text not null references public.change_requests(id) on delete cascade,
  file_name text not null,
  file_type text,
  uploaded_at timestamptz not null default timezone('utc', now())
);

-- Communication hub ---------------------------------------------------------

create table if not exists public.communication_channels (
  id text primary key,
  name text not null,
  channel_type text not null check (channel_type in ('public', 'private', 'direct')),
  description text,
  retention_policy text not null default 'standard',
  members integer not null default 0,
  unread integer not null default 0,
  encryption text not null default 'in-transit',
  external_guests boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.communication_messages (
  id text primary key,
  channel_id text not null references public.communication_channels(id) on delete cascade,
  author text not null,
  author_role text,
  content text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  priority text not null check (priority in ('normal', 'high', 'critical')),
  requires_ack boolean not null default false,
  acknowledged_by text[] not null default array[]::text[],
  incident_ticket text,
  tags text[]
);

-- Meetings workspace --------------------------------------------------------

create table if not exists public.meetings (
  id text primary key,
  title text not null,
  start_time timestamptz not null,
  duration_minutes integer not null,
  provider text not null check (provider in ('Zoom', 'Microsoft Teams', 'Google Meet', 'Daily', 'Cisco Webex')),
  host text not null,
  agenda text[] not null default array[]::text[],
  participants integer not null default 0,
  status text not null check (status in ('scheduled', 'in-progress', 'completed')),
  passcode_enforced boolean not null default true,
  e2ee boolean not null default true,
  recording_enabled boolean not null default false,
  minutes_status text not null check (minutes_status in ('not-started', 'processing', 'ready')),
  minutes_summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_meetings_updated_at()
returns trigger as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_meetings_updated_at on public.meetings;

create trigger trg_meetings_updated_at
before update on public.meetings
for each row
execute procedure public.set_meetings_updated_at();

-- Helpful indexes -----------------------------------------------------------

create index if not exists idx_promotion_approvals_promotion on public.promotion_approvals(promotion_id);
create index if not exists idx_change_request_diffs_request on public.change_request_diffs(request_id);
create index if not exists idx_change_request_attachments_request on public.change_request_attachments(request_id);
create index if not exists idx_comm_messages_channel on public.communication_messages(channel_id);
create index if not exists idx_comm_messages_priority on public.communication_messages(priority);
create index if not exists idx_meetings_status on public.meetings(status);
