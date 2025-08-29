-- Create AI knowledge base table for dynamic system updates
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'employees', 'payroll', 'settings', 'general'
    topic VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[], -- Array of searchable keywords
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_keywords ON ai_knowledge_base USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_active ON ai_knowledge_base(is_active);

-- Insert initial knowledge base entries
INSERT INTO ai_knowledge_base (category, topic, content, keywords) VALUES
('employees', 'Adding New Employee', 'To add a new employee: 1. Go to Employees section 2. Click "Add New Employee" 3. Fill Personal Info (14 fields including prefix, names, contact details) 4. Complete Employment section (position, subsidiary, department, direct supervisor, head of department) 5. Add Financial details (salary, allowances, bank info) 6. Upload required documents 7. Click Submit. Employee ID starts from AKWA0001 and increments automatically.', ARRAY['employee', 'add', 'new', 'personal', 'employment', 'financial', 'documents']),

('payroll', 'Payroll Settings Configuration', 'Configure payroll in Settings > Payroll tab: 1. Allowances - Set up transport, housing, medical allowances with codes, descriptions, taxable status 2. Deductions - Configure tax, SSNIT, loan deductions 3. Loan Settings - Define loan types with maximum amounts, interest rates, rate methods (Reducing Balance/Straight Line), admin charges, tenure. Use + Add button to create new entries.', ARRAY['payroll', 'allowances', 'deductions', 'loans', 'settings', 'configuration']),

('settings', 'Multi-Company Management', 'Manage subsidiaries in Settings > Multi-Company: 1. Enable "Activate Subsidiary Function" 2. Click "Add Subsidiary" to create new subsidiary 3. Fill subsidiary details (name, tax ID, SSNIT, contact info) 4. Deactivated subsidiaries remain visible with "deactivated" status 5. Use 3-dot menu to reactivate subsidiaries. Each subsidiary can have its own divisions, departments, and locations.', ARRAY['subsidiary', 'multi-company', 'management', 'activate', 'deactivate']),

('general', 'Organizational Chart', 'Access Organizational Chart from HR Management menu: 1. Select chart style (hierarchical, matrix, circular) 2. Choose subsidiary or company-wide view 3. Preview charts before saving 4. AI generates professional layouts automatically 5. Charts update when employee hierarchy changes. Direct supervisors and heads of department create reporting structure.', ARRAY['organizational', 'chart', 'hierarchy', 'reporting', 'structure']),

('employees', 'Employee Document Management', 'Required documents for employees: 1. Academic Certificate(s) 2. Passport Picture 3. Resume & Application Letter 4. Passport 5. National ID (Ghana Card) 6. Medical Report 7. Police Report 8. Other Uploads. Use "Choose File" buttons to upload. System shows green checkmarks for successful uploads.', ARRAY['documents', 'upload', 'academic', 'passport', 'resume', 'medical', 'police']),

('payroll', 'Employee Financial Setup', 'Employee financial configuration includes: 1. Monthly salary in GHS 2. Bank selection from Ghanaian banks list 3. Account number and SSNIT number 4. Ghana Card number 5. Allowances (transport, housing, medical, etc.) 6. Deductions (tax, loans, advances) 7. Loan details if applicable. All data integrates with payroll processing.', ARRAY['financial', 'salary', 'bank', 'allowances', 'deductions', 'ghana']);

-- Enable RLS
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
CREATE POLICY "Allow authenticated users to read knowledge base" ON ai_knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policy for service role to manage knowledge base
CREATE POLICY "Allow service role to manage knowledge base" ON ai_knowledge_base
    FOR ALL USING (auth.role() = 'service_role');
