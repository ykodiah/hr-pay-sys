-- Add clock in/out method tracking to attendance records
-- This allows tracking how attendance was recorded (manual, biometric, mobile app, etc.)

ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS clock_in_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS clock_out_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS clock_in_device_id UUID REFERENCES biometric_devices(id),
ADD COLUMN IF NOT EXISTS clock_out_device_id UUID REFERENCES biometric_devices(id),
ADD COLUMN IF NOT EXISTS clock_in_gps_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS clock_in_gps_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS clock_out_gps_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS clock_out_gps_lng DECIMAL(11, 8);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_method ON attendance_records(clock_in_method, clock_out_method);

COMMENT ON COLUMN attendance_records.clock_in_method IS 'Method used for clock in: manual, biometric, mobile_app, web_portal, etc.';
COMMENT ON COLUMN attendance_records.clock_out_method IS 'Method used for clock out: manual, biometric, mobile_app, web_portal, etc.';
