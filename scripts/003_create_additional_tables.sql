-- Create additional tables for company settings and organizational structure
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NOT NULL,
  ssnit_number VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  logo TEXT,
  divisions TEXT[], -- Array of division names
  departments TEXT[], -- Array of department names
  locations TEXT[], -- Array of location names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subsidiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES company_settings(id),
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NOT NULL,
  ssnit_number VARCHAR(50) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  logo TEXT,
  divisions TEXT[], -- Array of division names
  departments TEXT[], -- Array of department names
  locations TEXT[], -- Array of location names
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view company settings" ON company_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert company settings" ON company_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update company settings" ON company_settings FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view subsidiaries" ON subsidiaries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert subsidiaries" ON subsidiaries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update subsidiaries" ON subsidiaries FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view employee documents" ON employee_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert employee documents" ON employee_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update employee documents" ON employee_documents FOR UPDATE USING (auth.role() = 'authenticated');
