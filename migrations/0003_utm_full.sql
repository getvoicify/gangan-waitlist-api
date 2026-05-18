-- Add remaining UTM attribution columns for full 5-param tracking (GAN-939)
-- utm_source and utm_campaign were added in 0002_attribution.sql

ALTER TABLE waitlist ADD COLUMN utm_medium TEXT;
ALTER TABLE waitlist ADD COLUMN utm_content TEXT;
ALTER TABLE waitlist ADD COLUMN utm_term TEXT;
