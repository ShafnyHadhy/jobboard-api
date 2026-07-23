# System Design: Scaling to 100k Users

This document outlines the architectural decisions made in the Job Board API and how the system would evolve to handle 100,000 active concurrent users.

## 1. Current Architecture (MVP)

The current system uses a monolithic Node.js/Express API, a single PostgreSQL instance, and a single Redis instance.

- **Compute:** Node.js (Express) containerized via Docker.
- **Database:** PostgreSQL 16 relational database.
- **Cache / Rate Limiting:** Redis 7.
- **Auth:** Stateless JWTs.

### Why these choices?
- **PostgreSQL:** Job boards are heavily relational (Users → Companies → Jobs → Applications). ACID compliance ensures applications aren't lost or duplicated (enforced via `@@unique([jobId, userId])`).
- **Redis:** Provides fast, atomic operations for rate limiting (`INCR`) and cache-aside storage for the read-heavy job feed.
- **JWTs:** Stateless authentication means we don't need session lookups on every request, saving DB cycles.

---

## 2. Scaling Bottlenecks & Solutions

To handle 100k users, the current MVP would encounter several bottlenecks. Here is the roadmap to resolve them:

### Bottleneck 1: Database Read Load (The Job Feed)
Job boards have a read-to-write ratio of roughly 100:1. Thousands of users searching jobs will overwhelm a single Postgres instance.

**Solution: Read Replicas & Aggressive Caching**
- Implement PostgreSQL Read Replicas. All write operations (POST/PATCH/DELETE) go to the Primary DB. All read operations (GET) go to the Replicas.
- Keep the current Redis cache-aside pattern, but increase TTL and use Redis Clusters for high availability.

### Bottleneck 2: Search Performance
The current GIN index full-text search works well up to a few million rows, but complex faceted searches (filtering by location, salary bands, tags) will slow down.

**Solution: Elasticsearch / OpenSearch**
- Move the core search functionality out of Postgres.
- Implement a message queue (e.g., RabbitMQ or Kafka). When a job is created/updated, publish an event. A worker consumes the event and indexes the job document in Elasticsearch.
- The `GET /api/jobs` endpoint queries Elasticsearch instead of Postgres.

### Bottleneck 3: API Node Limits (Compute)
Node.js is single-threaded. CPU-intensive tasks (like bcrypt password hashing) can block the event loop, causing request queuing.

**Solution: Horizontal Scaling**
- Run multiple API instances behind a load balancer (e.g., Nginx or AWS ALB).
- Because our auth (JWT) and rate limiting (Redis) are already stateless, adding more API nodes requires zero code changes.

### Bottleneck 4: Background Processing
Currently, tasks like sending notification emails (when an application status changes) would happen synchronously in the HTTP request cycle, delaying the response to the user.

**Solution: Asynchronous Workers**
- Decouple slow tasks. When an employer updates an application to `ACCEPTED`, push a task to a Redis Queue (using a library like BullMQ).
- Separate Worker services process the queue and send emails via SendGrid/SES. The HTTP response is returned immediately.

---

## 3. Database Scaling (Sharding)

If the database size exceeds what a single primary node can hold:
- We would likely shard based on `TenantID` (Company). Since employers only access their own jobs and applicants, grouping all data for a specific company onto the same physical shard prevents cross-shard JOINs.
- Cross-company operations (like the global job feed) would be served entirely from Elasticsearch, isolating the transactional Postgres DB from heavy analytical reads.