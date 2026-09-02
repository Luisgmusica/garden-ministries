export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** Given an unprefixed English path like "/about", return the localized path. */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path;
  return locale === defaultLocale ? `/${clean}`.replace(/\/+/g, '/') : `/es${clean}`;
}

/** Strip the /es prefix (if any) to get the canonical English path used for the other locale link. */
export function unlocalizedPath(pathname: string): string {
  return pathname.startsWith('/es') ? pathname.slice(3) || '/' : pathname;
}
