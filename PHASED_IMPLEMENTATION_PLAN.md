# Phased Implementation Plan - Ghana Payroll System

## Overview
This document breaks down all needed enhancements into 4 phases. Each phase is independent but builds on previous work. Total timeline: 3-4 weeks to production.

---

## PHASE 0: Foundation (Already Complete ✅)
**Status:** DONE  
**Duration:** Completed  
**Deliverables:**
- ✅ Fixed authentication system
- ✅ Removed demo hardcoding
- ✅ Created data service layer
- ✅ Built error boundary system
- ✅ Database schema cleanup
- ✅ Test infrastructure

---

## PHASE 1: Ghana Tax Engine (CRITICAL)
**Priority:** 🔴 MUST DO  
**Duration:** 2-3 days  
**Start:** Immediately after Phase 0  
**Blockers:** Without this, can't generate any payroll

### Why This Phase First
- Foundation for all payroll calculations
- No payslip possible without correct taxes
- All other features depend on tax calculations
- Highest business impact

### Deliverables
1. Tax calculation engine (PAYE, SSNIT, Tier 3)
2. Tax rate configuration tables
3. Deduction calculation service
4. Tax band management UI
5. Validation & testing

### Tasks

#### Task 1.1: Database Schema - Tax Configuration
**File:** Migration SQL  
**Dependencies:** None  
**Effort:** 1-2 hours

```sql
CREATE TABLE public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  min_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2),
  rate DECIMAL(5,2),
  fixed_amount DECIMAL(15,2),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year, tax_type, min_amount)
);

CREATE TABLE public.tax_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  band_number INT,
  min_salary DECIMAL(15,2),
  max_salary DECIMAL(15,2),
  rate DECIMAL(5,2),
  PRIMARY_KEY(year, band_number),
  active BOOLEAN DEFAULT TRUE
);
```

**What it does:** Stores Ghana's PAYE tax bands by year  
**Who creates:** HR Admin via Settings UI (Phase 3)

#### Task 1.2: Tax Calculation Engine Service
**File:** `lib/services/tax-service.ts` (NEW)  
**Dependencies:** Employee Service, Payroll Service  
**Effort:** 8-10 hours

**Methods to implement:**
```typescript
calculatePAYE(grossSalary: number, year: number): number
calculateSNIT(grossSalary: number, employeeContribution: boolean): number
calculateTier3(optIn: boolean, employeeChoice: number): number
calculateDeductions(employee: Employee, salary: number, year: number): DeductionSummary
getTaxBands(year: number): TaxBand[]
validateTaxRates(rates: TaxRate[]): ValidationResult
```

**Testing:** 12+ test cases
- Edge cases: salary = 0, negative, very high
- Band boundaries: test all 5 PAYE bands
- Multiple tax types combined
- Year-over-year changes

#### Task 1.3: Ghana-Specific Tax Rules
**File:** `lib/services/ghana-tax-rules.ts` (NEW)  
**Effort:** 4-5 hours

**Business Rules to Code:**
```typescript
// PAYE 2024 Ghana Tax Bands (example - verify with GRA)
- GHS 0 - 365: 0% (tax-free threshold)
- GHS 365 - 1,000: 5%
- GHS 1,000 - 2,500: 10%
- GHS 2,500 - 5,000: 17.5%
- GHS 5,000+: 25%

// SSNIT Contributions
- Employee: 5.5% on insurable earnings
- Employer: 13% on insurable earnings
- Ceiling: GHS 69,000 (or current)
- Tier 3 (voluntary pension): 0-25% optional

// Exemptions & Allowances
- Entertainment allowance: 10% of basic (non-taxable up to limit)
- Housing allowance: Varies by policy
- Statutory deductions apply
```

**Validation:** Verify with GRA website before coding

#### Task 1.4: API Route - Tax Calculations
**File:** `app/api/payroll/calculate-taxes/route.ts` (NEW)  
**Effort:** 3-4 hours

