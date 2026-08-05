-- Biometric device online sync: API credentials + punch queue.
-- Safe to re-run.

ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS api_base_url text;
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS api_key text;
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS sync_path varchar(240) DEFAULT '/api/punches';
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS sync_mode varchar(40) DEFAULT 'webhook';
  -- webhook | pull | csv
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS last_sync_count integer DEFAULT 0;
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS last_sync_error text;
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS webhook_token varchar(80);

CREATE TABLE IF NOT EXISTS public.biometric_punch_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.biometric_devices(id) ON DELETE SET NULL,
  employee_code varchar(80),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  punched_at timestamptz NOT NULL,
  punch_type varchar(20) DEFAULT 'auto', -- in | out | auto
  raw jsonb DEFAULT '{}'::jsonb,
  status varchar(40) DEFAULT 'pending', -- pending | processed | failed | duplicate
  error_message text,
  processed_at timestamptz,
  attendance_id uuid,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bio_punch_queue_company_status
  ON public.biometric_punch_queue(company_id, status, punched_at);
CREATE INDEX IF NOT EXISTS idx_bio_punch_queue_device
  ON public.biometric_punch_queue(device_id, punched_at DESC);

ALTER TABLE public.biometric_punch_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS biometric_punch_queue_all ON public.biometric_punch_queue;
CREATE POLICY biometric_punch_queue_all ON public.biometric_punch_queue
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.biometric_punch_queue TO authenticated, anon, service_role;

-- Ensure devices table grants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'biometric_devices') THEN
    EXECUTE 'GRANT ALL ON public.biometric_devices TO authenticated, anon, service_role';
  END IF;
END $$;
