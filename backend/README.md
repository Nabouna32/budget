# Budget backend

V1 backend skeleton for the Budget application.

## Stack

- TypeScript
- Fastify
- Node.js 24.x

## Current scope

This backend currently contains:

- Fastify application creation;
- a GET /health endpoint;
- a minimal server entry point;
- Supabase Auth JWT verification infrastructure;
- an authentication hook for protected routes;
- executable authentication tests.

Business APIs and synchronization are not implemented yet. PostgreSQL runtime access is initialized with `pg` and remains limited to connection infrastructure; no business query is implemented yet. Supabase migration tooling is initialized at repository root.

## Local development

From this directory:

    npm ci
    npm run dev

Run the checks with:

    npm test
    npm run build

## PostgreSQL runtime

Set `DATABASE_URL` to the server-side PostgreSQL connection string. For Vercel, use the Supabase **Transaction Pooler** connection string. The application pool is limited to one connection per instance.

Never put this value in source control, Android configuration or client-visible environment variables.

## Supabase Auth

The backend requires:

- `SUPABASE_URL`;
- `SUPABASE_PUBLISHABLE_KEY`.

Protected routes use the Fastify authentication hook, which verifies the incoming `Authorization: Bearer <JWT>` token with Supabase Auth. The backend does not persist or refresh the client session and does not use a `service_role` key.

Session lifetime, renewal, revocation and logout semantics remain open and are tracked by GitHub Issue #15.
