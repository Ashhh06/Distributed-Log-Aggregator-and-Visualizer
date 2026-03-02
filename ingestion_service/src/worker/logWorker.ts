import { LogQueue, LogEntry } from "../queue/logQueue";
import { FileManager } from "@storage/fileManager";

const BATCH_SIZE = 500;
const IDLE_SLEEP_MS = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startLogWorker(
  queue: LogQueue,
  fileManager: FileManager
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

        await fileManager.appendBatch(batch);

        console.log(
          `Persisted batch of ${batch.length} logs. Queue size now: ${queue.size()}`
        );
      } catch (err) {
        console.error("Worker error:", err);
      }
    }
  })();
}