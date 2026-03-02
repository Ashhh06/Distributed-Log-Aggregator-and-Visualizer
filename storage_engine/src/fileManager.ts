import { promises as fs } from "fs";
import path from "path";

export interface LogEntry {
  service: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class FileManager {
    private fileHandle: fs.FileHandle | null = null;
    private filePath: string;

    constructor() {
        this.filePath = path.resolve(
            __dirname,
            "../data/logs.log"
        );
    }

    async init() {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        this.fileHandle = await fs.open(this.filePath, 'a');
        console.log("Storage initialized at:", this.filePath);
    }

    async appendBatch(logs: LogEntry[]) {
        if(!this.fileHandle) {
            throw new Error("Storage not initialized");
        }

        const data = logs.map((log) => JSON.stringify(log)).join('\n') + '\n';

        await this.fileHandle.appendFile(data);
    }
}