-- Creating comprehensive subsidiary data for the database
-- Insert sample subsidiaries data
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
  logo_url,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1),
  'Akwaaba Digital Solutions',
  'TIN-ADS-2023-001',
  'SSNIT-ADS-789012',
  '15 Liberation Road, Ridge, Accra, Ghana',
  '+233 30 276 5432',
  'info@akwaabadigital.com',
  'active',
  'Digital Marketing & Web Development',
  '["Digital Marketing", "Web Development", "Mobile Apps", "UI/UX Design", "E-commerce Solutions"]'::jsonb,
  '["Marketing", "Development", "Design", "Sales", "Customer Support", "Quality Assurance"]'::jsonb,
  '["Accra - Ridge", "Kumasi Branch", "Takoradi Office"]'::jsonb,
  '/placeholder.svg?height=40&width=40',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1),
  'Akwaaba Consulting Group',
  'TIN-ACG-2023-002',
  'SSNIT-ACG-789013',
  '8 Airport Residential Area, Accra, Ghana',
  '+233 30 276 5433',
  'consulting@akwaaba.com',
  'active',
  'Business Consulting & Strategy',
  '["Strategy Consulting", "Digital Transformation", "Process Optimization", "Change Management", "Business Intelligence"]'::jsonb,
  '["Consulting", "Strategy", "Operations", "Client Relations", "Research & Analytics"]'::jsonb,
  '["Accra - Airport", "Tema Office", "Cape Coast Branch"]'::jsonb,
  '/placeholder.svg?height=40&width=40',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1),
  'Akwaaba Financial Services',
  'TIN-AFS-2023-003',
  'SSNIT-AFS-789014',
  '25 Independence Avenue, Accra, Ghana',
  '+233 30 276 5434',
  'finance@akwaabafs.com',
  'active',
  'Financial Technology & Services',
  '["Fintech Solutions", "Payment Processing", "Financial Advisory", "Investment Management", "Insurance Services"]'::jsonb,
  '["Finance", "Technology", "Compliance", "Customer Service", "Risk Management", "Investment Advisory"]'::jsonb,
  '["Accra - Independence Ave", "Ho Regional Office", "Sunyani Branch"]'::jsonb,
  '/placeholder.svg?height=40&width=40',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1),
  'Akwaaba Logistics Ltd',
  'TIN-ALL-2023-004',
  'SSNIT-ALL-789015',
  '12 Spintex Road, Accra, Ghana',
  '+233 30 276 5435',
  'logistics@akwaabalog.com',
  'active',
  'Supply Chain & Logistics',
  '["Transportation", "Warehousing", "Supply Chain Management", "Freight Forwarding", "Last Mile Delivery"]'::jsonb,
  '["Operations", "Fleet Management", "Warehousing", "Customer Service", "Procurement", "Maintenance"]'::jsonb,
  '["Accra - Spintex", "Takoradi Port", "Tamale Hub", "Bolgatanga Depot"]'::jsonb,
  '/placeholder.svg?height=40&width=40',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1),
  'Akwaaba Training Institute',
  'TIN-ATI-2023-005',
  'SSNIT-ATI-789016',
  '5 Cantonments Road, Accra, Ghana',
  '+233 30 276 5436',
  'training@akwaabainstitute.com',
  'active',
  'Education & Professional Training',
  '["Corporate Training", "IT Certification", "Professional Development", "Leadership Training", "Skills Assessment"]'::jsonb,
  '["Training", "Curriculum Development", "Student Services", "Administration", "Assessment & Evaluation"]'::jsonb,
  '["Accra - Cantonments", "Kumasi Campus", "Online Platform", "Tamale Center"]'::jsonb,
  '/placeholder.svg?height=40&width=40',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1),
  'Akwaaba Manufacturing Co.',
  'TIN-AMC-2023-006',
  'SSNIT-AMC-789017',
  '45 Industrial Area, Tema, Ghana',
  '+233 30 276 5437',
  'manufacturing@akwaabamanuf.com',
  'active',
  'Manufacturing & Production',
  '["Product Manufacturing", "Quality Control", "Research & Development", "Supply Chain", "Export Operations"]'::jsonb,
  '["Production", "Quality Assurance", "Engineering", "Maintenance", "Procurement", "Export Sales"]'::jsonb,
  '["Tema - Industrial Area", "Kumasi Factory", "Takoradi Processing Plant"]'::jsonb,
  '/placeholder.svg?height=40&width=40',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1),
  'Akwaaba Healthcare Services',
  'TIN-AHS-2023-007',
  'SSNIT-AHS-789018',
  '18 Ring Road East, Accra, Ghana',
  '+233 30 276 5438',
  'healthcare@akwaabahealthcare.com',
  'active',
  'Healthcare & Medical Services',
  '["Primary Healthcare", "Specialized Medicine", "Diagnostic Services", "Pharmacy Services", "Health Insurance"]'::jsonb,
  '["Medical Services", "Nursing", "Pharmacy", "Administration", "Laboratory", "Patient Relations"]'::jsonb,
  '["Accra - Ring Road", "Kumasi Medical Center", "Ho Clinic", "Tamale Health Post"]'::jsonb,
  '/placeholder.svg?height=40&width=40',
  NOW(),
  NOW()
);

