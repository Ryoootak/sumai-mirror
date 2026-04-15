-- Add partner_comment column to property_logs
ALTER TABLE property_logs
  ADD COLUMN IF NOT EXISTS partner_comment text;
