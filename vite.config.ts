
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Consolidate API KEY from different sources
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    server: {
      host: true,
    },
    define: {
      // Expose Gemini API Key
      'process.env.API_KEY': JSON.stringify(apiKey),
      
      // Prevent crash if code references `process.env` generally
      'process.env': {}
    }
  };
});
