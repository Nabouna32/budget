# Budget backend

V1 backend skeleton for the Budget application.

## Stack

- TypeScript
- Fastify
- Node.js 24.x

## Current scope

This skeleton intentionally contains only:

- Fastify application creation;
- a GET /health endpoint;
- a minimal server entry point;
- a first executable HTTP test.

Business APIs, Supabase authentication and synchronization are not implemented in this step. PostgreSQL runtime access is initialized with `pg` and remains limited to connection infrastructure; no business query is implemented yet. Supabase migration tooling is initialized at repository root.

## Local development

From this directory:

    npm install
    npm run dev

Run the checks with:

    npm test
    npm run build

## PostgreSQL runtime

Set `DATABASE_URL` to the server-side PostgreSQL connection string. For Vercel, use the Supabase **Transaction Pooler** connection string. The application pool is limited to one connection per instance.

Never put this value in source control, Android configuration or client-visible environment variables.
