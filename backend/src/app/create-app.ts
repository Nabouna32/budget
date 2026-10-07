import Fastify, { type FastifyInstance } from "fastify";

export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  app.get("/health", async () => ({
    status: "ok",
  }));

  return app;
}
