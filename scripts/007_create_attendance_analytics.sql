-- Create view for attendance analytics
CREATE OR REPLACE VIEW public.attendance_analytics AS
SELECT
  e.company_id,
  e.id as employee_id,
  e.full_name,
  e.department,
  e.division,
  COUNT(ar.id) as total_records,
  SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as days_present,
  SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as days_absent,
  SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as days_late,
  SUM(CASE WHEN ar.is_late THEN 1 ELSE 0 END) as late_arrivals,
  AVG(ar.late_minutes) as avg_late_minutes,
  SUM(ar.total_hours) as total_hours_worked,
  SUM(ar.overtime_hours) as total_overtime_hours,
  AVG(ar.ai_anomaly_score) as avg_anomaly_score,
  MAX(ar.date) as last_attendance_date,
  DATE_PART('day', NOW() - MAX(ar.date)) as days_since_last_attendance
FROM public.employees e
LEFT JOIN public.attendance_records ar ON e.id = ar.employee_id
WHERE ar.created_at >= NOW() - INTERVAL '90 days'
GROUP BY e.company_id, e.id, e.full_name, e.department, e.division;

-- Grant access to view
GRANT SELECT ON public.attendance_analytics TO authenticated;
