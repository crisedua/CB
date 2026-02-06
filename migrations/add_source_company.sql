-- Migration to add source_company column to incidents table
-- Run this in Supabase SQL Editor

ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS source_company text;

-- Optional: Add a comment describing the column
COMMENT ON COLUMN incidents.source_company IS 'The company that uploaded/scanned this form: primera, segunda, tercera, cuarta, quinta, sexta, septima, octava';
