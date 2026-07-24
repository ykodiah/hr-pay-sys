# HR Enhancements Implementation Guide

## Quick Start Checklist

### Phase 1: Deploy Database Migrations
Run these migrations in order to set up the new schema:

```bash
# Execute in your Supabase dashboard or via migration runner
1. 20260722_interview_staff_tagging.sql
2. 20260722_medical_requirements_workflow.sql
3. 20260722_probation_confirmation_automation.sql
4. 20260722_onboarding_queue_improvements.sql
5. 20260722_financial_auto_capture_sync.sql
```

**Expected Outcome:** 
- 5 new tables created
- 6 columns added to existing tables
- All RLS policies enabled
- Multi-tenant isolation configured

---

### Phase 2: Integrate Components into UI

#### Add Interview Staff Tagging to Interview Tab
In recruitment page/interview section, add:
```tsx
import { InterviewStaffSelector } from "@/components/recruitment/interview-staff-selector"

// In your interview form:
<InterviewStaffSelector
  interviewId={interview.id}
  candidateName={candidateName}
  jobTitle={jobTitle}
  scheduledAt={interview.scheduled_at}
  onStaffTagged={(staffIds) => console.log("Staff tagged:", staffIds)}
/>
```

#### Add Medical Requirements to Offers Tab
In recruitment offers section:
```tsx
import { MedicalRequirementsSection } from "@/components/recruitment/medical-requirements-section"

// In your offers form:
<MedicalRequirementsSection
  offerId={offer.id}
  candidateName={candidate.name}
  candidateEmail={candidate.email}
/>
```

#### Add Onboarding Queue Sidebar
In onboarding checklist view:
```tsx
import { OnboardingQueue } from "@/components/recruitment/onboarding-queue"

// Side-by-side layout:
<div className="grid grid-cols-4 gap-4">
  <div className="col-span-1">
    <OnboardingQueue
      selectedChecklistId={selectedChecklistId}
      onSelectChecklist={(id) => loadChecklist(id)}
    />
  </div>
  <div className="col-span-3">
    {/* Onboarding checklist form */}
  </div>
</div>
```

#### Add Financial Data to Employee Card
In employee profile/financial tab:
```tsx
import { FinancialDataDisplay } from "@/components/employees/financial-data-display"

// In employee card:
<FinancialDataDisplay
  employeeId={employee.id}
  isReadOnly={!isHRUser}
/>
```

---

### Phase 3: Connect Workflow Triggers

#### Probation Review Board Integration
In employee management section:
```tsx
import { ProbationReviewBoard } from "@/components/recruitment/probation-review-board"

// When 3 weeks before probation end (in your dashboard or cron job):
const { data: notifications } = await fetch('/api/recruitment/probation', {
  query: 'action=initiate_review_board&employee_id=...'
})

// Show modal:
<ProbationReviewBoard
  employeeId={employee.id}
  open={showReviewBoard}
  onOpenChange={setShowReviewBoard}
/>
```

#### Financial Data Auto-Sync Trigger
When signing off onboarding stage:
```tsx
// After "Complete Stage" button is clicked:
const financialData = {
  bank_name: formData.bank_name,
  bank_account_number: formData.bank_account_number,
  ssnit_number: formData.ssnit_number,
  monthly_salary: formData.monthly_salary,
  // ... all other fields from onboarding
}

const response = await fetch('/api/employees/financial-data-sync', {
  method: 'POST',
  body: JSON.stringify({
    employee_id: newEmployee.id,
    checklist_id: checklist.id,
    financial_data: financialData
  })
})
```

---

### Phase 4: Update Add Hire Modal
The modal in `app/recruitment/page.tsx` has been updated:
- ✅ Removed salary checkbox
- ✅ Updated copy to indicate financial auto-sync from onboarding
- Status: **Ready to use**

---

## API Reference

### Interview Staff Tagging
```tsx
// Get staff list
GET /api/recruitment/interviews/staff-tagging?company_id=...
Response: { staff: [{ id, name, department, position, email, phone }] }

// Tag staff to interview
POST /api/recruitment/interviews/staff-tagging
Body: { 
  interview_id, 
  staff_ids: [], 
  interview_summary: string,
  notification_type: 'email|sms|notification|all'
}

// Update notification status
PATCH /api/recruitment/interviews/staff-tagging
Body: { tagging_id, email_status, sms_status, notification_status }
```

### Medical Requirements
```tsx
// Get medical requirements
GET /api/recruitment/offers/medical-requirements?offer_id=...

// Set requirements
PATCH /api/recruitment/offers/medical-requirements
Body: { 
  offer_id, 
  medical_required: boolean,
  medical_required_before_offer_letter: boolean
}

// Submit medical
POST /api/recruitment/offers/medical-submission
Body: {
  offer_id,
  applicant_name,
  applicant_email,
  medical_file_path
}

// Verify medical
PATCH /api/recruitment/offers/medical-submission
Body: { submission_id, status: 'approved|rejected|resubmit_required', verification_notes }
```

