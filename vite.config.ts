import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Türkçe Açıklama:
// Tüm uygulama sürümü package.json'dan tek kaynak olarak okunur.
// Başka hiçbir dosyaya hardcode edilmez; build.gradle ve public/version.json
// scripts/sync-version.mjs tarafından bu değere göre senkronize edilir.
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // AI API key'leri artık bundle'a inject EDİLMİYOR — Supabase Edge
        // Function proxy üzerinden çağrılır. Key'ler sadece Edge Function
        // secrets'te tutulur, APK'da görünmez.
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
        __APP_VERSION__: JSON.stringify(pkg.version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