```typescript
POST /api/payroll/calculate-taxes
Body: {
  salary: number,
  allowances: { type: string, amount: number }[],
  deductions: { type: string, amount: number }[],
  year: number,
  employeeId: string
}
Response: {
  grossSalary: number,
  paye: number,
  ssnit: {
    employee: number,
    employer: number
  },
  tier3: number,
  totalDeductions: number,
  netSalary: number,
  breakdown: object
}
```

**Testing:** Integration test with real payroll data

#### Task 1.5: Tax Settings Dashboard Component
**File:** `app/app/settings/tax-rates/page.tsx` (NEW)  
**Effort:** 4-5 hours

**Features:**
- Display current tax bands (table view)
- Add/edit tax bands
- Upload bulk rates (CSV)
- Year-over-year comparison
- Validation before save
- Audit trail

**Components:**
- `TaxBandTable` - Display bands
- `TaxBandForm` - Add/edit
- `TaxRateImport` - CSV upload
- `TaxRateValidator` - Validation logic

#### Task 1.6: Testing & Validation
**Files:** 
- `__tests__/services/tax-service.test.ts`
- `__tests__/api/calculate-taxes.test.ts`

**Test Cases:** 25+ scenarios
- All 5 PAYE bands
- Boundary conditions
- Multiple deductions
- Year changes
- Error cases

### Validation Checklist
- [ ] All 5 PAYE bands calculate correctly
- [ ] SSNIT employee/employer split correct
- [ ] Tier 3 optional contribution works
- [ ] Tax-free threshold applied
- [ ] Deductions reduce taxable income
- [ ] Edge cases handled (0, negative, very high)
- [ ] API returns correct breakdown
- [ ] Settings UI works
- [ ] Tests pass 100%

### Success Criteria
- Tax calculation accuracy: 99.9%
- All test cases passing
- API response < 500ms
- Settings UI fully functional
- Documentation complete

---

## PHASE 2: Payslip Generation (CRITICAL)
**Priority:** 🔴 MUST DO  
**Duration:** 3-4 days  
**Start:** After Phase 1 tax service is tested  
**Depends On:** Phase 1 (Tax Service)

### Why This Phase
- Payslips are legally required
- Employees need itemized breakdown
- Foundation for other reports
- Direct business value

### Deliverables
1. Payslip data model
2. Payslip generation service
3. PDF export functionality
4. Payslip viewing UI
5. Email delivery setup

### Tasks

#### Task 2.1: Database Schema - Payslips
**File:** Migration SQL  
**Effort:** 1-2 hours

```sql
CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  payslip_date DATE NOT NULL,
  month_year VARCHAR(7),
  gross_salary DECIMAL(15,2),
  total_allowances DECIMAL(15,2),
  total_deductions DECIMAL(15,2),
  net_salary DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'generated',
  generated_at TIMESTAMP DEFAULT NOW(),
  email_sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.payslip_line_items (
  id UUID PRIMARY KEY,
  payslip_id UUID REFERENCES public.payslips(id) ON DELETE CASCADE,
  item_type VARCHAR(20), -- 'earning', 'deduction', 'tax'
  description TEXT,
  amount DECIMAL(15,2),
  sequence INT
);
```

#### Task 2.2: Payslip Generation Service
**File:** `lib/services/payslip-service.ts` (NEW)  
**Effort:** 6-8 hours

**Methods:**
```typescript
generatePayslip(payrollRunId: string, employeeId: string): Payslip
generatePayslipsForRun(payrollRunId: string): Payslip[]
getPayslip(payslipId: string): Payslip with lineItems
getEmployeePayslips(employeeId: string, limit?: number): Payslip[]
emailPayslips(payslipIds: string[]): Promise
markAsViewed(payslipId: string): void
```

