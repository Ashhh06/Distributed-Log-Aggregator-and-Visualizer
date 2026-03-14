import { FileManager } from "@storage/fileManager";
import { IndexEngine } from "@index/indexEngine";
import { LogPointer } from "@index/indexEngine";

export interface LogQuery {
  service?: string;
  level?: "INFO" | "WARN" | "ERROR" | "DEBUG";
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export class QueryEngine {
    constructor(
        private fileManager: FileManager,
        private indexEngine: IndexEngine
    ) {}

    async execute(query: LogQuery) {
        const limit = Math.min(query.limit ?? 100, 1000); //enforce max limit of 1000
        let candidateOffsets: Set<LogPointer> | null = null;

        //service filter
        if (query.service) {
            const serviceSet = this.indexEngine.getServiceOffsets(query.service);
            if(!serviceSet) return []; //no logs for this service
            candidateOffsets = new Set(serviceSet);
        }

        //level filter
        if (query.level) {
            const levelSet = this.indexEngine.getLevelOffsets(query.level);
            if (!levelSet) return []; //no logs for this level

            if (!candidateOffsets) {
                candidateOffsets = new Set(levelSet);
            } else {
                candidateOffsets = this.intersect(
                    candidateOffsets,
                    levelSet
                );
            }
        }

        //if no filters provided, return empty for now (could be dangerous to return everything)
        // if (!candidateOffsets) return []; //modified now.

        //time-only query
        if(!candidateOffsets) {
            if(query.startTime !== undefined || query.endTime != undefined) {
                candidateOffsets = this.indexEngine.getOffsetByTimeRange(
                    query.startTime,
                    query.endTime
                );
            } else {
                //return recent logs if no filters
                candidateOffsets = new Set(
                    this.indexEngine.getTimeEntries()
                    .slice(-100)
                    .map(entry => entry.pointer)
                );
            }
        }

        const results = [];

        let count = 0;

        for(const pointer of candidateOffsets) {
            if(count >= limit) break;

            const logLine = await this.fileManager.readLogAt(pointer.shard, pointer.offset);
            
            if(!logLine || !logLine.trim()) {
                continue; //skip empty lines
            }
            const log = JSON.parse(logLine);

            //time filtering
            if(
                (query.startTime !== undefined &&
                    log.timestamp < query.startTime) ||
                (query.endTime !== undefined &&
                    log.timestamp > query.endTime) 
            ) {
                continue;
            }
            results.push(log);
            count++;
        }
        return results;
    }

    private intersect(setA: Set<LogPointer>, setB: Set<LogPointer>): Set<LogPointer> {
        const result = new Set<LogPointer>();

        const map = new Map<string, LogPointer>();

        for(const p of setA) {
            map.set(`${p.shard}:${p.offset}`, p);
        }

        for(const p of setB) {
            const key = `${p.shard}:${p.offset}`;
            if(map.has(key)) {
                result.add(p);
            }
        }
        return result;
    }
}