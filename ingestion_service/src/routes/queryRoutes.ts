import { FastifyInstance } from "fastify";
import { QueryEngine } from "@query/queryEngine";

export async function queryRoutes(
    fastify: FastifyInstance
) {
    fastify.post("/query", async (request, reply) => {
        const queryEngine = fastify.queryEngine as QueryEngine;

        const results = await queryEngine.execute(request.body as any);

        return reply.send(results);
    })
}