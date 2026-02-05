-- Step 1: Create base tables if they don't exist
-- Run this first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create incidents table (basic version)
CREATE TABLE IF NOT EXISTS incidents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  act_number text,
  date date,
  time time,
  commander text,
  company_commander text,
  address text,
  corner text,
  area text,
  nature text,
  origin text,
  cause text,
  observations text,
  other_observations text,
  raw_data jsonb
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS incident_vehicles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  brand text,
  model text,
  plate text,
  driver text,
  run text
);

-- Create people table
CREATE TABLE IF NOT EXISTS incident_involved_people (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  name text,
  run text,
  attended_by_132 boolean,
  observation text,
  status text
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS incident_attendance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  volunteer_name text,
  volunteer_id int,
  present boolean DEFAULT true
);

-- Create institutions table
CREATE TABLE IF NOT EXISTS incident_institutions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  institution_type text,
  present boolean DEFAULT true,
  name text,
  grade text,
  comisaria text,
  movil text,
  cargo text,
  entidad text
);
