const defaultRuntimeCaching = require('next-pwa/cache');

const customRuntimeCaching = [
  // 1. Gambar Mushaf (quran-images)
  {
    urlPattern: /^https:\/\/raw\.githubusercontent\.com\/ngaosidn\/dbQuranImages\/main\/.*\.webp/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'quran-images',
      expiration: {
        maxEntries: 650, 
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 tahun
      },
    },
  },
  // 2. Data JSON Lokal (/data/)
  {
    urlPattern: /\/data\/.*\.json$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'quran-local-data',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      },
    },
  },
  // 3. API API Eksternal (Equran & Quran.com)
  {
    urlPattern: /^https:\/\/equran\.id\/api\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'quran-tafsir-api',
      expiration: {
        maxEntries: 120,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      },
    },
  },
  {
    urlPattern: /^https:\/\/api\.quran\.com\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'quran-api',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
    },
  },
  // 4. Audio Murottal
  {
    urlPattern: /^https:\/\/everyayah\.com\/data\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'quran-audio',
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, 
      },
    },
  },
  // 5. App Shell Navigation (Agar Beranda & iQuran tidak Blank Offline)
  {
    urlPattern: /\/((iquran|itajwidmudah)(\/.*)?)?$/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'app-shell-html',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, 
      },
    },
  },
  ...defaultRuntimeCaching
];

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: customRuntimeCaching,
  buildExcludes: [/middleware-manifest.json$/],
  fallbacks: {
    document: '/offline.html',
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.svgrepo.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      }
    ],
  },
};

module.exports = withPWA(nextConfig); 