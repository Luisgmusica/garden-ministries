import { randomUUID } from 'node:crypto';

const EXPECTED_ACTION = 'contact';
const ERROR_CODE = /^[a-z0-9_-]{1,64}$/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Server-side Cloudflare Turnstile verification. Tokens are single-use and expire after 300 s (Cloudflare enforces
 * both). Returns { ok } or { ok: false, kind: 'rejected' | 'unavailable', codes }. One retry with the same
 * idempotency key on network errors or 5xx.
 */
export async function verifyTurnstile(token, remoteIp, config, { fetchImpl = fetch, timeoutMs = 5_000 } = {}) {
  const params = new URLSearchParams({
    secret: config.turnstileSecret,
    response: token,
    idempotency_key: randomUUID(),
  });
  if (remoteIp) params.set('remoteip', remoteIp);

  let data;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetchImpl(config.turnstileVerifyUrl, {
        method: 'POST',
        body: params,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status >= 500) throw new Error(`siteverify returned ${response.status}`);
      if (!response.ok) return { ok: false, kind: 'unavailable', codes: [`http_${response.status}`] };
      data = await response.json();
      break;
    } catch {
      if (attempt === 2) return { ok: false, kind: 'unavailable', codes: ['siteverify_unreachable'] };
      await sleep(300);
    }
  }

  const codes = Array.isArray(data?.['error-codes'])
    ? data['error-codes'].filter((code) => typeof code === 'string' && ERROR_CODE.test(code)).slice(0, 5)
    : [];

  if (data?.success !== true) return { ok: false, kind: 'rejected', codes: codes.length ? codes : ['not_success'] };

  // Cloudflare's test secrets answer with hostname "example.com" and no action, so these checks apply to real keys only.
  if (!config.turnstileTestKeys) {
    if (!config.turnstileHostnames.includes(data.hostname)) return { ok: false, kind: 'rejected', codes: ['hostname_mismatch'] };
    if (data.action !== EXPECTED_ACTION) return { ok: false, kind: 'rejected', codes: ['action_mismatch'] };
  }

  return { ok: true };
}
