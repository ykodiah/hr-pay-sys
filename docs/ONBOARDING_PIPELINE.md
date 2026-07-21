# Recruitment onboarding pipeline

## SQL

Run after `088`:

```text
scripts/089_recruitment_onboarding_pipeline.sql
```

Also: `supabase/migrations/20260721110000_recruitment_onboarding_pipeline.sql`

Adds stages, offer link, notes table, and unique active checklist per application.

## Behavior

- Accepting an offer (admin or candidate portal) **auto-starts onboarding**
- Accept button fades when status is `accepted`; **Go to onboarding** appears
- Onboarding tab shows stage stepper, progress, and modern task cards
