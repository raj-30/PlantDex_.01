import 'dotenv/config';
// Fix the pg import for ESM
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set.");
  console.error("Please create a .env file with DATABASE_URL in the project root.");
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create a PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance
export const db = drizzle(pool, { schema });
