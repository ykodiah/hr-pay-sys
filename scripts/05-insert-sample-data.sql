-- Insert sample data for testing

-- Insert a sample school
INSERT INTO schools (name, address, phone, email) VALUES 
('Demo School', '123 Education Street', '+1234567890', 'admin@demoschool.com');

-- Get the school ID for reference
DO $$
DECLARE
    school_uuid UUID;
BEGIN
    SELECT id INTO school_uuid FROM schools WHERE name = 'Demo School' LIMIT 1;
    
    -- Insert sample grades
    INSERT INTO grades (name, level, school_id) VALUES 
    ('Kindergarten', 0, school_uuid),
    ('Grade 1', 1, school_uuid),
    ('Grade 2', 2, school_uuid),
    ('Grade 3', 3, school_uuid),
    ('Grade 4', 4, school_uuid),
    ('Grade 5', 5, school_uuid);
    
    -- Insert sample subjects
    INSERT INTO subjects (name, code, school_id) VALUES 
    ('Mathematics', 'MATH', school_uuid),
    ('English Language', 'ENG', school_uuid),
    ('Science', 'SCI', school_uuid),
    ('Social Studies', 'SS', school_uuid),
    ('Physical Education', 'PE', school_uuid);
    
    -- Insert sample fee heads
    INSERT INTO fee_heads (name, description, school_id) VALUES 
    ('Tuition Fee', 'Monthly tuition fee', school_uuid),
    ('Transport Fee', 'School bus transportation', school_uuid),
    ('Activity Fee', 'Extracurricular activities', school_uuid),
    ('Library Fee', 'Library usage and books', school_uuid);
    
    -- Insert current term
    INSERT INTO terms (name, start_date, end_date, is_current, school_id) VALUES 
    ('Term 1 2024', '2024-01-15', '2024-04-15', true, school_uuid);
    
END $$;
