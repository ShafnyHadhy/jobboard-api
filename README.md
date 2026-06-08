# JobBoard API

A production-ready Job Board SaaS REST API built to demonstrate core backend engineering concepts - authentication, caching, rate limiting, database indexing, structured logging, and containerization - all working together in a single, real-world application.

---

## Overview

JobBoard API is a multi-role platform where **employers** post jobs and manage applicants, and **jobseekers** browse listings and track their applications. The project is intentionally backend-focused, with every architectural decision made to reflect how APIs are built and maintained at product companies.

Built while working as an Associate Software Engineer to deepen backend fundamentals beyond day-to-day fullstack work.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Cache | Redis 7 |
| Auth | JWT + Google OAuth 2.0 |
| Containerization | Docker + Docker Compose |
| Frontend | React (minimal — job feed + apply flow) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Client                      │
│         (React / Postman / curl)             │
└───────────────────┬─────────────────────────┘
                    │ HTTP
┌───────────────────▼─────────────────────────┐
│              Express API                     │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │   Auth   │ │   Jobs   │ │Applications │  │
│  │ middleware│ │ routes  │ │   routes    │  │
│  └──────────┘ └──────────┘ └─────────────┘  │
│  ┌──────────────────────────────────────┐    │
│  │         Rate limiter + Logger        │    │
│  └──────────────────────────────────────┘    │
└───────┬──────────────────────┬───────────────┘
        │                      │
┌───────▼──────┐      ┌────────▼───────┐
│  PostgreSQL  │      │     Redis      │
│  (primary    │      │  (job listing  │
│   data store)│      │   cache)       │
└──────────────┘      └────────────────┘
```

---

## Core Features

### Authentication
- Email/password registration and login with `bcryptjs` password hashing
- JWT-based stateless authentication - no session table, scales across instances
- Google OAuth 2.0 login flow - authorization code exchange, issues own JWT at the end
- Role-based access control - `EMPLOYER` and `JOBSEEKER` roles enforced at middleware level

### Job Management
- Employers create, update, and close job listings under their company profile
- Public job feed with pagination - no auth required to browse
- Full-text job search across title and description using PostgreSQL `tsvector`
- Composite indexes on `(status, createdAt)` and `(companyId, status)` for fast filtered queries

### Applications
- Jobseekers apply to open jobs with a cover letter
- Unique constraint at the database level prevents duplicate applications
- Employers view all applicants for their jobs and update application status
- Status transitions: `PENDING → REVIEWED → ACCEPTED / REJECTED`

### Caching
- `GET /api/jobs` responses cached in Redis with a 5-minute TTL (cache-aside pattern)
- Cache invalidated automatically when a new job is posted or an existing one is updated
- Per-route cache keys scoped by query parameters (location, type, page)

### Rate Limiting
- Auth routes (`/register`, `/login`): 10 requests per 15 minutes per IP - brute force protection
- Application submission: 5 applications per hour per user - prevents spam applying
- Returns `429 Too Many Requests` with a `Retry-After` header

### Logging
- Structured JSON logs on every request - method, path, status, duration, userId
- Application lifecycle events logged as audit trail - `job_applied`, `status_changed`, `employer_viewed`
- Error logs include stack trace and request context for debugging

---

## API Endpoints

### Auth
```
POST   /api/auth/register              Register with email + password
POST   /api/auth/login                 Login, returns signed JWT
GET    /api/auth/google                Redirect to Google OAuth consent
GET    /api/auth/google/callback       OAuth callback, issues JWT
```

### Jobs
```
GET    /api/jobs                       Public job feed (paginated, cached)
GET    /api/jobs/:id                   Single job detail
POST   /api/jobs                       Create job (EMPLOYER only)
PATCH  /api/jobs/:id                   Update job (EMPLOYER, owner only)
DELETE /api/jobs/:id                   Close job (EMPLOYER, owner only)
```

### Companies
```
POST   /api/companies                  Create company profile (EMPLOYER only)
GET    /api/companies/:id              Public company profile
PATCH  /api/companies/:id             Update company (EMPLOYER, owner only)
```

### Applications
```
POST   /api/applications/:jobId        Apply to a job (JOBSEEKER, rate limited)
GET    /api/applications/my            My applications (JOBSEEKER)
GET    /api/jobs/:jobId/applications   View applicants (EMPLOYER, owner only)
PATCH  /api/applications/:id/status    Update application status (EMPLOYER)
```

---

## Database Schema

```
USER ──────────────── COMPANY
 │  (one employer      │
 │   owns one company) │
 │                     └──── JOB
 │                            │
 └──── APPLICATION ───────────┘
        (unique on jobId + userId)

USER ──── NOTIFICATION
```

**Key design decisions:**
- `role` enum on `USER` (`EMPLOYER | JOBSEEKER`) is the single source of truth for permissions - no separate roles table
- `salary` on `Job` is nullable - reflects real-world listings that don't disclose compensation
- `Application` has a unique constraint on `(jobId, userId)` - enforced at DB level, not just application layer
- `Job.status` (`OPEN | CLOSED`) allows soft-closing without data loss

---

## Getting Started

### Prerequisites
- Docker Desktop
- Node.js 18+ (via nvm recommended)

### Run locally

```bash
# Clone the repo
git clone https://github.com/yourusername/jobboard-api.git
cd jobboard-api

# Start PostgreSQL and Redis
docker compose up -d

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in JWT_SECRET and GOOGLE_CLIENT credentials in .env

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

Server runs at `http://localhost:3000`

Health check: `GET /health` → `{ "status": "ok" }`

### Environment variables

```env
DATABASE_URL=postgresql://postgres:secret@localhost:5432/jobboard
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PORT=3000
```

---

## Project Structure

```
jobboard-api/
├── prisma/
│   ├── schema.prisma          # Database models and relations
│   └── migrations/            # Migration history
├── src/
│   ├── config/
│   │   ├── db.js              # Prisma client singleton
│   │   └── redis.js           # Redis client (ioredis)
│   ├── middleware/
│   │   ├── auth.js            # JWT verification, role guard
│   │   ├── rateLimiter.js     # Route-specific rate limits
│   │   └── logger.js          # Structured request logging
│   ├── routes/
│   │   ├── auth.js
│   │   ├── jobs.js
│   │   ├── companies.js
│   │   └── applications.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── jobs.controller.js
│   │   ├── companies.controller.js
│   │   └── applications.controller.js
│   └── app.js
├── docker-compose.yml
├── .env.example
└── SYSTEM_DESIGN.md           # Scale analysis and architectural decisions
```

---

## What I Learned

This project was built specifically to gain hands-on experience with backend concepts beyond typical CRUD development:

- **Stateless auth at scale** — understanding why JWTs don't require a session lookup, and the tradeoff with token revocation
- **Cache invalidation strategy** — implementing cache-aside correctly so stale data never leaks to users
- **Database indexing in practice** — observing query plans before and after adding composite indexes on the jobs table
- **Rate limiting design** — choosing different limits per route based on business risk, not just a blanket global limit
- **Structured logging** — the difference between `console.log` and logs that are actually queryable in production
- **Docker Compose** — making the entire stack portable so any engineer can run it in under a minute

---

## Roadmap

- [ ] Email notifications via Resend when application status changes
- [ ] Job search with filters (location, type, salary range)
- [ ] Employer analytics dashboard (views per listing, application funnel)
- [ ] Webhook support for ATS integrations
- [ ] Kubernetes deployment manifests

---

## License

MIT