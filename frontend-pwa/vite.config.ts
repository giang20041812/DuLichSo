import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'screenshots/desktop-wide.png', 'screenshots/mobile-narrow.png'],
      manifest: {
        id: '/',
        name: 'Đi Du Lịch - Du Lịch Di Sản & Sinh Thái Việt Nam',
        short_name: 'Đi Du Lịch',
        description: 'Nền tảng đặt phòng Homestay & trải nghiệm du lịch số bản địa Việt Nam',
        theme_color: '#048C73',
        background_color: '#F6FAF8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-wide.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Trang chủ Đi Du Lịch trên máy tính'
          },
          {
            src: '/screenshots/mobile-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Ứng dụng Đi Du Lịch trên điện thoại'
          }
        ],
        shortcuts: [
          {
            name: 'Tìm phòng Homestay',
            short_name: 'Homestay',
            description: 'Khám phá và đặt phòng homestay sinh thái',
            url: '/homestays',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Chuyến đi của tôi',
            short_name: 'Đơn đặt',
            description: 'Kiểm tra lịch trình & đơn đặt chỗ',
            url: '/bookings',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Bản đồ du lịch',
            short_name: 'Bản đồ',
            description: 'Khám phá địa điểm bản đồ',
            url: '/map',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.domain\.com\/api\/v1\/(homestays|services)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            },
          }
        ]
      }
    })
  ],
});
