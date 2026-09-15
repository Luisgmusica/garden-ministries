import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { startServer } from '../src/server.js';
import { makeFakeSendmail, request, startMockSiteverify } from './helpers.js';

async function setup({ sendmailFail = false, limits, siteverify: sharedSiteverify } = {}) {
  const sendmail = await makeFakeSendmail({ fail: sendmailFail });
  const siteverify = sharedSiteverify ?? (await startMockSiteverify());
  const config = loadConfig({ TURNSTILE_SECRET: 'mock-secret', TURNSTILE_VERIFY_URL: siteverify.url, SENDMAIL_PATH: sendmail.path });
  const logs = [];
  const server = startServer(config, { log: (entry) => logs.push(entry), limits });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  let counter = 0;
  const submit = (overrides = {}, options = {}) => {
    counter += 1;
    const body = {
      name: 'Ana Pérez',
      email: 'ana@example.org',
      message: `Hello Garden, this is message number ${counter}.`,
      locale: 'en',
      website: '',
      turnstileToken: `pass-${counter}-${Math.random().toString(36).slice(2)}`,
      ...overrides,
    };
    return request(port, { body: JSON.stringify(body), ...options });
  };
  return {
    port,
    submit,
    sendmail,
    siteverify,
    logs,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      if (!sharedSiteverify) await siteverify.close();
    },
  };
}

test('a valid human submission is delivered once to info@ with fixed headers and Reply-To', async (t) => {
  const app = await setup();
  t.after(app.close);
  const response = await app.submit({ locale: 'es' }, { headers: { 'X-Real-IP': '203.0.113.9' } });
  assert.equal(response.status, 200);
  assert.deepEqual(response.json, { ok: true });
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['access-control-allow-origin'], undefined);

  const deliveries = await app.sendmail.deliveries();
  assert.equal(deliveries.length, 1);
  assert.deepEqual(deliveries[0].args, ['-i', '-f', 'info@garden-ministries.org', '--', 'info@garden-ministries.org']);
  const [head, encoded] = deliveries[0].message.split('\n\n');
  const headers = head.split('\n');
  assert.ok(headers.includes('From: "Garden Ministries website" <info@garden-ministries.org>'));
  assert.ok(headers.includes('To: info@garden-ministries.org'));
  assert.ok(headers.includes('Reply-To: ana@example.org'));
  assert.ok(headers.includes('Subject: [Garden website] Start a conversation (ES)'));
  assert.equal(headers.filter((line) => /^(to|cc|bcc|from|subject|reply-to):/i.test(line)).length, 4);
  const body = Buffer.from(encoded.replace(/\n/g, ''), 'base64').toString('utf8');
  assert.ok(body.includes('Name: Ana Pérez'));
  assert.ok(body.includes('Hello Garden, this is message number 1.'));

  assert.equal(app.siteverify.calls.length, 1);
  assert.equal(app.siteverify.calls[0].secret, 'mock-secret');
  assert.equal(app.siteverify.calls[0].remoteip, '203.0.113.9');
  assert.ok(app.siteverify.calls[0].idempotencyKey);

  assert.equal(app.logs.at(-1).outcome, 'sent');
  const logText = JSON.stringify(app.logs);
  for (const secret of ['Ana', 'ana@example.org', 'Hello Garden', '203.0.113.9', 'pass-']) assert.equal(logText.includes(secret), false);
});

test('invalid Turnstile token is rejected without delivery', async (t) => {
  const app = await setup();
  t.after(app.close);
  const response = await app.submit({ turnstileToken: 'fail-token' });
  assert.deepEqual([response.status, response.json], [403, { ok: false, error: 'verify_failed' }]);
  assert.equal((await app.sendmail.deliveries()).length, 0);
  assert.deepEqual(app.logs.at(-1).codes, ['invalid-input-response']);
});

test('Turnstile hostname or action mismatch is rejected', async (t) => {
  const app = await setup();
  t.after(app.close);
  assert.equal((await app.submit({ turnstileToken: 'wronghost-1' })).status, 403);
  assert.equal((await app.submit({ turnstileToken: 'wrongaction-1' })).status, 403);
  assert.deepEqual(app.logs.map((entry) => entry.codes), [['hostname_mismatch'], ['action_mismatch']]);
  assert.equal((await app.sendmail.deliveries()).length, 0);
});

test('a replayed token is rejected (locally and by Cloudflare after a restart)', async (t) => {
  const siteverify = await startMockSiteverify();
  const first = await setup({ siteverify });
  const token = 'pass-replay-token';
  assert.equal((await first.submit({ turnstileToken: token })).status, 200);
  const replay = await first.submit({ turnstileToken: token, message: 'Another message to replay the token.' });
  assert.deepEqual([replay.status, replay.json.error], [403, 'verify_failed']);
  assert.equal(first.logs.at(-1).outcome, 'replay');
  assert.equal(siteverify.calls.length, 1);
  await first.close();

  const restarted = await setup({ siteverify });
  t.after(async () => {
    await restarted.close();
    await siteverify.close();
  });
  const afterRestart = await restarted.submit({ turnstileToken: token, message: 'Replay after a service restart.' });
  assert.deepEqual([afterRestart.status, afterRestart.json.error], [403, 'verify_failed']);
  assert.deepEqual(restarted.logs.at(-1).codes, ['timeout-or-duplicate']);
  assert.equal((await restarted.sendmail.deliveries()).length, 0);
});

test('honeypot gets a silent success and nothing is verified or sent', async (t) => {
  const app = await setup();
  t.after(app.close);
  const response = await app.submit({ website: 'https://spam.example' });
  assert.deepEqual([response.status, response.json], [200, { ok: true }]);
  assert.equal(app.siteverify.calls.length, 0);
  assert.equal((await app.sendmail.deliveries()).length, 0);
  assert.equal(app.logs.at(-1).outcome, 'honeypot');
});

