import { LogEntry } from "@storage/fileManager";

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
            this.timeIndex.push({
                timestamp: log.timestamp,
                offset: offset,
            });
        }
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
}