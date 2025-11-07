-- Timesheet intelligence persistence layer

CREATE TABLE IF NOT EXISTS timesheet_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours NUMERIC(6,2) DEFAULT 0,
  expected_hours NUMERIC(6,2) DEFAULT 0,
  overtime_hours NUMERIC(6,2) DEFAULT 0,
  variance_hours NUMERIC(6,2) DEFAULT 0,
  alerts JSONB DEFAULT '[]',
  fatigue_risk BOOLEAN DEFAULT FALSE,
  missing_punches INTEGER DEFAULT 0,
  lateness_streak INTEGER DEFAULT 0,
  overnight_shifts INTEGER DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES employees(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS timesheet_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES timesheet_snapshots(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  recommendation TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES employees(id),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS timesheet_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id UUID REFERENCES timesheet_anomalies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  action_type TEXT NOT NULL, -- e.g. 'nudge', 'payroll_route'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_timesheet_snapshots_employee_period ON timesheet_snapshots(employee_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_timesheet_anomalies_employee ON timesheet_anomalies(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_anomalies_snapshot ON timesheet_anomalies(snapshot_id);

ALTER TABLE timesheet_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_actions ENABLE ROW LEVEL SECURITY;

-- Policies: employees see their own; managers/HR see company data; system role inserts

CREATE POLICY "Timesheet snapshots: employees read own" ON timesheet_snapshots
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Timesheet anomalies: employees read own" ON timesheet_anomalies
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Timesheet actions: employees read own" ON timesheet_actions
  FOR SELECT USING (auth.uid()::text = employee_id::text);

-- HR/Admin broad access aligned with employees.company_id
CREATE POLICY "Timesheet snapshots: hr access" ON timesheet_snapshots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id::text = auth.uid()::text
      AND e.company_id = (SELECT emp.company_id FROM employees emp WHERE emp.id = timesheet_snapshots.employee_id)
      AND e.special_role IN ('HR', 'Admin')
    )
  );

CREATE POLICY "Timesheet anomalies: hr access" ON timesheet_anomalies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id::text = auth.uid()::text
      AND e.company_id = (SELECT emp.company_id FROM employees emp WHERE emp.id = timesheet_anomalies.employee_id)
      AND e.special_role IN ('HR', 'Admin')
    )
  );

CREATE POLICY "Timesheet actions: hr access" ON timesheet_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id::text = auth.uid()::text
      AND e.company_id = (SELECT emp.company_id FROM employees emp WHERE emp.id = timesheet_actions.employee_id)
      AND e.special_role IN ('HR', 'Admin')
    )
  );

-- Service role (supabase functions) can insert/update via auth role check in API layer.

