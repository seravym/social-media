import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Migrasi/CLI pakai koneksi direct Neon; fallback ke DATABASE_URL kalau tidak diisi.
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts'
  },
})