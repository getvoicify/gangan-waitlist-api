export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
}

export interface WaitlistEntry {
  id: number;
  email: string;
  user_type: 'artist' | 'fan';
  created_at: string;
  ip_hash: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  country: string | null;
  referrer: string | null;
  landed_at: string | null;
}

export interface WaitlistRequest {
  email: string;
  userType: 'artist' | 'fan';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  country?: string;
  referrer?: string;
  landed_at?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}
