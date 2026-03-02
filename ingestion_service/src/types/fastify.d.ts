import { LogQueue } from "../queue/logQueue";

declare module "fastify" {
  interface FastifyInstance {
    logQueue: LogQueue;
  }
}