**Data Structure:**
```typescript
interface PayslipLineItem {
  type: 'earning' | 'deduction' | 'tax' | 'benefit'
  description: string
  amount: number
  sequence: number
}

interface Payslip {
  id: string
  employee: EmployeeInfo
  period: string
  grossSalary: number
  earnings: PayslipLineItem[]
  deductions: PayslipLineItem[]
  taxes: PayslipLineItem[]
  netSalary: number
  bankAccount: string
  generatedDate: Date
}
```

#### Task 2.3: PDF Generation Service
**File:** `lib/services/payslip-pdf.ts` (NEW)  
**Library:** `pdfkit` or `html2pdf`  
**Effort:** 5-6 hours

**PDF Layout:**
```
┌─────────────────────────────────┐
│     COMPANY NAME - PAYSLIP      │
│     Month: January 2024         │
├─────────────────────────────────┤
│ Employee: John Doe              │
│ ID: EMP001 | Dept: Sales        │
├─────────────────────────────────┤
│ EARNINGS              AMOUNT     │
│ Basic Salary         GHS 2,500   │
│ Transportation          200      │
│ Housing                 400      │
│ ─────────────────────────────    │
│ GROSS SALARY         GHS 3,100   │
├─────────────────────────────────┤
│ DEDUCTIONS           AMOUNT     │
│ PAYE Tax             GHS 300    │
│ SSNIT Employee       GHS 170    │
│ Pension (Tier 3)     GHS 100    │
│ ─────────────────────────────    │
│ TOTAL DEDUCTIONS     GHS 570    │
├─────────────────────────────────┤
│ NET SALARY           GHS 2,530   │
│ Bank Transfer on: 30-Jan-2024   │
└─────────────────────────────────┘
```

**Features:**
- Company logo/header
- Employee info
- Period info
- Itemized earnings & deductions
- Tax breakdown
- Net salary & payment method
- Footnotes (contact info, tax notices)

#### Task 2.4: Payslip REST API
**File:** `app/api/payslips/route.ts` (NEW)  
**Effort:** 3-4 hours

```typescript
GET /api/payslips
  - Auth required
  - Returns employee's payslips
  - Pagination: limit=20

GET /api/payslips/:id
  - Get single payslip details
  
GET /api/payslips/:id/pdf
  - Download payslip as PDF
  
POST /api/payslips/:id/email
  - Email payslip to employee
  - Mark as sent

POST /api/payslips/generate
  - Generate for payroll run (admin only)
  - Bulk operation
```

#### Task 2.5: Payslip UI - Employee View
**File:** `app/app/payslips/page.tsx` (NEW)  
**Effort:** 4-5 hours

**Features:**
- List of payslips (recent first)
- Filter by month/year
- View payslip (expanded view)
- Download as PDF
- Print
- Email to personal email
- Search by date

**Components:**
- `PayslipList` - Table of payslips
- `PayslipDetail` - Full payslip view
- `PayslipExport` - PDF/Print buttons

#### Task 2.6: Payslip UI - Admin View
**File:** `app/app/admin/payslips/page.tsx` (NEW)  
**Effort:** 3-4 hours

**Features:**
- Generate payslips for run
- Bulk email all
- View audit (who viewed when)
- Regenerate single
- Delete (with confirmation)
- Export all as ZIP

#### Task 2.7: Testing
**Files:**
- `__tests__/services/payslip-service.test.ts`
- `__tests__/services/payslip-pdf.test.ts`
- `__tests__/api/payslips.test.ts`

**Test Cases:** 20+
- PDF generation
- Line items calculation
- Edge cases (no deductions, high deductions)
- Employee privacy (can only see own)
- Admin access

### Validation Checklist
- [ ] Payslips generate for all employees in run
- [ ] Line items match calculated taxes
- [ ] PDF layout is professional/readable
- [ ] PDF contains all required info
- [ ] Employees see only their payslips
- [ ] Admin can bulk generate
- [ ] Email delivery works
- [ ] Download works from UI
- [ ] Tests pass 100%

