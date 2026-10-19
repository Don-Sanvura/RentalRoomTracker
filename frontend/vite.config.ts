import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development, /api requests are proxied to the backend so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } },
});
