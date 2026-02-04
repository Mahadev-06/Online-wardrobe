
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: true,
    },
    define: {
      // Expose Gemini API Key
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      
      // Prevent crash if code references `process.env` generally
      'process.env': {}
    }
  };
});
