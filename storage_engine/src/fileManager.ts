import { promises as fs } from "fs";
import { FileHandle } from "fs/promises";
import { LogPointer } from "@index/indexEngine";
import path from "path";

export interface LogEntry {
  service: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class FileManager {
    private shardHandles: Map<string, FileHandle> = new Map();
    private fileHandle!: FileHandle;

    private filePath: string;
    private dataDir: string;
    

    constructor() {
        this.dataDir = path.resolve(__dirname, "../data");
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

    async appendBatch(logs: LogEntry[]) : Promise<LogPointer[]>{
        const shardGroups = new Map<string, LogEntry[]>();

        //group logs by shard
        for(const log of logs) {
            const shardId = this.getShardId(log.timestamp);

            if(!shardGroups.has(shardId)) {
                shardGroups.set(shardId, []);
            }

            shardGroups.get(shardId)!.push(log);
        }

        const pointers: LogPointer[] = [];

        //write per shard
        for (const [shardId, shardLogs] of shardGroups.entries()) {

            const handle = await this.getShardHandle(shardId);

            const stats = await handle.stat();
            let currentOffset = stats.size;

            const lines: string[] = [];

            for(const log of shardLogs) {
                const line = JSON.stringify(log);

                pointers.push({
                    shard: shardId,
                    offset: currentOffset
                });

                lines.push(line);

                currentOffset += Buffer.byteLength(line, "utf8") + 1;
            }

            const data = lines.join("\n") + "\n";

            await handle.appendFile(data);
        }
        return pointers;
    }

    async readLogAt(shard: string, offset: number): Promise<string> {
        const handle = await this.getShardHandle(shard);

        const CHUNK_SIZE = 1024;
        let position = offset;
        let logLine = "";

        const buffer = Buffer.alloc(CHUNK_SIZE);

        while(true) {
            const { bytesRead } = await handle.read(
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

    getFilePath() {
        return this.filePath;
    }

    private getShardId(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toISOString().slice(0, 10); //YYYY-MM-DD
    }

    private async getShardHandle(shardId: string): Promise<FileHandle> {
        if (this.shardHandles.has(shardId)) {
            return this.shardHandles.get(shardId)!; //! = non null assertion operator: you promise typescript that it will be defined later.
        }

        const filePath = `${this.dataDir}/${shardId}.log`;

        //ensure directory exists
        await fs.mkdir(this.dataDir, { recursive: true });

        //open file (will create if doesn't exist)
        const handle = await fs.open(filePath, "a+");
        
        this.shardHandles.set(shardId, handle);

        return handle;
    }
}