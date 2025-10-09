# Supabase Database Update Guide

This guide will help you update your Supabase database with the new employee financial changes.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New query"

### Step 3: Run the Migration
1. Copy the entire content from `scripts/run_migration.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

### Step 4: Verify the Changes
Run this query to verify the changes:
\`\`\`sql
-- Check if annual_salary column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employee_financial' 
AND column_name = 'annual_salary';

-- Check if custom_banks table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'custom_banks';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'custom_banks';
\`\`\`

## Method 2: Using Supabase CLI

### Step 1: Install Supabase CLI
\`\`\`bash
npm install -g supabase
\`\`\`

### Step 2: Login to Supabase
\`\`\`bash
supabase login
\`\`\`

### Step 3: Link Your Project
\`\`\`bash
supabase link --project-ref YOUR_PROJECT_REF
\`\`\`

### Step 4: Run Migration
\`\`\`bash
supabase db push
\`\`\`

## Method 3: Using Direct SQL Connection

If you have direct access to your PostgreSQL database:

\`\`\`bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/038_complete_employee_financial_migration.sql
\`\`\`

## What the Migration Does

### 1. Adds Annual Salary Column
- Adds `annual_salary` column to `employee_financial` table
- Creates index for better performance

### 2. Creates Custom Banks Table
- Creates `custom_banks` table for company-specific banks
- Sets up proper foreign key relationships
- Implements Row Level Security (RLS)

### 3. Sets Up Security
- Creates RLS policies for data isolation
- Grants appropriate permissions
- Ensures users can only access their company's data

### 4. Optional: Removes Loan Columns
- Removes loan-related columns (uncomment in script if desired)
- Creates backup of existing loan data

## Testing the Changes

After running the migration, test the functionality:

1. **Annual Salary Field**: Should be clickable and functional
2. **Monthly Salary**: Should auto-calculate from annual salary
3. **Bank Selection**: Should show all banks including custom ones
4. **Add Custom Bank**: Should work and save to database

## Troubleshooting

### If Migration Fails
1. Check for any existing columns that might conflict
2. Ensure you have proper permissions
3. Check the Supabase logs for specific error messages

### If Annual Salary Field is Not Working
1. Verify the `annual_salary` column was created
2. Check that the form data includes `annualSalary` field
3. Ensure the `handleAnnualSalaryChange` function is working

### If Custom Banks Are Not Saving
1. Check RLS policies are properly set up
2. Verify the `custom_banks` table exists
3. Check that the user has proper permissions

## Rollback (If Needed)

If you need to rollback the changes, run:
\`\`\`sql
-- Remove annual_salary column
ALTER TABLE employee_financial DROP COLUMN IF EXISTS annual_salary;

-- Drop custom_banks table
DROP TABLE IF EXISTS custom_banks CASCADE;
\`\`\`

## Support

If you encounter any issues:
1. Check the Supabase logs
2. Verify all columns and tables were created
3. Test the functionality step by step
4. Check the browser console for JavaScript errors
