import { FileManager } from "@storage/fileManager";
import { IndexEngine } from "@index/indexEngine";

export interface LogQuery {
  service?: string;
  level?: "INFO" | "WARN" | "ERROR" | "DEBUG";
  startTime?: number;
  endTime?: number;
}

export class QueryEngine {
    constructor(
        private fileManager: FileManager,
        private indexEngine: IndexEngine
    ) {}

    async execute(query: LogQuery) {
        let candidateOffsets: Set<number> | null = null;

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
        if (!candidateOffsets) return [];

        const results = [];

        for(const offset of candidateOffsets) {
            const logLine = await this.fileManager.readLogAt(offset);
            const log = JSON.parse(logLine);

            //time filtering
            if(
                (query.startTime &&
                    log.timestamp < query.startTime) ||
                (query.endTime &&
                    log.timestamp > query.endTime) 
            ) {
                continue;
            }
            results.push(log);
        }
        return results;
    }

    private intersect(setA: Set<number>, setB: Set<number>): Set<number> {
        const smaller = setA.size < setB.size ? setA : setB;
        const larger = setA.size < setB.size ? setB : setA;

        const result = new Set<number>();

        for(const value of smaller) {
            if(larger.has(value)) {
                result.add(value);
            }
        }
        return result;
    }
}