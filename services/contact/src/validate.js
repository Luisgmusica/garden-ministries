// Server-side validation of a contact submission. The browser's checks are only a convenience; these are authoritative.

export const LIMITS = Object.freeze({
  nameMax: 100,
  emailMax: 254,
  emailLocalMax: 64,
  messageMin: 10,
  messageMax: 5000,
  maxLinks: 3,
  tokenMax: 2048,
  honeypotMax: 200,
});

const ALLOWED_KEYS = new Set(['name', 'email', 'message', 'locale', 'website', 'turnstileToken']);
const LOCALES = new Set(['en', 'es']);

// Zero-width and bidirectional formatting characters are removed: they can disguise text but carry no meaning here.
const INVISIBLE_FORMATTING = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const SINGLE_LINE_FORBIDDEN = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/;
const MULTI_LINE_FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u2028\u2029]/;
const EMAIL =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;
const LINK = /\b(?:https?:\/\/|www\.)/gi;
const TOKEN = /^[\x21-\x7E]+$/;

const codePoints = (value) => [...value].length;
const clean = (value) => value.normalize('NFC').replace(INVISIBLE_FORMATTING, '');

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

/** Bots tend to fill every field; a filled honeypot is answered with a silent success and nothing is sent. */
export function honeypotFilled(body) {
  return isPlainObject(body) && typeof body.website === 'string' && body.website.trim() !== '';
}

export function validateSubmission(body) {
  if (!isPlainObject(body)) return { ok: false, reason: 'not_object', fields: [] };
  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) return { ok: false, reason: 'unexpected_field', fields: [] };
  }

  const read = (key, required) => {
    const value = body[key];
    if (value === undefined) return required ? null : '';
    if (typeof value !== 'string' || !value.isWellFormed()) return null;
    return value;
  };

  const fields = [];

  const rawName = read('name', true);
  const name = rawName === null ? '' : clean(rawName).trim();
  if (rawName === null || SINGLE_LINE_FORBIDDEN.test(name) || codePoints(name) < 1 || codePoints(name) > LIMITS.nameMax) {
    fields.push('name');
  }

  const rawEmail = read('email', true);
  const email = rawEmail === null ? '' : rawEmail.trim();
  const localPart = email.split('@')[0] ?? '';
  if (
    rawEmail === null ||
    email.length > LIMITS.emailMax ||
    localPart.length > LIMITS.emailLocalMax ||
    !EMAIL.test(email)
  ) {
    fields.push('email');
  }

  const rawMessage = read('message', true);
  const message = rawMessage === null ? '' : clean(rawMessage).replace(/\r\n?/g, '\n').trim();
  const links = message.match(LINK)?.length ?? 0;
  if (
    rawMessage === null ||
    MULTI_LINE_FORBIDDEN.test(message) ||
    codePoints(message) < LIMITS.messageMin ||
    codePoints(message) > LIMITS.messageMax ||
    links > LIMITS.maxLinks
  ) {
    fields.push('message');
  }

  if (fields.length) return { ok: false, reason: 'invalid_field', fields };

  const locale = read('locale', false);
  if (locale === null || (locale !== '' && !LOCALES.has(locale))) return { ok: false, reason: 'invalid_locale', fields: [] };

  const website = read('website', false);
  if (website === null || website.length > LIMITS.honeypotMax) return { ok: false, reason: 'invalid_honeypot', fields: [] };

  const turnstileToken = read('turnstileToken', true);
  if (turnstileToken === null || turnstileToken.length > LIMITS.tokenMax || !TOKEN.test(turnstileToken)) {
    return { ok: false, reason: 'invalid_token', fields: [] };
  }

  return {
    ok: true,
    value: { name, email, message, locale: locale || 'en', turnstileToken },
  };
}
