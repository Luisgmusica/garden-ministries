import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('requires a Turnstile secret', () => {
  assert.throws(() => loadConfig({}), /TURNSTILE_SECRET/);
});

test('refuses Cloudflare test secrets unless explicitly allowed', () => {
  assert.throws(() => loadConfig({ TURNSTILE_SECRET: '1x0000000000000000000000000000000AA' }), /test secret/);
  const config = loadConfig({ TURNSTILE_SECRET: '1x0000000000000000000000000000000AA', ALLOW_TURNSTILE_TEST_KEYS: '1' });
  assert.equal(config.turnstileTestKeys, true);
});

test('production defaults', () => {
  const config = loadConfig({ TURNSTILE_SECRET: 'real-secret' });
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 8091);
  assert.equal(config.turnstileTestKeys, false);
  assert.deepEqual(config.allowedOrigins, ['https://garden-ministries.org', 'https://www.garden-ministries.org']);
  assert.deepEqual(config.turnstileHostnames, ['garden-ministries.org', 'www.garden-ministries.org']);
  assert.equal(config.sendmailPath, '/usr/sbin/sendmail');
  assert.equal(config.turnstileVerifyUrl, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.throws(() => loadConfig({ TURNSTILE_SECRET: 's', PORT: 'abc' }), /PORT/);
});
