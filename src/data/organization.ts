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