### Success Criteria
- Payslip generation: < 2 seconds per employee
- PDF quality: Professional appearance
- Data accuracy: 100%
- Test coverage: > 85%

---

## PHASE 3: Compliance Reports (CRITICAL)
**Priority:** 🔴 MUST DO  
**Duration:** 4-5 days  
**Start:** After Phase 2 payslips tested  
**Depends On:** Phase 1 (Tax), Phase 2 (Payslips)

### Why This Phase
- Legal requirement in Ghana
- GRA requires PAYE reports
- SSNIT requires contribution reports
- Bank requires advice files
- Audit compliance

### Deliverables
1. 8 compliance reports
2. Report generation engine
3. Report export (PDF/Excel/CSV)
4. Report scheduling (automatic)
5. Report audit trail

### The 8 Reports

#### Report 1: PAYE Report (GRA Filing)
**File:** `lib/services/reports/paye-report.ts`  
**Frequency:** Monthly  
**For:** Ghana Revenue Authority  
**Contains:**
- Employee names & IDs
- Gross salary
- PAYE tax withheld
- Submission status

**Format:** Excel/PDF/CSV

#### Report 2: SSNIT Contributions Report
**File:** `lib/services/reports/ssnit-report.ts`  
**Frequency:** Monthly  
**For:** SSNIT  
**Contains:**
- Employee details
- Insurable earnings
- Employee contribution (5.5%)
- Employer contribution (13%)
- Total liability

#### Report 3: Bank Advice File
**File:** `lib/services/reports/bank-advice.ts`  
**Frequency:** Per payroll run  
**For:** Company's bank  
**Format:** Bank-specific (CSV/XML/TXT)  
**Contains:**
- Employee bank details
- Net salary
- Payment date
- Reference

#### Report 4: Cash Budget Comparison (CTC)
**File:** `lib/services/reports/ctc-report.ts`  
**Frequency:** Monthly  
**For:** Finance/Accounting  
**Contains:**
- Cost to company (salary + benefits + taxes)
- Budget vs actual
- Variance analysis

#### Report 5: Loan Deduction Report
**File:** `lib/services/reports/loan-report.ts`  
**Frequency:** Monthly  
**For:** Loan tracking  
**Contains:**
- Employee loans
- Deductions withheld
- Principal remaining
- Status

#### Report 6: Other Deductions Report
**File:** `lib/services/reports/deductions-report.ts`  
**Frequency:** Monthly  
**For:** Finance  
**Contains:**
- All non-tax deductions
- By type (union, insurance, etc.)
- By employee
- By department

#### Report 7: Allowances Report
**File:** `lib/services/reports/allowances-report.ts`  
**Frequency:** Monthly  
**For:** HR/Finance  
**Contains:**
- All allowances paid
- By type (transport, housing, etc.)
- By employee
- Trend analysis

#### Report 8: Provident Fund Report
**File:** `lib/services/reports/provident-report.ts`  
**Frequency:** Quarterly  
**For:** Provident fund manager  
**Contains:**
- Employee contributions (if applicable)
- Company contributions
- Fund balance per employee

### Tasks

#### Task 3.1: Database - Report Configuration
**File:** Migration SQL  
**Effort:** 2-3 hours

