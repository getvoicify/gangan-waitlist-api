export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  RESEND_ARTIST_AUDIENCE_ID: string;
  RESEND_FAN_AUDIENCE_ID: string;
}

export interface WaitlistEntry {
  id: number;
  email: string;
  user_type: 'artist' | 'fan';
  created_at: string;
  ip_hash: string | null;
  source: string;
  variant: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
}

export interface WaitlistRequest {
  email: string;
  userType?: 'artist' | 'fan';
  audience?: 'artist' | 'fan';
  variant?: string;
  utm_source?: string;
  utm_campaign?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}
