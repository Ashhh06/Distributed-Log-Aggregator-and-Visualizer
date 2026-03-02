export interface LogEntry {
  service: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class LogQueue {
    private buffer: LogEntry[] = [];
    private readonly maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    enqueue(log: LogEntry): void {
        if (this.buffer.length >= this.maxSize) {
            throw new Error("QUEUE_FULL");
        }
        this.buffer.push(log);
    }

    dequeueBatch(batchSize: number): LogEntry[] {
        if(this.buffer.length === 0) return [];

        const size = Math.min(batchSize, this.buffer.length);
        return this.buffer.splice(0, size); //splice not optimal, we'll latern optimize it by using ring buffer.
    }

    size(): number {
        return this.buffer.length;
    }

    isFull(): boolean {
        return this.buffer.length >= this.maxSize;
    }
}
