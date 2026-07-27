# Custom Report Template Builder System

## Overview

A comprehensive, reusable framework for creating Ghana payroll reports without code duplication. Once defined, reports are automatically handled for data fetching, transformation, exporting, and caching.

## What's Included

### 1. **Report Template Builder Framework**
   - **File**: `lib/payroll/report-template-builder.ts` (348 lines)
   - **Components**:
     - `ReportTemplateRegistry`: Central registry for all reports
     - `CustomReportDefinition`: Type-safe report specification interface
     - `ReportColumn`: Flexible column definitions with formatting
     - `DataTransformRule`: Data source and transformation logic
     - `ReportHelper`: Utility functions for formatting and calculations
     - `ReportResponse`: Standard response format

### 2. **Comprehensive Developer Guide**
   - **File**: `docs/CUSTOM_REPORT_BUILDER_GUIDE.md` (486 lines)
   - **Covers**:
     - Step-by-step report creation guide
     - Template component explanations
     - Helper functions reference
     - Ghana compliance field configuration
     - Multi-section report handling
     - Export customization
     - Common report templates (examples)
     - Troubleshooting guide
     - Best practices

### 3. **Ready-to-Use Example Reports**
   - **File**: `lib/payroll/custom-reports-examples.ts` (336 lines)
   - **5 Example Reports**:
     1. **Compliance Summary** - All statutory deductions consolidated
     2. **Net Pay Summary** - Gross, deductions, net pay per employee
     3. **Remittance Schedule** - Amounts due to SSNIT/GRA/Insurance
     4. **Social Security Summary** - Complete SSNIT contribution breakdown
     5. **Tax Reconciliation** - Month-by-month PAYE tracking

## How to Create a New Report

### Quick Start (3 Minutes)

1. **Define your report** in `lib/payroll/custom-reports.ts`:
```typescript
const myReport: CustomReportDefinition = {
  id: 'my_report',
  name: 'My Report',
  description: 'Report description',
  category: 'summary',
  type: 'standard',
  icon: 'BarChart3',
  
  columns: [
    { label: 'Staff ID', key: 'staff_id', type: 'string' },
    { label: 'Amount', key: 'amount', type: 'currency' },
  ],
  
  dataTransform: {
    source: 'payroll_items',
    filters: { status: { $ne: 'cancelled' } },
  },
  
  calculations: {
    total: (rows) => ReportHelper.calculateSubtotal(rows, 'amount'),
  },
}

ReportTemplateRegistry.register(myReport)
```

2. **Create API route** at `/api/payroll/reports/my-report/route.ts` (copy template from guide)

3. **Add to reports page** dropdown

4. **Done!** Report is now accessible with full export support

## Key Features

### Type-Safe Definitions
- Define reports with TypeScript interfaces
- Automatic validation at compile time
- Full IDE autocomplete support

### Flexible Data Transformation
- Support for payroll_items, employees, or custom queries
- Nested field access: `'employee.full_name'`
- Calculated fields with custom functions
- Automatic grouping for multi-section reports

### Smart Column Handling
```typescript
columns: [
  { label: 'Amount', key: 'amount', type: 'currency' },
  // Automatically formats as: GHS 1,234.56
  
  { label: 'Rate', key: 'rate', type: 'percentage' },
  // Automatically formats as: 13.50%
  
  { label: 'Date', key: 'date', type: 'date' },
  // Automatically formats as: 15 January 2024
]
```

### Built-In Calculations
```typescript
calculations: {
  total_salary: (rows) => ReportHelper.calculateSubtotal(rows, 'salary'),
  // Sums all salary values automatically
  
  average_salary: (rows) => 
    ReportHelper.calculateSubtotal(rows, 'salary') / rows.length,
}
```

### Export Customization
- PDF: Via browser print dialog
- Excel: Styled with proper column widths and formatting
- CSV: With proper escaping and quoting
- File naming: Automatic with date and period

### Ghana Compliance
```typescript
complianceFields: {
  erNumberRequired: true,      // Company ER number in header
  ssnitNumberRequired: true,   // SSNIT # in columns
  niaNumberRequired: true,     // NIA # in columns
  policyNumberRequired: true,  // Policy # for insurance deductions
}
```

### Performance & Caching
```typescript
cacheDuration: 3600  // Cache for 1 hour
// Prevents redundant recalculation
// Users can re-export without waiting
```

### Role-Based Access
```typescript
requiredRoles: ['HR', 'Admin', 'Finance']
// Automatically enforced on API endpoint
// Prevents unauthorized access
```

## Helper Functions

