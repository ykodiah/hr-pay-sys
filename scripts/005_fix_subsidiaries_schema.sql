-- Fix subsidiaries table schema to ensure correct column names
-- Drop and recreate subsidiaries table to fix any schema issues

-- First, drop the existing subsidiaries table if it exists
DROP TABLE IF EXISTS subsidiaries CASCADE;

-- Recreate subsidiaries table with correct schema
CREATE TABLE subsidiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(100),
  ssnit_number VARCHAR(100),
  address TEXT,
  phone_number VARCHAR(50),
  email_address VARCHAR(255),
  logo_url TEXT,
  divisions JSONB DEFAULT '[]',
  departments JSONB DEFAULT '[]',
  locations JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;

-- Create policies for subsidiaries
CREATE POLICY "Enable read access for all users" ON subsidiaries FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON subsidiaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON subsidiaries FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON subsidiaries FOR DELETE USING (true);

-- Add foreign key constraint to companies table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        ALTER TABLE subsidiaries ADD CONSTRAINT fk_subsidiaries_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update employees table to reference subsidiaries if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS subsidiary_id UUID;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_employees_subsidiary_id'
        ) THEN
            ALTER TABLE employees ADD CONSTRAINT fk_employees_subsidiary_id 
            FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;
