-- Finance management tables

-- Fee heads (types of fees)
CREATE TABLE IF NOT EXISTS fee_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  school_id UUID REFERENCES schools(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee structures (amounts by grade/term)
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_head_id UUID REFERENCES fee_heads(id),
  grade_id UUID REFERENCES grades(id),
  term_id UUID REFERENCES terms(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE,
  student_id UUID REFERENCES students(id),
  term_id UUID REFERENCES terms(id),
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  fee_head_id UUID REFERENCES fee_heads(id),
  description VARCHAR(255),
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed',
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
