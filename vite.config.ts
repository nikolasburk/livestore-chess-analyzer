/* eslint-disable unicorn/no-process-exit */
import { spawn } from 'node:child_process'

import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 60_001,
  },
  worker: { format: 'es' },
  plugins: [
    react(),
    cloudflare(),
    livestoreDevtoolsPlugin({ schemaPath: './src/livestore/schema.ts' }),
    // Running `wrangler dev` as part of `vite dev` needed for `@livestore/sync-cf`
  ],
})
