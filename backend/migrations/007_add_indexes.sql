-- Add indexes to improve query performance

-- Users: Optimization for login and lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- SOS Requests: Optimization for filtering by status and user
CREATE INDEX IF NOT EXISTS idx_sos_requests_status ON sos_requests(status);
CREATE INDEX IF NOT EXISTS idx_sos_requests_user_id ON sos_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_requests_created_at ON sos_requests(created_at DESC);

-- Volunteers: Optimization for finding available volunteers
CREATE INDEX IF NOT EXISTS idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_is_active ON volunteers(is_active);
