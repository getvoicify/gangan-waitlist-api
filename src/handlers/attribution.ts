import type { Env, AttributionResponse, ApiResponse } from '../types';

function jsonResponse(body: ApiResponse | AttributionResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleAttributionGet(
  email: string,
  env: Env
): Promise<Response> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await env.DB.prepare(
      `SELECT email, utm_source, utm_medium, utm_campaign, utm_content, utm_term
       FROM waitlist
       WHERE email = ?`
    ).bind(normalizedEmail).first<AttributionResponse>();

    if (!result) {
      return jsonResponse(
        { success: false, message: 'Email not found on waitlist' },
        404
      );
    }

    return jsonResponse(result, 200);
  } catch (err) {
    console.error('Attribution lookup error:', err instanceof Error ? err.message : String(err));
    return jsonResponse(
      { success: false, message: 'Something on our end. Try again in a minute.' },
      500
    );
  }
}
