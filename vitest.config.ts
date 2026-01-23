import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Disable React plugin's CSS processing
      include: '**/*.{jsx,tsx}',
    }),
  ],
  test: {
    // Using jsdom for better React 19 compatibility and stability
    // jsdom is more mature and handles complex React Testing Library queries better than happy-dom
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false, // Disable CSS processing to avoid PostCSS issues in tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/pages/_app.tsx',
        'src/pages/_document.tsx',
      ],
    },
    globals: true,
    env: {
      VITEST: 'true',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Completely ignore CSS files during Vite build for tests
  css: {
    postcss: false,
  },
});
