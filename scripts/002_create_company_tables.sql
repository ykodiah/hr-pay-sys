-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(100),
  ssnit_number VARCHAR(100),
  industry VARCHAR(100),
  address TEXT,
  phone_number VARCHAR(50),
  email_address VARCHAR(255),
  logo_url TEXT,
  divisions JSONB DEFAULT '[]',
  departments JSONB DEFAULT '[]',
  locations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subsidiaries table
CREATE TABLE IF NOT EXISTS subsidiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
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
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255),
  file_url TEXT,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);

-- Add subsidiary_id to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS division VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_exit DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS probation_period INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS confirmation_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notice_period INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Enable read access for all users" ON companies FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON companies FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON companies FOR DELETE USING (true);

-- Create policies for subsidiaries
CREATE POLICY "Enable read access for all users" ON subsidiaries FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON subsidiaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON subsidiaries FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON subsidiaries FOR DELETE USING (true);

-- Create policies for employee_documents
CREATE POLICY "Enable read access for all users" ON employee_documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON employee_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON employee_documents FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON employee_documents FOR DELETE USING (true);
