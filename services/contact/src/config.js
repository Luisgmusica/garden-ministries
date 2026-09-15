// Runtime configuration. Where mail goes (recipient, sender, subject) is fixed in message.js and cannot be configured.
// The Turnstile secret comes from a root-owned environment file on the server; it never reaches the browser or git.

export const TURNSTILE_TEST_SECRETS = Object.freeze([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

const list = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export function loadConfig(env = process.env) {
  const turnstileSecret = (env.TURNSTILE_SECRET ?? '').trim();
  if (!turnstileSecret) throw new Error('TURNSTILE_SECRET is not set');

  // Cloudflare's public test secrets accept any dummy token; they must never run in production.
  const turnstileTestKeys = TURNSTILE_TEST_SECRETS.includes(turnstileSecret);
  if (turnstileTestKeys && env.ALLOW_TURNSTILE_TEST_KEYS !== '1') {
    throw new Error('Refusing a Turnstile test secret (set ALLOW_TURNSTILE_TEST_KEYS=1 only for local testing)');
  }

  const port = Number(env.PORT ?? 8091);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');

  return Object.freeze({
    host: '127.0.0.1',
    port,
    turnstileSecret,
    turnstileTestKeys,
    turnstileVerifyUrl: env.TURNSTILE_VERIFY_URL || 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    turnstileHostnames: list(env.TURNSTILE_HOSTNAMES || 'garden-ministries.org,www.garden-ministries.org'),
    allowedOrigins: list(env.ALLOWED_ORIGINS || 'https://garden-ministries.org,https://www.garden-ministries.org'),
    sendmailPath: env.SENDMAIL_PATH || '/usr/sbin/sendmail',
  });
}
