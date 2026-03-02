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
        this.fileHandle = await fs.open(this.filePath, 'a+');
        console.log("Storage initialized at:", this.filePath);
    }

    async appendBatch(logs: LogEntry[]) {
        if(!this.fileHandle) {
            throw new Error("Storage not initialized");
        }

        //get current file size
        const stats = await this.fileHandle.stat();
        let currentOffset = stats.size;

        const offsets: number[] = [];
        const lines: string[] = [];

        for (const log of logs) {
            const line = JSON.stringify(log);
            offsets.push(currentOffset);
            lines.push(line);

            //+1 for newline character
            currentOffset += Buffer.byteLength(line, "utf8") + 1;
        }

        const data = lines.join("\n") + "\n";

        await this.fileHandle.appendFile(data);
        return offsets;
    }

    async readLogAt(offset: number): Promise<string> {
        if(!this.fileHandle) {
            throw new Error("Storage not initialized");
        }

        const CHUNK_SIZE = 1024;
        let position = offset;
        let logLine = "";

        const buffer = Buffer.alloc(CHUNK_SIZE);

        while(true) {
            const { bytesRead } = await this.fileHandle.read(
                buffer,
                0,
                CHUNK_SIZE,
                position
            );

            if(bytesRead === 0) break;

            const chunk = buffer.slice(0, bytesRead).toString("utf8");
            const newLineIndex = chunk.indexOf("\n");

            if(newLineIndex !== -1) {
                logLine += chunk.slice(0, newLineIndex);
                break;
            }

            logLine += chunk;
            position += bytesRead;
        }
        return logLine;
    }
}