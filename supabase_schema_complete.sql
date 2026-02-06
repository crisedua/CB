-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (careful in production!)
DROP TABLE IF EXISTS incident_attendance CASCADE;
DROP TABLE IF EXISTS incident_involved_people CASCADE;
DROP TABLE IF EXISTS incident_vehicles CASCADE;
DROP TABLE IF EXISTS incident_institutions CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;

-- Create incidents table with ALL fields
CREATE TABLE incidents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Source company (who uploaded this form)
  source_company text, -- 'primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'septima', 'octava'
  
  -- Scanned images
  scanned_images text[], -- Array of image URLs from Supabase Storage
  
  -- Basic Info
  act_number text,
  incident_number text,
  list_number text,
  date date,
  time time,
  arrival_time time,
  return_time time,
  retired_time time,
  
  -- Command
  commander text,
  company_commander text,
  company_number text,
  department text,
  floor text,
  
  -- Location
  address text,
  corner text,
  area text,
  commune text,
  population text,
  
  -- Incident Details
  nature text,
  fire_rescue_location text,
  origin text,
  cause text,
  damage text,
  
  -- Insurance
  has_insurance boolean,
  insurance_company text,
  mobile_units text[],
  insurance_conductors text,
  other_classes text,
  
  -- Company Attendance
  company_quinta int,
  company_primera int,
  company_segunda int,
  company_tercera int,
  company_cuarta int,
  company_sexta int,
  company_septima int,
  company_octava int,
  company_bc_bp int,
  attendance_correction text,
  
  -- Sector
  sector_rural boolean,
  sector_location text,
  sector_numbers int[],
  
  -- Counts
  cant_lesionados int,
  cant_involucrados int,
  cant_damnificados int,
  cant_7_3 int,
  
  -- Observations
  observations text,
  other_observations text,
  
  -- Report Metadata
  report_prepared_by text,
  list_prepared_by text,
  officer_in_charge text,
  called_by_command text,
  
  -- Raw JSON for anything missed
  raw_data jsonb
);

-- Vehicles involved in the incident
CREATE TABLE incident_vehicles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  brand text,
  model text,
  plate text,
  driver text,
  run text
);

-- Involved people (victims, injured, etc.)
CREATE TABLE incident_involved_people (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  name text,
  run text,
  attended_by_132 boolean,
  observation text,
  status text
);

-- Firefighters attendance
CREATE TABLE incident_attendance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  volunteer_name text,
  volunteer_id int,
  present boolean DEFAULT true
);

-- Institutions present at incident
CREATE TABLE incident_institutions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  institution_type text, -- 'pdi', 'prensa', 'bernagred', 'saesa', 'suralic', 'ong', 'carabineros', 'ambulancia'
  present boolean DEFAULT true,
  name text,
  grade text, -- For carabineros
  comisaria text, -- For carabineros
  movil text,
  cargo text, -- For ambulancia
  entidad text -- For ambulancia
);

-- SECURITY POLICIES --
-- Allow public access for this prototype (Warning: NOT for production sensitive data)

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_involved_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_institutions ENABLE ROW LEVEL SECURITY;

-- Policies for incidents
CREATE POLICY "Allow Public Insert Incidents" ON incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Incidents" ON incidents FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Incidents" ON incidents FOR DELETE USING (true);

-- Policies for vehicles
CREATE POLICY "Allow Public Insert Vehicles" ON incident_vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Vehicles" ON incident_vehicles FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Vehicles" ON incident_vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Vehicles" ON incident_vehicles FOR DELETE USING (true);

-- Policies for people
CREATE POLICY "Allow Public Insert People" ON incident_involved_people FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select People" ON incident_involved_people FOR SELECT USING (true);
CREATE POLICY "Allow Public Update People" ON incident_involved_people FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete People" ON incident_involved_people FOR DELETE USING (true);

-- Policies for attendance
CREATE POLICY "Allow Public Insert Attendance" ON incident_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Attendance" ON incident_attendance FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Attendance" ON incident_attendance FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Attendance" ON incident_attendance FOR DELETE USING (true);

-- Policies for institutions
CREATE POLICY "Allow Public Insert Institutions" ON incident_institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Select Institutions" ON incident_institutions FOR SELECT USING (true);
CREATE POLICY "Allow Public Update Institutions" ON incident_institutions FOR UPDATE USING (true);
CREATE POLICY "Allow Public Delete Institutions" ON incident_institutions FOR DELETE USING (true);
