import type { WaitlistRequest } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const COUNTRY_REGEX = /^[A-Z]{2}$/;

export function validateWaitlistRequest(request: WaitlistRequest): ValidationResult {
  const errors: string[] = [];

  // Validate email
  if (!request.email || request.email.trim() === '') {
    errors.push('Email is required');
  } else if (!validateEmail(request.email)) {
    errors.push('Invalid email address');
  }

  // Validate user type
  if (!request.userType || request.userType.trim() === '') {
    errors.push('User type is required');
  } else if (!['artist', 'fan'].includes(request.userType)) {
    errors.push('User type must be "artist" or "fan"');
  }

  // Validate optional fields — all are optional; never error on missing
  const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  for (const field of UTM_FIELDS) {
    const val = request[field];
    if (val !== undefined && val.length > 256) {
      errors.push(`${field} must be 256 characters or fewer`);
    }
  }

  if (request.referrer !== undefined && request.referrer.length > 1024) {
    errors.push('referrer must be 1024 characters or fewer');
  }

  if (request.country !== undefined && !COUNTRY_REGEX.test(request.country)) {
    errors.push('country must be a 2-letter ISO country code (A-Z)');
  }

  if (request.landed_at !== undefined && !ISO8601_REGEX.test(request.landed_at)) {
    errors.push('landed_at must be an ISO-8601 UTC timestamp');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
