-- Attendance policy automation

CREATE TABLE IF NOT EXISTS attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  policy_type TEXT NOT NULL DEFAULT 'grace' CHECK (policy_type IN ('grace', 'rounding', 'penalty', 'payroll')),
  scope_type TEXT NOT NULL DEFAULT 'company' CHECK (scope_type IN ('company', 'subsidiary', 'department', 'team')),
  scope_reference UUID,
  grace_minutes INTEGER DEFAULT 0,
  rounding_increment INTEGER DEFAULT 0,
  rounding_mode TEXT DEFAULT 'nearest' CHECK (rounding_mode IN ('nearest', 'up', 'down')),
  penalty_type TEXT,
  penalty_value NUMERIC(6,2),
  auto_escalate BOOLEAN DEFAULT FALSE,
  escalation_minutes INTEGER,
  escalation_channel TEXT DEFAULT 'email' CHECK (escalation_channel IN ('email', 'sms', 'push')),
  payroll_action TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_policy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES attendance_policies(id) ON DELETE CASCADE,
  attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES employees(id),
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  applied_by UUID,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_policies_scope ON attendance_policies(scope_type, scope_reference);
CREATE INDEX IF NOT EXISTS idx_attendance_policy_logs_policy ON attendance_policy_logs(policy_id);

ALTER TABLE attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_policy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance policy view own company" ON attendance_policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id::text = auth.uid()::text
      AND (
        scope_type = 'company' AND scope_reference IS NULL AND e.company_id IS NOT NULL
        OR scope_reference IS NULL
        OR scope_reference = e.subsidiary_id
      )
    )
  );

CREATE POLICY "Attendance policy manage hr" ON attendance_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id::text = auth.uid()::text
      AND e.company_id = (
        SELECT company_id FROM employees emp
        WHERE emp.id = created_by
      )
      AND e.special_role IN ('HR', 'Admin')
    )
  );

CREATE POLICY "Attendance policy logs readable" ON attendance_policy_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id::text = auth.uid()::text
      AND e.company_id = (
        SELECT emp.company_id FROM employees emp
        WHERE emp.id = attendance_policy_logs.employee_id
      )
    )
  );

