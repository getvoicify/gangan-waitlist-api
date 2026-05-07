import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleWaitlistPost } from '../src/handlers/waitlist';

// Mock D1 database
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

describe('handleWaitlistPost', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it('should return 201 for new signup', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    const response = await handleWaitlistPost(
      { email: 'new@example.com', userType: 'artist' },
      mockDb as unknown as D1Database,
      null
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('Welcome');
  });

  it('should return 200 for duplicate email (idempotent)', async () => {
    mockDb._mockRun.mockRejectedValue(new Error('UNIQUE constraint failed: waitlist.email'));

    const response = await handleWaitlistPost(
      { email: 'existing@example.com', userType: 'fan' },
      mockDb as unknown as D1Database,
      null
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('already');
  });

  it('should return 400 for invalid email', async () => {
    const response = await handleWaitlistPost(
      { email: 'notvalid', userType: 'artist' },
      mockDb as unknown as D1Database,
      null
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid user type', async () => {
    const response = await handleWaitlistPost(
      { email: 'test@example.com', userType: 'invalid' as 'artist' | 'fan' },
      mockDb as unknown as D1Database,
      null
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('should store IP hash when provided', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    await handleWaitlistPost(
      { email: 'test@example.com', userType: 'artist' },
      mockDb as unknown as D1Database,
      '192.168.1.1'
    );

    // Verify bind was called with IP hash (not raw IP)
    const bindCall = mockDb._mockBind.mock.calls[0];
    expect(bindCall[2]).not.toBe('192.168.1.1'); // Should be hashed
    expect(bindCall[2]).toBeTruthy(); // But not empty
  });

  it('should return 500 for unexpected database errors', async () => {
    mockDb._mockRun.mockRejectedValue(new Error('Database connection failed'));

    const response = await handleWaitlistPost(
      { email: 'test@example.com', userType: 'artist' },
      mockDb as unknown as D1Database,
      null
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('bare payload (no UTMs) still returns 201 — no regression', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    const response = await handleWaitlistPost(
      { email: 'bare@example.com', userType: 'fan' },
      mockDb as unknown as D1Database,
      null
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('persists all UTMs + country + referrer + landed_at when present', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    await handleWaitlistPost(
      {
        email: 'utm@example.com',
        userType: 'fan',
        utm_source: 'instagram',
        utm_medium: 'paid',
        utm_campaign: 'ramp',
        utm_content: 'video-01',
        utm_term: 'afrobeats',
        country: 'NG',
        referrer: 'https://instagram.com',
        landed_at: '2026-05-07T12:00:00.000Z',
      },
      mockDb as unknown as D1Database,
      null
    );

    const bindCall = mockDb._mockBind.mock.calls[0];
    // Positions: email[0], user_type[1], ip_hash[2],
    //            utm_source[3], utm_medium[4], utm_campaign[5], utm_content[6], utm_term[7],
    //            country[8], referrer[9], landed_at[10]
    expect(bindCall[3]).toBe('instagram');
    expect(bindCall[4]).toBe('paid');
    expect(bindCall[5]).toBe('ramp');
    expect(bindCall[6]).toBe('video-01');
    expect(bindCall[7]).toBe('afrobeats');
    expect(bindCall[8]).toBe('NG');
    expect(bindCall[9]).toBe('https://instagram.com');
    expect(bindCall[10]).toBe('2026-05-07T12:00:00.000Z');
  });

  it('duplicate email keeps original UTMs — first-touch attribution wins', async () => {
    mockDb._mockRun.mockRejectedValue(new Error('UNIQUE constraint failed: waitlist.email'));

    // Second submit with different UTMs — duplicate, so nothing is inserted
    const response = await handleWaitlistPost(
      {
        email: 'existing@example.com',
        userType: 'fan',
        utm_source: 'tiktok', // different from first-touch
        utm_campaign: 'retarget',
      },
      mockDb as unknown as D1Database,
      null
    );

    // Must still be idempotent 200
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    // The INSERT threw — no update occurred, so original UTMs are untouched in DB
    expect(mockDb._mockRun).toHaveBeenCalledTimes(1); // only one INSERT attempt, no UPDATE
  });
});
