-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create incidents table
create table if not exists incidents (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  act_number text,
  date date,
  time time,
  commander text, -- A Cargo del Cuerpo
  company_commander text, -- A Cargo de la Compañía
  address text,
  corner text,
  area text, -- Poblacion
  nature text, -- Naturaleza del lugar
  origin text,
  cause text,
  observations text,
  other_observations text,
  
  -- Raw JSON for anything missed or structured differently
  raw_data jsonb
);

-- Vehicles involved in the incident (The machines participating)
create table if not exists incident_vehicles (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id) on delete cascade,
  brand text,
  model text,
  plate text,
  driver text,
  run text
);

-- Involved people (Victims or drivers involved in crash, etc)
create table if not exists incident_involved_people (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id) on delete cascade,
  name text,
  run text,
  attended_by_132 boolean,
  observation text,
  status text
);

-- Firefighters attendance
create table if not exists incident_attendance (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id) on delete cascade,
  volunteer_name text,
  volunteer_id int,
  present boolean default true
);

-- SECURITY POLICIES --

-- Allow public access for this prototype (Warning: NOT for production sensitive data)
alter table incidents enable row level security;
alter table incident_vehicles enable row level security;
alter table incident_involved_people enable row level security;
alter table incident_attendance enable row level security;

-- Policy for Inserts
create policy "Allow Public Insert Incidents" on incidents for insert with check (true);
create policy "Allow Public Insert Vehicles" on incident_vehicles for insert with check (true);
create policy "Allow Public Insert People" on incident_involved_people for insert with check (true);
create policy "Allow Public Insert Attendance" on incident_attendance for insert with check (true);

-- Policy for Selects (so we can see what we saved)
create policy "Allow Public Select Incidents" on incidents for select using (true);
create policy "Allow Public Select Vehicles" on incident_vehicles for select using (true);
create policy "Allow Public Select People" on incident_involved_people for select using (true);
create policy "Allow Public Select Attendance" on incident_attendance for select using (true);
