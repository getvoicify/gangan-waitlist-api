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
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface AttributionResponse {
  email: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface WaitlistRequest {
  email: string;
  userType?: 'artist' | 'fan';
  audience?: 'artist' | 'fan';
  variant?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}