```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY,
  report_type VARCHAR(50), -- 'paye', 'ssnit', 'bank_advice', etc.
  payroll_run_id UUID REFERENCES public.payroll_runs(id),
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  file_path TEXT,
  status VARCHAR(20), -- 'generated', 'submitted', 'filed'
  submitted_at TIMESTAMP,
  submission_ref TEXT,
  notes TEXT
);

CREATE TABLE public.report_audit (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id),
  action VARCHAR(50), -- 'generated', 'submitted', 'viewed', 'edited'
  actor_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### Task 3.2: Report Engine Service
**File:** `lib/services/report-engine.ts` (NEW)  
**Effort:** 8-10 hours

**Methods:**
```typescript
generateReport(type: ReportType, payrollRunId: string): Report
generateAllReports(payrollRunId: string): Report[]
getReport(reportId: string): Report with data
exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Buffer
scheduleReports(payrollRunId: string): void
getReportHistory(type: ReportType, limit: number): Report[]
```

#### Task 3.3: Individual Report Services
**Files:** 8 files in `lib/services/reports/`  
**Effort:** 12-15 hours total

Each report service:
```typescript
generatePAYEReport(payrollRunId: string): PAYEReportData
validateData(): boolean
formatForExport(): ExcelData | CSVData | PDFData
getSummary(): ReportSummary
```

**Example - PAYE Report:**
```typescript
interface PAYEReportData {
  generatedDate: Date
  payrollPeriod: string
  companyInfo: CompanyDetails
  employees: Array<{
    name: string
    id: string
    grossSalary: number
    paye: number
    status: 'withheld' | 'exempted'
  }>
  totalEmployees: number
  totalGrossSalary: number
  totalPAYEWithheld: number
  summary: string
}
```

#### Task 3.4: Report Export Service
**File:** `lib/services/report-exporter.ts` (NEW)  
**Libraries:** `xlsx`, `pdfkit`  
**Effort:** 6-8 hours

**Methods:**
```typescript
exportToExcel(reportData: any): Buffer
exportToCSV(reportData: any): string
exportToPDF(reportData: any, template: string): Buffer
exportToJSON(reportData: any): string
zipMultipleReports(reportIds: string[]): Buffer
```

#### Task 3.5: Report API Routes
**File:** `app/api/reports/` (Multiple route files)  
**Effort:** 4-5 hours

```typescript
GET /api/reports
  - List all reports with filters
  
GET /api/reports/:type/latest
  - Get latest report of type
  
GET /api/reports/:id/download?format=pdf|excel|csv
  - Download report
  
POST /api/reports/generate
  - Trigger report generation
  
POST /api/reports/:id/submit
  - Mark as submitted to authority
```

#### Task 3.6: Reports Dashboard UI
**File:** `app/app/reports/page.tsx` (Update existing)  
**Effort:** 5-6 hours

**Features:**
- Report list (8 types)
- Status per report
- Download buttons
- Generation history
- Scheduling settings
- Submission status
- Audit trail

**Components:**
- `ReportGrid` - Show 8 reports
- `ReportDetail` - Full report view
- `ReportScheduler` - Set auto-generation
- `ReportAudit` - View history

#### Task 3.7: Report Scheduler Service
**File:** `lib/services/report-scheduler.ts` (NEW)  
**Effort:** 3-4 hours

**Features:**
- Schedule automatic report generation
- Trigger after payroll approval
- Email reports to stakeholders
- Archive reports
- Retention policy

#### Task 3.8: Testing
**Files:**
- `__tests__/services/reports/paye-report.test.ts`
- `__tests__/services/reports/ssnit-report.test.ts`
- `__tests__/services/report-engine.test.ts`
- `__tests__/api/reports.test.ts`

**Test Cases:** 30+
- Data accuracy
- Export formats
- Permission checks
- Edge cases

### Validation Checklist
- [ ] All 8 report types generate
- [ ] Data accuracy verified
- [ ] Excel export works
- [ ] CSV export works
- [ ] PDF layout professional
- [ ] Permissions correct (admin only)
- [ ] Scheduling works
- [ ] Audit trail complete
- [ ] Tests pass 100%

### Success Criteria
- Report generation: < 5 seconds
- Export accuracy: 100%
- All 8 report types functional
- Test coverage: > 85%
- Ready for GRA/SSNIT submission

---

## PHASE 4: Enhanced Features (IMPORTANT/NICE)
**Priority:** 🟡 IMPORTANT  
**Duration:** 4-5 days  
**Start:** After Phase 3 reports working  
**Depends On:** Phases 1-3

### Why This Phase
- Improves efficiency
- Reduces manual work
- Better data management
- Employee satisfaction

### Deliverables
1. Loan amortization engine
2. Bulk employee import
3. Overtime taxation
4. Approval workflow UI
5. Advanced filtering & search

### Tasks

#### Task 4.1: Loan Amortization Service
**File:** `lib/services/loan-service.ts` (NEW)  
**Effort:** 5-6 hours  
**Priority:** 🟡 IMPORTANT

**Methods:**
```typescript
createLoan(employeeId: string, amount: number, term: number, rate: number): Loan
generateAmortizationSchedule(loanId: string): Schedule[]
calculateMonthlyPayment(principal: number, rate: number, term: number): number
getActiveLoan(employeeId: string): Loan
getLoanBalance(loanId: string): number
recordPayment(loanId: string, amount: number): Payment
```

**Business Rules:**
- Support reducing-balance method
- Monthly deductions from salary
- Interest calculations (if applicable)
- Early repayment allowed
- Status tracking (active, completed, defaulted)

**Database Schema:**
```sql
CREATE TABLE public.employee_loans (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id),
  principal DECIMAL(15,2),
  monthly_payment DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  remaining_balance DECIMAL(15,2),
  status VARCHAR(20)
);

