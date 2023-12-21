import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: '/index.html',
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
