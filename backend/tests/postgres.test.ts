import { describe, expect, it } from "vitest";
import { createPostgresPool } from "../src/infrastructure/database/postgres.js";

describe("createPostgresPool", () => {
  it("requires DATABASE_URL", () => {
    expect(() => createPostgresPool(undefined)).toThrow("DATABASE_URL is required");
  });

  it("creates a single-connection pool without opening a database connection", async () => {
    const pool = createPostgresPool("postgresql://localhost/budget");

    expect(pool.options.max).toBe(1);
    expect(pool.options.connectionTimeoutMillis).toBe(10_000);
    expect(pool.options.idleTimeoutMillis).toBe(20_000);

    await pool.end();
  });
});
