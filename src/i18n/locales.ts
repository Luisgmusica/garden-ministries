export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/**
 * Given an unprefixed English path like "/about" (optionally with "#fragment"), return the localized
 * path with a trailing slash ("/about/", "/es/about/"), matching `trailingSlash: 'always'`.
 */
export function localizedPath(path: string, locale: Locale): string {
  const [pathname, fragment] = path.split('#');
  const clean = pathname.replace(/\/+$/, '');
  const localized = locale === defaultLocale ? `${clean}/` : `/es${clean}/`;
  return fragment ? `${localized}#${fragment}` : localized;
}

/** Strip the /es prefix (if any) to get the canonical English path used for the other locale link. */
export function unlocalizedPath(pathname: string): string {
  return pathname.startsWith('/es') ? pathname.slice(3) || '/' : pathname;
}
