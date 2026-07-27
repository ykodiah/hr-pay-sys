# Ghana Payroll Reports System - Implementation Summary

## Overview
Comprehensive payroll report generation system compliant with Ghana statutory requirements for monthly tax and contribution reporting. Supports 6 distinct report types with multi-section layouts, data isolation, and export capabilities.

## 1. Database Schema (Migration 081)

### New Tables
- **ghana_payroll_reports**: Caches generated reports for fast re-export
  - Fields: company_id, pay_period, report_type, report_data (JSONB), generated_by, created_at
  - RLS: HR/Admin/Finance roles only, company-scoped access
  
- **ghana_report_templates**: Customizable report templates per company
  - Fields: company_id, report_type, custom_header, footer_text, logo_url
  
- **allowance_types**: Catalog of allowed allowance classifications
  - Fields: id, company_id, name, code, description, is_active
  
- **deduction_types**: Catalog of allowed deduction classifications
  - Fields: id, company_id, name, code, policy_type (insurance/loan/other), description, is_active
  
- **payroll_deduction_details**: Links deductions to policy numbers for insurance tracking
  - Fields: id, employee_id, deduction_type_id, policy_number, effective_date, is_active

### Schema Enhancements
- **employees table additions**:
  - `ssnit_number` (VARCHAR): National SSNIT identifier
  - `nia_number` (VARCHAR): Ghana NIA identifier
  - `tier2_applicable` (BOOLEAN): Whether employee contributes to SSNIT Tier 2
  - `tier3_applicable` (BOOLEAN): Whether employee contributes to Provident Fund (Tier 3)
  - `insurance_policies` (JSONB): Maps deduction types to policy numbers
    ```json
    {
      "medical_insurance": "POL-2024-001",
      "life_insurance": "POL-2024-002",
      "nssf_loan": "LOAN-2024-100"
    }
    ```

## 2. Report Generation API Routes

All routes accept POST requests with `companyId` and `payPeriod` parameters.
All routes enforce role-based access control (HR/Admin/Finance only).

### /api/payroll/reports/ssnit-tier1
**SSNIT Tier 1 Contribution Report (13.5%)**
- Calculation: basic_salary × 0.135
- Columns: Staff ID, SSNIT Number, NIA Number, Surname, First Name, Other Names, Basic Salary, 13.50% Contribution, Code
- Required data: ssnit_number, nia_number on employees
- Used for: Monthly SSNIT statutory filing

### /api/payroll/reports/ssnit-tier2
**SSNIT Tier 2 Contribution Report (5%)**
- Calculation: basic_salary × 0.05 (only for tier2_applicable = true)
- Columns: Staff ID, SSNIT Number, NIA Number, Name, Basic Salary, 5% Contribution, Code
- Filtering: tier2_applicable flag must be true
- Used for: Secondary SSNIT contributions (occupational safety/pension supplementation)

### /api/payroll/reports/provident-fund
**Provident Fund (Tier 3) Deduction Report**
- Calculation: Uses tier3_employee value from payroll_items or calculates as % of basic
- Columns: Staff ID, SSNIT Number, NIA Number, Name, Basic Salary, % Deducted, Amount Deducted
- Filtering: tier3_applicable flag must be true
- Used for: Employee savings scheme contributions

### /api/payroll/reports/paye
**PAYE (Pay As You Earn) Tax Report**
- Special Rule: If basic_salary ≤ 1500 GHS
  - Overtime income only is taxed (applies overtime tax rate)
  - Total tax payable = overtime income tax amount
  - Basic salary is tax-free
- Standard Rule: If basic_salary > 1500 GHS
  - Standard tax calculations apply to all income components
- Columns: TIN, Name, Category, Non-Resident, Basic Salary, Allowances, Bonus, Monthly SSNIT, SSNIT Tier 2, Cash Advance, Loan Repayment, Unpaid Leave, Absent Days, 10% Minimum Income, Fixed Tax, Cash Benefit, Accommodation, Utilities, Vehicle Upkeep, Gratuity, Leave Encashment, Overtime, Leave Cash, Vehicle/Transport, Tax Deductible, Overtime Income, Overtime Tax, Total Payable, Relief, Chainage, Tax Due, Tax Deductible, Overtime Income, Overtime Tax, Total Payable, Relief, Chainage
- Used for: Monthly income tax filing with Ghana Revenue Authority

