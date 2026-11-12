import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForPostgres = globalThis as typeof globalThis & { communityPool?: Pool }

export const pool = globalForPostgres.communityPool ?? new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.communityPool = pool
}

export const db = drizzle(pool, { schema })
