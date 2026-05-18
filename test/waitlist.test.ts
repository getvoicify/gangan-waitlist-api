import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleWaitlistPost } from '../src/handlers/waitlist';

interface MockEnv {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  RESEND_ARTIST_AUDIENCE_ID: string;
  RESEND_FAN_AUDIENCE_ID: string;
}

const createMockDb = () => {
  const mockRun = vi.fn();
  const mockBind = vi.fn(() => ({ run: mockRun }));
  const mockPrepare = vi.fn(() => ({ bind: mockBind }));

  return {
    prepare: mockPrepare,
    _mockRun: mockRun,
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

describe('handleWaitlistPost', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockEnv: MockEnv;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDb = createMockDb();
    mockEnv = createMockEnv(mockDb);
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 201 for new signup with audience field', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });
    mockFetch.mockResolvedValue(new Response('{"id":"msg_1"}', { status: 200 }));

    const response = await handleWaitlistPost(
      { email: 'new@example.com', audience: 'artist' },
      mockEnv,
      '1.2.3.4'
    );

    expect(response.status).toBe(201);
    const body: { success: boolean; message: string } = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("You're on the list");
  });

  it('should store all attribution fields in D1', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    await handleWaitlistPost(
      {
        email: 'test@example.com',
        audience: 'fan',
        variant: 'b',
        utm_source: 'instagram',
        utm_campaign: 'cold-outreach-v1',
      },
      mockEnv,
      '1.2.3.4'
    );

    const bindCall = mockDb._mockBind.mock.calls[0];
    expect(bindCall[0]).toBe('test@example.com'); // email
    expect(bindCall[1]).toBe('fan');              // user_type (from audience)
    expect(bindCall[3]).toBe('instagram / cold-outreach-v1'); // source
    expect(bindCall[4]).toBe('b');                // variant
    expect(bindCall[5]).toBe('instagram');        // utm_source
    expect(bindCall[6]).toBe('cold-outreach-v1'); // utm_campaign
  });

  it('should set source to organic when no UTM params', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    await handleWaitlistPost(
      { email: 'test@example.com', audience: 'fan' },
      mockEnv,
      '1.2.3.4'
    );

    const bindCall = mockDb._mockBind.mock.calls[0];
    expect(bindCall[3]).toBe('organic');
  });

  it('should return 200 for duplicate email with CMO message', async () => {
    mockDb._mockRun.mockRejectedValue(new Error('UNIQUE constraint failed: waitlist.email'));

    const response = await handleWaitlistPost(
      { email: 'existing@example.com', audience: 'fan' },
      mockEnv,
      '1.2.3.4'
    );

    expect(response.status).toBe(200);
    const body: { success: boolean; message: string } = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("You're already on the list. We'll be in touch.");
  });

  it('should return 400 for invalid email', async () => {
    const response = await handleWaitlistPost(
      { email: 'notvalid', audience: 'artist' },
      mockEnv,
      null
    );

    expect(response.status).toBe(400);
    const body: { success: boolean; message: string } = await response.json();
    expect(body.success).toBe(false);
  });

  it('should return 400 when neither audience nor userType', async () => {
    const response = await handleWaitlistPost(
      { email: 'test@example.com' },
      mockEnv,
      null
    );

    expect(response.status).toBe(400);
    const body: { success: boolean; message: string } = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain('audience or userType');
  });

  it('should send Resend email on successful insert', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });
    mockFetch.mockResolvedValue(new Response('{"id":"msg_1"}', { status: 200 }));

    await handleWaitlistPost(
      { email: 'artist@example.com', audience: 'artist' },
      mockEnv,
      '1.2.3.4'
    );

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    }, { timeout: 1000 });

    const emailCall = mockFetch.mock.calls.find(
      (call: string[]) => call[0] === 'https://api.resend.com/emails'
    );
    expect(emailCall).toBeTruthy();

    const audienceCall = mockFetch.mock.calls.find(
      (call: string[]) => call[0]?.includes('/audiences/aud_artist_123/contacts/')
    );
    expect(audienceCall).toBeTruthy();
  });

  it('should not fail submission when Resend errors', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });
    mockFetch.mockRejectedValue(new Error('Network error'));

    const response = await handleWaitlistPost(
      { email: 'test@example.com', audience: 'fan' },
      mockEnv,
      '1.2.3.4'
    );

    expect(response.status).toBe(201);
    const body: { success: boolean; message: string } = await response.json();
    expect(body.success).toBe(true);
  });

  it('should store IP hash when provided', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    await handleWaitlistPost(
      { email: 'test@example.com', audience: 'artist' },
      mockEnv,
      '192.168.1.1'
    );

    const bindCall = mockDb._mockBind.mock.calls[0];
    expect(bindCall[2]).not.toBe('192.168.1.1');
    expect(bindCall[2]).toBeTruthy();
  });

  it('should return 500 for unexpected database errors with CMO message', async () => {
    mockDb._mockRun.mockRejectedValue(new Error('Database connection failed'));

    const response = await handleWaitlistPost(
      { email: 'test@example.com', audience: 'artist' },
      mockEnv,
      null
    );

    expect(response.status).toBe(500);
    const body: { success: boolean; message: string } = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Something on our end. Try again in a minute.');
  });

  it('should accept userType as fallback (backward compat)', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    const response = await handleWaitlistPost(
      { email: 'legacy@example.com', userType: 'artist' },
      mockEnv,
      null
    );

    expect(response.status).toBe(201);

    const bindCall = mockDb._mockBind.mock.calls[0];
    expect(bindCall[1]).toBe('artist');
  });

  it('should prefer audience over userType when both provided', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    await handleWaitlistPost(
      { email: 'test@example.com', audience: 'fan', userType: 'artist' },
      mockEnv,
      null
    );

    const bindCall = mockDb._mockBind.mock.calls[0];
    expect(bindCall[1]).toBe('fan');
  });
});
