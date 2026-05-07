import { describe, it, expect } from 'vitest';
import { validateEmail, validateWaitlistRequest } from '../src/lib/validation';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('artist+signup@music.io')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });

  it('should reject null and undefined', () => {
    expect(validateEmail(null as unknown as string)).toBe(false);
    expect(validateEmail(undefined as unknown as string)).toBe(false);
  });
});

describe('validateWaitlistRequest', () => {
  it('should accept valid requests', () => {
    const result = validateWaitlistRequest({
      email: 'artist@example.com',
      userType: 'artist'
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept fan user type', () => {
    const result = validateWaitlistRequest({
      email: 'fan@example.com',
      userType: 'fan'
    });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateWaitlistRequest({
      email: 'notvalid',
      userType: 'artist'
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email address');
  });

  it('should reject missing email', () => {
    const result = validateWaitlistRequest({
      email: '',
      userType: 'artist'
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('should reject invalid user type', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      userType: 'manager' as 'artist' | 'fan'
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('User type must be "artist" or "fan"');
  });

  it('should reject missing user type', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      userType: '' as 'artist' | 'fan'
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('User type is required');
  });

  it('should collect multiple errors', () => {
    const result = validateWaitlistRequest({
      email: '',
      userType: '' as 'artist' | 'fan'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('should accept valid optional UTM fields', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      userType: 'fan',
      utm_source: 'instagram',
      utm_medium: 'paid',
      utm_campaign: 'ramp',
      utm_content: 'video-01',
      utm_term: 'afrobeats',
      country: 'NG',
      referrer: 'https://instagram.com',
      landed_at: '2026-05-07T12:00:00.000Z',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept bare payload without optional fields (no regression)', () => {
    const result = validateWaitlistRequest({ email: 'bare@example.com', userType: 'artist' });
    expect(result.valid).toBe(true);
  });

  it('should reject utm_source over 256 chars', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      userType: 'fan',
      utm_source: 'a'.repeat(257),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('utm_source must be 256 characters or fewer');
  });

  it('should reject referrer over 1024 chars', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      userType: 'fan',
      referrer: 'https://example.com/' + 'a'.repeat(1010),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('referrer must be 1024 characters or fewer');
  });

  it('should reject invalid country code', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      userType: 'fan',
      country: 'nigeria',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('country must be a 2-letter ISO country code (A-Z)');
  });

  it('should reject malformed landed_at', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      userType: 'fan',
      landed_at: '2026-05-07',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('landed_at must be an ISO-8601 UTC timestamp');
  });
});
