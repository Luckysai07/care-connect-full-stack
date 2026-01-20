-- Migration: Add volunteer location tracking
-- Adds location column and index for geo-spatial queries

BEGIN;

-- Add location tracking columns to volunteers table
ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS last_location GEOGRAPHY(POINT, 4326),
ADD COLUMN IF NOT EXISTS last_location_updated_at TIMESTAMP;

-- Create spatial index for efficient location queries
CREATE INDEX IF NOT EXISTS idx_volunteers_location ON volunteers USING GIST(last_location);

-- Add comment
COMMENT ON COLUMN volunteers.last_location IS 'Volunteer current location for nearby SOS matching';
COMMENT ON COLUMN volunteers.last_location_updated_at IS 'Last time volunteer location was updated';

COMMIT;
