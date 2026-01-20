-- Migration: Add SOS Expiration Feature
-- Adds 2-minute auto-expiration to SOS requests

BEGIN;

-- Add expiration columns to sos_requests table
ALTER TABLE sos_requests 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP;

-- Set expiration time for existing PENDING requests (2 minutes from creation)
UPDATE sos_requests 
SET expires_at = created_at + INTERVAL '2 minutes'
WHERE status = 'PENDING' AND expires_at IS NULL;

-- Add EXPIRED to status enum (drop and recreate constraint)
ALTER TABLE sos_requests DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE sos_requests ADD CONSTRAINT valid_status 
CHECK (status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED', 'ESCALATED', 'EXPIRED'));

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_sos_requests_expires_at 
ON sos_requests(expires_at) 
WHERE status = 'PENDING';

COMMIT;

-- Verify migration
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as pending_with_expiration 
FROM sos_requests 
WHERE status = 'PENDING' AND expires_at IS NOT NULL;
