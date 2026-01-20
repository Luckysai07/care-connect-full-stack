-- Add image_url to sos_requests
ALTER TABLE sos_requests ADD COLUMN IF NOT EXISTS image_url VARCHAR(2048);
