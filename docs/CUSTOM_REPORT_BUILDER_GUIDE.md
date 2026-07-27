# Custom Report Builder Guide

## Overview

The Custom Report Template System enables rapid creation of new Ghana payroll reports without duplicating code. Define report metadata, columns, and data transformation logic—the framework handles API routes, export formatting, caching, and permissions.

## Architecture

```
ReportTemplateRegistry (Central Registry)
    ↓
CustomReportDefinition (Report Spec)
    ↓
ReportTemplateBuilder (Data Processing)
    ↓
API Route (Handler)
    ↓
Export Utilities (PDF/Excel/CSV)
```

## Step-by-Step: Creating a New Report

### Step 1: Define Report Structure

Create a new report definition in `lib/payroll/custom-reports.ts`:

```typescript
import { CustomReportDefinition, ReportTemplateRegistry, ReportHelper } from '@/lib/payroll/report-template-builder'

const complianceSummaryReport: CustomReportDefinition = {
  // Metadata
  id: 'compliance_summary',
  name: 'Compliance Summary',
  description: 'All statutory deductions and contributions consolidated',
  category: 'compliance',
  type: 'standard',
  icon: 'CheckCircle',
  color: 'green',
  priority: 85,

  // Display Columns
  columns: [
    { label: 'Staff ID', key: 'employee_id', type: 'string', width: 12 },
    { label: 'Name', key: 'employee.full_name', type: 'string', width: 25 },
    { label: 'Basic Salary', key: 'basic_salary', type: 'currency', width: 15 },
    { label: 'SSNIT T1 (13.5%)', key: 'ssnit_tier1', type: 'currency', width: 15 },
    { label: 'SSNIT T2 (5%)', key: 'ssnit_tier2', type: 'currency', width: 12 },
    { label: 'PAYE Tax', key: 'paye_tax', type: 'currency', width: 12 },
    { label: 'Total Contributions', key: 'total_contributions', type: 'currency', width: 18 },
  ],

  // Data Source
  dataTransform: {
    source: 'payroll_items',
    filters: {
      company_id: 'current_company',
      pay_period: 'selected_period',
      status: { $ne: 'cancelled' },
    },
    // Add calculated fields
    calculated: {
      total_contributions: (row) => {
        return (row.ssnit_tier1 || 0) + (row.ssnit_tier2 || 0) + (row.paye_tax || 0)
      },
    },
  },

  // Totals and Summaries
  calculations: {
    total_ssnit_t1: (rows) => ReportHelper.calculateSubtotal(rows, 'ssnit_tier1'),
    total_ssnit_t2: (rows) => ReportHelper.calculateSubtotal(rows, 'ssnit_tier2'),
    total_paye: (rows) => ReportHelper.calculateSubtotal(rows, 'paye_tax'),
    total_all_contributions: (rows) => ReportHelper.calculateSubtotal(rows, 'total_contributions'),
  },

  // Ghana Compliance
  complianceFields: {
    erNumberRequired: true,
    ssnitNumberRequired: true,
  },

  // Permissions
  requiredRoles: ['HR', 'Admin', 'Finance'],
  cacheDuration: 3600, // 1 hour
}

// Register the report
ReportTemplateRegistry.register(complianceSummaryReport)
```

### Step 2: Create API Route

Create `/app/api/payroll/reports/[reportId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiUser } from '@/lib/auth/api-user'
import { ReportTemplateRegistry, ReportResponse } from '@/lib/payroll/report-template-builder'

export async function POST(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { companyId, payPeriod } = await request.json()
    if (!companyId || !payPeriod) {
      return NextResponse.json({ error: 'Missing companyId or payPeriod' }, { status: 400 })
    }

    // Get report template
    const template = ReportTemplateRegistry.get(params.reportId)
    if (!template) {
      return NextResponse.json({ error: 'Report template not found' }, { status: 404 })
    }

    // Check permissions
    const client = await createClient()
    const { data: employee } = await client
      .from('employees')
      .select('id')
      .eq('id', user.id)
      .eq('company_id', companyId)
      .in('special_role', template.requiredRoles)
      .single()

    if (!employee) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch and process data
    const { data: payrollData } = await client
      .from('payroll_items')
      .select(`
        employee_id,
        basic_salary,
        ssnit_tier1_employee,
        ssnit_tier2_employee,
        paye_tax,
        employees!inner(id, employee_id_no, full_name)
      `)
      .eq('company_id', companyId)
      .eq('pay_period', payPeriod)
      .neq('status', 'cancelled')

    // Apply custom transformations
    const processedData = (payrollData || []).map((row: any) => {
      const processed = { ...row }
      if (template.dataTransform.calculated) {
        Object.entries(template.dataTransform.calculated).forEach(([key, calc]) => {
          processed[key] = (calc as Function)(row)
        })
      }
      return processed
    })

    // Calculate totals
    const totals: Record<string, number> = {}
    if (template.calculations) {
      Object.entries(template.calculations).forEach(([key, calc]) => {
        totals[key] = (calc as Function)(processedData)
      })
    }

    // Get company details
    const { data: company } = await client.from('companies').select('name, er_number').eq('id', companyId).single()

    const response: ReportResponse = {
      success: true,
      report: {
        reportType: template.name,
        reportName: template.name,
        companyName: company?.name || '',
        companyErNumber: company?.er_number,
        payPeriod,
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        rows: processedData,
        columns: template.columns,
        totals,
        exportFileName: `${template.id}_${payPeriod}.xlsx`,
        exportFormats: ['pdf', 'excel', 'csv'],
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[v0] Report generation error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
```

