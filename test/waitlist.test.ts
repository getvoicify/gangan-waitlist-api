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
});
