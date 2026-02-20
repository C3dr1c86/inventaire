/**
 * Configuration Vite pour le projet React.
 *
 * Configure le serveur de développement, le proxy vers le backend,
 * et le plugin PWA (vite-plugin-pwa) avec les stratégies de cache Workbox.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Le service worker ne s'active qu'en build de production
      devOptions: {
        enabled: false,
      },
      // Fichiers à pré-cacher lors de l'installation du SW
      includeAssets: ['favicon.ico', 'icons/*.png'],
      // Référence au manifest.json existant dans public/
      manifest: false,
      workbox: {
        // Fichiers statiques du build : cache permanent (cache-first)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Durée de vie max du cache de runtime : 24h
        runtimeCaching: [
          // Articles — NetworkFirst avec fallback cache 24h
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/articles'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-articles',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Catégories
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/categories'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-categories',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fournisseurs
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/fournisseurs'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-fournisseurs',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Emplacements
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/emplacements'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-emplacements',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Mouvements
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/mouvements'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-mouvements',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 500, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Tags
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/tags'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-tags',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Statistiques dashboard — cache 1h
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/rapports'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-rapports',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Photos articles — CacheFirst (rarement modifiées)
          {
            urlPattern: ({ url }) => url.pathname.includes('/photos'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-photos',
              expiration: { maxEntries: 200, maxAgeSeconds: 2592000 }, // 30 jours
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy pour les appels API vers le backend (dev)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      // Proxy pour les appels API vers le backend (preview/test PWA)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
