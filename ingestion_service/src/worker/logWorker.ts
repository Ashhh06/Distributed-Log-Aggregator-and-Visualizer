import { IndexEngine } from "@index/indexEngine";
import { LogQueue, LogEntry } from "../queue/logQueue";
import { FileManager } from "@storage/fileManager";

const BATCH_SIZE = 500;
const IDLE_SLEEP_MS = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startLogWorker(
  queue: LogQueue,
  fileManager: FileManager,
  indexEngine: IndexEngine

) {
  console.log("Log worker started...");

  (async function processLoop() {
    while (true) {
      try {
        const batch: LogEntry[] = queue.dequeueBatch(BATCH_SIZE);

        if (batch.length === 0) {
          await sleep(IDLE_SLEEP_MS);
          continue;
        }

        //await fileManager.appendBatch(batch);
        const pointers = await fileManager.appendBatch(batch);
        indexEngine.addBatch(batch, pointers);
        indexEngine.printStats();

        const testLog = await fileManager.readLogAt(pointers[0].shard, pointers[0].offset);
        console.log("Read back:", testLog);

        //next step: pass to index engine
        console.log("Pointers:", pointers); //for now we'll just log them.

        console.log(
          `Persisted batch of ${batch.length} logs. Queue size now: ${queue.size()}`
        );
      } catch (err) {
        console.error("Worker error:", err);
      }
    }
  })();
}