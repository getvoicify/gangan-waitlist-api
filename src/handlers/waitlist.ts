import type { WaitlistRequest, ApiResponse } from '../types';
import { validateWaitlistRequest } from '../lib/validation';

/**
 * Hash an IP address for privacy-friendly storage
 */
async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'gangan-salt-2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Create a JSON response with proper headers
 */
function jsonResponse(body: ApiResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle POST /waitlist requests
 */
export async function handleWaitlistPost(
  request: WaitlistRequest,
  db: D1Database,
  clientIp: string | null
): Promise<Response> {
  // Validate request
  const validation = validateWaitlistRequest(request);
  if (!validation.valid) {
    return jsonResponse({
      success: false,
      message: validation.errors.join(', '),
    }, 400);
  }

  const email = request.email.trim().toLowerCase();
  const userType = request.userType;
  const ipHash = clientIp ? await hashIp(clientIp) : null;

  // Optional lead-capture v0.2 fields — all nullable
  const utmSource = request.utm_source ?? null;
  const utmMedium = request.utm_medium ?? null;
  const utmCampaign = request.utm_campaign ?? null;
  const utmContent = request.utm_content ?? null;
  const utmTerm = request.utm_term ?? null;
  const country = request.country ?? null;
  const referrer = request.referrer ?? null;
  const landedAt = request.landed_at ?? null;

  try {
    await db.prepare(
      `INSERT INTO waitlist
         (email, user_type, ip_hash,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          country, referrer, landed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      email, userType, ipHash,
      utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
      country, referrer, landedAt,
    ).run();

    return jsonResponse({
      success: true,
      message: 'Welcome to the waitlist! We\'ll be in touch soon.',
    }, 201);

  } catch (err) {
    const error = err as Error;

    // Duplicate email — first-touch attribution wins; do NOT update UTMs on re-submit.
    if (error.message.includes('UNIQUE constraint failed')) {
      return jsonResponse({
        success: true,
        message: 'You\'re already on the waitlist! We\'ll be in touch soon.',
      }, 200);
    }

    // Log unexpected errors (in production, use proper logging)
    console.error('Waitlist error:', error.message);

    return jsonResponse({
      success: false,
      message: 'Something went wrong. Please try again later.',
    }, 500);
  }
}