### Probation & Confirmation
```tsx
// Get probation details
GET /api/recruitment/probation?employee_id=...

// Initialize probation
POST /api/recruitment/probation
Body: { employee_id, hire_date, duration_months: 6 }

// Submit confirmation decision
POST /api/recruitment/confirmation
Body: {
  employee_id,
  probation_review_id,
  confirmed: boolean,
  pay_decision: 'same_pay|pay_increase',
  new_salary: number,
  notes: string
}
```

### Onboarding Queue
```tsx
// Get queue
GET /api/recruitment/onboarding/queue?company_id=...
Response: { queue: [{ id, candidate_name, job_title, status, current_stage, completed_stages }] }

// Archive stage
POST /api/recruitment/onboarding/stage-archiving
Body: { checklist_id, stage, signed_off_by, notes }

// Get completed stages
GET /api/recruitment/onboarding/stage-archiving?checklist_id=...
```

### Financial Data Sync
```tsx
// Sync from onboarding
POST /api/employees/financial-data-sync
Body: {
  employee_id,
  checklist_id,
  financial_data: { bank_name, bank_account_number, ssnit_number, monthly_salary, ... }
}

// Get latest financial data
GET /api/employees/financial-data-sync?employee_id=...&latest_only=true

// Update financial data
PATCH /api/employees/financial-data-sync
Body: { snapshot_id, financial_data: { field: value } }
```

---

## Important Notes

### Multi-Tenant Isolation
All queries automatically scope by `company_id`. Make sure to:
- Pass `company_id` in request body or query params
- Verify RLS policies are enabled on all new tables
- Test cross-company data access restrictions

### Notification System
Interview staff tagging API prepares notification payloads but doesn't send them. You'll need to:
- Integrate with your email service (for email notifications)
- Integrate with SMS provider (for SMS notifications)
- Create in-app notification records (for portal notifications)

### Probation Automation
The 3-week notification trigger needs to be run via:
- Scheduled background job (recommended)
- Cron job that calls `/api/recruitment/probation` with `action=initiate_review_board`
- Manual trigger from HR dashboard

### Financial Data Sync
Financial data is auto-captured when onboarding is converted to employee. Make sure to:
- Call financial sync API after employee is created
- Verify all fields from onboarding are captured
- Test employee portal displays read-only data correctly

---

## Testing Scenarios

### Test 1: Interview Staff Tagging
1. Schedule an interview
2. Click "Tag Staff Members"
3. Select 2-3 staff members
4. Enter applicant summary
5. Choose notification type
6. Submit and verify notification records created

**Expected:** Staff tagging records in DB, notifications queued

### Test 2: Medical Requirements
1. Create an offer
2. Enable "Medical required"
3. Select "Before offer letter"
4. Try to generate offer letter (should be blocked)
5. Submit medical document
6. Verify offer letter can now be generated

**Expected:** Offer letter blocked until medical submitted

### Test 3: Probation Automation
1. Convert onboarding to employee
2. Verify probation dates set (6 months from hire date)
3. 3 weeks before end, verify notification created
4. Open review board modal
5. Confirm employee with pay increase
6. Verify employee notification sent

**Expected:** All dates calculated correctly, decisions logged

### Test 4: Onboarding Queue
1. Create multiple onboarding checklists
2. Verify queue displays all pending
3. Click applicant name to switch between checklist
4. Complete a stage and archive it
5. Verify stage hidden, summary shown

**Expected:** Queue navigation smooth, stage archiving works

### Test 5: Financial Sync
1. Fill onboarding financial tab completely
2. Complete onboarding and convert to employee
3. Go to employee financial tab
4. Verify all data auto-populated and read-only
5. Log in as employee, verify read-only in portal

**Expected:** Data synced, employee sees read-only display

---

## Troubleshooting

### Issue: Migrations fail
- Check that base tables exist (employees, recruitment_interviews, etc.)
- Verify Supabase project is connected
- Run migrations in order

### Issue: API returns 401
- Verify user is authenticated
- Check that company_id is correct
- Verify user has access to that company

### Issue: Notifications not sending
- Notification API prepares payloads, you must integrate with email/SMS providers
- Check notification status records in DB
- Verify notification payload structure

### Issue: Financial data not syncing
- Verify financial_data_sync API is called after employee creation
- Check that all required fields are populated
- Verify employee_id and checklist_id are correct

---

## Success Criteria

- Interview staff can be tagged to interviews
- Medical requirements block/allow offer letters appropriately
- Probation dates auto-calculate and notifications trigger
- Confirmation decisions record pay increase options
- Onboarding queue shows pending applicants
- Completed stages archive and show summary
- Financial data syncs to employee card from onboarding
- Employee portal displays read-only financial data

---

## Support

For detailed schema information, see: `HR_ENHANCEMENTS_SUMMARY.md`

For API details and component usage, see component files and inline comments.
