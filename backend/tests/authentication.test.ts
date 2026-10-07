import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../src/app/create-app.js";
import type { AccessTokenVerifier } from "../src/infrastructure/auth/supabase-auth.js";

describe("authentication hook", () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) await app.close();
  });

  function createProtectedApp(verifier: AccessTokenVerifier): FastifyInstance {
    const instance = createApp({ authVerifier: verifier });

    instance.get(
      "/protected",
      { onRequest: instance.authenticate },
      async (request) => ({ user_id: request.authIdentity?.userId }),
    );

    return instance;
  }

  it("rejects a request without a bearer token", async () => {
    app = createProtectedApp({
      verify: async () => ({ userId: "test-user" }),
    });

    const response = await app.inject({
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        retryable: false,
      },
    });
  });

  it("rejects an invalid bearer token", async () => {
    app = createProtectedApp({
      verify: async () => {
        throw new Error("invalid token");
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: "Bearer invalid-token" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHORIZED");
  });

  it("accepts a valid bearer token and exposes only the authenticated identity", async () => {
    app = createProtectedApp({
      verify: async (token) => {
        expect(token).toBe("valid-token");
        return { userId: "test-user", sessionId: "test-session" };
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user_id: "test-user" });
  });
});
