import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The secret stays in the local Node proxy; never prefix it with VITE_.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const token = process.env.AUTOPILOT_API_TOKEN || env.AUTOPILOT_API_TOKEN;
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      cors: { origin: ['http://127.0.0.1:5173', 'http://localhost:5173'] },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: false,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) => {
              const origin = req.headers.origin;
              const host = req.headers.host;
              const allowedHosts = new Set(['127.0.0.1:5173', 'localhost:5173']);
              const allowedOrigins = new Set(['http://127.0.0.1:5173', 'http://localhost:5173']);
              if (token && allowedHosts.has(host) && (!origin || allowedOrigins.has(origin))) {
                proxyReq.setHeader('Authorization', 'Bearer ' + token);
              } else {
                proxyReq.removeHeader('Authorization');
              }
            });
          }
        }
      }
    }
  };
});
