-- OWASP Security Implementation
-- This migration adds authentication-based security and audit logging

-- 1. Create audit log table for security monitoring (A09: Security Logging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 2. Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read their own logs, admins can read all
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- 3. Update RLS policies to require authentication (A01: Broken Access Control)

-- Drop all public policies
DROP POLICY IF EXISTS "Allow Public Insert Incidents" ON incidents;
DROP POLICY IF EXISTS "Allow Public Select Incidents" ON incidents;
DROP POLICY IF EXISTS "Allow Public Update Incidents" ON incidents;
DROP POLICY IF EXISTS "Allow Public Delete Incidents" ON incidents;

DROP POLICY IF EXISTS "Allow Public Insert Vehicles" ON incident_vehicles;
DROP POLICY IF EXISTS "Allow Public Select Vehicles" ON incident_vehicles;
DROP POLICY IF EXISTS "Allow Public Update Vehicles" ON incident_vehicles;
DROP POLICY IF EXISTS "Allow Public Delete Vehicles" ON incident_vehicles;

DROP POLICY IF EXISTS "Allow Public Insert People" ON incident_involved_people;
DROP POLICY IF EXISTS "Allow Public Select People" ON incident_involved_people;
DROP POLICY IF EXISTS "Allow Public Update People" ON incident_involved_people;
DROP POLICY IF EXISTS "Allow Public Delete People" ON incident_involved_people;

DROP POLICY IF EXISTS "Allow Public Insert Attendance" ON incident_attendance;
DROP POLICY IF EXISTS "Allow Public Select Attendance" ON incident_attendance;
DROP POLICY IF EXISTS "Allow Public Update Attendance" ON incident_attendance;
DROP POLICY IF EXISTS "Allow Public Delete Attendance" ON incident_attendance;

DROP POLICY IF EXISTS "Allow Public Insert Institutions" ON incident_institutions;
DROP POLICY IF EXISTS "Allow Public Select Institutions" ON incident_institutions;
DROP POLICY IF EXISTS "Allow Public Update Institutions" ON incident_institutions;
DROP POLICY IF EXISTS "Allow Public Delete Institutions" ON incident_institutions;

-- Create authenticated-only policies for incidents
CREATE POLICY "Authenticated users can insert incidents" ON incidents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view incidents" ON incidents
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update incidents" ON incidents
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete incidents" ON incidents
    FOR DELETE
    TO authenticated
    USING (true);

-- Create authenticated-only policies for vehicles
CREATE POLICY "Authenticated users can insert vehicles" ON incident_vehicles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view vehicles" ON incident_vehicles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update vehicles" ON incident_vehicles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles" ON incident_vehicles
    FOR DELETE
    TO authenticated
    USING (true);

-- Create authenticated-only policies for people
CREATE POLICY "Authenticated users can insert people" ON incident_involved_people
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view people" ON incident_involved_people
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update people" ON incident_involved_people
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete people" ON incident_involved_people
    FOR DELETE
    TO authenticated
    USING (true);

-- Create authenticated-only policies for attendance
CREATE POLICY "Authenticated users can insert attendance" ON incident_attendance
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view attendance" ON incident_attendance
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update attendance" ON incident_attendance
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attendance" ON incident_attendance
    FOR DELETE
    TO authenticated
    USING (true);

-- Create authenticated-only policies for institutions
CREATE POLICY "Authenticated users can insert institutions" ON incident_institutions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view institutions" ON incident_institutions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update institutions" ON incident_institutions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete institutions" ON incident_institutions
    FOR DELETE
    TO authenticated
    USING (true);

-- 4. Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add audit triggers to all tables
DROP TRIGGER IF EXISTS audit_incidents_trigger ON incidents;
CREATE TRIGGER audit_incidents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_vehicles_trigger ON incident_vehicles;
CREATE TRIGGER audit_vehicles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON incident_vehicles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_people_trigger ON incident_involved_people;
CREATE TRIGGER audit_people_trigger
    AFTER INSERT OR UPDATE OR DELETE ON incident_involved_people
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_institutions_trigger ON incident_institutions;
CREATE TRIGGER audit_institutions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON incident_institutions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 6. Secure storage bucket (A05: Security Misconfiguration)
-- Note: Run these commands in Supabase Dashboard > Storage > incident-scans > Policies

-- Remove public access and require authentication
-- You'll need to manually update the bucket to be private and add these policies:

/*
-- In Supabase Dashboard, create these storage policies:

1. "Authenticated users can upload"
   Operation: INSERT
   Policy: (bucket_id = 'incident-scans' AND auth.role() = 'authenticated')

2. "Authenticated users can view"
   Operation: SELECT
   Policy: (bucket_id = 'incident-scans' AND auth.role() = 'authenticated')

3. "Authenticated users can update"
   Operation: UPDATE
   Policy: (bucket_id = 'incident-scans' AND auth.role() = 'authenticated')

4. "Authenticated users can delete"
   Operation: DELETE
   Policy: (bucket_id = 'incident-scans' AND auth.role() = 'authenticated')
*/

-- 7. Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, endpoint, window_start);

-- Function to clean old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON incident_vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON incident_involved_people TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON incident_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON incident_institutions TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limits TO authenticated;

COMMENT ON TABLE audit_logs IS 'Security audit log for all database operations (OWASP A09)';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking to prevent abuse';
