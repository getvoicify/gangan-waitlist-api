# Gangan Waitlist API

Cloudflare Worker API for the Gangan waitlist.

## Features

- **POST /waitlist** — Submit email + userType (artist/fan)
- **Idempotent** — Duplicate emails return success (200) without creating duplicates
- **Validation** — Email format + userType validation
- **Privacy** — IP addresses are hashed before storage
- **CORS** — Configured for gangan.app

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create D1 database

```bash
npm run db:create
```

Update `wrangler.toml` with the generated database ID.

### 3. Run migrations

```bash
# Production
npm run db:migrate

# Local development
npm run db:migrate:local
```

### 4. Deploy

```bash
npm run deploy
```

## Development

```bash
# Run tests
npm test

# Run dev server
npm run dev
```

## API

### POST /waitlist

**Request:**
```json
{
  "email": "artist@example.com",
  "userType": "artist"
}
```

**Response (201 - New signup):**
```json
{
  "success": true,
  "message": "Welcome to the waitlist! We'll be in touch soon."
}
```

**Response (200 - Already exists):**
```json
{
  "success": true,
  "message": "You're already on the waitlist! We'll be in touch soon."
}
```

**Response (400 - Validation error):**
```json
{
  "success": false,
  "message": "Invalid email address"
}
```

### GET /health

Returns `200 OK` for health checks.

## Schema

```sql
CREATE TABLE waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK(user_type IN ('artist', 'fan')),
  created_at TEXT DEFAULT (datetime('now')),
  ip_hash TEXT,
  source TEXT DEFAULT 'landing'
);
```
