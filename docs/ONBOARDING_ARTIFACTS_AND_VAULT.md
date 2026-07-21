# Onboarding artifacts, offer signatures & document vault

## SQL order

Run after `090`:

```text
scripts/091_onboarding_artifacts_and_offer_signatures.sql
```

## Onboarding queue — uploads & typed fields

Document / payroll / info tasks show inline forms:

- Typed fields (Ghana Card number required on employee-info; bank dropdown from tenant banks + defaults; no TIN field)
- File upload only where needed (not for payroll banking/SSNIT or day-one check-in)
- **Save draft** or **Save & complete**

Uploads and form summaries are copied into **Document Vault** (`source: recruitment-onboarding`) with short notes (task title only). When the hire is converted to an employee, vault rows and `employee_documents` are linked to that employee (and bank/SSNIT fields sync into `employee_financial` when present).

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
