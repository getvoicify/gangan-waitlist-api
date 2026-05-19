-- Lead-capture v0.2 additions (GAN-207)
-- All columns nullable; no backfill required; existing rows keep working with NULLs.
ALTER TABLE waitlist ADD COLUMN utm_source TEXT;
ALTER TABLE waitlist ADD COLUMN utm_medium TEXT;
ALTER TABLE waitlist ADD COLUMN utm_campaign TEXT;
ALTER TABLE waitlist ADD COLUMN utm_content TEXT;
ALTER TABLE waitlist ADD COLUMN utm_term TEXT;
ALTER TABLE waitlist ADD COLUMN country TEXT; -- ISO-2
ALTER TABLE waitlist ADD COLUMN referrer TEXT;
ALTER TABLE waitlist ADD COLUMN landed_at TEXT; -- ISO8601 from client

CREATE INDEX IF NOT EXISTS idx_waitlist_utm ON waitlist(utm_source, utm_campaign);
