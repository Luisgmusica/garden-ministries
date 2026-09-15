import test from 'node:test';
import assert from 'node:assert/strict';
import { honeypotFilled, validateSubmission } from '../src/validate.js';

const base = () => ({
  name: 'Ana Pérez',
  email: 'ana@example.org',
  message: 'I would like to help with the food program.',
  locale: 'es',
  website: '',
  turnstileToken: 'token-abc',
});

test('accepts a normal submission and normalizes text', () => {
  const result = validateSubmission({ ...base(), name: '  Ana\u202E Pe\u0301rez ', message: ' Line one\r\nLine two here ' });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, 'Ana Pérez');
  assert.equal(result.value.message, 'Line one\nLine two here');
  assert.equal(result.value.locale, 'es');
});

test('locale and honeypot are optional', () => {
  const { locale, website, ...rest } = base();
  const result = validateSubmission(rest);
  assert.equal(result.ok, true);
  assert.equal(result.value.locale, 'en');
});

test('rejects non-objects, arrays and unexpected fields', () => {
  for (const body of [null, 'text', 42, [], [base()]]) assert.equal(validateSubmission(body).ok, false);
  for (const extra of ['to', 'subject', 'from', 'cc', 'bcc', 'headers']) {
    const result = validateSubmission({ ...base(), [extra]: 'x@example.org' });
    assert.deepEqual([result.ok, result.reason], [false, 'unexpected_field']);
  }
  const proto = validateSubmission(JSON.parse('{"__proto__":{"admin":true},"name":"A","email":"a@b.co","message":"0123456789","turnstileToken":"t"}'));
  assert.deepEqual([proto.ok, proto.reason], [false, 'unexpected_field']);
});

test('rejects missing and non-string required fields', () => {
  for (const field of ['name', 'email', 'message']) {
    const body = base();
    delete body[field];
    assert.deepEqual(validateSubmission(body).fields, [field]);
    assert.deepEqual(validateSubmission({ ...base(), [field]: 123 }).fields, [field]);
  }
  const noToken = base();
  delete noToken.turnstileToken;
  assert.equal(validateSubmission(noToken).reason, 'invalid_token');
});

test('rejects CR/LF and control characters in single-line fields (header injection)', () => {
  assert.deepEqual(validateSubmission({ ...base(), name: 'Ana\r\nBcc: victim@example.org' }).fields, ['name']);
  assert.deepEqual(validateSubmission({ ...base(), name: 'Ana\u0000' }).fields, ['name']);
  assert.deepEqual(validateSubmission({ ...base(), email: 'ana@example.org\r\nBcc: victim@example.org' }).fields, ['email']);
  assert.deepEqual(validateSubmission({ ...base(), email: 'ana@example.org\nTo: x@y.z' }).fields, ['email']);
});

test('email syntax', () => {
  const valid = ['ana@example.org', 'first.last+tag@sub.example.co', "o'brien@example.ie", 'x@xn--bcher-kva.example'];
  const invalid = [
    'ana', 'ana@', '@example.org', 'ana@example', 'ana@@example.org', 'ana @example.org', 'ana@exa mple.org',
    '"Ana" <ana@example.org>', 'ana@example.org, bob@example.org', 'ana@example.org;bob@example.org', '.ana@example.org',
    'ana.@example.org', 'an..a@example.org', 'ana@-example.org', 'añá@example.org', `${'a'.repeat(65)}@example.org`,
    `a@${'b'.repeat(250)}.org`,
  ];
  for (const email of valid) assert.equal(validateSubmission({ ...base(), email }).ok, true, email);
  for (const email of invalid) assert.deepEqual(validateSubmission({ ...base(), email }).fields, ['email'], email);
});

test('name and message lengths', () => {
  assert.deepEqual(validateSubmission({ ...base(), name: '   ' }).fields, ['name']);
  assert.deepEqual(validateSubmission({ ...base(), name: 'n'.repeat(101) }).fields, ['name']);
  assert.equal(validateSubmission({ ...base(), name: 'ñ'.repeat(100) }).ok, true);
  assert.deepEqual(validateSubmission({ ...base(), message: 'too short' }).fields, ['message']);
  assert.deepEqual(validateSubmission({ ...base(), message: 'm'.repeat(5001) }).fields, ['message']);
  assert.equal(validateSubmission({ ...base(), message: '🙏'.repeat(5000) }).ok, true);
});

test('message allows newlines and tabs but not other controls; limits links', () => {
  assert.equal(validateSubmission({ ...base(), message: 'Hello\n\tGarden team, thank you' }).ok, true);
  assert.deepEqual(validateSubmission({ ...base(), message: 'Hello Garden\u0007 team' }).fields, ['message']);
  const threeLinks = 'See https://a.example http://b.example www.c.example please';
  assert.equal(validateSubmission({ ...base(), message: threeLinks }).ok, true);
  assert.deepEqual(validateSubmission({ ...base(), message: `${threeLinks} https://d.example` }).fields, ['message']);
});

test('HTML is accepted as plain text (never rendered)', () => {
  const result = validateSubmission({ ...base(), message: '<script>alert(1)</script> <b>hello</b>' });
  assert.equal(result.ok, true);
  assert.equal(result.value.message, '<script>alert(1)</script> <b>hello</b>');
});

test('rejects malformed Unicode, bad locale and bad tokens', () => {
  assert.deepEqual(validateSubmission({ ...base(), message: 'Hello Garden \uD800 team' }).fields, ['message']);
  assert.equal(validateSubmission({ ...base(), locale: 'fr' }).reason, 'invalid_locale');
  assert.equal(validateSubmission({ ...base(), turnstileToken: '' }).reason, 'invalid_token');
  assert.equal(validateSubmission({ ...base(), turnstileToken: 'has space' }).reason, 'invalid_token');
  assert.equal(validateSubmission({ ...base(), turnstileToken: 't'.repeat(2049) }).reason, 'invalid_token');
  assert.equal(validateSubmission({ ...base(), turnstileToken: 't'.repeat(2048) }).ok, true);
});

test('honeypot detection', () => {
  assert.equal(honeypotFilled({ ...base(), website: 'http://spam.example' }), true);
  assert.equal(honeypotFilled({ ...base(), website: '   ' }), false);
  assert.equal(honeypotFilled(base()), false);
  assert.equal(honeypotFilled(null), false);
});