### Step 3: Add to Reports Page

Update `/app/app/payroll/reports/page.tsx` to include the new report:

```typescript
const REPORT_OPTIONS: ReportType[] = [
  'ssnit_tier1',
  'ssnit_tier2',
  'provident_fund',
  'paye',
  'allowances',
  'deductions',
  'compliance_summary', // Add your report
]

const REPORT_INFO: Record<ReportType, ReportInfo> = {
  ssnit_tier1: { label: 'SSNIT Tier 1', icon: Building2 },
  ssnit_tier2: { label: 'SSNIT Tier 2', icon: Building2 },
  provident_fund: { label: 'Provident Fund', icon: PiggyBank },
  paye: { label: 'PAYE Tax', icon: Receipt },
  allowances: { label: 'Allowances', icon: DollarSign },
  deductions: { label: 'Deductions', icon: Minus },
  compliance_summary: { label: 'Compliance Summary', icon: CheckCircle }, // Add here
}
```

### Step 4: Add Navigation Link

Update `lib/navigation/app-nav-tree.ts`:

```typescript
// In the Payroll section
items: [
  { code: 'payroll_reports_compliance', name: 'Compliance Summary', href: '/app/payroll/reports?type=compliance_summary' },
  // ... other reports
]
```

## Template Components Explained

### CustomReportDefinition

```typescript
{
  id: string              // Unique identifier (snake_case)
  name: string           // Display name
  description: string    // For UI tooltips
  category: string       // ssnit | tax | allowance | deduction | summary | compliance | other
  type: string          // 'standard' | 'multi-section'
  
  columns: ReportColumn[] // Column definitions
  dataTransform: {
    source: string      // payroll_items | employees | custom_query
    filters: Record     // Filter conditions
    calculated: Record  // Add computed fields
  }
  
  calculations: Record  // Totals and summaries
  complianceFields: {} // Ghana statutory requirements
  requiredRoles: []    // Permission check
  icon: string         // Lucide icon name
  color: string        // UI color (blue, green, etc)
  priority: number     // Order in list (0-100)
  cacheDuration: number // Seconds
}
```

### ReportColumn

```typescript
{
  label: string        // Header text
  key: string         // Data field (supports nested: 'employee.name')
  type: string        // string | number | currency | percentage | date | boolean
  width?: number      // Excel column width
  visible?: boolean   // Show by default
  format?: Function   // Custom formatter
  exportWidth?: number // Export-specific width
}
```

### Column Type Formatting

```typescript
// Automatic formatting by type:

'currency'    → 1000 → GHS 1,000.00 (Ghana format)
'percentage'  → 0.135 → 13.5%
'date'        → '2024-01-15' → 15 January 2024
'number'      → 1000.5 → 1,000.50
'string'      → 'John' → John
'boolean'     → true → Yes / false → No
```

## Multi-Section Reports

For reports like Allowances/Deductions that have multiple sections:

```typescript
{
  id: 'benefits_by_type',
  name: 'Benefits by Type',
  type: 'multi-section',
  sectionKey: 'benefit_type', // Grouping field
  
  columns: [
    { label: 'Staff ID', key: 'staff_id', type: 'string' },
    { label: 'Name', key: 'employee_name', type: 'string' },
    { label: 'Amount', key: 'amount', type: 'currency' },
  ],
  
  dataTransform: {
    source: 'payroll_items',
    groupBy: 'benefit_type', // Creates separate sections
    calculated: { /* ... */ },
  },
}
```

The API will automatically:
- Group rows by `sectionKey`
- Create separate sections with headers
- Calculate subtotals per section
- Return as `{ sections: [...] }` instead of `{ rows: [...] }`

## Helper Functions

