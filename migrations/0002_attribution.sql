-- Add attribution columns for CMO landing page A/B testing and UTM tracking
-- Keep user_type column as-is (no rename — backward compat)

ALTER TABLE waitlist ADD COLUMN variant TEXT;
ALTER TABLE waitlist ADD COLUMN utm_source TEXT;
ALTER TABLE waitlist ADD COLUMN utm_campaign TEXT;