test('malformed, unexpected and invalid input is rejected', async (t) => {
  const app = await setup();
  t.after(app.close);
  const cases = [
    [await request(app.port, { body: '{not json' }), 400],
    [await request(app.port, { body: '[]' }), 400],
    [await app.submit({ to: 'victim@example.org' }), 400],
    [await app.submit({ subject: 'Injected' }), 400],
    [await app.submit({ email: 'not-an-email' }), 400],
    [await app.submit({ name: 'Ana\r\nBcc: victim@example.org' }), 400],
    [await app.submit({ email: 'ana@example.org\r\nBcc: victim@example.org' }), 400],
    [await app.submit({ message: 'short' }), 400],
  ];
  for (const [response, status] of cases) assert.equal(response.status, status, response.text);
  assert.deepEqual(cases[4][0].json, { ok: false, error: 'invalid', fields: ['email'] });
  assert.deepEqual(cases[5][0].json.fields, ['name']);
  assert.equal(app.siteverify.calls.length, 0);
  assert.equal((await app.sendmail.deliveries()).length, 0);
});

test('oversized requests are rejected with 413', async (t) => {
  const app = await setup();
  t.after(app.close);
  const big = JSON.stringify({ name: 'A', email: 'a@example.org', message: 'x'.repeat(20_000), turnstileToken: 'pass-big' });
  assert.equal((await request(app.port, { body: big })).status, 413);
  // Content-Length understated: the stream limit still applies.
  const response = await request(app.port, { body: big, headers: { 'Content-Length': undefined, 'Transfer-Encoding': 'chunked' } });
  assert.equal(response.status, 413);
  assert.equal((await app.sendmail.deliveries()).length, 0);
});

test('wrong or missing Origin, cross-site fetch, wrong method and content type are rejected', async (t) => {
  const app = await setup();
  t.after(app.close);
  assert.equal((await app.submit({}, { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await app.submit({}, { headers: { Origin: undefined } })).status, 403);
  assert.equal((await app.submit({}, { headers: { Origin: 'https://garden-ministries.org.evil.example' } })).status, 403);
  assert.equal((await app.submit({}, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await app.submit({}, { headers: { 'Sec-Fetch-Site': 'same-origin' } })).status, 200);
  assert.equal((await app.submit({}, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })).status, 415);
  const get = await request(app.port, { method: 'GET', body: '' });
  assert.deepEqual([get.status, get.headers.allow], [405, 'POST']);
  assert.equal((await request(app.port, { path: '/api/other' })).status, 404);
  assert.equal((await request(app.port, { method: 'GET', path: '/healthz' })).status, 200);
  assert.equal((await app.sendmail.deliveries()).length, 1);
});

test('rate limits: accepted messages per IP, attempts per IP, and a global cap', async (t) => {
  const app = await setup();
  t.after(app.close);
  for (let i = 0; i < 3; i += 1) assert.equal((await app.submit()).status, 200);
  const limited = await app.submit();
  assert.deepEqual([limited.status, limited.json.error], [429, 'rate_limited']);
  assert.equal((await app.submit({}, { headers: { 'X-Real-IP': '198.51.100.20' } })).status, 200);
  assert.equal((await app.sendmail.deliveries()).length, 4);

  const attempts = await setup({ limits: { attemptsPer10Min: 2 } });
  t.after(attempts.close);
  await attempts.submit({ message: 'short' });
  await attempts.submit({ message: 'short' });
  assert.equal((await attempts.submit()).status, 429);

  const global = await setup({ limits: { acceptedGlobalPerHour: 2 } });
  t.after(global.close);
  assert.equal((await global.submit({}, { headers: { 'X-Real-IP': '198.51.100.1' } })).status, 200);
  assert.equal((await global.submit({}, { headers: { 'X-Real-IP': '198.51.100.2' } })).status, 200);
  assert.equal((await global.submit({}, { headers: { 'X-Real-IP': '198.51.100.3' } })).status, 429);
});

test('duplicate message within 24 h is acknowledged but not sent twice', async (t) => {
  const app = await setup();
  t.after(app.close);
  const message = 'Please pray for our family this week.';
  assert.equal((await app.submit({ message })).status, 200);
  const duplicate = await app.submit({ message, email: 'ANA@example.org' });
  assert.deepEqual([duplicate.status, duplicate.json], [200, { ok: true }]);
  assert.equal((await app.sendmail.deliveries()).length, 1);
  assert.equal(app.logs.at(-1).outcome, 'duplicate');
});

test('mail system unavailable returns an honest failure', async (t) => {
  const app = await setup({ sendmailFail: true });
  t.after(app.close);
  const response = await app.submit();
  assert.deepEqual([response.status, response.json], [503, { ok: false, error: 'try_later' }]);
  assert.deepEqual([app.logs.at(-1).outcome, app.logs.at(-1).code], ['delivery_failed', 'exit_75']);
  // A failed delivery does not consume the visitor's allowance.
  const again = await app.submit();
  assert.equal(again.status, 503);
});

test('Turnstile unavailable returns an honest failure after one retry', async (t) => {
  const app = await setup();
  t.after(app.close);
  const response = await app.submit({ turnstileToken: 'down-1' });
  assert.deepEqual([response.status, response.json], [503, { ok: false, error: 'try_later' }]);
  assert.equal(app.siteverify.calls.length, 2);
  assert.equal(app.siteverify.calls[0].idempotencyKey, app.siteverify.calls[1].idempotencyKey);
  assert.equal((await app.sendmail.deliveries()).length, 0);
});
