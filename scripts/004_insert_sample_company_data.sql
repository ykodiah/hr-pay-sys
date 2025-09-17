-- Insert sample company data for dropdown population
INSERT INTO companies (
  id,
  name,
  tax_id,
  ssnit_number,
  industry,
  address,
  phone_number,
  email_address,
  divisions,
  departments,
  locations,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Akwaaba Technologies Ltd',
  'C0012345678',
  '1234567890',
  'Technology',
  '123 Liberation Road, Labone, Accra, Ghana',
  '+233 30 123 4567',
  'info@akwaabatech.com',
  '["Head Office", "Regional Office", "Branch Office"]'::jsonb,
  '["Human Resources", "Finance", "Technology", "Operations", "Marketing", "Sales"]'::jsonb,
  '["Accra", "Kumasi", "Takoradi", "Tamale"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert sample subsidiaries
INSERT INTO subsidiaries (
  id,
  company_id,
  name,
  tax_id,
  ssnit_number,
  address,
  phone_number,
  email_address,
  status,
  divisions,
  departments,
  locations,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM companies WHERE name = 'Akwaaba Technologies Ltd' LIMIT 1),
  'Akwaaba Tech Solutions',
  'CC001',
  '9876543210',
  'Tech Park, East Legon, Accra',
  '+233 30 987 6543',
  'solutions@akwaabatech.com',
  'active',
  '["Development", "Support", "QA"]'::jsonb,
  '["Engineering", "Product", "Customer Success"]'::jsonb,
  '["Accra", "Cape Coast"]'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies WHERE name = 'Akwaaba Technologies Ltd' LIMIT 1),
  'Akwaaba Consulting',
  'CC002',
  '5432167890',
  'Business District, Kumasi',
  '+233 32 555 1234',
  'consulting@akwaabatech.com',
  'active',
  '["Advisory", "Implementation", "Training"]'::jsonb,
  '["Consulting", "Business Development", "Training"]'::jsonb,
  '["Kumasi", "Sunyani"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
