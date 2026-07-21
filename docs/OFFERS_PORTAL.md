# Recruitment offers portal

## SQL

Run **`scripts/088_recruitment_offers_portal.sql`** after `087`.

Adds on `recruitment_offers`: short codes, remuneration fields, email/response tracking, and `recruitment_offer_events` audit table.

## Features

- Edit offer letter, salary, benefits, allowances, probation/notice, signatory
- Regenerate letter (Ghana Labour Act template) + optional **AI polish** (`GROQ_API_KEY`)
- **PDF** via branded printable HTML (`/api/recruitment/offers/[id]/pdf` → Print → Save as PDF)
- **Send email** with secure link `/o/{short_code}` for Accept / Decline / Withdraw
- Candidate response **auto-updates** application status (`hired` / `rejected` / `withdrawn`)
- Admin can also Accept / Decline / Withdraw or set status manually (same sync)

## Public path

`/o/[code]` and `/api/offers/public/[code]` are public (middleware).
