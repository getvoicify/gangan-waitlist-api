import type { Env, WaitlistRequest, ApiResponse } from './types';
import { handleWaitlistPost } from './handlers/waitlist';
import { checkRateLimit } from './lib/rate-limit';

/**
 * Create a JSON response with CORS headers
 */
function corsResponse(body: ApiResponse, status: number, allowedOrigin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Handle CORS preflight requests
 */
function handleOptions(allowedOrigin: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Add CORS headers to a response
 */
function addCorsHeaders(response: Response, allowedOrigin: string): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', allowedOrigin);
  newHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(allowedOrigin);
    }

    // Route: POST /waitlist
    if (url.pathname === '/waitlist' && request.method === 'POST') {
      const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

      if (!checkRateLimit(clientIp)) {
        return corsResponse({
          success: false,
          message: 'Slow down for a moment, then try again.',
        }, 429, allowedOrigin);
      }

      try {
        const body = await request.json() as WaitlistRequest;
        const response = await handleWaitlistPost(body, env, clientIp);
        return addCorsHeaders(response, allowedOrigin);
      } catch {
        return corsResponse({
          success: false,
          message: 'Invalid JSON body',
        }, 400, allowedOrigin);
      }
    }

    // Route: GET /health
    if (url.pathname === '/health' && request.method === 'GET') {
      return corsResponse({
        success: true,
        message: 'OK',
      }, 200, allowedOrigin);
    }

    // 404 for everything else
    return corsResponse({
      success: false,
      message: 'Not found',
    }, 404, allowedOrigin);
  },
};