CREATE TABLE public.loan_amortization_schedule (
  id UUID PRIMARY KEY,
  loan_id UUID REFERENCES public.employee_loans(id),
  month_number INT,
  payment_date DATE,
  payment_amount DECIMAL(15,2),
  principal_paid DECIMAL(15,2),
  interest_paid DECIMAL(15,2),
  balance_remaining DECIMAL(15,2)
);
```

#### Task 4.2: Bulk Employee Import
**File:** `app/api/employees/bulk-import/route.ts` (NEW)  
**Effort:** 6-7 hours  
**Priority:** 🟡 IMPORTANT

**Features:**
- CSV upload
- Data validation
- Duplicate detection
- Preview before import
- Batch processing
- Error reporting

**CSV Template Required:**
```
first_name,last_name,email,id_number,department,salary,employment_date
John,Doe,john@company.com,EMP001,Sales,2500,2024-01-01
Jane,Smith,jane@company.com,EMP002,HR,3000,2024-01-01
```

**Validation Rules:**
- All required fields present
- Email format valid
- Salary > 0
- No duplicate IDs
- No duplicate emails
- ID number format (Ghana)

**Process:**
1. Upload CSV
2. Parse & validate
3. Show preview (success & errors)
4. User confirms
5. Import to database
6. Send welcome emails

#### Task 4.3: Overtime Taxation
**File:** `lib/services/overtime-service.ts` (NEW)  
**Effort:** 4-5 hours  
**Priority:** 🟠 NICE

**Business Rules:**
- Hours beyond 40/week = overtime
- Overtime rate: 1.5x or 2x per policy
- Overtime income taxable
- Separate line in payslip
- Optional per company

**Methods:**
```typescript
calculateOvertimePay(hourlyRate: number, overtimeHours: number, multiplier: number): number
taxOvertimeIncome(overtimeAmount: number): number
addOvertimeToPayroll(employeeId: string, hours: number): void
getOvertimeReport(month: string): OvertimeData[]
```

#### Task 4.4: Approval Workflow UI
**File:** `app/app/admin/approvals/page.tsx` (NEW)  
**Effort:** 5-6 hours  
**Priority:** 🟠 NICE

**Features:**
- Multi-stage approvals (HR → Finance → Finance Lead)
- Approval dashboard
- Comments & notes
- Reject with reason
- Audit trail
- Notifications

**Workflow:**
```
Payroll Run Created
    ↓
HR Review (Can view, comment, approve/reject)
    ↓
Finance Review (Can view, comment, approve/reject)
    ↓
Finance Lead Approval (Final approval)
    ↓
