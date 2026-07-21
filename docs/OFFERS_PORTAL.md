# Recruitment offers portal

## Critical: run SQL first

Offer edit / send / candidate `/o/{code}` links require:

```text
scripts/088_recruitment_offers_portal.sql
```

Also mirrored at:

```text
supabase/migrations/20260721080000_recruitment_offers_portal.sql
```

Run in the Supabase SQL editor, then refresh the schema cache (`NOTIFY pgrst, 'reload schema';` is included).

Without `088`, the app still works in degraded mode:
- Edit salary / letter / status using core columns
- Candidate links use the **offer UUID** (`/o/{offer-id}`)
- Short codes, email_status, public_views, events may be unavailable

## Features

- Edit offer letter, salary, benefits, allowances, probation/notice, signatory
- Regenerate letter + optional **AI polish** (`GROQ_API_KEY`)
- **PDF** via `/api/recruitment/offers/[id]/pdf` → Print → Save as PDF
- **Send email** with Accept / Decline / Withdraw link
- Candidate response auto-updates application status; admin can also set status manually

## Public paths

`/o/[code]` and `/api/offers/public/[code]` (middleware allow-list).
`code` may be `short_code` **or** the offer UUID.
