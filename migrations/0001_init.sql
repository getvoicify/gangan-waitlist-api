-- Gangan Waitlist Schema
-- Tracks artist and fan signups for launch

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK(user_type IN ('artist', 'fan')),
  created_at TEXT DEFAULT (datetime('now')),
  ip_hash TEXT,
  source TEXT DEFAULT 'landing'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_type ON waitlist(user_type);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
