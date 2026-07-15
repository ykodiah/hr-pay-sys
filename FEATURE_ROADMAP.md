# Feature Roadmap: Ghana Payroll System

## Current State vs Production Ready

### What We Have ✅
```
Solid Foundation Layer
├── Authentication (Supabase)
├── Error Handling & Logging
├── Data Service Layer
├── Database Schema (Basic)
├── API Structure
└── Test Infrastructure
```

### What We're Missing for Go-Live ❌
```
Payroll Engine
├── 🔴 Tax Calculations (PAYE, SSNIT, Tier 3)
├── 🔴 Payslip Generation
├── 🔴 Compliance Reports (8 types)
├── 🟡 Loan Amortization
├── 🟡 Bulk Import
├── 🟡 Settings/Configuration UI
├── 🟠 Overtime Taxation
└── 🟠 Approval Workflow UI
```

---

## The 3 Things You MUST Build First

### 1️⃣ Ghana Tax Calculation Engine
**Why:** Can't generate a payslip without calculating taxes correctly
```
Input:  Basic Salary, Gross Salary, Period
Output: PAYE (5 bands), SSNIT Employee (5.5%), SSNIT Employer (13%), Tier 3
```
**Complexity:** Medium | **Time:** 2-3 days | **Risk:** High (compliance)

### 2️⃣ Payslip Generation
**Why:** Payslips are legally required documents in Ghana
```
Shows: Gross → Deductions (Tax, SSNIT, Loans) → Net Pay
Format: Print-ready, PDF export, itemized
```
**Complexity:** High | **Time:** 3-4 days | **Risk:** Medium (accuracy)

### 3️⃣ Compliance Reports
**Why:** Legal requirement + bank/authority submissions
```
PAYE Report    → Ghana Revenue Authority (monthly)
SSNIT Report   → SSNIT (monthly)
Bank Advice    → Bank transfers
```
**Complexity:** Medium | **Time:** 4-5 days | **Risk:** Low

---

## Implementation Timeline

```
WEEK 1 - CRITICAL PATH (Days 1-5)
│
├─ Mon-Tue: Tax Calculation Engine ⭐
│   └─ Implement PAYE bands, SSNIT, Tier 3 logic
│
├─ Wed-Thu: Payslip Generation ⭐
│   └─ Build payslip document, PDF export
│
└─ Fri: First PAYE Report ⭐
    └─ Tax report generation

WEEK 2 - COMPLIANCE (Days 6-10)
│
├─ Mon-Tue: Remaining Reports
│   └─ SSNIT, Provident, Bank Advice, CTC
│
├─ Wed-Thu: Tax Configuration UI
│   └─ Admin can update rates when GRA announces changes
│
└─ Fri: Testing & Documentation
    └─ Verify calculations against GRA standards

WEEK 3 - OPERATIONS (Days 11-15)
│
├─ Mon: Bulk Employee Import
│   └─ CSV upload and validation
│
├─ Tue-Wed: Loan Amortization
│   └─ Auto-generate repayment schedules
│
├─ Thu: Approval Workflow
│   └─ HR → Finance → Approved
│
└─ Fri: Overtime & Final Polish
    └─ Special overtime tax rules
```

---

## Quick Feature Matrix

### MUST HAVE 🔴 (Before First Real Payroll)
| Feature | Reason | Complexity | Days |
|---------|--------|-----------|------|
| Tax Calculation | Ghana compliance requirement | Medium | 2-3 |
| Payslips | Legal document required | High | 3-4 |
| PAYE Report | GRA submission required | Medium | 1 |
| SSNIT Report | SSNIT submission required | Medium | 1 |

### SHOULD HAVE 🟡 (Before Large Scale)
| Feature | Reason | Complexity | Days |
|---------|--------|-----------|------|
| Bulk Import | Onboard 50+ employees efficiently | Low | 2-3 |
| Tax Settings UI | Update rates when GRA announces changes | Low | 1-2 |
| Loan System | Common employee benefit | Medium | 2-3 |
| Bank Advice | Structured transfer format | Medium | 1 |

### NICE TO HAVE 🟠 (Post-Launch)
| Feature | Reason | Complexity | Days |
|---------|--------|-----------|------|
| Overtime Logic | Special tax rules | Low | 1-2 |
| Approval Workflow | Segregation of duties | Medium | 2-3 |
| CTC Report | Budget analysis | Low | 1 |

---

## Code Examples: What to Build

