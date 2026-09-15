// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Official production domain (apex). www is currently served by the same Nginx server block, not
// redirected; canonical tags point here. site + sitemap + canonical + hreflang tags all depend on this value.
const SITE_URL = 'https://garden-ministries.org';

export default defineConfig({
  site: SITE_URL,
  // Pages are emitted as <route>/index.html and Nginx serves them at <route>/ (it 301s the slash-less form),
  // so every generated URL — links, canonical, hreflang, sitemap — ends in "/".
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', es: 'es' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
