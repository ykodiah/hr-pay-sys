# Onboarding artifacts, offer signatures & document vault

## SQL order

Run after `090`:

```text
scripts/091_onboarding_artifacts_and_offer_signatures.sql
```

## Onboarding queue — uploads & typed fields

Document / payroll / info tasks show inline forms:

- Typed fields (TIN, bank, SSNIT, emergency contact, etc.)
- File upload where needed
- **Save draft** or **Save & complete**

Uploads and form summaries are copied into **Document Vault** (`source: recruitment-onboarding`) with `checklist_id` / `onboarding_task_id`. When the hire is converted to an employee, vault rows and `employee_documents` are linked to that employee (and bank/SSNIT fields sync into `employee_financial` when present).

The **Sign employment contract** task completes when **both** Candidate and HR Head have signed the offer letter.

## Offer letter signatures

| Party | Where |
|-------|--------|
| Candidate | Public portal `/o/{code}` — typed full name required before Accept |
| HR Head | Offers editor — **HR Head signature** field |

PDF/HTML letter includes a dual signature block. When both have signed, a vault copy is filed and the onboarding contract task is completed/linked.

## Document vault fixes

- Employee filter deduped by employee UUID (one name per person)
- Display uses business **employee id** (e.g. `EMP0001`) instead of UUID
- Each row shows a **Doc** code like `EMP0001-A1B2C3`
- Filter controls compacted onto one row
