-- Migration: Remove Professional Role and Merge into Volunteer
-- This migration removes the PROFESSIONAL role and merges its functionality into VOLUNTEER

BEGIN;

-- Step 1: Add professional fields to volunteers table
ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100),
ADD COLUMN IF NOT EXISTS hospital_affiliation VARCHAR(200);

-- Step 2: Migrate existing professionals to volunteers
INSERT INTO volunteers (user_id, skills, verified, available, license_number, specialization, hospital_affiliation, verified_at, verified_by)
SELECT 
    p.user_id,
    ARRAY[]::VARCHAR[],  -- Empty skills array
    p.verified,
    p.available,
    p.license_number,
    p.specialization,
    p.hospital_affiliation,
    p.verified_at,
    p.verified_by
FROM professionals p
WHERE NOT EXISTS (
    SELECT 1 FROM volunteers v WHERE v.user_id = p.user_id
);

-- Step 3: Update users table - change PROFESSIONAL role to VOLUNTEER
UPDATE users 
SET role = 'VOLUNTEER' 
WHERE role = 'PROFESSIONAL';

-- Step 4: Drop professional tables
DROP TABLE IF EXISTS professional_documents CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;

-- Step 5: Update role constraint on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('USER', 'VOLUNTEER', 'ADMIN'));

COMMIT;

-- Verify migration
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as professional_users_remaining FROM users WHERE role = 'PROFESSIONAL';
SELECT COUNT(*) as volunteers_with_license FROM volunteers WHERE license_number IS NOT NULL;