```typescript
// Format Ghana currency
ReportHelper.formatGHS(1000) // "GHS 1,000.00"

// Format percentage
ReportHelper.formatPercentage(0.135) // "13.50%"

// Format date
ReportHelper.formatDate(new Date()) // "15 January 2024"

// Calculate subtotal
ReportHelper.calculateSubtotal(rows, 'salary') // Sum of all values

// Get nested value
ReportHelper.getNestedValue(row, 'employee.full_name') // Safe access

// Group rows
const groups = ReportHelper.groupBy(rows, 'department') // Map<key, rows>

// Build filename
ReportHelper.buildFileName('Payroll', 'JUN_2024', 'xlsx')
// "PAYROLL_JUN_2024_2024-01-15.xlsx"
```

## Example Reports Provided

### 1. Compliance Summary
- **Purpose**: View all statutory deductions at once
- **Columns**: Staff ID, Name, SSNIT T1, SSNIT T2, PAYE, Total
- **Use Case**: Compliance verification, audit trail
- **Status**: Ready to use

### 2. Net Pay Summary
- **Purpose**: Gross pay less deductions
- **Columns**: Staff ID, Name, Basic, Allowances, Gross, Deductions, Net
- **Use Case**: Payroll verification, HR reports
- **Status**: Ready to use

### 3. Remittance Schedule
- **Purpose**: What's due to government/insurance
- **Columns**: Payee, Account, Amount, Due Date, Status
- **Use Case**: Finance planning, payment scheduling
- **Status**: Ready to use

### 4. Social Security Summary
- **Purpose**: Complete SSNIT breakdown
- **Columns**: Staff ID, SSNIT #, T1 Employee, T1 Employer, T2, Total
- **Use Case**: SSNIT reconciliation, statutory filing
- **Status**: Ready to use

### 5. Tax Reconciliation
- **Purpose**: Running total of taxes per employee
- **Columns**: TIN, Name, This Month, YTD, Relief, Net Payable
- **Use Case**: Tax compliance, GRA reconciliation
- **Status**: Ready to use

## File Structure

```
lib/payroll/
├── report-template-builder.ts      # Framework (348 lines)
├── custom-reports-examples.ts      # Example reports (336 lines)
├── report-export.ts                # Export utilities (existing)
└── custom-reports.ts               # Your custom reports (create)

docs/
├── CUSTOM_REPORT_BUILDER_GUIDE.md  # Developer guide (486 lines)

scripts/
└── 081_ghana_payroll_reports_schema.sql  # Database schema (existing)

app/api/payroll/reports/
├── ssnit-tier1/route.ts            # Existing reports
├── ssnit-tier2/route.ts
├── paye/route.ts
├── [reportId]/route.ts             # Template for custom routes

app/app/payroll/
├── reports/page.tsx                # Main reports page
```

## Usage Workflow

1. **Define**: Write `CustomReportDefinition` in TypeScript
2. **Register**: Call `ReportTemplateRegistry.register(myReport)`
3. **Route**: Create API endpoint at `/api/payroll/reports/[id]`
4. **UI**: Add to dropdown in reports page
5. **Export**: Users can PDF/Excel/CSV automatically
6. **Cache**: System caches results for fast re-export

## Integration Points

The template system integrates with:
- **Existing 6 reports**: SSNIT T1/T2, Provident Fund, PAYE, Allowances, Deductions
- **Supabase**: Data fetching and row-level security
- **Export utilities**: PDF/Excel/CSV generation
- **Navigation**: Reports page discovery
- **Auth**: Role-based access control

## Future Enhancements

The framework supports:
- Scheduled report generation
- Email delivery of reports
- Webhook notifications
- Custom report templates per company
- Report versioning and history
- Comparative reports (YoY, month-over-month)
- Drill-down capabilities
- Interactive dashboards

## Commit History

- **03591b9**: Custom Report Template Builder System implementation
  - Report template framework
  - Developer guide with examples
  - 5 ready-to-use report templates
  - Helper functions and utilities

## Next Steps

1. **Build Skipped Report**: Which report did you unknowingly skip?
   - One of the 5 examples above?
   - A Ghana statutory report (e.g., Remittance, Tax Summary)?
   - A custom report specific to your needs?

2. **Use the Template System**:
   - Copy an example from `custom-reports-examples.ts`
   - Modify columns and calculations
   - Register and deploy

3. **Create Additional Reports**:
   - Reference the guide for step-by-step instructions
   - Use `ReportHelper` functions for consistency
   - Follow naming conventions

Please let me know which report was skipped, and I'll build it using this new template system!

