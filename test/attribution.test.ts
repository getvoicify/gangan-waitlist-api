import { describe, it, expect, vi } from 'vitest';
import { handleAttributionGet } from '../src/handlers/attribution';

interface MockEnv {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  RESEND_ARTIST_AUDIENCE_ID: string;
  RESEND_FAN_AUDIENCE_ID: string;
}

const createMockDb = () => {
  const mockFirst = vi.fn();
  const mockBind = vi.fn(() => ({ first: mockFirst }));
  const mockPrepare = vi.fn(() => ({ bind: mockBind }));

  return {
    prepare: mockPrepare,
    _mockFirst: mockFirst,
    _mockBind: mockBind,
    _mockPrepare: mockPrepare,
  };
};

const createMockEnv = (db?: ReturnType<typeof createMockDb>): MockEnv => {
  const mockDb = db || createMockDb();
  return {
    DB: mockDb as unknown as D1Database,
    ALLOWED_ORIGIN: '*',
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM: 'GanGan <waitlist@gangan.app>',
    RESEND_ARTIST_AUDIENCE_ID: 'aud_artist_123',
    RESEND_FAN_AUDIENCE_ID: 'aud_fan_456',
  };
};

describe('handleAttributionGet', () => {
  it('should return 200 with attribution data for known email', async () => {
    const mockDb = createMockDb();
    const mockEnv = createMockEnv(mockDb);

    mockDb._mockFirst.mockResolvedValue({
      email: 'test@example.com',
      utm_source: 'meta',
      utm_medium: 'cpc',
      utm_campaign: 'launch_burst',
      utm_content: null,
      utm_term: null,
    });

    const response = await handleAttributionGet('test@example.com', mockEnv);
    expect(response.status).toBe(200);

    const body = await response.json() as Record<string, unknown>;
    expect(body.email).toBe('test@example.com');
    expect(body.utm_source).toBe('meta');
    expect(body.utm_medium).toBe('cpc');
    expect(body.utm_campaign).toBe('launch_burst');
  });

  it('should return 404 for unknown email', async () => {
    const mockDb = createMockDb();
    const mockEnv = createMockEnv(mockDb);

    mockDb._mockFirst.mockResolvedValue(null);

    const response = await handleAttributionGet('unknown@example.com', mockEnv);
    expect(response.status).toBe(404);

    const body = await response.json() as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.message).toBe('Email not found on waitlist');
  });

  it('should normalize email to lowercase', async () => {
    const mockDb = createMockDb();
    const mockEnv = createMockEnv(mockDb);

    mockDb._mockFirst.mockResolvedValue({
      email: 'mixedcase@example.com',
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    });

    const response = await handleAttributionGet('MixedCase@Example.com', mockEnv);
    expect(response.status).toBe(200);

    const bindCalls = mockDb._mockBind.mock.calls;
    expect(bindCalls[0][0]).toBe('mixedcase@example.com');
  });

  it('should return 500 on database error', async () => {
    const mockDb = createMockDb();
    const mockEnv = createMockEnv(mockDb);

    mockDb._mockFirst.mockRejectedValue(new Error('DB error'));

    const response = await handleAttributionGet('test@example.com', mockEnv);
    expect(response.status).toBe(500);

    const body = await response.json() as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.message).toBe('Something on our end. Try again in a minute.');
  });
});
