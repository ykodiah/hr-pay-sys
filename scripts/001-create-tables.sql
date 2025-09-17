-- Create database tables based on Prisma schema
-- This script will be executed to set up the initial database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "TenantMode" AS ENUM ('GROUP', 'SINGLE');
CREATE TYPE "Currency" AS ENUM ('GHS', 'USD', 'EUR');
CREATE TYPE "PaySchedule" AS ENUM ('MONTHLY', 'BIWEEKLY', 'WEEKLY');
CREATE TYPE "EmpStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "RunStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'POSTED', 'LOCKED');
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'HR', 'PAYROLL', 'FINANCE', 'MANAGER', 'EMPLOYEE');
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE', 'STUDY', 'UNPAID');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Insert Ghana tax rules for 2025
INSERT INTO "TaxRule" (id, country, "ruleType", "effectiveDate", config, "createdAt", "updatedAt")
VALUES 
  (
    gen_random_uuid()::text,
    'Ghana',
    'PAYE',
    '2025-01-01'::timestamp,
    '{
      "monthlyBands": [
        {"upTo": 365, "rate": 0},
        {"upTo": 730, "rate": 5},
        {"upTo": 3650, "rate": 10},
        {"upTo": 16250, "rate": 17.5},
        {"upTo": 50000, "rate": 25},
        {"upTo": null, "rate": 30}
      ],
      "personalRelief": 365
    }'::jsonb,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'Ghana',
    'SSNIT',
    '2025-01-01'::timestamp,
    '{
      "employee": 0.055,
      "employer": 0.135,
      "maxInsurableMonthly": 4500
    }'::jsonb,
    NOW(),
    NOW()
  );
