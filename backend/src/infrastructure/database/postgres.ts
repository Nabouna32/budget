import { Pool } from "pg";

const DEFAULT_MAX_CONNECTIONS = 1;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;
const DEFAULT_IDLE_TIMEOUT_MS = 20_000;

export function createPostgresPool(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return new Pool({
    connectionString: databaseUrl,
    max: DEFAULT_MAX_CONNECTIONS,
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
  });
}
