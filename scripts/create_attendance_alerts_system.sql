-- Enhanced Attendance, Overtime & Compliance Alert System

-- Alert rules configuration table
CREATE TABLE IF NOT EXISTS attendance_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'attendance', 'overtime', 'compliance'
  alert_category VARCHAR(50) NOT NULL, -- 'late_check_in', 'overtime_threshold', 'document_expiring', etc.
  trigger_condition JSONB NOT NULL, -- { "threshold": 3, "period_days": 30, "comparison": ">=", "metric": "late_arrivals" }
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  notification_channels JSONB DEFAULT '["email"]', -- ['email', 'sms', 'push', 'system']
  recipient_roles JSONB DEFAULT '["employee", "manager"]', -- Who should receive alerts
  is_auto_escalate BOOLEAN DEFAULT false,
  escalation_delay_hours INTEGER DEFAULT 24,
  escalation_recipients JSONB, -- ["hr", "senior_management"]
  is_active BOOLEAN DEFAULT true,
  template_key VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history/log table
CREATE TABLE IF NOT EXISTS attendance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES attendance_alert_rules(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB, -- Context data that triggered the alert
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'acknowledged', 'resolved', 'escalated'
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES employees(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES employees(id),
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_level INTEGER DEFAULT 0,
  notification_ids JSONB, -- References to notification_queue/history
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert acknowledgment tracking
CREATE TABLE IF NOT EXISTS alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES attendance_alerts(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_note TEXT,
  action_taken VARCHAR(100)
);

-- Insert default alert rules
INSERT INTO attendance_alert_rules (rule_name, rule_type, alert_category, trigger_condition, severity, notification_channels, recipient_roles, template_key) VALUES
-- Attendance alerts
('Late Check-In Pattern', 'attendance', 'late_check_in', 
'{"threshold": 3, "period_days": 30, "comparison": ">=", "metric": "late_arrivals"}',
'medium', '["email", "system"]', '["employee", "manager"]', 'ATTENDANCE.LATE_PATTERN'),

('Consecutive Absences', 'attendance', 'absent_consecutive', 
'{"threshold": 3, "period_days": 3, "comparison": ">=", "metric": "consecutive_absences"}',
'high', '["email", "sms", "system"]', '["employee", "manager", "hr"]', 'ATTENDANCE.CONSECUTIVE_ABSENCE'),

('Missing Clock-Out', 'attendance', 'missing_clock_out', 
'{"threshold": 1, "period_days": 1, "comparison": ">=", "metric": "missing_clock_out"}',
'low', '["system", "push"]', '["employee"]', 'ATTENDANCE.MISSING_CLOCK_OUT'),

('Early Departure Pattern', 'attendance', 'early_departure', 
'{"threshold": 5, "period_days": 30, "comparison": ">=", "metric": "early_departures"}',
'medium', '["email", "system"]', '["employee", "manager"]', 'ATTENDANCE.EARLY_DEPARTURE'),

-- Overtime alerts
('Excessive Overtime', 'overtime', 'overtime_threshold', 
'{"threshold": 20, "period_days": 7, "comparison": ">=", "metric": "overtime_hours"}',
'high', '["email", "system"]', '["employee", "manager", "hr"]', 'OVERTIME.EXCESSIVE'),

('Fatigue Risk Alert', 'overtime', 'fatigue_risk', 
'{"threshold": 50, "period_days": 7, "comparison": ">=", "metric": "total_hours_worked"}',
'critical', '["email", "sms", "system"]', '["employee", "manager", "hr"]', 'OVERTIME.FATIGUE_RISK'),

('Overtime Pending Approval', 'overtime', 'pending_approval', 
'{"threshold": 48, "period_hours": 48, "comparison": ">=", "metric": "hours_pending"}',
'medium', '["email", "system"]', '["manager", "hr"]', 'OVERTIME.PENDING_APPROVAL'),

-- Compliance alerts
('Document Expiring Soon', 'compliance', 'document_expiring', 
'{"threshold": 60, "period_days": 60, "comparison": "<=", "metric": "days_to_expiry"}',
'high', '["email", "system"]', '["employee", "hr"]', 'COMPLIANCE.DOCUMENT_EXPIRING'),

('Missing Required Documents', 'compliance', 'missing_documents', 
'{"threshold": 1, "period_days": 7, "comparison": ">=", "metric": "missing_docs"}',
'high', '["email", "sms", "system"]', '["employee", "hr"]', 'COMPLIANCE.MISSING_DOCUMENTS'),

('Tax Filing Due', 'compliance', 'tax_filing_due', 
'{"threshold": 14, "period_days": 14, "comparison": "<=", "metric": "days_to_deadline"}',
'critical', '["email", "system"]', '["hr", "payroll"]', 'COMPLIANCE.TAX_FILING_DUE');

-- Enable RLS
ALTER TABLE attendance_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "alert_rules_company_access" ON attendance_alert_rules
  FOR ALL USING (company_id IN (
    SELECT company_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "alerts_company_access" ON attendance_alerts
  FOR ALL USING (company_id IN (
    SELECT company_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "acknowledgments_company_access" ON alert_acknowledgments
  FOR ALL USING (alert_id IN (
    SELECT id FROM attendance_alerts WHERE company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  ));

-- Indexes
CREATE INDEX idx_alert_rules_company_type ON attendance_alert_rules(company_id, rule_type);
CREATE INDEX idx_alerts_employee_status ON attendance_alerts(employee_id, status);
CREATE INDEX idx_alerts_created_at ON attendance_alerts(created_at DESC);
CREATE INDEX idx_alert_acknowledgments_alert ON alert_acknowledgments(alert_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_alert_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attendance_alert_rules_timestamp
BEFORE UPDATE ON attendance_alert_rules
FOR EACH ROW
EXECUTE FUNCTION update_alert_rules_timestamp();
