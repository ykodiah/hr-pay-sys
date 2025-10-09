# Database Schema Sync Guide

This guide explains how to sync your Supabase database with the latest employee module changes.

## What's New

### 1. Annual Salary Field
- **Column**: `annual_salary` in `employee_financial` table
- **Type**: `DECIMAL(12,2)`
- **Purpose**: Store annual salary and auto-calculate monthly salary (annual ÷ 12)
- **Required**: Yes (validation in the UI)

### 2. Custom Banks Table
- **Table**: `custom_banks`
- **Purpose**: Allow companies to add custom banks beyond the default Ghanaian banks list
- **Features**:
  - Company-specific custom banks
  - Unique constraint per company
  - Row Level Security (RLS) enabled
  - Audit trail with created_by and timestamps

## Migration Scripts

### Primary Migration Script
**File**: `scripts/039_sync_employee_financial_schema.sql`

This is the main script that:
- ✅ Adds `annual_salary` column if missing
- ✅ Creates `custom_banks` table if missing
- ✅ Sets up RLS policies
- ✅ Creates helper functions
- ✅ Adds performance indexes
- ✅ Verifies all changes

### How to Run

#### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire content from `scripts/039_sync_employee_financial_schema.sql`
5. Paste and click **Run**
6. Check the output for verification messages

#### Option 2: Supabase CLI
\`\`\`bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
\`\`\`

#### Option 3: Direct PostgreSQL Connection
\`\`\`bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/039_sync_employee_financial_schema.sql
\`\`\`

## Verification

After running the migration, verify the changes:

\`\`\`sql
-- Check annual_salary column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employee_financial'
AND column_name = 'annual_salary';

-- Check custom_banks table
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'custom_banks';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'custom_banks';

-- Test the helper function
SELECT * FROM get_company_banks(NULL) LIMIT 5;
\`\`\`

## Expected Results

### Annual Salary Column
\`\`\`
column_name   | data_type | is_nullable
--------------+-----------+-------------
annual_salary | numeric   | YES
\`\`\`

### Custom Banks Table Structure
\`\`\`
Column       | Type                        | Nullable
-------------+-----------------------------+----------
id           | uuid                        | NOT NULL
company_id   | uuid                        | NOT NULL
bank_name    | character varying(255)      | NOT NULL
created_at   | timestamp with time zone    | YES
updated_at   | timestamp with time zone    | YES
created_by   | uuid                        | YES
is_active    | boolean                     | YES
\`\`\`

### RLS Policies
- `custom_banks_select_policy` - Allow SELECT
- `custom_banks_insert_policy` - Allow INSERT
- `custom_banks_update_policy` - Allow UPDATE
- `custom_banks_delete_policy` - Allow DELETE

## Testing the Changes

### 1. Test Annual Salary
\`\`\`sql
-- Insert test employee financial record
INSERT INTO employee_financial (employee_id, annual_salary, monthly_salary)
VALUES (
  'YOUR_EMPLOYEE_ID',
  60000.00,
  5000.00
);

-- Verify the data
SELECT employee_id, annual_salary, monthly_salary
FROM employee_financial
WHERE employee_id = 'YOUR_EMPLOYEE_ID';
\`\`\`

### 2. Test Custom Banks
\`\`\`sql
-- Add a custom bank
INSERT INTO custom_banks (company_id, bank_name, created_by)
VALUES (
  'YOUR_COMPANY_ID',
  'My Custom Bank',
  'YOUR_USER_ID'
);

-- Get all banks for a company
SELECT * FROM get_company_banks('YOUR_COMPANY_ID');
\`\`\`

## Troubleshooting

### Issue: Column already exists
**Solution**: The script handles this automatically with `IF NOT EXISTS` checks.

### Issue: RLS policies conflict
**Solution**: The script drops existing policies before creating new ones.

### Issue: Permission denied
**Solution**: Ensure you're running the script with sufficient database privileges (postgres user or equivalent).

### Issue: Function not found
**Solution**: Make sure the `get_company_banks` function was created successfully. Check for any errors in the migration output.

## Rollback

If you need to rollback the changes:

\`\`\`sql
BEGIN;

-- Remove the helper function
DROP FUNCTION IF EXISTS get_company_banks(UUID);

-- Remove custom banks table
DROP TABLE IF EXISTS custom_banks CASCADE;

-- Remove annual salary column
ALTER TABLE employee_financial DROP COLUMN IF EXISTS annual_salary;

COMMIT;
\`\`\`

## New Employee Card Component

A reusable employee card component has been added at `components/employee-card.tsx` with three variants:

### Variants
1. **full** - Full-width horizontal layout (default for employee lists)
2. **compact** - Grid-friendly card with avatar and details
3. **minimal** - Compact card for quick lists

### Usage Example
\`\`\`tsx
import { EmployeeCard } from "@/components/employee-card"

<EmployeeCard
  employee={employee}
  variant="full"
  showActions={true}
  showSalary={true}
  onView={(emp) => console.log("View", emp)}
  onEdit={(emp) => console.log("Edit", emp)}
  onDelete={(emp) => console.log("Delete", emp)}
  formatCurrency={(amount) => `GH₵ ${amount.toLocaleString()}`}
/>
\`\`\`

## Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Verify your database permissions
3. Ensure all referenced tables (companies, employees) exist
4. Check that your Supabase project is on a compatible version

## Next Steps

After successful migration:
1. ✅ Test the employee form with annual salary field
2. ✅ Test adding custom banks
3. ✅ Verify monthly salary auto-calculation
4. ✅ Test the new employee card component
5. ✅ Update any existing employee records if needed
