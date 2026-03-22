import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    react({
      // Only use babel for fast refresh in dev
      babel: {
        plugins: process.env.NODE_ENV === 'production' ? [] : ['react-refresh/babel'],
      },
    }),
  ],
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // UI libraries
          if (id.includes('node_modules/styled-components')) {
            return 'styled';
          }
          if (id.includes('node_modules/antd')) {
            return 'antd';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'framer';
          }
          if (id.includes('node_modules/@tabler/icons-react')) {
            return 'icons';
          }
          // State management
          if (id.includes('node_modules/@reduxjs/toolkit') || id.includes('node_modules/react-redux')) {
            return 'redux';
          }
          // Data fetching
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          // Utilities
          if (id.includes('node_modules/dayjs')) {
            return 'dayjs';
          }
          if (id.includes('node_modules/lodash')) {
            return 'lodash';
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n';
          }
          // Vendor chunk for other dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    // Source maps for debugging (disable in production for smaller size)
    sourcemap: false,
    // Minify
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2015',
    // CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets < 4kb
  },
  // Optimize dev server
  server: {
    // Enable HMR
    hmr: true,
    // Disable cors for dev
    cors: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'styled-components',
      '@reduxjs/toolkit',
      'react-redux',
      '@tanstack/react-query',
      'axios',
      'i18next',
      'react-i18next',
    ],
    exclude: [
      '@tanstack/react-query-devtools',
    ],
    force: true,
  },
});