### /api/payroll/reports/allowances
**Allowances Report (Multi-Section)**
- Format: One section per allowance type on single export
- Per Section Columns: Staff ID, Full Name, Amount Issued (GHS)
- Section Header: "ALLOWANCE REPORT FOR [ALLOWANCE_TYPE]"
- Example: House Allowance, Transport Allowance, Meal Allowance, etc.
- Data Source: Extracts from payroll_items.allowances JSONB object
- Display: Each allowance type gets its own bordered section with subtotal

### /api/payroll/reports/deductions
**Deductions Report (Multi-Section)**
- Format: One section per deduction type on single export
- Per Section Columns: Staff ID, Full Name, Policy Number (if insurance), Amount Issued (GHS)
- Section Header: "DEDUCTION REPORT FOR [DEDUCTION_TYPE]"
- Example: Medical Insurance, Life Insurance, Loan, NSSF, etc.
- Data Source: Extracts from payroll_items.deductions JSONB object
- Policy Numbers: From employee.insurance_policies or payroll_deduction_details table
- Display: Each deduction type gets its own bordered section with subtotal

## 3. React Components

### ReportSelector.tsx
- Allows user to choose from 6 report types
- Displays icon and description per report
- Returns selected report type to parent

### PeriodSelector.tsx
- Month/year picker interface
- Defaults to current month
- Allows selection of previous 24 months
- Returns `{ month: number, year: number }` format

### StandardReportViewer.tsx
- Generic table viewer for SSNIT T1/T2, PF, PAYE reports
- Paginated rows with column headers
- Displays company name, ER number, pay period as header
- Calculates and displays subtotals/totals as appropriate

### AllowancesSectionViewer.tsx
- Multi-section display for allowances report
- Each allowance type in collapsible section
- Sections show:
  - Allowance type header with total amount
  - Expandable/collapsible table per type
  - Rows: Staff ID, Name, Amount
  - Subtotal per allowance type
- All sections on single page/export

### DeductionsSectionViewer.tsx
- Multi-section display for deductions report
- Each deduction type in collapsible section
- Sections show:
  - Deduction type header
  - Expandable/collapsible table per type
  - Rows: Staff ID, Name, Policy Number, Amount
  - Subtotal per deduction type
- Policy number column populated from employee.insurance_policies
- All sections on single page/export

### ExportButtons.tsx
- Three export format buttons: PDF, Excel, CSV
- PDF: Triggers browser print dialog (user saves as PDF)
- Excel: Downloads .xlsx file with report formatted
- CSV: Downloads .csv file with comma-separated values
- Disabled state when no report loaded

## 4. Export Utilities (lib/payroll/report-export.ts)

### Functions
- `exportStandardReportToExcel(header, columns, rows)`: Creates Excel workbook with styled header/data
- `exportStandardReportToCSV(header, columns, rows)`: Creates CSV with header info and data rows
- `exportAllowancesReportToExcel(header, sections)`: Multi-sheet Excel with section per allowance
- `exportAllowancesReportToCSV(header, sections)`: CSV with section headers per allowance
- `exportDeductionsReportToExcel(header, sections)`: Multi-sheet Excel with section per deduction
- `exportDeductionsReportToCSV(header, sections)`: CSV with section headers per deduction

### Excel Formatting
- Header row: Company name, ER number, report type, pay period
- Data rows: Proper alignment and formatting
- Currency columns: 2 decimal places
- Borders on all cells
- File naming: `[ReportType]_[PayPeriod]_[CompanyName].xlsx`

### CSV Format
- Header line: Company info (name, ER number, report type, period)
- Separator: Comma
- Quoting: Fields with commas quoted
- File naming: `[ReportType]_[PayPeriod]_[CompanyName].csv`

## 5. Reports Page (/app/payroll/reports/page.tsx)

