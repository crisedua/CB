-- Step 3: Add security policies
-- Run this after steps 1 and 2

-- Enable RLS on all tables
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_involved_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_institutions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Create policies for all tables
CREATE POLICY "Allow Public Insert Incidents" ON incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Incidents" ON incidents FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Incidents" ON incidents FOR DELETE USING (true);

CREATE POLICY "Allow Public Insert Vehicles" ON incident_vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Vehicles" ON incident_vehicles FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Vehicles" ON incident_vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Vehicles" ON incident_vehicles FOR DELETE USING (true);

CREATE POLICY "Allow Public Insert People" ON incident_involved_people FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select People" ON incident_involved_people FOR SELECT USING (true);
CREATE POLICY "Allow Public Update People" ON incident_involved_people FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete People" ON incident_involved_people FOR DELETE USING (true);

CREATE POLICY "Allow Public Insert Attendance" ON incident_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Attendance" ON incident_attendance FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Attendance" ON incident_attendance FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Attendance" ON incident_attendance FOR DELETE USING (true);

CREATE POLICY "Allow Public Insert Institutions" ON incident_institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Institutions" ON incident_institutions FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Institutions" ON incident_institutions FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Institutions" ON incident_institutions FOR DELETE USING (true);
