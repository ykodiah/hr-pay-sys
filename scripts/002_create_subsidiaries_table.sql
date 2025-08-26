-- Create subsidiaries table for multi-company management
CREATE TABLE IF NOT EXISTS subsidiaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    ssnit_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    divisions TEXT[] DEFAULT '{}',
    departments TEXT[] DEFAULT '{}',
    locations TEXT[] DEFAULT '{}',
    logo TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage subsidiaries" ON subsidiaries
    FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subsidiaries_updated_at 
    BEFORE UPDATE ON subsidiaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