### Workflow
1. User selects report type from ReportSelector dropdown
2. User selects/confirms pay period with PeriodSelector
3. System calls appropriate API route based on report type
4. API returns report data with calculated values
5. Appropriate viewer component displays report (Standard/Allowances/Deductions)
6. User can export to PDF/Excel/CSV or modify period and re-run

### State Management
- `selectedReport`: Currently selected report type
- `selectedPeriod`: { month, year } for the report period
- `report`: Full report data including header and rows/sections
- `isLoading`: API call in progress
- `error`: Error message if API fails

### Access Control
- Checks user role on page load
- Redirects non-HR/Finance users
- Shows company selector if multi-tenant

## 6. Navigation Integration

**File**: lib/navigation/app-nav-tree.ts
- Added "Ghana Reports" link under Payroll section
- Code: `payroll_reports`
- Href: `/app/payroll/reports`
- Appears between "Process Payroll" and "Tax Reliefs"

## 7. Data Isolation & Security

### Row-Level Security (RLS)
- All tables enforce company_id scoping
- Policies require authenticated user in employees table for same company
- HR/Admin/Finance role checks on sensitive operations

### API Endpoint Security
- `requireApiUser()` middleware verifies authentication
- Company access check: Ensures user belongs to company_id in request
- Role check: Verifies HR/Admin/Finance role for user in that company
- Prevents cross-company data leakage

### Data Privacy
- Report data cached only for requesting user's company
- Cache expiration: 7 days (configurable)
- No raw salary data exposed in public APIs

## 8. Calculation Rules

### SSNIT Tier 1 (13.5%)
```
Contribution = basic_salary × 0.135
```

### SSNIT Tier 2 (5%)
```
Contribution = basic_salary × 0.05 (if tier2_applicable = true)
```

### Provident Fund (Tier 3)
```
Deduction = basic_salary × tier3_percentage (typically 5-10%)
```

### PAYE - Special Low Income Rule
```
if basic_salary ≤ 1500:
  taxable_income = overtime_income_only
  tax_rate = overtime_tax_rate (typically higher)
  total_tax = overtime_tax_amount
else:
  taxable_income = all_income_components
  tax_rate = standard_rate
  total_tax = calculated_tax
```

### Allowances Report
```
For each allowance_type in payroll_items.allowances:
  Filter employees where allowance_type > 0
  Sum by employee_id
  Display in section with Staff ID, Name, Amount
  Calculate section subtotal
```

### Deductions Report
```
For each deduction_type in payroll_items.deductions:
  Filter employees where deduction_type > 0
  Get policy_number from employee.insurance_policies[deduction_type]
  Display in section with Staff ID, Name, Policy Number, Amount
  Calculate section subtotal
```

## 9. Usage Instructions

### For HR/Finance Users
1. Navigate to Payroll → Ghana Reports
2. Select report type from dropdown (SSNIT T1, T2, PF, PAYE, Allowances, Deductions)
3. Select pay period (month/year)
4. Click "Generate Report"
5. Review report in viewer
6. Export to PDF (print), Excel, or CSV as needed
7. Submit to appropriate government/regulatory body

### For System Administrators
1. Run migration 081: `psql -d your_db -f scripts/081_ghana_payroll_reports_schema.sql`
2. Update employee records with ssnit_number, nia_number, tier2_applicable, tier3_applicable
3. Populate insurance_policies JSONB for employees with insurance deductions
4. Deploy updated application
5. Users can access Ghana Reports from Payroll section

## 10. Compliance Notes

- Reports comply with Ghana National Pensions Authority (NPA) requirements for SSNIT reporting
- PAYE calculations aligned with Ghana Revenue Authority (GRA) directives
- Low-income earner rule (basic ≤ 1500) matches GRA guidance
- Report format matches standard Ghanaian statutory templates
- All data properly isolated per company (multi-tenant safe)
- Audit trail: report_generated_by and timestamps recorded

## 11. Future Enhancements

- Batch report generation for multiple periods
- Email delivery of reports to finance team
- Automatic filing integration with government portals
- Historical report archival and retrieval
- Report approval workflow before export
- Variance analysis reports (month-over-month comparisons)
