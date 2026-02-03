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

  return {
    valid: errors.length === 0,
    errors,
  };
}
