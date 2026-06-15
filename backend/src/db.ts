import pg from "pg";
import { config } from "./config";

// pool de connexions PostgreSQL (réutilise les connexions, plus performant)
const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });
