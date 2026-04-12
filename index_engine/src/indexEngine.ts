import { LogEntry } from "../../storage_engine/src/fileManager";
import { FileManager } from "../../storage_engine/src/fileManager";

export type LogPointer = {
    shard: string;
    offset: number;
}

export class IndexEngine {
    private serviceIndex: Map<string, Set<LogPointer>> = new Map();
    private levelIndex: Map<string, Set<LogPointer>> = new Map();
    private timeIndex: Array<{ timestamp: number; pointer: LogPointer }> = [];

    addBatch(logs: LogEntry[], pointers: LogPointer[]) {
        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const pointer = pointers[i];

            //index by service
            if (!this.serviceIndex.has(log.service)) {
                this.serviceIndex.set(log.service, new Set());
            }
            this.serviceIndex.get(log.service)!.add(pointer);

            //index by level
            if (!this.levelIndex.has(log.level)) {
                this.levelIndex.set(log.level, new Set());
            }
            this.levelIndex.get(log.level)!.add(pointer);

            //index by time
            this.insertTimeEntry(log.timestamp, pointer);
        }
    }

    //sorted insert method
    private insertTimeEntry(timestamp: number, pointer: LogPointer) {
        const len = this.timeIndex.length;

        //fast path - append if sorted
        if (len === 0 || timestamp >= this.timeIndex[len - 1].timestamp) {
            this.timeIndex.push({ timestamp, pointer });
            return;
        }

        //binary search for insertion point
        let left = 0;
        let right = len - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);

            if (this.timeIndex[mid].timestamp === timestamp) {
                left = mid;
                break;
            }

            if (this.timeIndex[mid].timestamp < timestamp) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        this.timeIndex.splice(left, 0, { timestamp, pointer });
    }

    //For debugging
    printStats() {
        console.log("Service Index Keys:", [...this.serviceIndex.keys()]);
        console.log("Level Index Keys:", [...this.levelIndex.keys()]);
        console.log("Total Time Index Entries:", this.timeIndex.length);
    }

    getServiceOffsets(service: string): Set<LogPointer> | null {
        return this.serviceIndex.get(service) || null;
    }

    getLevelOffsets(level: string): Set<LogPointer> | null {
        return this.levelIndex.get(level) || null;
    }

    getTimeEntries() {
        return this.timeIndex;
    }

    getOffsetByTimeRange(startTime?: number, endTime?: number): Set<LogPointer> {
        if (startTime === undefined && endTime === undefined) {
            return new Set();
        }

        const result = new Set<LogPointer>();
        const n = this.timeIndex.length;

        if (n === 0) return result;

        //find lower bound
        let left = 0;
        let right = n - 1;
        let startIndex = 0;

        if (startTime !== undefined) {
            while (left <= right) {
                const mid = Math.floor((left + right) / 2);

                if (this.timeIndex[mid].timestamp < startTime) {
                    left = mid + 1;
                } else {
                    startIndex = mid;
                    right = mid - 1;
                }
            }
        }

        //collect until endTime
        for (let i = startIndex; i < n; i++) {
            const entry = this.timeIndex[i];

            if (endTime !== undefined && entry.timestamp > endTime) {
                break;
            }

            if (
                (startTime === undefined || entry.timestamp >= startTime) &&
                (endTime === undefined || entry.timestamp <= endTime)
            ) {
                result.add(entry.pointer);
            }
        }
        return result;
    }

    async rebuildFromFile(fileManager: FileManager) {
        const fs = await import("fs");
        const path = await import("path");
        const readline = await import("readline");

        const dataDir = path.resolve(__dirname, "../../storage_engine/data");

        if (!fs.existsSync(dataDir)) {
            console.log("No data directory found. Skipping rebuild.");
            return;
        }

        console.log("Rebuilding index from shard files...");

        const files = fs.readdirSync(dataDir);

        for (const file of files) {
            if (!file.endsWith(".log")) continue;

            const shardId = file.replace(".log", "");
            const filePath = path.join(dataDir, file);

            console.log(`Processing shard: ${file}`);

            const stream = fs.createReadStream(filePath, { encoding: "utf8" });

            const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity,
            });

            let offset = 0;

            for await (const line of rl) {
                if (!line.trim()) {
                    offset += 1;
                    continue;
                }

                try {
                    const log = JSON.parse(line);

                    this.addBatch([log], [{
                        shard: shardId,
                        offset: offset
                    }]);

                    offset += Buffer.byteLength(line, "utf8") + 1;
                } catch (err) {
                    console.error("Error parsing line:", err);
                }
            }
        }

        console.log("Rebuild complete.");
        this.printStats();
    }
}