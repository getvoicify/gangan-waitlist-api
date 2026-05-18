export interface Env {
  DB: D1Database;
  EMAIL: SendEmail;
  ALLOWED_ORIGIN: string;
}

export interface WaitlistEntry {
  id: number;
  email: string;
  user_type: 'artist' | 'fan';
  created_at: string;
  ip_hash: string | null;
  source: string;
}

export interface WaitlistRequest {
  email: string;
  userType: 'artist' | 'fan';
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}
