import { LogEntry } from "@storage/fileManager";
import { FileManager } from "@storage/fileManager";
import { time } from "console";
import { start } from "repl";

export class IndexEngine {
    private serviceIndex: Map<string, Set<number>> = new Map();
    private levelIndex: Map<string, Set<number>> = new Map();
    private timeIndex: Array<{ timestamp: number; offset: number }> = [];

    addBatch(logs: LogEntry[], offsets: number[]) {
        for(let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const offset = offsets[i];
            
            //index by service
            if(!this.serviceIndex.has(log.service)) {
                this.serviceIndex.set(log.service, new Set());
            }
            this.serviceIndex.get(log.service)!.add(offset);

            //index by level
            if (!this.levelIndex.has(log.level)) {
                this.levelIndex.set(log.level, new Set());
            }
            this.levelIndex.get(log.level)!.add(offset);

            //index by time
            this.insertTimeEntry(log.timestamp, offset);
        }
    }

    //sorted insert method
    private insertTimeEntry(timestamp: number, offset: number) {
        const len = this.timeIndex.length;

        //fast path - append if sorted
        if(len === 0 || timestamp >= this.timeIndex[len - 1].timestamp) {
            this.timeIndex.push({ timestamp, offset });
            return;
        }

        //binary search for insertion point
        let left = 0;
        let right = len - 1;

        while(left <= right) {
            const mid = Math.floor((left + right) / 2);
            
            if(this.timeIndex[mid].timestamp === timestamp) {
                left = mid;
                break;
            }

            if(this.timeIndex[mid].timestamp < timestamp) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        this.timeIndex.splice(left, 0, { timestamp, offset });
    }

    //For debugging
    printStats() {
        console.log("Service Index Keys:", [...this.serviceIndex.keys()]);
        console.log("Level Index Keys:", [...this.levelIndex.keys()]);
        console.log("Total Time Index Entries:", this.timeIndex.length);
    }

    getServiceOffsets(service: string): Set<number> | null {
        return this.serviceIndex.get(service) || null;
    }

    getLevelOffsets(level: string): Set<number> | null {
        return this.levelIndex.get(level) || null;
    }

    getTimeEntries() {
        return this.timeIndex;
    }

    getOffsetByTimeRange(startTime? : number, endTime?: number) : Set<number> {
        if(startTime === undefined && endTime === undefined) {
            return new Set();
        }

        const result = new Set<number>();
        const n = this.timeIndex.length;

        if(n === 0) return result;

        //find lower bound
        let left = 0;
        let right = n - 1;
        let startIndex = 0;

        if(startTime !== undefined) {
            while(left <= right) {
                const mid = Math.floor((left + right) / 2);

                if(this.timeIndex[mid].timestamp < startTime) {
                    left = mid + 1;
                } else {
                    startIndex = mid;
                    right = mid - 1;
                }
            }
        }

        //collect until endTime
        for(let i = startIndex; i < n; i++) {
            const entry = this.timeIndex[i];

            if(endTime !== undefined && entry.timestamp > endTime) {
                break;
            }

            if(
                (startTime === undefined || entry.timestamp >= startTime) &&
                (endTime === undefined || entry.timestamp <= endTime)
            ) {
                result.add(entry.offset);
            }
        }
        return result;
    }

    async rebuildFromFile(fileManager: FileManager) {
        const filePath = fileManager.getFilePath();

        const fs = await import("fs");
        const readline = await import("readline");

        if(!fs.existsSync(filePath)) {
            console.log("No existing log file. Skipping rebuild.");
            return;
        }

        console.log("Rebuilding index from log file...");

        const stream = fs.createReadStream(filePath, { encoding: "utf8" });

        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });

        let offset = 0;

        for await (const line of rl) {
            if(!line.trim()) {
                offset += 1;
                continue;
            }

            const log = JSON.parse(line);

            this.addBatch([log], [offset]);

            offset += Buffer.byteLength(line, "utf8") + 1; //+1 for newline
        }

        console.log("Rebuild complete.");
        this.printStats();
    }
}