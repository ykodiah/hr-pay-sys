# Employee Financial Migration Documentation

This document describes the database changes made to support the updated employee financial form functionality.

## Overview

The employee financial form has been updated with the following changes:
1. **Annual Salary Field**: Added mandatory annual salary field with auto-calculation of monthly salary
2. **Enhanced Bank Management**: Updated bank list with First National Bank Ghana Limited and added custom bank functionality
3. **Removed Loan Details**: Removed the entire loan details section from the financial form

## Database Changes

### 1. Employee Financial Table Updates

#### Added Columns
- `annual_salary` (DECIMAL(12,2)): Stores the annual salary in GHS
  - Used to auto-calculate monthly salary (annual_salary / 12)
  - Made mandatory in the form validation

#### Removed Columns
- `loan_amount` (DECIMAL(12,2))
- `loan_balance` (DECIMAL(12,2))
- `loan_installment` (DECIMAL(10,2))
- `loan_start_date` (DATE)
- `loan_end_date` (DATE)

### 2. New Custom Banks Table

Created `custom_banks` table to allow companies to add their own banks:

\`\`\`sql
CREATE TABLE custom_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(company_id, bank_name)
);
\`\`\`

### 3. Updated Bank List

The default bank list now includes:
- Access Bank
- Agricultural Development Bank
- Bank of Africa
- CalBank
- Consolidated Bank Ghana
- Ecobank Ghana
- Fidelity Bank Ghana
- First Atlantic Bank
- **First National Bank Ghana Limited** (newly added)
- GCB Bank Limited
- Guaranty Trust Bank Ghana
- National Investment Bank
- OmniBSIC Bank
- Prudential Bank Ghana
- Republic Bank Ghana
- Societe Generale Ghana
- Stanbic Bank Ghana
- Standard Chartered Bank Ghana
- United Bank for Africa Ghana
- Zenith Bank Ghana

## Migration Scripts

### 1. Complete Migration
- **File**: `038_complete_employee_financial_migration.sql`
- **Purpose**: Applies all changes in one script
- **Usage**: Run this script to update your database

### 2. Individual Scripts
- **File**: `036_employee_financial_updates.sql` - Adds annual salary and custom banks
- **File**: `037_remove_loan_columns.sql` - Removes loan-related columns

### 3. Rollback Script
- **File**: `039_rollback_employee_financial_changes.sql`
- **Purpose**: Reverts all changes if needed
- **Usage**: Run this script to rollback the changes

## Security Features

### Row Level Security (RLS)
- Custom banks table has RLS enabled
- Users can only access custom banks for their company
- Policies ensure data isolation between companies

### Permissions
- Authenticated users can read/write custom banks for their company
- Anonymous users have read access for public bank lists

## Helper Functions

### get_company_banks(company_uuid)
Returns all available banks (default + custom) for a specific company:
\`\`\`sql
SELECT * FROM get_company_banks('company-uuid-here');
\`\`\`

## Application Changes

### Form Updates
1. **Annual Salary Field**: 
   - Made mandatory with validation
   - Auto-calculates monthly salary (annual_salary / 12)
   - Monthly salary field is now read-only

2. **Bank Selection**:
   - Updated dropdown with new bank list
   - Added "Add New Bank" option
   - Custom banks are saved per company

3. **Removed Sections**:
   - Entire loan details section removed
   - Form is now more focused on core financial information

### Validation Updates
- Annual salary is now required
- Monthly salary is auto-calculated and read-only
- Bank name validation includes custom banks

## Data Migration

### Existing Data
- Existing monthly salary data is preserved
- Annual salary can be calculated from existing monthly salary if needed
- Loan data is backed up before removal

### Backup
- Loan data is backed up to `employee_financial_loan_backup` table
- Can be restored using the rollback script

## Testing

### Verification Queries
The migration scripts include verification queries that check:
- Annual salary column exists
- Custom banks table exists
- Loan columns are removed
- RLS policies are in place

### Sample Data
Optional sample data can be inserted for testing:
\`\`\`sql
-- Uncomment in migration script to add sample custom banks
INSERT INTO custom_banks (company_id, bank_name, created_by)
SELECT 
    c.id as company_id,
    'Sample Custom Bank ' || c.name as bank_name,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM companies c
LIMIT 1;
\`\`\`

## Rollback Procedure

If you need to rollback the changes:

1. Run the rollback script: `039_rollback_employee_financial_changes.sql`
2. This will:
   - Restore loan-related columns
   - Drop custom banks table
   - Remove annual salary column
   - Restore original functionality

## Support

For issues or questions about this migration:
1. Check the verification queries in the migration scripts
2. Review the rollback script if you need to revert changes
3. Ensure all RLS policies are properly configured

## Version History

- **v1.0**: Initial migration with annual salary, custom banks, and loan removal
- **v1.1**: Added comprehensive verification and rollback procedures