Lock for Processing
```

#### Task 4.5: Advanced Filtering & Search
**File:** Updates to existing services  
**Effort:** 3-4 hours  
**Priority:** 🟠 NICE

**Enhancements:**
- Multi-field search (name, ID, department)
- Date range filters
- Status filters
- Amount range filters
- Saved filters
- Export filtered results

**Services to update:**
- Employee Service
- Payroll Service
- Attendance Service
- Reports Service

### Validation Checklist
- [ ] Loans calculate correctly
- [ ] Amortization schedule accurate
- [ ] CSV import validates
- [ ] Duplicates detected
- [ ] Overtime hours calculated
- [ ] Approval workflow works
- [ ] All filters functional
- [ ] Search works across fields
- [ ] Tests pass 100%

### Success Criteria
- Loan calculation accuracy: 100%
- Import success rate: > 95%
- Approval workflow: < 2 seconds per action
- Search results: < 1 second

---

## Implementation Timeline

### Week 1: Foundation & Tax Engine
```
Monday-Tuesday:   Phase 1.1 - 1.2 (Tax DB, Calculation Engine)
Wednesday:        Phase 1.3 - 1.4 (Ghana Rules, API)
Thursday:         Phase 1.5 - 1.6 (Settings UI, Tests)
Friday:           Phase 1 Testing & Validation
```

### Week 2: Payslips & Reports Start
```
Monday-Tuesday:   Phase 2.1 - 2.4 (Payslip DB, Service, PDF, API)
Wednesday-Thu:    Phase 2.5 - 2.7 (UI, Tests)
Friday:           Phase 2 Complete + Phase 3.1-3.2 Start
```

### Week 3: Compliance Reports
```
Monday-Tuesday:   Phase 3.3 - 3.5 (8 Reports, Export, API)
Wednesday-Thu:    Phase 3.6 - 3.8 (Reports UI, Scheduler, Tests)
Friday:           Phase 3 Complete + Phase 4 Planning
```

### Week 4: Enhanced Features (If Needed)
```
Monday:           Phase 4.1 (Loan Service)
Tuesday-Wed:      Phase 4.2 (Bulk Import)
Thursday:         Phase 4.3 - 4.5 (Overtime, Approval, Search)
Friday:           Final Testing, Deployment Prep
```

---

## Critical Dependencies

```
Phase 1 (Tax Engine)
    ↓
Phase 2 (Payslips)  →  Phase 3 (Reports)
    ↓
