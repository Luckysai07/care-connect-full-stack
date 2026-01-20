-- ============================================
-- CareConnect Database Schema
-- Initial Migration - Creates all tables
-- ============================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- USERS TABLE
-- Core user authentication and identity
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'VOLUNTEER', 'PROFESSIONAL', 'ADMIN')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;

-- ============================================
-- USER PROFILES TABLE
-- User personal information
-- ============================================
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    photo_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);

-- ============================================
-- VOLUNTEERS TABLE
-- Volunteer-specific data
-- ============================================
CREATE TABLE volunteers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[] NOT NULL DEFAULT '{}',
    certifications JSONB DEFAULT '[]',
    verified BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT false,
    average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    cancellation_count INT DEFAULT 0,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_volunteers_verified ON volunteers(verified) WHERE verified = true;
CREATE INDEX idx_volunteers_available ON volunteers(available) WHERE available = true AND verified = true;
CREATE INDEX idx_volunteers_rating ON volunteers(average_rating DESC);

-- ============================================
-- PROFESSIONALS TABLE
-- Medical professionals data
-- ============================================
CREATE TABLE professionals (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    hospital_affiliation VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_professionals_verified ON professionals(verified) WHERE verified = true;
CREATE INDEX idx_professionals_specialization ON professionals(specialization);

-- ============================================
-- USER LOCATIONS TABLE
-- Real-time location tracking with PostGIS
-- ============================================
CREATE TABLE user_locations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy_meters FLOAT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for geo-queries
CREATE INDEX idx_user_locations_gist ON user_locations USING GIST(location);

-- ============================================
-- SOS REQUESTS TABLE
-- Emergency SOS requests
-- ============================================
CREATE TABLE sos_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    emergency_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    accepted_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    CONSTRAINT valid_emergency_type CHECK (
        emergency_type IN ('MEDICAL', 'FIRE', 'ACCIDENT', 'CRIME', 'NATURAL_DISASTER', 'OTHER')
    ),
    CONSTRAINT valid_priority CHECK (
        priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED', 'ESCALATED')
    ),
    CONSTRAINT accepted_at_after_created CHECK (
        accepted_at IS NULL OR accepted_at >= created_at
    ),
    CONSTRAINT resolved_at_after_accepted CHECK (
        resolved_at IS NULL OR resolved_at >= accepted_at
    )
);

-- Indexes for common queries
CREATE INDEX idx_sos_status ON sos_requests(status) WHERE status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS');
CREATE INDEX idx_sos_user_id ON sos_requests(user_id);
CREATE INDEX idx_sos_accepted_by ON sos_requests(accepted_by);
CREATE INDEX idx_sos_created_at ON sos_requests(created_at DESC);
CREATE INDEX idx_sos_location_gist ON sos_requests USING GIST(location);
CREATE INDEX idx_sos_status_created ON sos_requests(status, created_at DESC);

-- ============================================
-- CHAT MESSAGES TABLE
-- Real-time chat between user and responder
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_sos_id ON chat_messages(sos_id, created_at ASC);
CREATE INDEX idx_chat_sender_id ON chat_messages(sender_id);

-- ============================================
-- SOS FEEDBACK TABLE
-- User ratings for volunteers
-- ============================================
CREATE TABLE sos_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(sos_id)
);

CREATE INDEX idx_feedback_volunteer ON sos_feedback(volunteer_id);

-- ============================================
-- SOS REJECTIONS TABLE
-- Track volunteer rejections
-- ============================================
CREATE TABLE sos_rejections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(sos_id, volunteer_id)
);

CREATE INDEX idx_rejections_sos ON sos_rejections(sos_id);
CREATE INDEX idx_rejections_volunteer ON sos_rejections(volunteer_id);

-- ============================================
-- SOS CANCELLATIONS TABLE
-- Track volunteer cancellations after acceptance
-- ============================================
CREATE TABLE sos_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cancellations_volunteer ON sos_cancellations(volunteer_id);

-- ============================================
-- REFRESH TOKENS TABLE
-- JWT refresh token management
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked = false;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked = false;

-- ============================================
-- VOLUNTEER DOCUMENTS TABLE
-- Store volunteer verification documents
-- ============================================
CREATE TABLE volunteer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(user_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_document_type CHECK (
        document_type IN ('ID_PROOF', 'CERTIFICATION', 'BACKGROUND_CHECK', 'OTHER')
    )
);

CREATE INDEX idx_volunteer_docs ON volunteer_documents(volunteer_id);

-- ============================================
-- PROFESSIONAL DOCUMENTS TABLE
-- Store professional license documents
-- ============================================
CREATE TABLE professional_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(user_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_document_type CHECK (
        document_type IN ('MEDICAL_LICENSE', 'DEGREE', 'HOSPITAL_ID', 'OTHER')
    )
);

CREATE INDEX idx_professional_docs ON professional_documents(professional_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update volunteer average rating when feedback is added
CREATE OR REPLACE FUNCTION update_volunteer_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE volunteers
    SET average_rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM sos_feedback
        WHERE volunteer_id = NEW.volunteer_id
    )
    WHERE user_id = NEW.volunteer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_rating
AFTER INSERT ON sos_feedback
FOR EACH ROW
EXECUTE FUNCTION update_volunteer_rating();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
