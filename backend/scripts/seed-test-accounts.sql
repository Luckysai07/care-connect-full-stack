/**
 * Seed Test Accounts
 * Creates test accounts for USER, VOLUNTEER, and PROFESSIONAL roles
 */

-- First, let's create the test users
-- Password for all: Password123! (hashed with bcrypt)
-- Hash: $2a$10$rN8eH.6QOzeGzV5YKXNHJeqKj5vXKp0xP0qP0qP0qP0qP0qP0qP0q (example - you'll need to generate real hash)

-- Insert test users
INSERT INTO users (email, password, name, phone, role, email_verified)
VALUES 
    ('user@careconnect.com', '$2a$10$YourHashHere', 'Test User', '+1234567890', 'USER', true),
    ('volunteer@careconnect.com', '$2a$10$YourHashHere', 'Test Volunteer', '+1234567891', 'VOLUNTEER', true),
    ('professional@careconnect.com', '$2a$10$YourHashHere', 'Test Professional', '+1234567892', 'PROFESSIONAL', true)
ON CONFLICT (email) DO NOTHING;

-- Insert user profile for regular user
INSERT INTO user_profiles (user_id, phone, address, emergency_contact_name, emergency_contact_phone)
SELECT id, '+1234567890', '123 Test St', 'Emergency Contact', '+1234567899'
FROM users WHERE email = 'user@careconnect.com'
ON CONFLICT (user_id) DO NOTHING;

-- Insert volunteer record
INSERT INTO volunteers (user_id, skills, certifications, verified, available, average_rating)
SELECT id, 'First Aid, CPR, Emergency Response', '["CPR Certified", "First Aid"]', true, true, 4.5
FROM users WHERE email = 'volunteer@careconnect.com'
ON CONFLICT (user_id) DO NOTHING;

-- Insert professional record
INSERT INTO professionals (user_id, specialization, license_number, verified, available)
SELECT id, 'Emergency Medicine', 'MED-12345', true, true
FROM users WHERE email = 'professional@careconnect.com'
ON CONFLICT (user_id) DO NOTHING;
