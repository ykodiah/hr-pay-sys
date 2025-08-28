-- Create comprehensive employee tables to support enhanced employee profile
-- Drop existing tables if they exist
DROP TABLE IF EXISTS employee_documents CASCADE;
DROP TABLE IF EXISTS employee_financial CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Create employees table with comprehensive fields
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Personal Information
    prefix VARCHAR(10),
    first_name VARCHAR(100) NOT NULL,
    other_names VARCHAR(200),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(400) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    marital_status VARCHAR(20),
    gender VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    educational_level VARCHAR(100),
    
    -- Contact Information
    personal_email VARCHAR(255) NOT NULL,
    corporate_email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    emergency_contact_name VARCHAR(200),
    emergency_contact_tel VARCHAR(20),
    
    -- Employment Information
    position VARCHAR(200) NOT NULL,
    direct_supervisor UUID REFERENCES employees(id),
    head_of_department UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id),
    subsidiary_id UUID REFERENCES subsidiaries(id),
    division VARCHAR(100),
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    contract_type VARCHAR(50) DEFAULT 'Permanent',
    date_of_joining DATE NOT NULL,
    date_of_exit DATE,
    status VARCHAR(20) DEFAULT 'Active',
    probation_period INTEGER DEFAULT 6,
    confirmation_date DATE,
    notice_period VARCHAR(50),
    
    -- Profile
    profile_picture TEXT,
    ghana_card_number VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_financial table for comprehensive financial data
CREATE TABLE employee_financial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Basic Financial Information
    monthly_salary DECIMAL(12,2) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    ssnit_number VARCHAR(50) NOT NULL,
    
    -- Allowances
    transport_allowance DECIMAL(10,2) DEFAULT 0,
    housing_allowance DECIMAL(10,2) DEFAULT 0,
    medical_allowance DECIMAL(10,2) DEFAULT 0,
    meal_allowance DECIMAL(10,2) DEFAULT 0,
    uniform_allowance DECIMAL(10,2) DEFAULT 0,
    communication_allowance DECIMAL(10,2) DEFAULT 0,
    other_allowances DECIMAL(10,2) DEFAULT 0,
    
    -- Deductions
    tax_deduction DECIMAL(10,2) DEFAULT 0,
    tier3_contribution DECIMAL(10,2) DEFAULT 0,
    loan_deduction DECIMAL(10,2) DEFAULT 0,
    advance_deduction DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    
    -- Loan Details
    loan_amount DECIMAL(12,2) DEFAULT 0,
    loan_balance DECIMAL(12,2) DEFAULT 0,
    loan_installment DECIMAL(10,2) DEFAULT 0,
    loan_start_date DATE,
    loan_end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_documents table for document management
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizational_charts table for AI-generated org charts
CREATE TABLE organizational_charts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL, -- 'hierarchical', 'matrix', 'flat', 'functional'
    chart_style VARCHAR(50) NOT NULL, -- 'modern', 'classic', 'minimal', 'corporate'
    company_id UUID REFERENCES companies(id),
    subsidiary_id UUID REFERENCES subsidiaries(id),
    chart_data JSONB NOT NULL, -- Stores the chart structure and styling
    preview_image TEXT, -- Base64 or URL to preview image
    is_active BOOLEAN DEFAULT false,
    created_by UUID, -- Reference to user who created it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_subsidiary_id ON employees(subsidiary_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_direct_supervisor ON employees(direct_supervisor);
CREATE INDEX idx_employees_head_of_department ON employees(head_of_department);

CREATE INDEX idx_employee_financial_employee_id ON employee_financial(employee_id);
CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(document_type);

CREATE INDEX idx_organizational_charts_company_id ON organizational_charts(company_id);
CREATE INDEX idx_organizational_charts_subsidiary_id ON organizational_charts(subsidiary_id);
CREATE INDEX idx_organizational_charts_active ON organizational_charts(is_active);

-- Add RLS policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_charts ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON employees
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON employee_financial
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON employee_documents
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON organizational_charts
    FOR ALL USING (auth.role() = 'authenticated');
