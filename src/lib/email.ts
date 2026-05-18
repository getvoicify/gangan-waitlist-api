import type { Env } from '../types';

export async function sendWaitlistConfirmation(
  env: Env,
  to: string
): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px 20px; max-width: 560px; margin: 0 auto;">
  <h1 style="color: #fff; font-size: 24px; margin-bottom: 20px;">You are on the Gangan waitlist!</h1>
  <p style="line-height: 1.6; margin-bottom: 16px;">Thanks for signing up. We'll let you know as soon as we launch.</p>
  <p style="line-height: 1.6; margin-bottom: 24px; color: #999;">&mdash; The Gangan Team</p>
  <a href="https://gangan.app" style="color: #6c5ce7; text-decoration: none;">gangan.app</a>
</body>
</html>`;

  await env.EMAIL.send({
    from: 'welcome@gangan.app',
    to,
    subject: "You are on the Gangan waitlist!",
    htmlBody: html,
  });
}
