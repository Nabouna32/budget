import type {
  FastifyReply,
  FastifyRequest,
  onRequestHookHandler,
} from "fastify";
import type {
  AccessTokenVerifier,
  AuthenticatedIdentity,
} from "../infrastructure/auth/supabase-auth.js";
import { createSupabaseAuthVerifier } from "../infrastructure/auth/supabase-auth.js";

export function extractBearerToken(
  authorization: string | undefined,
): string | null {
  if (!authorization) return null;

  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

function sendUnauthorized(reply: FastifyReply): void {
  void reply.code(401).send({
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required",
      retryable: false,
    },
  });
}

export function createAuthenticationHook(
  verifier?: AccessTokenVerifier,
): onRequestHookHandler {
  const authVerifier = verifier ?? createSupabaseAuthVerifier();

  return async function authenticateRequest(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      sendUnauthorized(reply);
      return;
    }

    try {
      const identity: AuthenticatedIdentity = await authVerifier.verify(token);
      request.setDecorator("authIdentity", identity);
    } catch {
      sendUnauthorized(reply);
    }
  };
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: onRequestHookHandler;
  }

  interface FastifyRequest {
    authIdentity: AuthenticatedIdentity | null;
  }
}
