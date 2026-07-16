# Employee Count Tracking in Payroll Processing

## Overview
The payroll processing system now tracks and displays the number of employees being processed throughout the entire flow, providing clear feedback to users about progress and completion.

## Implementation Details

### Frontend (`/app/app/payroll/page.tsx`)

#### 1. Button UI
```tsx
<Button onClick={handleRunPayroll} disabled={processing || !rows.length || !companyId}>
  {processing ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <Zap className="h-4 w-4 mr-2" />
  )}
  Run Payroll
</Button>
```

#### 2. Handler Function - `handleRunPayroll()`
- Counts employees in the current worksheet
- Sends them to the API
- Displays success with format: **"X of Y employee(s) saved"**

```tsx
const employeesToRun = selected.length ? selected : rows  // Select which employees
// Build row payload with all required fields
rows: employeesToRun.map((r) => ({
  employeeId: r.employeeId,
  name: r.name,
  // ... all other fields
}))
```

#### 3. Success Message
```tsx
toast({
  title: "✓ Payroll run complete",
  description: `${processed} of ${employeesToRun.length} employee(s) saved...`
})
```

**Display Format**:
- If all employees succeed: `"3 of 3 employee(s) saved"`
- If some fail: `"2 of 3 employee(s) saved with 1 warning(s)"`
- With errors list if applicable

### Backend (`/app/api/payroll/process/route.ts`)

#### 1. Request Parsing
```typescript
const worksheetRows = Array.isArray(rows) 
  ? rows.filter((r) => r && r.employeeId) 
  : []  // Only count rows with employeeId
```

#### 2. Processing Loop
```typescript
for (const row of rows) {
  // Validate and process each employee
  // On success: processed++
  // On error: errors.push(errorMessage)
}
```

#### 3. Response with Counts
```json
{
  "success": true,
  "processed": 3,
  "errors": [],
  "run": { /* payroll_run details */ },
  "meta": { 
    "fetched_at": "2026-07-16T19:30:00Z",
    "source": "worksheet"
  }
}
```

### Database Updates

#### `payroll_runs` Table
```sql
UPDATE payroll_runs SET
  total_gross_pay = SUM(gross_pay_all_employees),
  total_deductions = SUM(total_deductions_all_employees),
  total_net_pay = SUM(net_pay_all_employees),
  status = 'completed'  -- or 'pending' for approval
WHERE id = run_id;
```

#### `payroll_items` Table (one row per employee)
```sql
INSERT INTO payroll_items (
  id, payroll_run_id, employee_id, company_id,
  basic_salary, gross_pay, net_pay, ...
) VALUES (...)
```

#### `payslips` Table (one row per employee)
```sql
INSERT INTO payslips (
  id, payroll_run_id, employee_id, company_id,
  gross_pay, paye_tax, total_deductions, net_pay, ...
) VALUES (...)
```

## Data Flow Example

### User Action: Click "Run Payroll"
1. **Frontend** collects 3 employees from worksheet
2. **API Request** sends:
   ```json
   {
     "company_id": "00000000-0000-0000-0000-000000000001",
     "pay_period": "2026-07",
     "rows": [
       { "employeeId": "emp1", "name": "Agnes", "grossPay": 14333.33, ... },
       { "employeeId": "emp2", "name": "Priscilla", "grossPay": 8250, ... },
       { "employeeId": "emp3", "name": "Yaw", "grossPay": 25000, ... }
     ]
   }
   ```

3. **Backend** processes:
   - Creates/updates payroll_run
   - For each employee: INSERT into payroll_items + payslips
   - Returns: `{ processed: 3, errors: [] }`

4. **Frontend** displays:
   - Toast: **"✓ Payroll run complete"**
   - Message: **"3 of 3 employee(s) saved. View payslips and reports."**
   - Summary card updates: "Run approved · 3 items"

## Error Scenarios

### Scenario 1: All Fail (0 processed)
```json
{
  "processed": 0,
  "errors": ["Employee 1: missing employeeId", "Employee 2: invalid salary", ...],
  "status": 422
}
```
→ Shows: **"Run failed"** with error count

### Scenario 2: Partial Success (1 processed, 2 errors)
```json
{
  "processed": 1,
  "errors": ["Employee 2: constraint violation", "Employee 3: duplicate"],
  "status": 422
}
```
→ Shows: **"1 of 3 employee(s) saved with 2 warning(s)"**

### Scenario 3: Success (All processed)
```json
{
  "processed": 3,
  "errors": [],
  "status": 200
}
```
→ Shows: **"3 of 3 employee(s) saved"** (green)

## Summary Statistics Updated

After payroll run completes, the summary cards display:
- **Employees**: 3 (or current count)
- **Gross Pay**: GHS 47,583.33
- **Deductions**: GHS 15,991.31
- **Net Pay**: GHS 31,592.02

Plus status badge: **"Run approved · 3 items"** or **"Run draft · 3 items"**

## Column Displayed in UI

### Payroll Worksheet Shows:
- ✓ Employee ID
- ✓ Employee Name  
- ✓ Department
- ✓ Basic Salary
- ✓ Allowances
- ✓ Overtime
- ✓ Gross Pay
- ✓ Provident Fund
- ✓ SSNIT Employee
- ✓ Taxable Income
- ✓ PAYE Tax
- ✓ Loan Deduction
- ✓ Advance Deduction
- ✓ Other Deductions
- ✓ Total Deductions
- ✓ Net Pay
- ✓ Totals Row: Sums of all above

## Performance Optimization

- **Selected Rows**: If user selects specific employees (checkboxes), only process selected ones
- **Batch Processing**: All employees processed in single API call (no N+1 queries)
- **Indexes**: Added indexes on `payroll_run_id`, `company_id`, `pay_period` for fast lookups
- **Service Role**: Bypasses RLS checks, faster inserts

## Testing Employee Count Updates

```bash
# Test Case 1: Full payroll run
- Load 3 employees via "Sync from DB"
- Click "Run Payroll"
- Expected: "3 of 3 employee(s) saved"

# Test Case 2: Select specific employees
- Load employees, select checkbox on 2 of 3
- Click "Run Payroll"
- Expected: "2 of 2 employee(s) saved"

# Test Case 3: Error handling
- Manually corrupt employee data
- Click "Run Payroll"
- Expected: Show error count in message
```
