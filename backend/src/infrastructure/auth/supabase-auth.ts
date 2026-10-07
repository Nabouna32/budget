import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface AuthenticatedIdentity {
  userId: string;
  sessionId?: string;
}

export interface AccessTokenVerifier {
  verify(accessToken: string): Promise<AuthenticatedIdentity>;
}

interface SupabaseAuthConfig {
  url: string;
  publishableKey: string;
}

function requireConfigValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function createSupabaseAuthVerifier(
  config: Partial<SupabaseAuthConfig> = {},
): AccessTokenVerifier {
  const url = requireConfigValue(
    "SUPABASE_URL",
    config.url ?? process.env.SUPABASE_URL,
  );
  const publishableKey = requireConfigValue(
    "SUPABASE_PUBLISHABLE_KEY",
    config.publishableKey ?? process.env.SUPABASE_PUBLISHABLE_KEY,
  );

  const client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return createAccessTokenVerifier(client);
}

export function createAccessTokenVerifier(
  client: Pick<SupabaseClient, "auth">,
): AccessTokenVerifier {
  return {
    async verify(accessToken: string): Promise<AuthenticatedIdentity> {
      const { data, error } = await client.auth.getClaims(accessToken);
      const userId = data?.claims?.sub;

      if (error || typeof userId !== "string" || userId.length === 0) {
        throw new Error("Invalid access token");
      }

      const sessionId = data.claims.session_id;

      return {
        userId,
        ...(typeof sessionId === "string" && sessionId.length > 0
          ? { sessionId }
          : {}),
      };
    },
  };
}
