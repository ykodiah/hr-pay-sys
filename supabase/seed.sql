-- Seed data for local development
-- This file is run when you start your local Supabase instance

-- Insert sample companies
INSERT INTO companies (id, name, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Akwaaba Technologies Ltd', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'Demo Company', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample custom banks for testing
INSERT INTO custom_banks (id, company_id, bank_name, created_at, updated_at) VALUES
('650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Test Custom Bank', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Demo Custom Bank', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;