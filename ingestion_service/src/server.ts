import Fastify from 'fastify';
import { logRoutes } from './routes/logRoutes';
import { queryRoutes } from "./routes/queryRoutes";
import { LogQueue } from "./queue/logQueue";
import { startLogWorker } from "./worker/logWorker";


import { FileManager } from "@storage/fileManager";
import { IndexEngine } from "@index/indexEngine";
import { QueryEngine } from "@query/queryEngine";

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

        const indexEngine = new IndexEngine();

        const queryEngine = new QueryEngine(
            fileManager,
            indexEngine
        );

        fastify.decorate("queryEngine", queryEngine);
        fastify.register(queryRoutes);

        startLogWorker(logQueue, fileManager, indexEngine);

        await fastify.listen({ port : 3000 });
        console.log("Ingestion service is running on port 3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();