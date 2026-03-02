import { LogQueue } from "../queue/logQueue";
import { QueryEngine } from "@query/queryEngine";

declare module "fastify" {
  interface FastifyInstance {
    logQueue: LogQueue;
    queryEngine: QueryEngine;
  }
}