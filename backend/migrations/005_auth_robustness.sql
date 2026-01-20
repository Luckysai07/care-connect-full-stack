-- Add columns for account lockout and login tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) DEFAULT NULL;

-- Create index for performance on login lookups (optional but good for scale)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