-- Update employee counts by linking employees to subsidiaries
UPDATE subsidiaries 
SET updated_at = NOW()
WHERE id IN (SELECT DISTINCT subsidiary_id FROM employees WHERE subsidiary_id IS NOT NULL);

-- Add some sample employees for each subsidiary if employees table is empty
INSERT INTO employees (
  id,
  company_id,
  subsidiary_id,
  employee_id,
  first_name,
  last_name,
  full_name,
  corporate_email,
  position,
  department,
  status,
  date_of_joining,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  s.company_id,
  s.id,
  'EMP-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  CASE (ROW_NUMBER() OVER()) % 10
    WHEN 1 THEN 'John'
    WHEN 2 THEN 'Jane'
    WHEN 3 THEN 'Michael'
    WHEN 4 THEN 'Sarah'
    WHEN 5 THEN 'David'
    WHEN 6 THEN 'Lisa'
    WHEN 7 THEN 'Robert'
    WHEN 8 THEN 'Emily'
    WHEN 9 THEN 'James'
    ELSE 'Maria'
  END,
  CASE (ROW_NUMBER() OVER()) % 10
    WHEN 1 THEN 'Doe'
    WHEN 2 THEN 'Smith'
    WHEN 3 THEN 'Johnson'
    WHEN 4 THEN 'Williams'
    WHEN 5 THEN 'Brown'
    WHEN 6 THEN 'Jones'
    WHEN 7 THEN 'Garcia'
    WHEN 8 THEN 'Miller'
    WHEN 9 THEN 'Davis'
    ELSE 'Rodriguez'
  END,
  CASE (ROW_NUMBER() OVER()) % 10
    WHEN 1 THEN 'John Doe'
    WHEN 2 THEN 'Jane Smith'
    WHEN 3 THEN 'Michael Johnson'
    WHEN 4 THEN 'Sarah Williams'
    WHEN 5 THEN 'David Brown'
    WHEN 6 THEN 'Lisa Jones'
    WHEN 7 THEN 'Robert Garcia'
    WHEN 8 THEN 'Emily Miller'
    WHEN 9 THEN 'James Davis'
    ELSE 'Maria Rodriguez'
  END,
  LOWER(
    CASE (ROW_NUMBER() OVER()) % 10
      WHEN 1 THEN 'john.doe'
      WHEN 2 THEN 'jane.smith'
      WHEN 3 THEN 'michael.johnson'
      WHEN 4 THEN 'sarah.williams'
      WHEN 5 THEN 'david.brown'
      WHEN 6 THEN 'lisa.jones'
      WHEN 7 THEN 'robert.garcia'
      WHEN 8 THEN 'emily.miller'
      WHEN 9 THEN 'james.davis'
      ELSE 'maria.rodriguez'
    END || '@' || REPLACE(LOWER(s.name), ' ', '') || '.com'
  ),
  CASE (ROW_NUMBER() OVER()) % 8
    WHEN 1 THEN 'Software Engineer'
    WHEN 2 THEN 'Marketing Manager'
    WHEN 3 THEN 'HR Specialist'
    WHEN 4 THEN 'Financial Analyst'
    WHEN 5 THEN 'Operations Manager'
    WHEN 6 THEN 'Sales Representative'
    WHEN 7 THEN 'Customer Service Rep'
    ELSE 'Administrative Assistant'
  END,
  (s.departments->>(FLOOR(RANDOM() * jsonb_array_length(s.departments))::int)),
  'active',
  CURRENT_DATE - INTERVAL '1 year' * RANDOM(),
  NOW(),
  NOW()
FROM subsidiaries s
CROSS JOIN generate_series(1, FLOOR(RANDOM() * 50 + 20)::int) -- Random 20-70 employees per subsidiary
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE subsidiary_id = s.id)
LIMIT 300; -- Limit total employees created

-- Create a view for subsidiary statistics
CREATE OR REPLACE VIEW subsidiary_statistics AS
SELECT 
  s.*,
  COALESCE(emp_counts.employee_count, 0) as employee_count,
  jsonb_array_length(s.divisions) as divisions_count,
  jsonb_array_length(s.departments) as departments_count,
  jsonb_array_length(s.locations) as locations_count
FROM subsidiaries s
LEFT JOIN (
  SELECT 
    subsidiary_id,
    COUNT(*) as employee_count
  FROM employees 
  WHERE subsidiary_id IS NOT NULL
  GROUP BY subsidiary_id
) emp_counts ON s.id = emp_counts.subsidiary_id;
