import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'icon-48x48.png',
          'icon-72x72.png',
          'icon-96x96.png',
          'icon-128x128.png',
          'icon-144x144.png',
          'icon-152x152.png',
          'icon-180x180.png',
          'pwa-192x192.png',
          'icon-384x384.png',
          'pwa-512x512.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
          'screenshot-wide.png',
          'screenshot-narrow.png',
        ],
        manifest: {
          id: '/',
          name: 'نظام الحوافز والمكافآت - مجموعة البحري',
          short_name: 'حوافز البحري',
          description: 'نظام إدارة الحوافز والمكافآت والمخالفات الميدانية والإدارية لمجموعة البحري التجارية',
          theme_color: '#0c2340',
          background_color: '#0c2340',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          dir: 'rtl',
          lang: 'ar',
          prefer_related_applications: false,
          categories: ['business', 'finance', 'productivity'],
          icons: [
            {
              src: '/icon-48x48.png',
              sizes: '48x48',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-180x180.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshot-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'لوحة التحكم الرئيسية - نظام الحوافز والمكافآت لمجموعة البحري',
            },
            {
              src: '/screenshot-narrow.png',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'واجهة الجوال المتجاوبة - حوافز البحري',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
