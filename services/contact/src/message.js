import { randomUUID } from 'node:crypto';

// Fixed, Garden-controlled identities. Visitor input never becomes a recipient, a sender or a subject.
export const MAIL_TO = 'info@garden-ministries.org';
export const ENVELOPE_SENDER = 'info@garden-ministries.org';
const FROM_HEADER = '"Garden Ministries website" <info@garden-ministries.org>';

const PRINTABLE_ASCII = /^[\x20-\x7E]+$/;
const BARE_ADDRESS = /^[^\s<>(),;:"\\@]+@[^\s<>(),;:"\\@]+$/;

function header(name, value) {
  // Defense in depth: validation already guarantees this, but a header line must never contain CR/LF or non-ASCII.
  if (!PRINTABLE_ASCII.test(value)) throw new Error(`Unsafe value for the ${name} header`);
  return `${name}: ${value}`;
}

/**
 * Builds the plain-text message for local `sendmail` (LF line endings). The only visitor value in a header is the
 * validated address in Reply-To; everything the visitor wrote goes into a base64-encoded text/plain body.
 */
export function buildMessage({ name, email, message, locale }, { now = new Date(), messageId = randomUUID() } = {}) {
  if (!BARE_ADDRESS.test(email)) throw new Error('Unsafe Reply-To address');
  const language = locale === 'es' ? 'ES' : 'EN';

  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Language: ${language}`,
    `Received: ${now.toISOString()}`,
    '',
    'Message:',
    message,
    '',
  ].join('\n');

  const headers = [
    header('From', FROM_HEADER),
    header('To', MAIL_TO),
    header('Reply-To', email),
    header('Subject', `[Garden website] Start a conversation (${language})`),
    header('Date', now.toUTCString()),
    header('Message-ID', `<${messageId}@garden-ministries.org>`),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated',
    'X-Garden-Form: start-a-conversation',
  ];

  const encoded = Buffer.from(body, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\n') ?? '';
  return `${headers.join('\n')}\n\n${encoded}\n`;
}
