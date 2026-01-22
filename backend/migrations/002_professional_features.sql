/**
 * Migration: Add Professional Features
 * Adds case_notes and case_timeline tables for professional case management
 */

-- Case Notes Table
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(user_id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case Timeline Table
CREATE TABLE IF NOT EXISTS case_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID NOT NULL REFERENCES sos_requests(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_case_notes_sos ON case_notes(sos_id);
CREATE INDEX idx_case_notes_professional ON case_notes(professional_id);
CREATE INDEX idx_case_timeline_sos ON case_timeline(sos_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_case_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_notes_updated_at
    BEFORE UPDATE ON case_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_case_notes_updated_at();

-- Add timeline events for existing SOS requests
INSERT INTO case_timeline (sos_id, event, description, created_at)
SELECT id, 'SOS_CREATED', 'Emergency request created', created_at
FROM sos_requests
WHERE NOT EXISTS (
    SELECT 1 FROM case_timeline WHERE sos_id = sos_requests.id AND event = 'SOS_CREATED'
);
