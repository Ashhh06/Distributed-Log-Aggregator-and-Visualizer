import Fastify from 'fastify';
import { logRoutes } from './routes/logRoutes';
import { LogQueue } from "./queue/logQueue";
import { startLogWorker } from "./worker/logWorker";

import { FileManager } from "@storage/fileManager";

const fastify = Fastify({
    logger: true
});

const logQueue = new LogQueue(30000);
fastify.decorate("logQueue", logQueue);


fastify.register(logRoutes);

fastify.get("/health", async () => {
    return { status: "ok" };
});

const start = async () => {
    try {   
        const fileManager = new FileManager();
        await fileManager.init();

        startLogWorker(logQueue, fileManager);

        await fastify.listen({ port : 3000 });
        console.log("Ingestion service is running on port 3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();