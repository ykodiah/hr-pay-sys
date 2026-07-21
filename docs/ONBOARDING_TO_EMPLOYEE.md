# Onboarding → Employee list conversion

## Take / design

Completing onboarding **should** land the hire in Employees, but **not as a silent auto-insert**.

| Principle | Approach |
|-----------|----------|
| Seamless | Prefill name, email, phone, role, department, start date from candidate + offer |
| Secure | Auth + company scope; idempotent; email duplicate → **link** existing, never double-create |
| Stress-free | Explicit **preview → confirm**; payroll/bank/SSNIT only if HR opts in (no `"Pending"` traps) |
| Auditable | `recruitment_hire_conversions` + checklist `employee_id` / `converted_at` |

## SQL

Run after `089`:

```text
scripts/090_onboarding_employee_convert.sql
```

## Flow

1. Accept offer (or click **Go to onboarding**) → Onboarding tab opens with that hire focused (scroll + “Continue here”)  
2. Finish tasks / **Mark complete**  
3. **Add to employees** opens preview (also opens automatically after Mark complete if not linked)  
4. HR confirms → employee created (or linked) → redirected to `/app/employees`

## Offers → Onboarding deep link

**Go to onboarding** matches the checklist by `offer_id` (preferred) or `application_id`, pins it to the top, and scrolls into view. Requires SQL **089** so checklists store `offer_id`.
