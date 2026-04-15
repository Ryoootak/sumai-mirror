-- Add property_type column to property_logs
ALTER TABLE property_logs
  ADD COLUMN IF NOT EXISTS property_type text
  CHECK (property_type IN ('mansion', 'house', 'land'));
