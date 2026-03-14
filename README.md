# Distributed Log Aggregator & Visualizer

A **mini observability platform** that ingests, stores, indexes, and visualizes logs from multiple services in real time.
The system demonstrates how modern log platforms (like **ELK Stack** or **Grafana Loki**) process and query logs efficiently.

This project implements a **complete end-to-end pipeline**:

```
Services → Ingestion API → Queue → Worker → Sharded Storage → Index Engine → Query Engine → React Dashboard
```

---

# Features

### Log Ingestion

* HTTP API for ingesting logs (`POST /logs`)
* High-throughput ingestion using an **in-memory queue**
* Asynchronous **worker-based batch processing**

### Storage Engine

* **Append-only JSONL log storage**
* **Time-based sharding** (`YYYY-MM-DD.log`)
* Efficient **byte-offset reads** for fast log retrieval

### Indexing Engine

* In-memory **inverted index**
* Indexed by:

  * service
  * log level
  * timestamp
* **Binary search** for fast time-range queries

### Query Engine

Supports queries by:

* service
* log level
* time range

Example:

```json
{
  "service": "auth",
  "level": "ERROR"
}
```

Returns matching logs using index lookups instead of scanning files.

### Visualization Dashboard

* Built with **React + Vite**
* Displays logs in a table
* Filter logs by:

  * service
  * level
* Color-coded severity levels

```
INFO  → green
WARN  → yellow
ERROR → red
DEBUG → gray
```

### Log Simulation

Simulated services generate logs continuously:

* auth service
* payment service

This creates a **live log stream** for testing the dashboard.

---

# Architecture

```
              +-------------------+
              |   React Dashboard |
              +---------+---------+
                        |
                        | POST /query
                        |
                +-------v--------+
                | Fastify API    |
                | (Ingestion)    |
                +-------+--------+
                        |
                        v
                 +------+------+
                 | Log Queue   |
                 | (In-memory) |
                 +------+------+
                        |
                        v
                 +------+------+
                 | Worker      |
                 | Batch write |
                 +------+------+
                        |
                        v
           +--------------------------+
           | Storage Engine           |
           | Sharded JSONL files      |
           | YYYY-MM-DD.log           |
           +-----------+--------------+
                       |
                       v
                +------+------+
                | Index Engine |
                | service      |
                | level        |
                | time         |
                +------+------+
                       |
                       v
                +------+------+
                | Query Engine |
                +-------------+
```

---

# Project Structure

```
log_system
│
├── ingestion_service
│   ├── routes
│   │   ├── logRoutes.ts
│   │   └── queryRoutes.ts
│   ├── queue
│   │   └── logQueue.ts
│   ├── worker
│   │   └── logWorker.ts
│   └── server.ts
│
├── storage_engine
│   └── fileManager.ts
│
├── index_engine
│   └── indexEngine.ts
│
├── query_engine
│   └── queryEngine.ts
│
├── dashboard
│   ├── src
│   │   └── App.tsx
│   └── vite.config.ts
│
└── simulators
    ├── auth-service.ts
    └── payment-service.ts
```

---

# Installation

Clone the repository:

```
git clone <your-repo-url>
cd log_system
```

Install dependencies for backend:

```
npm install
```

Install dashboard dependencies:

```
cd dashboard
npm install
```

---

# Running the System

### Start Backend

```
cd ingestion_service
npm run dev
```

Backend runs on:

```
http://localhost:3000
```

---

### Start Dashboard

```
cd dashboard
npm run dev
```

Open:

```
http://localhost:5173
```

---

### Run Log Simulators

Open new terminals:

```
cd simulators
npx ts-node auth-service.ts
```

```
cd simulators
npx ts-node payment-service.ts
```

Logs will now stream into the system.

---

# API

## Ingest Log

```
POST /logs
```

Example:

```json
{
  "service": "auth",
  "level": "INFO",
  "message": "user login",
  "timestamp": 1709856000000
}
```

---

## Query Logs

```
POST /query
```

Example queries:

### Query by service

```json
{
  "service": "auth"
}
```

### Query by level

```json
{
  "level": "ERROR"
}
```

### Query by time range

```json
{
  "startTime": 1709856000000,
  "endTime": 1710000000000
}
```

---

# Example Log File

Logs are stored as **JSON lines**:

```
2024-03-08.log

{"service":"auth","level":"INFO","message":"login","timestamp":1709856000000}
{"service":"payment","level":"ERROR","message":"payment failed","timestamp":1709856012000}
```

---

# Technologies Used

Backend

* Node.js
* TypeScript
* Fastify

Frontend

* React
* Vite

Other Concepts

* Async queues
* Batch processing
* Append-only storage
* Sharded log files
* Inverted indexing
* Binary search time indexing

---

# Learning Outcomes

This project demonstrates:

* Designing **high-throughput log ingestion pipelines**
* Building **custom storage engines**
* Implementing **in-memory indexing**
* Query optimization using **index lookups**
* Building a **full-stack observability tool**

---

# Future Improvements

Potential upgrades:

* pagination for queries
* full-text search
* WebSocket live log streaming
* distributed ingestion nodes
* persistent index snapshots
* advanced dashboard analytics

---

# Author - Akshad

Built as a backend systems project demonstrating log aggregation, indexing, and visualization techniques used in real observability platforms.
