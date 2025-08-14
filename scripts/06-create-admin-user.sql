-- Create default admin user data
-- Note: You must first create the auth user in Supabase dashboard with email: ykodiah@gmail.com

-- Insert school record (if not exists)
INSERT INTO schools (id, name, address, phone, email, website, logo_url, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Default School',
  '123 School Street, Education City',
  '+1234567890',
  'admin@defaultschool.edu',
  'https://defaultschool.edu',
  null,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Get the school ID
DO $$
DECLARE
    school_uuid UUID;
    auth_user_id UUID;
    staff_uuid UUID;
BEGIN
    -- Get school ID
    SELECT id INTO school_uuid FROM schools WHERE email = 'admin@defaultschool.edu' LIMIT 1;
    
    -- Get auth user ID (this assumes the auth user exists)
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'ykodiah@gmail.com' LIMIT 1;
    
    -- If auth user doesn't exist, show error
    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user with email ykodiah@gmail.com not found. Please create this user in Supabase Auth first.';
    END IF;
    
    -- Insert user record
    INSERT INTO users (id, email, first_name, last_name, phone, is_active, school_id, created_at, updated_at)
    VALUES (
        auth_user_id,
        'ykodiah@gmail.com',
        'Admin',
        'User',
        '+1234567890',
        true,
        school_uuid,
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        is_active = EXCLUDED.is_active,
        school_id = EXCLUDED.school_id,
        updated_at = now();
    
    -- Insert staff record
    INSERT INTO staff (id, user_id, staff_id, department, position, hire_date, salary, is_active, school_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        auth_user_id,
        'ADMIN001',
        'Administration',
        'System Administrator',
        CURRENT_DATE,
        0.00,
        true,
        school_uuid,
        now(),
        now()
    ) ON CONFLICT (user_id) DO UPDATE SET
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    
    -- Get staff ID for role assignment
    SELECT id INTO staff_uuid FROM staff WHERE user_id = auth_user_id LIMIT 1;
    
    -- Insert admin role
    INSERT INTO user_roles (id, user_id, role, entity_type, entity_id, granted_by, granted_at, is_active, school_id)
    VALUES (
        gen_random_uuid(),
        auth_user_id,
        'super_admin',
        'school',
        school_uuid,
        auth_user_id,
        now(),
        true,
        school_uuid
    ) ON CONFLICT (user_id, role, entity_type, entity_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        granted_at = now();
    
    RAISE NOTICE 'Admin user setup completed for ykodiah@gmail.com';
END $$;
