import { describe, it, expect } from 'vitest';
import { validateEmail, validateWaitlistRequest, resolveAudience } from '../src/lib/validation';

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

describe('resolveAudience', () => {
  it('should return audience when provided', () => {
    expect(resolveAudience({ email: 'test@test.com', audience: 'artist' })).toBe('artist');
    expect(resolveAudience({ email: 'test@test.com', audience: 'fan' })).toBe('fan');
  });

  it('should fall back to userType', () => {
    expect(resolveAudience({ email: 'test@test.com', userType: 'fan' })).toBe('fan');
    expect(resolveAudience({ email: 'test@test.com', userType: 'artist' })).toBe('artist');
  });

  it('should prefer audience over userType when both provided', () => {
    expect(resolveAudience({ email: 'test@test.com', audience: 'fan', userType: 'artist' })).toBe('fan');
    expect(resolveAudience({ email: 'test@test.com', audience: 'artist', userType: 'fan' })).toBe('artist');
  });

  it('should return null when neither provided', () => {
    expect(resolveAudience({ email: 'test@test.com' })).toBeNull();
  });

  it('should return null for invalid values', () => {
    expect(resolveAudience({ email: 'test@test.com', audience: 'invalid' as 'artist' })).toBeNull();
    expect(resolveAudience({ email: 'test@test.com', userType: 'listener' as 'artist' })).toBeNull();
  });
});

describe('validateWaitlistRequest', () => {
  it('should accept valid request with audience', () => {
    const result = validateWaitlistRequest({
      email: 'artist@example.com',
      audience: 'artist',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept valid request with userType (backward compat)', () => {
    const result = validateWaitlistRequest({
      email: 'fan@example.com',
      userType: 'fan',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept request with both audience and userType', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      userType: 'artist',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject request with neither audience nor userType', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('audience or userType (artist or fan) is required');
  });

  it('should accept request with valid variant', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      variant: 'a',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject variant longer than 1 character', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      variant: 'ab',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('variant must be a single character (a or b)');
  });

  it('should accept request with utm_source and utm_campaign', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'artist',
      utm_source: 'instagram',
      utm_campaign: 'cold-outreach-v1',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject utm_source over 255 characters', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      utm_source: 'x'.repeat(256),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('utm_source must be at most 255 characters');
  });

  it('should reject utm_campaign over 255 characters', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      utm_campaign: 'x'.repeat(256),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('utm_campaign must be at most 255 characters');
  });

  it('should accept request with all five UTM params', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      utm_source: 'meta',
      utm_medium: 'cpc',
      utm_campaign: 'launch_burst',
      utm_content: 'variant_a',
      utm_term: 'afrobeats',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject utm_medium over 255 characters', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      utm_medium: 'x'.repeat(256),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('utm_medium must be at most 255 characters');
  });

  it('should reject utm_content over 255 characters', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      utm_content: 'x'.repeat(256),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('utm_content must be at most 255 characters');
  });

  it('should reject utm_term over 255 characters', () => {
    const result = validateWaitlistRequest({
      email: 'test@example.com',
      audience: 'fan',
      utm_term: 'x'.repeat(256),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('utm_term must be at most 255 characters');
  });

  it('should reject invalid email', () => {
    const result = validateWaitlistRequest({
      email: 'notvalid',
      audience: 'artist',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email address');
  });

  it('should reject missing email', () => {
    const result = validateWaitlistRequest({
      email: '',
      audience: 'artist',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('should collect multiple errors', () => {
    const result = validateWaitlistRequest({
      email: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
