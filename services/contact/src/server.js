import http from 'node:http';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './config.js';
import { buildMessage } from './message.js';
import { ExpiringSet, SlidingWindow, clientKey } from './ratelimit.js';
import { deliver as sendmailDeliver } from './sendmail.js';
import { verifyTurnstile } from './turnstile.js';
import { honeypotFilled, validateSubmission } from './validate.js';

export const BODY_LIMIT_BYTES = 16 * 1024;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function clientIp(req) {
  const remote = req.socket.remoteAddress ?? '';
  const fromLoopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  const forwarded = req.headers['x-real-ip'];
  // Only Nginx on the same host can reach this service, so its X-Real-IP is trusted; nothing else is.
  if (fromLoopback && typeof forwarded === 'string' && isIP(forwarded.trim())) return forwarded.trim();
  return remote;
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const tooLarge = () => Object.assign(new Error('body too large'), { code: 'too_large' });
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > limit) {
      req.resume();
      reject(tooLarge());
      return;
    }
    const chunks = [];
    let size = 0;
    let failed = false;
    req.on('data', (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > limit) {
        failed = true;
        req.resume();
        reject(tooLarge());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (failed) return;
      try {
        resolve(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
      } catch {
        reject(Object.assign(new Error('invalid utf-8'), { code: 'invalid' }));
      }
    });
    req.on('error', () => {
      if (failed) return;
      failed = true;
      reject(Object.assign(new Error('request error'), { code: 'invalid' }));
    });
  });
}

/**
 * The only route that does anything is POST /api/contact. Order: method → Origin → attempt limit → content type →
 * size → JSON → honeypot → validation → local replay check → per-IP/global accepted limits → Turnstile → duplicate
 * check → one fixed-format message to info@. External responses are generic; internal outcome codes go to the log.
 */
