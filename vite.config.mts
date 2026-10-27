
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from "path";

const basePath = process.env.VITE_BASE_PATH || '/imsop-app-frontend/';

const isolatedProxy = process.env.IMSOP_SYSTEM_API === 'http://127.0.0.1:18067'
  ? Object.fromEntries(['/api','/supply-chain','/health','/ready','/version'].map(prefix=>[prefix,{target:process.env.IMSOP_SYSTEM_API,changeOrigin:false}])) : undefined;
export default defineConfig({
  preview: {proxy:isolatedProxy},
  plugins: [react(), tailwindcss()],
  base: basePath,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    proxy: isolatedProxy,
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
