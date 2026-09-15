// Single source for organization contact data shown on the site.

/**
 * Postal address for mail only — not a visitor or office location. Keep it out of the JSON-LD
 * `address` in BaseLayout so search engines never present it as a place to visit.
 */
export const mailingAddress = [
  'Garden Ministries',
  '179 S Ten Mile Rd. Ste. 120',
  'PMB #150',
  'Meridian, ID 83642',
] as const;

/** Institutional address; also the fallback when the online contact form cannot be used. */
export const contactEmail = 'info@garden-ministries.org';

/**
 * Public Cloudflare Turnstile sitekey for the "Start a conversation" form (the secret exists only on the server).
 * Empty = online sending disabled: the page shows the email fallback instead of a form.
 * Local testing may override it at build time with PUBLIC_TURNSTILE_SITEKEY.
 */
const PRODUCTION_TURNSTILE_SITEKEY = '0x4AAAAAAE25w_GKpgHYFzoH';
export const turnstileSiteKey: string = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || PRODUCTION_TURNSTILE_SITEKEY;
