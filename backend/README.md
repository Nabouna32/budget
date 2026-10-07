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

Business APIs, Supabase authentication, PostgreSQL access and synchronization are not implemented in this step.

## Local development

From this directory:

    npm install
    npm run dev

Run the checks with:

    npm test
    npm run build
