import Fastify, { type FastifyInstance } from "fastify";
import type { AccessTokenVerifier } from "../infrastructure/auth/supabase-auth.js";
import { createAuthenticationHook } from "./authentication.js";

export interface CreateAppOptions {
  authVerifier?: AccessTokenVerifier;
}

export function createApp(options: CreateAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  app.decorateRequest("authIdentity", null);
  app.decorate(
    "authenticate",
    createAuthenticationHook(options.authVerifier),
  );

  app.get("/health", async () => ({
    status: "ok",
  }));

  return app;
}