Phase 4 (Enhancements)
```

**Cannot start Phase 2 without Phase 1 ✓**  
**Cannot start Phase 3 without Phase 1 & 2 ✓**  
**Can start Phase 4 after Phase 2 ✓**

---

## File Structure After All Phases

```
lib/
├── services/
│   ├── base-service.ts ✅
│   ├── employee-service.ts ✅
│   ├── payroll-service.ts ✅
│   ├── attendance-service.ts ✅
│   ├── dashboard-service.ts ✅
│   ├── tax-service.ts 📋 PHASE 1
│   ├── ghana-tax-rules.ts 📋 PHASE 1
│   ├── payslip-service.ts 📋 PHASE 2
│   ├── payslip-pdf.ts 📋 PHASE 2
│   ├── report-engine.ts 📋 PHASE 3
│   ├── report-exporter.ts 📋 PHASE 3
│   ├── report-scheduler.ts 📋 PHASE 3
│   ├── loan-service.ts 📋 PHASE 4
│   ├── overtime-service.ts 📋 PHASE 4
│   ├── reports/
│   │   ├── paye-report.ts 📋 PHASE 3
│   │   ├── ssnit-report.ts 📋 PHASE 3
│   │   ├── bank-advice.ts 📋 PHASE 3
│   │   ├── ctc-report.ts 📋 PHASE 3
│   │   ├── loan-report.ts 📋 PHASE 3
│   │   ├── deductions-report.ts 📋 PHASE 3
│   │   ├── allowances-report.ts 📋 PHASE 3
│   │   └── provident-report.ts 📋 PHASE 3
│   └── error-handling/ ✅
│
app/
├── api/
│   ├── payroll/
│   │   └── calculate-taxes/route.ts 📋 PHASE 1
│   ├── payslips/
│   │   └── route.ts 📋 PHASE 2
│   ├── reports/
│   │   └── route.ts 📋 PHASE 3
│   └── employees/
│       └── bulk-import/route.ts 📋 PHASE 4
│
├── app/
│   ├── settings/
│   │   └── tax-rates/page.tsx 📋 PHASE 1
│   ├── payslips/
│   │   └── page.tsx 📋 PHASE 2
│   ├── reports/
│   │   └── page.tsx 📋 PHASE 3 (update)
│   ├── admin/
│   │   ├── approvals/page.tsx 📋 PHASE 4
│   │   └── payslips/page.tsx 📋 PHASE 2
│
__tests__/
├── services/
│   ├── tax-service.test.ts 📋 PHASE 1
│   ├── payslip-service.test.ts 📋 PHASE 2
│   ├── report-engine.test.ts 📋 PHASE 3
│   └── loan-service.test.ts 📋 PHASE 4
│
├── api/
│   ├── calculate-taxes.test.ts 📋 PHASE 1
│   ├── payslips.test.ts 📋 PHASE 2
│   └── reports.test.ts 📋 PHASE 3
```

✅ = Already done  
📋 = To do in phases

---

## Testing Strategy by Phase

### Phase 1 Testing
- Unit tests: Tax calculations (25+ cases)
- Integration tests: Tax API
- Manual testing: Settings UI
- Validation: Against GRA rates

### Phase 2 Testing
- Unit tests: Payslip generation (20+ cases)
- Integration tests: Payslip API
- Regression tests: Phase 1 still works
- PDF quality check

### Phase 3 Testing
- Unit tests: Each report (30+ cases total)
- Integration tests: Report API
- Accuracy validation: Data checks
- Export format validation

### Phase 4 Testing
- Unit tests: Loans, overtime (20+ cases)
- Integration tests: Bulk import
- Load testing: High-volume import
- Workflow tests: Approval stages

---

## Risk Mitigation

### Risk: Tax rates change during development
**Mitigation:** Store rates in database (Phase 1), easy to update

### Risk: GRA report format changes
**Mitigation:** Export to Excel + CSV (flexibility), update templates

### Risk: Performance issues with large payroll
**Mitigation:** Add indexes, pagination, caching in services

### Risk: Data loss during import
**Mitigation:** Validation, preview, transaction rollback on error

### Risk: Approval workflow delays
**Mitigation:** Notifications, dashboard reminders, escalation

---

## Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| 1 | Tax accuracy | 99.9% |
| 1 | Processing time | < 500ms |
| 2 | Payslip generation | < 2s per employee |
| 2 | PDF quality | Professional |
| 3 | Report generation | < 5s |
| 3 | Export accuracy | 100% |
| 4 | Loan calculation | 100% accurate |
| 4 | Import success rate | > 95% |
| ALL | Test coverage | > 85% |

---

## Approval Gates

Each phase requires approval before starting next:

**Gate 1 (After Phase 1):** 
- Tax calculations verified with GRA
- Test coverage > 85%
- ✅ Approved to proceed to Phase 2

**Gate 2 (After Phase 2):**
- Payslips generated for 100+ employees
- PDF format approved by HR
- ✅ Approved to proceed to Phase 3

**Gate 3 (After Phase 3):**
- All 8 reports generated
- GRA/SSNIT format verified
- ✅ Approved to proceed to Phase 4

**Gate 4 (After Phase 4):**
- UAT completed
- All features tested
- ✅ Ready for production

---

## Next Steps

1. **Read this document** and confirm phases
2. **Get GRA approval** on tax bands (before Phase 1)
3. **Create project board** with 4 phases
4. **Assign resources** to Phase 1
5. **Start Phase 1** immediately

**Target Go-Live:** 3-4 weeks from Phase 1 start
