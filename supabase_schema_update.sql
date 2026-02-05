-- Add missing fields to incidents table
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS incident_number text,
ADD COLUMN IF NOT EXISTS list_number text,
ADD COLUMN IF NOT EXISTS return_time time,
ADD COLUMN IF NOT EXISTS retired_time time,
ADD COLUMN IF NOT EXISTS arrival_location text,
ADD COLUMN IF NOT EXISTS company_number text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS floor text,
ADD COLUMN IF NOT EXISTS commune text,
ADD COLUMN IF NOT EXISTS fire_rescue_location text,
ADD COLUMN IF NOT EXISTS damage text,
ADD COLUMN IF NOT EXISTS insurance_company text,
ADD COLUMN IF NOT EXISTS has_insurance boolean,
ADD COLUMN IF NOT EXISTS mobile_units text[],
ADD COLUMN IF NOT EXISTS insurance_conductors text,
ADD COLUMN IF NOT EXISTS other_classes text,
ADD COLUMN IF NOT EXISTS company_quinta int,
ADD COLUMN IF NOT EXISTS company_primera int,
ADD COLUMN IF NOT EXISTS company_segunda int,
ADD COLUMN IF NOT EXISTS company_tercera int,
ADD COLUMN IF NOT EXISTS company_cuarta int,
ADD COLUMN IF NOT EXISTS company_sexta int,
ADD COLUMN IF NOT EXISTS company_septima int,
ADD COLUMN IF NOT EXISTS company_octava int,
ADD COLUMN IF NOT EXISTS company_bc_bp int,
ADD COLUMN IF NOT EXISTS attendance_correction text,
ADD COLUMN IF NOT EXISTS sector_rural boolean,
ADD COLUMN IF NOT EXISTS sector_location text,
ADD COLUMN IF NOT EXISTS sector_numbers int[],
ADD COLUMN IF NOT EXISTS cant_lesionados int,
ADD COLUMN IF NOT EXISTS cant_involucrados int,
ADD COLUMN IF NOT EXISTS cant_damnificados int,
ADD COLUMN IF NOT EXISTS cant_7_3 int,
ADD COLUMN IF NOT EXISTS report_prepared_by text,
ADD COLUMN IF NOT EXISTS list_prepared_by text,
ADD COLUMN IF NOT EXISTS officer_in_charge text,
ADD COLUMN IF NOT EXISTS called_by_command text;

-- Create institutions table
CREATE TABLE IF NOT EXISTS incident_institutions (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id) on delete cascade,
  institution_type text, -- 'pdi', 'prensa', 'bernagred', 'saesa', 'suralic', 'ong', 'carabineros', 'ambulancia'
  present boolean default true,
  name text,
  grade text, -- For carabineros
  comisaria text, -- For carabineros
  movil text,
  cargo text, -- For ambulancia
  entidad text -- For ambulancia
);

-- Add RLS policies for institutions
ALTER TABLE incident_institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Public Insert Institutions" ON incident_institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Institutions" ON incident_institutions FOR SELECT USING (true);
CREATE POLICY "Allow Public Delete Institutions" ON incident_institutions FOR DELETE USING (true);

-- Add update policies for all tables
CREATE POLICY "Allow Public Update Incidents" ON incidents FOR UPDATE USING (true);
CREATE POLICY "Allow Public Update Vehicles" ON incident_vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow Public Update People" ON incident_involved_people FOR UPDATE USING (true);
CREATE POLICY "Allow Public Update Attendance" ON incident_attendance FOR UPDATE USING (true);
CREATE POLICY "Allow Public Update Institutions" ON incident_institutions FOR UPDATE USING (true);

-- Add delete policies
CREATE POLICY "Allow Public Delete Incidents" ON incidents FOR DELETE USING (true);
CREATE POLICY "Allow Public Delete Vehicles" ON incident_vehicles FOR DELETE USING (true);
CREATE POLICY "Allow Public Delete People" ON incident_involved_people FOR DELETE USING (true);
CREATE POLICY "Allow Public Delete Attendance" ON incident_attendance FOR DELETE USING (true);
