-- Create table for storing company logo files
CREATE TABLE IF NOT EXISTS company_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  file_data BYTEA NOT NULL, -- Store file as binary data
  file_url TEXT, -- Optional: for external file URLs
  file_category VARCHAR(50) DEFAULT 'logo', -- logo, document, etc.
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_company_files_company_id ON company_files(company_id);
CREATE INDEX IF NOT EXISTS idx_company_files_category ON company_files(file_category);

-- Add RLS policies
ALTER TABLE company_files ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their company's files
CREATE POLICY "Users can manage their company files" ON company_files
  FOR ALL USING (true);

-- Update companies table to reference the logo file
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_file_id UUID REFERENCES company_files(id);

-- Insert sample data for existing company
INSERT INTO company_files (
  company_id, 
  file_name, 
  file_type, 
  file_size, 
  file_data, 
  file_category
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'default-logo.png',
  'image/png',
  1024,
  decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
  'logo'
) ON CONFLICT DO NOTHING;
