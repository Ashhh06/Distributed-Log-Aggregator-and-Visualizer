import { FastifyInstance } from "fastify";
import { logSchema } from "../validators/logSchema";
import { LogEntry } from "../queue/logQueue";

export async function logRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/logs",
        { schema: logSchema },
        async (request, reply) => {
            const log = request.body as LogEntry;

            const queue = fastify.logQueue;

            try {
                queue.enqueue(log);
                return reply.status(202).send({ status: "queued" });
            } catch (err : any) {
                if(err.message === "QUEUE_FULL") {
                    return reply.status(429).send({ error: "Queue is full" });
                }
                throw err;
            }
        }
    )
}