### Tax Calculation Service (Top Priority)
```typescript
// lib/services/tax-calculation-service.ts
export class TaxCalculationService {
  
  // Ghana PAYE Bands (Jan 2024) - configurable
  private PAYEBands = [
    { max: 490, rate: 0 },           // 0%
    { max: 600, rate: 0.05 },        // 5%
    { max: 730, rate: 0.10 },        // 10%
    { max: 3896.67, rate: 0.175 },   // 17.5%
    { max: 19896.67, rate: 0.25 },   // 25%
    { max: 50416.67, rate: 0.30 },   // 30%
    { max: Infinity, rate: 0.35 },   // 35%
  ]

  calculatePAYE(basicSalary: number): number {
    let tax = 0;
    let previousMax = 0;
    
    for (const band of this.PAYEBands) {
      const bandWidth = band.max - previousMax;
      if (basicSalary <= previousMax) break;
      
      const taxableInBand = Math.min(basicSalary, band.max) - previousMax;
      tax += taxableInBand * band.rate;
      previousMax = band.max;
    }
    return Math.round(tax * 100) / 100;
  }

  calculateSNIT(basicSalary: number): {
    employee: number;
    employer: number;
  } {
    const cap = 69000; // Monthly insurable ceiling Jan 2026
    const insurable = Math.min(basicSalary, cap);
    
    return {
      employee: Math.round(insurable * 0.055 * 100) / 100,
      employer: Math.round(insurable * 0.13 * 100) / 100,
    };
  }

  calculateTier3(basicSalary: number): number {
    // Voluntary, tax-exempt up to 16.5% of basic + SSNIT
    const maxContribution = basicSalary * 0.165;
    return maxContribution;
  }
}
```

### Payslip Generation (High Priority)
```typescript
// lib/services/payslip-service.ts
interface PayslipRow {
  description: string;
  amount: number;
  type: 'gross' | 'allowance' | 'deduction' | 'tax' | 'net';
}

export class PayslipService {
  
  async generatePayslip(payrollItemId: string): Promise<Payslip> {
    const item = await this.getPayrollItem(payrollItemId);
    const taxes = await this.taxService.calculateAll(item.basic_salary);
    
    const rows: PayslipRow[] = [
      { description: 'Basic Salary', amount: item.basic_salary, type: 'gross' },
      { description: 'Allowances', amount: item.allowances, type: 'allowance' },
      { description: 'PAYE Tax', amount: taxes.paye, type: 'tax' },
      { description: 'SSNIT Employee', amount: taxes.ssnit_employee, type: 'deduction' },
      { description: 'Loans', amount: item.loan_deduction, type: 'deduction' },
    ];
    
    const netPay = item.basic_salary + item.allowances - 
                   taxes.paye - taxes.ssnit_employee - item.loan_deduction;
    
    return {
      id: payrollItemId,
      employee: item.employee,
      period: item.period,
      lines: rows,
      netPay,
      generatedAt: new Date(),
    };
  }

  async exportPayslipPDF(payslipId: string): Promise<Buffer> {
    // Use puppeteer or jsPDF to generate PDF
  }
}
```

---

## Database Schema You'll Need

```sql
-- Tax configuration (versioned)
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  effective_date DATE,
  paye_bands JSONB,  -- Store as JSON array for flexibility
  ssnit_employee DECIMAL,
  ssnit_employer DECIMAL,
  ssnit_ceiling DECIMAL,
  created_at TIMESTAMP
);

-- Payslip storage
CREATE TABLE payslips (
  id UUID PRIMARY KEY,
  payroll_item_id UUID REFERENCES payroll_items(id),
  gross_pay DECIMAL,
  total_deductions DECIMAL,
  net_pay DECIMAL,
  generated_at TIMESTAMP
);

-- Amortization schedules for loans
CREATE TABLE amortization_schedules (
  id UUID PRIMARY KEY,
  loan_id UUID REFERENCES loans(id),
  month INT,
  payment_amount DECIMAL,
  balance DECIMAL
);
```

---

## Success Criteria

### Phase 1 Complete (Week 1)
- [ ] Can calculate PAYE correctly for all salary ranges
- [ ] Can calculate SSNIT with insurable ceiling
- [ ] Can generate printable payslips
- [ ] PAYE report matches manual calculation

### Phase 2 Complete (Week 2)
- [ ] All 8 reports generate correctly
- [ ] Tax rates configurable via UI
- [ ] Reports can be exported to CSV
- [ ] Bank advice format accepted by bank

### Phase 3 Complete (Week 3)
- [ ] Can bulk import 100+ employees
- [ ] Loan amortization schedules auto-generate
- [ ] Approval workflow tracks all changes
- [ ] All tests passing

---

## Risk Mitigation

### High Risks
| Risk | Mitigation |
|------|-----------|
| Tax calculations wrong | Get Jan 2024 GRA rates from official GRA circular before coding |
| Payslips don't match database | Implement calculation audit log |
| Reports incomplete | Use reference as checklist |

### Integration Points
- **GRA**: Verify PAYE bands in official circular
- **SSNIT**: Confirm current insurable ceiling
- **Banks**: Get format requirements for bank advice
- **Employees**: Test first payslip on real employee

---

## Quick Start: Which File to Edit First

1. **Start here:** `/lib/services/tax-calculation-service.ts` (new file)
2. **Then add:** `/lib/services/payslip-service.ts` (new file)
3. **Add database:** Via Supabase MCP (tax_rates table)
4. **Build UI:** `/app/app/payroll/generate-payslips/page.tsx` (new page)
5. **Add tests:** `/__tests__/services/tax-calculation.test.ts`

---

## Questions to Resolve Before Starting

- [ ] Confirm PAYE bands are still current (Jan 2024 rates shown above)?
- [ ] SSNIT insurable ceiling still GHS 69,000?
- [ ] What's the company's overtime policy (Sunday multiplier, etc.)?
- [ ] Do you need biometric integration for attendance?
- [ ] Any company-specific allowances/deductions?

This roadmap takes you from "incomplete system" to "production-ready Ghana payroll" in 3 weeks.
