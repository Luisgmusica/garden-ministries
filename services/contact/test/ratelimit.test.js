import test from 'node:test';
import assert from 'node:assert/strict';
import { ExpiringSet, SlidingWindow, clientKey } from '../src/ratelimit.js';

test('sliding window allows up to the limit, then recovers after the window', () => {
  const window = new SlidingWindow(3, 1_000);
  for (let i = 0; i < 3; i += 1) {
    assert.equal(window.allowed('a', 100 + i), true);
    window.record('a', 100 + i);
  }
  assert.equal(window.allowed('a', 500), false);
  assert.equal(window.allowed('b', 500), true);
  assert.equal(window.allowed('a', 1_101), true);
});

test('sliding window bounds memory', () => {
  const window = new SlidingWindow(1, 60_000, 10);
  for (let i = 0; i < 50; i += 1) window.record(`k${i}`, 1_000);
  assert.equal(window.allowed('k49', 1_000), false);
  assert.equal(window.allowed('k0', 1_000), true);
});

test('expiring set', () => {
  const set = new ExpiringSet(1_000, 3);
  set.add('x', 0);
  assert.equal(set.has('x', 999), true);
  assert.equal(set.has('x', 1_000), false);
  for (const key of ['a', 'b', 'c', 'd']) set.add(key, 10);
  assert.equal(set.has('a', 20), false);
  assert.equal(set.has('d', 20), true);
});

test('client keys', () => {
  assert.equal(clientKey('203.0.113.7'), '203.0.113.7');
  assert.equal(clientKey('::ffff:203.0.113.7'), '203.0.113.7');
  assert.equal(clientKey('2001:db8:1:2:3:4:5:6'), '2001:0db8:0001:0002::/64');
  assert.equal(clientKey('2001:db8:1:2::9'), '2001:0db8:0001:0002::/64');
  assert.equal(clientKey('2001:db8::1'), '2001:0db8:0000:0000::/64');
  assert.equal(clientKey(''), 'unknown');
});
