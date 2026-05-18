import type { WaitlistRequest } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_AUDIENCES = ['artist', 'fan'] as const;

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

export function resolveAudience(request: WaitlistRequest): 'artist' | 'fan' | null {
  if (request.audience && VALID_AUDIENCES.includes(request.audience)) {
    return request.audience;
  }
  if (request.userType && VALID_AUDIENCES.includes(request.userType)) {
    return request.userType;
  }
  return null;
}

export function validateWaitlistRequest(request: WaitlistRequest): ValidationResult {
  const errors: string[] = [];

  if (!request.email || request.email.trim() === '') {
    errors.push('Email is required');
  } else if (!validateEmail(request.email)) {
    errors.push('Invalid email address');
  }

  const audience = resolveAudience(request);
  if (!audience) {
    errors.push('audience or userType (artist or fan) is required');
  }

  if (request.variant !== undefined && request.variant !== null && request.variant !== '') {
    if (typeof request.variant !== 'string' || request.variant.length > 1) {
      errors.push('variant must be a single character (a or b)');
    }
  }

  if (request.utm_source !== undefined && request.utm_source !== null) {
    if (typeof request.utm_source !== 'string' || request.utm_source.length > 255) {
      errors.push('utm_source must be at most 255 characters');
    }
  }

  if (request.utm_campaign !== undefined && request.utm_campaign !== null) {
    if (typeof request.utm_campaign !== 'string' || request.utm_campaign.length > 255) {
      errors.push('utm_campaign must be at most 255 characters');
    }
  }

  if (request.utm_medium !== undefined && request.utm_medium !== null) {
    if (typeof request.utm_medium !== 'string' || request.utm_medium.length > 255) {
      errors.push('utm_medium must be at most 255 characters');
    }
  }

  if (request.utm_content !== undefined && request.utm_content !== null) {
    if (typeof request.utm_content !== 'string' || request.utm_content.length > 255) {
      errors.push('utm_content must be at most 255 characters');
    }
  }

  if (request.utm_term !== undefined && request.utm_term !== null) {
    if (typeof request.utm_term !== 'string' || request.utm_term.length > 255) {
      errors.push('utm_term must be at most 255 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