export function createContactHandler(config, deps = {}) {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((entry) => console.log(JSON.stringify(entry)));
  const deliver = deps.deliver ?? ((raw) => sendmailDeliver(raw, { sendmailPath: config.sendmailPath }));
  const verify = deps.verify ?? ((token, ip) => verifyTurnstile(token, ip, config));
  const limits = deps.limits ?? {};

  const attempts = new SlidingWindow(limits.attemptsPer10Min ?? 20, 10 * MINUTE);
  const acceptedShort = new SlidingWindow(limits.acceptedPer10Min ?? 3, 10 * MINUTE);
  const acceptedDay = new SlidingWindow(limits.acceptedPerDay ?? 10, DAY);
  const acceptedGlobal = new SlidingWindow(limits.acceptedGlobalPerHour ?? 30, HOUR);
  const seenTokens = new ExpiringSet(10 * MINUTE);
  const recentMessages = new ExpiringSet(DAY);

  // Client identifiers in logs are HMACs with a key that changes daily and is never stored: correlatable within a day only.
  let hashDay = '';
  let hashKey = randomBytes(32);
  const clientHash = (key, time) => {
    const day = new Date(time).toISOString().slice(0, 10);
    if (day !== hashDay) {
      hashDay = day;
      hashKey = randomBytes(32);
    }
    return createHmac('sha256', hashKey).update(key).digest('hex').slice(0, 16);
  };

  return async function handle(req, res) {
    const started = now();
    const path = (req.url ?? '').split('?')[0];

    const reply = (status, body, outcome, details = {}) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...(status === 405 ? { Allow: 'POST' } : {}),
        ...(status === 413 ? { Connection: 'close' } : {}),
      });
      res.end(JSON.stringify(body));
      if (outcome) log({ ts: new Date(started).toISOString(), outcome, status, ...details });
    };

    if (path === '/healthz' && req.method === 'GET') return reply(200, { ok: true });
    if (path !== '/api/contact') {
      req.resume();
      return reply(404, { ok: false, error: 'not_found' });
    }
    if (req.method !== 'POST') {
      req.resume();
      return reply(405, { ok: false, error: 'method_not_allowed' }, 'method_rejected');
    }

    const ip = clientIp(req);
    const key = clientKey(ip);
    const client = clientHash(key, started);

    const origin = req.headers.origin;
    const fetchSite = req.headers['sec-fetch-site'];
    if (!origin || !config.allowedOrigins.includes(origin) || (fetchSite !== undefined && fetchSite !== 'same-origin')) {
      req.resume();
      return reply(403, { ok: false, error: 'forbidden' }, 'origin_rejected', { client });
    }

    if (!attempts.allowed(key, started)) {
      req.resume();
      return reply(429, { ok: false, error: 'rate_limited' }, 'rate_limited', { client, limit: 'attempts' });
    }
    attempts.record(key, started);

    const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      req.resume();
      return reply(415, { ok: false, error: 'unsupported' }, 'unsupported_type', { client });
    }

    let raw;
    try {
      raw = await readBody(req, BODY_LIMIT_BYTES);
    } catch (error) {
      if (error.code === 'too_large') return reply(413, { ok: false, error: 'too_large' }, 'too_large', { client });
      return reply(400, { ok: false, error: 'invalid', fields: [] }, 'invalid', { client, reason: 'body' });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return reply(400, { ok: false, error: 'invalid', fields: [] }, 'invalid', { client, reason: 'json' });
    }

    if (honeypotFilled(body)) return reply(200, { ok: true }, 'honeypot', { client });

    const result = validateSubmission(body);
    if (!result.ok) {
      return reply(400, { ok: false, error: 'invalid', fields: result.fields }, 'invalid', { client, reason: result.reason });
    }
    const submission = result.value;
    const locale = submission.locale;

    const tokenKey = sha256(submission.turnstileToken);
    if (seenTokens.has(tokenKey, started)) {
      return reply(403, { ok: false, error: 'verify_failed' }, 'replay', { client, locale });
    }
    seenTokens.add(tokenKey, started);

    if (!acceptedShort.allowed(key, started) || !acceptedDay.allowed(key, started)) {
      return reply(429, { ok: false, error: 'rate_limited' }, 'rate_limited', { client, locale, limit: 'accepted' });
    }
    if (!acceptedGlobal.allowed('global', started)) {
      return reply(429, { ok: false, error: 'rate_limited' }, 'rate_limited', { client, locale, limit: 'global' });
    }

    const verdict = await verify(submission.turnstileToken, ip);
    if (!verdict.ok) {
      const unavailable = verdict.kind === 'unavailable';
      return reply(
        unavailable ? 503 : 403,
        { ok: false, error: unavailable ? 'try_later' : 'verify_failed' },
        unavailable ? 'verify_unavailable' : 'verify_failed',
        { client, locale, codes: verdict.codes },
      );
    }

    const fingerprint = sha256(`${submission.email.toLowerCase()}\n${submission.message}`);
    if (recentMessages.has(fingerprint, started)) return reply(200, { ok: true }, 'duplicate', { client, locale });

    try {
      await deliver(buildMessage(submission, { now: new Date(started) }));
    } catch (error) {
      return reply(503, { ok: false, error: 'try_later' }, 'delivery_failed', { client, locale, code: String(error.code ?? 'error') });
    }

    const accepted = now();
    acceptedShort.record(key, accepted);
    acceptedDay.record(key, accepted);
    acceptedGlobal.record('global', accepted);
    recentMessages.add(fingerprint, accepted);
    return reply(200, { ok: true }, 'sent', { client, locale, length: [...submission.message].length });
  };
}

export function startServer(config, deps = {}) {
  const handle = createContactHandler(config, deps);
  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error(JSON.stringify({ ts: new Date().toISOString(), outcome: 'internal_error', error: error?.name ?? 'Error' }));
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end('{"ok":false,"error":"try_later"}');
      } else {
        res.destroy();
      }
    });
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = loadConfig();
  const server = startServer(config);
  server.listen(config.port, config.host, () => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        outcome: 'listening',
        host: config.host,
        port: config.port,
        turnstileTestKeys: config.turnstileTestKeys,
      }),
    );
  });
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
