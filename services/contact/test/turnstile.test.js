import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { verifyTurnstile } from '../src/turnstile.js';

// Calls Cloudflare's real siteverify with its public test secrets. Opt-in: TURNSTILE_LIVE=1 npm test
const live = process.env.TURNSTILE_LIVE === '1';
const dummyToken = 'XXXX.DUMMY.TOKEN.XXXX';
const configFor = (secret) => loadConfig({ TURNSTILE_SECRET: secret, ALLOW_TURNSTILE_TEST_KEYS: '1' });

test('live siteverify: always-pass test secret', { skip: !live }, async () => {
  assert.deepEqual(await verifyTurnstile(dummyToken, '203.0.113.5', configFor('1x0000000000000000000000000000000AA')), { ok: true });
});

test('live siteverify: always-fail test secret', { skip: !live }, async () => {
  const result = await verifyTurnstile(dummyToken, '', configFor('2x0000000000000000000000000000000AA'));
  assert.deepEqual(result, { ok: false, kind: 'rejected', codes: ['invalid-input-response'] });
});

test('live siteverify: token-already-spent test secret', { skip: !live }, async () => {
  const result = await verifyTurnstile(dummyToken, '', configFor('3x0000000000000000000000000000000AA'));
  assert.deepEqual(result, { ok: false, kind: 'rejected', codes: ['timeout-or-duplicate'] });
});

test('unreachable siteverify is reported as unavailable', async () => {
  const config = loadConfig({ TURNSTILE_SECRET: 'x', TURNSTILE_VERIFY_URL: 'http://127.0.0.1:9/siteverify' });
  assert.deepEqual(await verifyTurnstile('token', '', config, { timeoutMs: 500 }), {
    ok: false,
    kind: 'unavailable',
    codes: ['siteverify_unreachable'],
  });
});
