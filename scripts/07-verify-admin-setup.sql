-- Verify admin user setup
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    s.staff_id,
    s.position,
    ur.role,
    sch.name as school_name
FROM users u
JOIN staff s ON u.id = s.user_id
JOIN user_roles ur ON u.id = ur.user_id
JOIN schools sch ON u.school_id = sch.id
WHERE u.email = 'ykodiah@gmail.com';
