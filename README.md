# Distributed Log Aggregator and Visualizer

A horizontally scalable log ingestion, indexing, and query system inspired by modern observability platforms like Elasticsearch and Grafana Loki.

## Features Implemented

### 🔹 Ingestion Layer
- Fastify-based HTTP ingestion API
- Strict JSON schema validation
- Asynchronous producer-consumer architecture
- Bounded in-memory queue (backpressure control)
- HTTP 429 on overload

### 🔹 Storage Engine
- Append-only log storage (JSONL format)
- Batch writes for disk efficiency
- Byte-offset tracking for each log
- Random-access read using file offsets
- Read + append file descriptor mode (`a+`)

### 🔹 Indexing Engine
- In-memory inverted index:
  - `service → Set<byteOffset>`
  - `level → Set<byteOffset>`
- Time index for timestamp-based filtering
- Offset-based retrieval (no log duplication in memory)

### 🔹 Query Engine
Supports structured queries:

```json
{
  "service": "auth",
  "level": "ERROR",
  "startTime": 1719990000,
  "endTime": 1720000000
}



### Query execution strategy:

1. Fetch candidate offset sets

2. Intersect smallest sets first

3. Read matching logs using byte-offset

4. Apply time filtering

5. Return parsed JSON logs


### Architechture Overview

Client
   ↓
Ingestion API (Fastify)
   ↓
Bounded Queue (Backpressure)
   ↓
Async Worker
   ↓
Storage Engine (Append-only JSONL)
   ↓
Index Engine (In-memory offset maps)
   ↓
Query Engine
   ↓
Response


### Tech Stack

Node.js (TypeScript)

Fastify

Custom in-memory queue

Custom append-only storage engine

Byte-offset indexing

Monorepo with TypeScript path aliases



🔍 Key Engineering Decisions

1. Append-Only Storage

Logs are immutable and high-write volume.
Append-only ensures:

Sequential disk writes

High throughput

Simpler recovery

2. Byte Offset Indexing

Instead of storing logs in memory:

Index stores byte offsets

Logs remain on disk

Enables O(1) file seek

3. Bounded Queue + Backpressure

Prevents memory explosion under high load.
Returns HTTP 429 when queue is full.

4. Batch Processing

Worker processes logs in batches for:

Fewer disk syscalls

Higher throughput

Reduced I/O overhead

5. Set-Based Inverted Index

Uses Set<number> for offset tracking to:

Avoid duplicates

Ensure correctness

Simplify intersection logic




📊 Current Capabilities

Insert logs via HTTP

Persist logs to disk

Build in-memory inverted index

Execute structured queries

Random-access read from file




⚠️ Current Limitations

Index is in-memory only (lost on restart)

No sharding yet

No replication yet

No full-text search

Time index not optimized (linear scan)





🛠️ Next Phases

Sorted time index with binary search

Sharding (time-based partitioning)

Index persistence & recovery

Replication (leader-follower simulation)

Load testing & benchmarking

Dashboard visualization