```typescript
// Format Ghana currency
ReportHelper.formatGHS(1000) // "GHS 1,000.00"

// Format percentage
ReportHelper.formatPercentage(0.135) // "13.50%"

// Format date
ReportHelper.formatDate(new Date()) // "15 January 2024"

// Calculate subtotal
ReportHelper.calculateSubtotal(rows, 'salary') // Sum of all salary values

// Get nested value
ReportHelper.getNestedValue(row, 'employee.full_name') // Supports dots

// Group rows
const groups = ReportHelper.groupBy(rows, 'department')

// Build export filename
ReportHelper.buildFileName('Payroll Summary', 'JUN_2024', 'xlsx')
// "PAYROLL_SUMMARY_JUN_2024_2024-01-15.xlsx"
```

## Ghana Compliance Fields

Use `complianceFields` to ensure statutory requirements:

```typescript
complianceFields: {
  erNumberRequired: true,      // ER number in header
  ssnitNumberRequired: true,   // SSNIT # in columns
  niaNumberRequired: true,     // NIA # in columns
  policyNumberRequired: true,  // Policy # for insurance
}
```

## Export Configuration

Customize export behavior:

```typescript
{
  cacheDuration: 3600,           // Cache 1 hour
  exportFormats: ['pdf', 'excel', 'csv'],
  columns: [
    {
      label: 'Amount',
      key: 'amount',
      type: 'currency',
      width: 15,        // Default width
      exportWidth: 20,  // Override for Excel
    }
  ]
}
```

## Testing Your Report

1. **Register the template**:
   ```typescript
   import { complianceSummaryReport } from '@/lib/payroll/custom-reports'
   ReportTemplateRegistry.register(complianceSummaryReport)
   ```

2. **Test the API**:
   ```bash
   curl -X POST http://localhost:3000/api/payroll/reports/compliance_summary \
     -H "Content-Type: application/json" \
     -d '{ "companyId": "company-uuid", "payPeriod": "JUN_2024" }'
   ```

3. **Verify in UI**:
   - Navigate to /app/payroll/reports
   - Should see "Compliance Summary" in dropdown
   - Select it, pick period, click Generate
   - View and export

## Common Report Templates

### 1. Net Pay Summary
```typescript
{
  id: 'net_pay_summary',
  columns: [
    { label: 'Staff ID', key: 'staff_id', type: 'string' },
    { label: 'Name', key: 'name', type: 'string' },
    { label: 'Gross Pay', key: 'gross_pay', type: 'currency' },
    { label: 'Total Deductions', key: 'total_deductions', type: 'currency' },
    { label: 'Net Pay', key: 'net_pay', type: 'currency' },
  ],
  // ...
}
```

### 2. Social Security Summary
```typescript
{
  id: 'ss_summary',
  columns: [
    { label: 'Staff ID', key: 'staff_id', type: 'string' },
    { label: 'SSNIT T1 Employee', key: 'ssnit_t1_emp', type: 'currency' },
    { label: 'SSNIT T1 Employer', key: 'ssnit_t1_emp', type: 'currency' },
    { label: 'SSNIT T2', key: 'ssnit_t2', type: 'currency' },
    { label: 'Provident Fund', key: 'pf', type: 'currency' },
  ],
  // ...
}
```

### 3. Tax Reconciliation
```typescript
{
  id: 'tax_reconciliation',
  columns: [
    { label: 'TIN', key: 'tin', type: 'string' },
    { label: 'Name', key: 'name', type: 'string' },
    { label: 'Previous Month', key: 'prev_tax', type: 'currency' },
    { label: 'Current Tax', key: 'current_tax', type: 'currency' },
    { label: 'Adjustment', key: 'adjustment', type: 'currency' },
    { label: 'Running Total', key: 'running_total', type: 'currency' },
  ],
  // ...
}
```

## Best Practices

1. **Naming Convention**:
   - Report ID: `snake_case` (e.g., `net_pay_summary`)
   - Display Name: Title Case (e.g., "Net Pay Summary")
   - Icon: PascalCase from lucide-react (e.g., `DollarSign`)

2. **Data Transformation**:
   - Keep calculations simple and reusable
   - Use `ReportHelper` functions for formatting
   - Support nested object access with dots

3. **Performance**:
   - Set appropriate cache duration
   - Filter data at source (in dataTransform)
   - Limit calculated fields to necessary ones

4. **Ghana Compliance**:
   - Always include ER number in header
   - Include SSNIT/NIA for applicable reports
   - Validate policy numbers for insurance reports
   - Format currency in GHS

5. **User Experience**:
   - Use intuitive column labels
   - Set appropriate column widths
   - Provide meaningful descriptions
   - Use consistent icons and colors

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Template not appearing in UI | Check `ReportTemplateRegistry.register()` called, rebuild app |
| Data not showing | Verify `dataTransform.source` matches available tables |
| Export formatting wrong | Check column `type` (currency vs number), use `format` function |
| Permissions denied | Ensure user role in `requiredRoles` array |
| Slow performance | Add filters in `dataTransform`, increase `cacheDuration` |

