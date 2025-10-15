# 🔧 User Metadata Configuration Guide

## Overview

After implementing the security fixes, you need to configure user metadata to include `company_id` for proper company-based data isolation.

## 🎯 Step 1: Configure User Metadata

### Option A: Via Supabase Dashboard

1. **Go to Authentication → Users**
2. **Select a user**
3. **Edit user metadata**:
   ```json
   {
     "user_metadata": {
       "company_id": "550e8400-e29b-41d4-a716-446655440000"
     }
   }
   ```

### Option B: Via Supabase Client (Programmatically)

```typescript
// When creating a user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      company_id: '550e8400-e29b-41d4-a716-446655440000'
    }
  }
});

// When updating user metadata
const { data, error } = await supabase.auth.updateUser({
  data: {
    company_id: '550e8400-e29b-41d4-a716-446655440000'
  }
});
```

### Option C: Via SQL (Admin only)

```sql
-- Update user metadata for existing users
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"company_id": "550e8400-e29b-41d4-a716-446655440000"}'::jsonb
WHERE id = 'user-uuid-here';
```

## 🧪 Step 2: Test with Different User Roles

### Test 1: Create Test Users

```sql
-- Create test company
INSERT INTO companies (id, name, email_address, phone_number, address, industry)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Company A',
  'test@company-a.com',
  '+233-123-456-789',
  '123 Test Street, Accra, Ghana',
  'Technology'
);

-- Create test employees
INSERT INTO employees (id, full_name, email, company_id, position, department)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'John Admin',
    'admin@company-a.com',
    '550e8400-e29b-41d4-a716-446655440000',
    'System Administrator',
    'IT'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Jane HR',
    'hr@company-a.com',
    '550e8400-e29b-41d4-a716-446655440000',
    'HR Manager',
    'Human Resources'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Bob Employee',
    'employee@company-a.com',
    '550e8400-e29b-41d4-a716-446655440000',
    'Software Developer',
    'Engineering'
  );
```

### Test 2: Assign Roles

```sql
-- Get role IDs
SELECT id, name, code FROM roles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- Assign Super Admin role to John
INSERT INTO user_roles (employee_id, role_id, assigned_by, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM roles WHERE code = 'SUPER_ADMIN' AND company_id = '550e8400-e29b-41d4-a716-446655440000'),
  '11111111-1111-1111-1111-111111111111',
  true
);

-- Assign HR Manager role to Jane
INSERT INTO user_roles (employee_id, role_id, assigned_by, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM roles WHERE code = 'HR_MANAGER' AND company_id = '550e8400-e29b-41d4-a716-446655440000'),
  '11111111-1111-1111-1111-111111111111',
  true
);

-- Assign Employee role to Bob
INSERT INTO user_roles (employee_id, role_id, assigned_by, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  (SELECT id FROM roles WHERE code = 'EMPLOYEE' AND company_id = '550e8400-e29b-41d4-a716-446655440000'),
  '11111111-1111-1111-1111-111111111111',
  true
);
```

### Test 3: Test Access Control

```sql
-- Test 1: Check if user can see their own data
-- (Run as each user)
SELECT * FROM employees WHERE id = auth.uid();

-- Test 2: Check if user can see company data
-- (Run as HR Manager or Admin)
SELECT * FROM employees WHERE company_id = get_current_user_company_id();

-- Test 3: Check if user has specific permissions
-- (Run as each user)
SELECT user_has_permission('employees', 'read') as can_read_employees;
SELECT user_has_permission('financial', 'read') as can_read_financial;

-- Test 4: Check company isolation
-- (Run as user from Company A - should not see Company B data)
SELECT * FROM employees WHERE company_id != get_current_user_company_id();
-- Should return empty result
```

## 🔍 Step 3: Security Testing Checklist

### ✅ Basic Security Tests

- [ ] **RLS Enabled**: All tables have Row Level Security enabled
- [ ] **No Anonymous Access**: Anonymous users cannot access any data
- [ ] **Company Isolation**: Users only see their company's data
- [ ] **Role-Based Access**: Access is controlled by user roles
- [ ] **Permission-Based Access**: Actions require specific permissions

### ✅ User Role Tests

- [ ] **Super Admin**: Can access all data in their company
- [ ] **HR Manager**: Can access HR-related data only
- [ ] **Payroll Manager**: Can access payroll-related data only
- [ ] **Employee**: Can only access their own data

### ✅ Data Isolation Tests

- [ ] **Cross-Company Access**: Users cannot see other companies' data
- [ ] **Financial Data**: Only authorized users can access financial data
- [ ] **Personal Data**: Users can always access their own data
- [ ] **Admin Functions**: Only admins can manage roles and permissions

## 🚨 Step 4: Monitor Security

### Security Logs

```sql
-- View access logs
SELECT * FROM access_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check for suspicious activity
SELECT * FROM check_suspicious_activity();

-- Generate security alerts
SELECT generate_security_alerts();
```

### Security Dashboard

```sql
-- View security overview
SELECT * FROM security_dashboard;

-- View role assignments
SELECT * FROM role_assignments_summary;
```

## 🛠️ Troubleshooting

### Common Issues

1. **Users can't access data**
   - Check if user metadata has `company_id`
   - Verify user has assigned roles
   - Check if roles have proper permissions

2. **Company isolation not working**
   - Verify `get_current_user_company_id()` function
   - Check user metadata configuration
   - Ensure RLS policies are correct

3. **Permission errors**
   - Check if user has required permissions
   - Verify role-permission assignments
   - Check if user roles are active

### Debug Commands

```sql
-- Check current user's company
SELECT get_current_user_company_id() as user_company_id;

-- Check current user's roles
SELECT r.name, r.code, ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.employee_id = auth.uid();

-- Check current user's permissions
SELECT p.resource, p.action, p.name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.employee_id = auth.uid()
AND ur.is_active = true;

-- Check if user is authenticated
SELECT is_user_authenticated() as is_auth;
```

## 📋 Next Steps

1. **Apply the security scripts** to your Supabase instance
2. **Run the validation tests** to ensure everything works
3. **Configure user metadata** with company_id
4. **Create test users** with different roles
5. **Test access control** thoroughly
6. **Monitor security logs** regularly
7. **Train your team** on the new security model

## 🎯 Success Criteria

Your security implementation is successful when:
- ✅ All users can only access their company's data
- ✅ Role-based access control works properly
- ✅ Permission-based authorization is enforced
- ✅ No anonymous access is possible
- ✅ Security logs are being generated
- ✅ Suspicious activity is detected
- ✅ All tests pass without errors

Remember: Security is an ongoing process. Regular monitoring, testing, and updates are essential for maintaining a secure system.