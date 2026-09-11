// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Adresse publique du site. À remplacer par le domaine définitif avant mise en ligne :
// elle sert aux balises canonical / Open Graph et aux liens permanents des communiqués.
const SITE = process.env.SITE_URL ?? 'https://looki.example';

export default defineConfig({
  site: SITE,
  integrations: [react()],
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: {
    // Les PNG sources sont volumineux : on laisse Astro générer AVIF/WebP redimensionnés.
    responsiveStyles: true,
    layout: 'constrained',
  },
});
