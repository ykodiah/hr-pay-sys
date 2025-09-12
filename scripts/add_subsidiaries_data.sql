-- Adding comprehensive subsidiaries data to the database
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
  industry,
  divisions,
  departments,
  locations,
  created_at,
  updated_at
) VALUES 
-- Akwaaba Technologies subsidiaries
(
  gen_random_uuid(),
  (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1),
  'Akwaaba Digital Solutions',
  'TIN-ADS-2023-001',
  'SSNIT-ADS-789012',
  '15 Liberation Road, Ridge, Accra, Ghana',
  '+233 30 276 5432',
  'info@akwaabadigital.com',
  'active',
  'Digital Marketing & Web Development',
  '["Digital Marketing", "Web Development", "Mobile Apps"]'::jsonb,
  '["Marketing", "Development", "Design", "Sales"]'::jsonb,
  '["Accra - Ridge", "Kumasi Branch"]'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1),
  'Akwaaba Consulting Group',
  'TIN-ACG-2023-002',
  'SSNIT-ACG-789013',
  '8 Airport Residential Area, Accra, Ghana',
  '+233 30 276 5433',
  'consulting@akwaaba.com',
  'active',
  'Business Consulting & Strategy',
  '["Strategy Consulting", "Digital Transformation", "Process Optimization"]'::jsonb,
  '["Consulting", "Strategy", "Operations", "Client Relations"]'::jsonb,
  '["Accra - Airport", "Tema Office"]'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1),
  'Akwaaba Financial Services',
  'TIN-AFS-2023-003',
  'SSNIT-AFS-789014',
  '25 Independence Avenue, Accra, Ghana',
  '+233 30 276 5434',
  'finance@akwaabafs.com',
  'active',
  'Financial Technology & Services',
  '["Fintech Solutions", "Payment Processing", "Financial Advisory"]'::jsonb,
  '["Finance", "Technology", "Compliance", "Customer Service"]'::jsonb,
  '["Accra - Independence Ave", "Ho Regional Office"]'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1),
  'Akwaaba Logistics Ltd',
  'TIN-ALL-2023-004',
  'SSNIT-ALL-789015',
  '12 Spintex Road, Accra, Ghana',
  '+233 30 276 5435',
  'logistics@akwaabalog.com',
  'active',
  'Supply Chain & Logistics',
  '["Transportation", "Warehousing", "Supply Chain Management"]'::jsonb,
  '["Operations", "Fleet Management", "Warehousing", "Customer Service"]'::jsonb,
  '["Accra - Spintex", "Takoradi Port", "Tamale Hub"]'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1),
  'Akwaaba Training Institute',
  'TIN-ATI-2023-005',
  'SSNIT-ATI-789016',
  '5 Cantonments Road, Accra, Ghana',
  '+233 30 276 5436',
  'training@akwaabainstitute.com',
  'active',
  'Education & Professional Training',
  '["Corporate Training", "IT Certification", "Professional Development"]'::jsonb,
  '["Training", "Curriculum Development", "Student Services", "Administration"]'::jsonb,
  '["Accra - Cantonments", "Kumasi Campus", "Online Platform"]'::jsonb,
  NOW(),
  NOW()
);

-- Update employees to assign them to subsidiaries
UPDATE employees 
SET subsidiary_id = (
  SELECT id FROM subsidiaries 
  WHERE name = 'Akwaaba Digital Solutions' 
  LIMIT 1
)
WHERE department IN ('Marketing', 'Development', 'Design') 
AND company_id = (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1);

UPDATE employees 
SET subsidiary_id = (
  SELECT id FROM subsidiaries 
  WHERE name = 'Akwaaba Consulting Group' 
  LIMIT 1
)
WHERE department IN ('Consulting', 'Strategy', 'Operations') 
AND company_id = (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1);

UPDATE employees 
SET subsidiary_id = (
  SELECT id FROM subsidiaries 
  WHERE name = 'Akwaaba Financial Services' 
  LIMIT 1
)
WHERE department IN ('Finance', 'Compliance') 
AND company_id = (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1);

UPDATE employees 
SET subsidiary_id = (
  SELECT id FROM subsidiaries 
  WHERE name = 'Akwaaba Logistics Ltd' 
  LIMIT 1
)
WHERE department IN ('Operations', 'Fleet Management', 'Warehousing') 
AND company_id = (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1);

UPDATE employees 
SET subsidiary_id = (
  SELECT id FROM subsidiaries 
  WHERE name = 'Akwaaba Training Institute' 
  LIMIT 1
)
WHERE department IN ('Training', 'Administration') 
AND company_id = (SELECT id FROM companies WHERE name = 'Akwaaba Technologies' LIMIT 1);
