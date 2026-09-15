import test from 'node:test';
import assert from 'node:assert/strict';
import { ENVELOPE_SENDER, MAIL_TO, buildMessage } from '../src/message.js';

const submission = {
  name: 'Ana Pérez <script>',
  email: 'ana@example.org',
  message: 'Hola 🙏\nTo: attacker@example.org\nSubject: fake',
  locale: 'es',
};
const fixed = { now: new Date('2026-09-15T20:00:00Z'), messageId: '00000000-0000-4000-8000-000000000000' };

function parse(raw) {
  const [head, ...rest] = raw.split('\n\n');
  return { headers: head.split('\n'), body: Buffer.from(rest.join('\n\n').replace(/\n/g, ''), 'base64').toString('utf8') };
}

test('fixed identities', () => {
  assert.equal(MAIL_TO, 'info@garden-ministries.org');
  assert.equal(ENVELOPE_SENDER, 'info@garden-ministries.org');
});

test('headers are fixed except the validated Reply-To', () => {
  const { headers } = parse(buildMessage(submission, fixed));
  assert.deepEqual(headers, [
    'From: "Garden Ministries website" <info@garden-ministries.org>',
    'To: info@garden-ministries.org',
    'Reply-To: ana@example.org',
    'Subject: [Garden website] Start a conversation (ES)',
    'Date: Tue, 15 Sep 2026 20:00:00 GMT',
    'Message-ID: <00000000-0000-4000-8000-000000000000@garden-ministries.org>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated',
    'X-Garden-Form: start-a-conversation',
  ]);
});

test('visitor text only appears inside the base64 plain-text body', () => {
  const raw = buildMessage(submission, fixed);
  assert.equal(raw.includes('attacker@example.org'), false);
  assert.equal(raw.includes('Ana'), false);
  const { body } = parse(raw);
  assert.equal(
    body,
    'Name: Ana Pérez <script>\nEmail: ana@example.org\nLanguage: ES\nReceived: 2026-09-15T20:00:00.000Z\n\nMessage:\nHola 🙏\nTo: attacker@example.org\nSubject: fake\n',
  );
  for (const line of raw.split('\n')) assert.ok(line.length <= 998);
});

test('English subject for en', () => {
  assert.ok(buildMessage({ ...submission, locale: 'en' }, fixed).includes('Subject: [Garden website] Start a conversation (EN)\n'));
});

test('refuses unsafe Reply-To values even if validation were bypassed', () => {
  for (const email of ['ana@example.org\r\nBcc: x@y.z', 'ana@example.org\nBcc: x@y.z', 'Ana <ana@example.org>', 'a@b.c, d@e.f', 'añá@example.org']) {
    assert.throws(() => buildMessage({ ...submission, email }, fixed));
  }
});
