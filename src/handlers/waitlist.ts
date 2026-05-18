import type { WaitlistRequest, ApiResponse, Env } from '../types';
import { validateWaitlistRequest, resolveAudience } from '../lib/validation';
import { sendWaitlistConfirmation } from '../lib/resend';

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

function buildSource(utmSource?: string, utmCampaign?: string): string {
  if (utmSource && utmCampaign) {
    return `${utmSource} / ${utmCampaign}`;
  }
  if (utmSource) {
    return utmSource;
  }
  return 'organic';
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
  env: Env,
  clientIp: string | null
): Promise<Response> {
  const validation = validateWaitlistRequest(request);
  if (!validation.valid) {
    return jsonResponse({
      success: false,
      message: validation.errors.join(', '),
    }, 400);
  }

  const email = request.email.trim().toLowerCase();
  const audience = resolveAudience(request)!;
  const ipHash = clientIp ? await hashIp(clientIp) : null;
  const source = buildSource(request.utm_source, request.utm_campaign);
  const variant = request.variant || null;
  const utmSource = request.utm_source || null;
  const utmCampaign = request.utm_campaign || null;

  try {
    await env.DB.prepare(
      `INSERT INTO waitlist (email, user_type, ip_hash, source, variant, utm_source, utm_campaign)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(email, audience, ipHash, source, variant, utmSource, utmCampaign).run();

    sendWaitlistConfirmation(env, email, audience).catch(err => {
      console.error('Resend confirmation failed:', err instanceof Error ? err.message : String(err));
    });

    return jsonResponse({
      success: true,
      message: "You're on the list. We'll email you ahead of the soft-launch on 2026-05-25.",
    }, 201);

  } catch (err) {
    const error = err as Error;

    if (error.message.includes('UNIQUE constraint failed')) {
      return jsonResponse({
        success: true,
        message: "You're already on the list. We'll be in touch.",
      }, 200);
    }

    console.error('Waitlist error:', error.message);

    return jsonResponse({
      success: false,
      message: 'Something on our end. Try again in a minute.',
    }, 500);
  }
}
