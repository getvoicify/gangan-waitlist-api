import type { Env } from '../types';

interface ResendContact {
  first_name: string;
  last_name: string;
  subscribed: boolean;
}

function getAudienceMessage(audience: 'artist' | 'fan'): string {
  if (audience === 'artist') {
    return 'As an artist, you\'ll get early access to set up your profile and start connecting with fans.';
  }
  return 'As a fan, you\'ll be the first to discover new music and support artists directly.';
}

async function sendConfirmationEmail(
  env: Env,
  email: string,
  audience: 'artist' | 'fan'
): Promise<void> {
  const audienceMessage = getAudienceMessage(audience);
  const html =
    `<p>Thanks for joining. We'll email you ahead of the soft-launch on 2026-05-25.</p>` +
    `<p>${audienceMessage}</p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: email,
      subject: "You're on the GanGan waitlist",
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${body}`);
  }
}

async function subscribeToAudience(
  env: Env,
  email: string,
  audience: 'artist' | 'fan'
): Promise<void> {
  const audienceId = audience === 'artist'
    ? env.RESEND_ARTIST_AUDIENCE_ID
    : env.RESEND_FAN_AUDIENCE_ID;

  const response = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        unsubscribed: false,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend audience subscribe failed (${response.status}): ${body}`);
  }
}

export async function sendWaitlistConfirmation(
  env: Env,
  email: string,
  audience: 'artist' | 'fan'
): Promise<void> {
  await sendConfirmationEmail(env, email, audience);
  await subscribeToAudience(env, email, audience);
}
