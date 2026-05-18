import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleWaitlistPost } from '../src/handlers/waitlist';
import type { Env } from '../src/types';
import * as emailLib from '../src/lib/email';

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

const createMockEmail = () => {
  const mockSend = vi.fn().mockResolvedValue(undefined);
  return { send: mockSend, _mockSend: mockSend };
};

const createMockEnv = (db: ReturnType<typeof createMockDb>, email: ReturnType<typeof createMockEmail>): Env => ({
  DB: db as unknown as D1Database,
  EMAIL: email as unknown as SendEmail,
  ALLOWED_ORIGIN: 'https://gangan.app',
});

describe('handleWaitlistPost', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockEmail: ReturnType<typeof createMockEmail>;
  let mockEnv: Env;

  beforeEach(() => {
    mockDb = createMockDb();
    mockEmail = createMockEmail();
    mockEnv = createMockEnv(mockDb, mockEmail);
  });

  it('should return 201 for new signup', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    const response = await handleWaitlistPost(
      { email: 'new@example.com', userType: 'artist' },
      mockEnv,
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
      mockEnv,
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
      mockEnv,
      null
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid user type', async () => {
    const response = await handleWaitlistPost(
      { email: 'test@example.com', userType: 'invalid' as 'artist' | 'fan' },
      mockEnv,
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
      mockEnv,
      '192.168.1.1'
    );

    const bindCall = mockDb._mockBind.mock.calls[0];
    expect(bindCall[2]).not.toBe('192.168.1.1');
    expect(bindCall[2]).toBeTruthy();
  });

  it('should return 500 for unexpected database errors', async () => {
    mockDb._mockRun.mockRejectedValue(new Error('Database connection failed'));

    const response = await handleWaitlistPost(
      { email: 'test@example.com', userType: 'artist' },
      mockEnv,
      null
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('should send confirmation email on new signup', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    const sendSpy = vi.spyOn(emailLib, 'sendWaitlistConfirmation').mockResolvedValue(undefined);

    await handleWaitlistPost(
      { email: 'test@example.com', userType: 'artist' },
      mockEnv,
      null
    );

    expect(sendSpy).toHaveBeenCalledWith(mockEnv, 'test@example.com');

    sendSpy.mockRestore();
  });

  it('should still return success when confirmation email fails (fire-and-forget)', async () => {
    mockDb._mockRun.mockResolvedValue({ success: true });

    const sendSpy = vi.spyOn(emailLib, 'sendWaitlistConfirmation').mockRejectedValue(
      new Error('SMTP timeout')
    );

    const response = await handleWaitlistPost(
      { email: 'test@example.com', userType: 'fan' },
      mockEnv,
      null
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(sendSpy).toHaveBeenCalled();

    sendSpy.mockRestore();
  });

  it('should not send confirmation email for duplicate signup', async () => {
    mockDb._mockRun.mockRejectedValue(new Error('UNIQUE constraint failed: waitlist.email'));

    const sendSpy = vi.spyOn(emailLib, 'sendWaitlistConfirmation');

    await handleWaitlistPost(
      { email: 'existing@example.com', userType: 'artist' },
      mockEnv,
      null
    );

    expect(sendSpy).not.toHaveBeenCalled();

    sendSpy.mockRestore();
  });
});
