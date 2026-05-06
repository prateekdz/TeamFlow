import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import "../config/index.js";
import * as schema from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL must be set. Create a .env file from .env.example and add your PostgreSQL connection string."
    );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
export * from "./schema/index.js";
