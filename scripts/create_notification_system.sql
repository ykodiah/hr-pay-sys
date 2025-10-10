-- Create comprehensive notification system for HR/Payroll

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'system'
  category VARCHAR(50) NOT NULL, -- 'payroll', 'hr', 'leave', 'attendance', 'promotion'
  subject VARCHAR(200),
  body_template TEXT NOT NULL,
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  delivery_method JSONB DEFAULT '["email"]', -- ['email', 'sms', 'push', 'system']
  frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, employee_id, category, notification_type)
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES notification_templates(id),
  recipient_id UUID REFERENCES employees(id),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  subject VARCHAR(200),
  body TEXT,
  notification_type VARCHAR(50),
  category VARCHAR(50),
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=urgent
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history table
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES employees(id),
  template_id UUID REFERENCES notification_templates(id),
  subject VARCHAR(200),
  body TEXT,
  notification_type VARCHAR(50),
  category VARCHAR(50),
  delivery_method VARCHAR(20),
  status VARCHAR(20),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email configuration table
CREATE TABLE IF NOT EXISTS email_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'smtp', 'sendgrid', 'mailgun', 'ses'
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password VARCHAR(255),
  api_key VARCHAR(500),
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(100),
  reply_to VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (template_name, template_type, category, subject, body_template, variables, is_system_template) VALUES
('Employee Welcome', 'email', 'hr', 'Welcome to {{company_name}}!', 
'Dear {{employee_name}},

Welcome to {{company_name}}! We are excited to have you join our team.

Your employee details:
- Employee ID: {{employee_id}}
- Department: {{department}}
- Position: {{position}}
- Start Date: {{start_date}}

Please log in to your HR portal to complete your onboarding process.

Best regards,
HR Team', 
'{"employee_name": "Employee full name", "company_name": "Company name", "employee_id": "Employee ID", "department": "Department", "position": "Job position", "start_date": "Employment start date"}', 
true),

('Payroll Processed', 'email', 'payroll', 'Your Payroll for {{pay_period}} has been processed', 
'Dear {{employee_name}},

Your payroll for {{pay_period}} has been successfully processed.

Payroll Summary:
- Gross Pay: {{gross_pay}}
- Total Deductions: {{total_deductions}}
- Net Pay: {{net_pay}}
- Pay Date: {{pay_date}}

You can view your detailed payslip in the employee portal.

Best regards,
Payroll Team', 
'{"employee_name": "Employee full name", "pay_period": "Pay period", "gross_pay": "Gross pay amount", "total_deductions": "Total deductions", "net_pay": "Net pay amount", "pay_date": "Payment date"}', 
true),

('Leave Request Approved', 'email', 'leave', 'Your Leave Request has been Approved', 
'Dear {{employee_name}},

Your leave request has been approved.

Leave Details:
- Leave Type: {{leave_type}}
- Start Date: {{start_date}}
- End Date: {{end_date}}
- Days: {{days_requested}}
- Approved By: {{approved_by}}

Please ensure proper handover before your leave begins.

Best regards,
HR Team', 
'{"employee_name": "Employee full name", "leave_type": "Type of leave", "start_date": "Leave start date", "end_date": "Leave end date", "days_requested": "Number of days", "approved_by": "Approver name"}', 
true),

('Promotion Notification', 'email', 'promotion', 'Congratulations on your Promotion!', 
'Dear {{employee_name}},

Congratulations! We are pleased to inform you of your promotion.

Promotion Details:
- New Position: {{new_position}}
- New Department: {{new_department}}
- New Salary: {{new_salary}}
- Effective Date: {{effective_date}}

We look forward to your continued success in your new role.

Best regards,
Management Team', 
'{"employee_name": "Employee full name", "new_position": "New job position", "new_department": "New department", "new_salary": "New salary amount", "effective_date": "Promotion effective date"}', 
true),

('Attendance Alert', 'email', 'attendance', 'Attendance Alert - {{alert_type}}', 
'Dear {{employee_name}},

This is an automated alert regarding your attendance.

Alert Details:
- Alert Type: {{alert_type}}
- Date: {{date}}
- Time: {{time}}
- Status: {{status}}

Please contact HR if you have any questions.

Best regards,
HR Team', 
'{"employee_name": "Employee full name", "alert_type": "Type of alert", "date": "Date of incident", "time": "Time of incident", "status": "Current status"}', 
true);

-- Insert default notification settings for common scenarios
INSERT INTO notification_settings (company_id, employee_id, category, notification_type, is_enabled, delivery_method) 
SELECT 
  c.id as company_id,
  e.id as employee_id,
  unnest(ARRAY['payroll', 'hr', 'leave', 'attendance', 'promotion']) as category,
  unnest(ARRAY['payroll_processed', 'employee_welcome', 'leave_approved', 'attendance_alert', 'promotion_notification']) as notification_type,
  true as is_enabled,
  '["email"]'::jsonb as delivery_method
FROM companies c
CROSS JOIN employees e
WHERE e.company_id = c.id
ON CONFLICT (company_id, employee_id, category, notification_type) DO NOTHING;

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "notification_templates_company_access" ON notification_templates
  FOR ALL USING (company_id IN (
    SELECT company_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "notification_settings_company_access" ON notification_settings
  FOR ALL USING (company_id IN (
    SELECT company_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "notification_queue_company_access" ON notification_queue
  FOR ALL USING (company_id IN (
    SELECT company_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "notification_history_company_access" ON notification_history
  FOR ALL USING (company_id IN (
    SELECT company_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "email_configurations_company_access" ON email_configurations
  FOR ALL USING (company_id IN (
    SELECT company_id FROM employees WHERE id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_notification_templates_company_category ON notification_templates(company_id, category);
CREATE INDEX idx_notification_settings_employee_category ON notification_settings(employee_id, category);
CREATE INDEX idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_at);
CREATE INDEX idx_notification_history_recipient_date ON notification_history(recipient_id, created_at);
CREATE INDEX idx_email_configurations_company_active ON email_configurations(company_id, is_active);
