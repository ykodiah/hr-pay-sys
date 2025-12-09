-- Update employees table to include special_role field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS special_role VARCHAR(50) DEFAULT 'No Special Role';

-- Add index for better performance on supervisor queries
CREATE INDEX IF NOT EXISTS idx_employees_department_special_role 
ON employees(department, special_role);

-- Add index for supervisor lookups
CREATE INDEX IF NOT EXISTS idx_employees_status_department 
ON employees(status, department);

-- Update existing employees to have proper special role based on position
UPDATE employees 
SET special_role = CASE 
  WHEN position ILIKE '%head%' OR position ILIKE '%manager%' OR position ILIKE '%director%' THEN 'Head of Department'
  WHEN position ILIKE '%supervisor%' OR position ILIKE '%lead%' OR position ILIKE '%senior%' THEN 'Supervisor'
  ELSE 'No Special Role'
END
WHERE special_role = 'No Special Role';
