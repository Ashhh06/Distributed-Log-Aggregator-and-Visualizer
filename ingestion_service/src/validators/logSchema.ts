import { FastifySchema } from "fastify";

export const logSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["service", "level", "message", "timestamp"],
    properties: {
      service: {
        type: "string",
        minLength: 1,
      },
      level: {
        type: "string",
        enum: ["INFO", "WARN", "ERROR", "DEBUG"],
      },
      message: {
        type: "string",
        minLength: 1,
      },
      timestamp: {
        type: "number",
      },
      metadata: {
        type: "object",
        additionalProperties: true,
        nullable: true,
      },
    },
    additionalProperties: false,
  },
};