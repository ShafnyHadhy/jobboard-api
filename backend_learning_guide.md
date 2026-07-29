# Backend Engineering Study Guide

This guide breaks down the advanced backend concepts you implemented in your Job Board API. Use this as a reference when studying your code or preparing for software engineering interviews. 

---

## 1. Stateless Authentication (JWT)

**Concept:** JSON Web Tokens (JWT) allow us to verify a user's identity without storing their login session in the database.
**Why we used it:** 
- *Tradeoff:* We could have used "Session Cookies" (where the server remembers who is logged in via a database table). However, sessions are hard to scale. If you have 5 backend servers, they all have to check that database. 
- *Benefit:* JWTs are "stateless". The token itself contains the user's ID cryptographically signed. Any server can instantly verify it without querying the database, making your API infinitely scalable.

**Where it happens:**
1. **Login Generation:** When a user logs in, we generate the token.
   [auth.controller.js](file:///D:/Courses/Projects/jobboard/jobboard-api/src/controllers/auth.controller.js)
   ```javascript
   const token = jwt.sign(
       { id: user.id, role: user.role }, // Payload
       process.env.JWT_SECRET,           // Secret Signature
       { expiresIn: '24h' }
   )
   ```
2. **Route Protection (Middleware):** Before a user can create a job, this middleware catches the request, intercepts the token, verifies the signature, and attaches the user to `req.user`.
   [middleware/auth.js](file:///D:/Courses/Projects/jobboard/jobboard-api/src/middleware/auth.js)
   ```javascript
   const verifyToken = (req, res, next) => {
       const token = req.header('Authorization')?.replace('Bearer ', '')
       const decoded = jwt.verify(token, process.env.JWT_SECRET)
       req.user = decoded // Now every route knows exactly who is making the request!
       next()
   }
   ```

---

## 2. Redis Caching

**Concept:** Storing frequently accessed data in a lightning-fast, temporary, in-memory database (RAM) instead of querying the main database (Hard Drive).
**Why we used it:** 
- *Tradeoff:* We could just query PostgreSQL every time a user visits the homepage. But if 10,000 users visit at once, the database will crash from CPU overload.
- *Benefit:* By caching the `/api/jobs` feed, Redis answers the 10,000 requests in milliseconds. We only hit the database when a *new* job is posted (which invalidates/clears the cache).

**Where it happens:**
1. **Cache Interception:** We wrap the `getAllJobs` route in this middleware. If Redis has the data, it sends it immediately and `next()` is never called (saving the database).
   [middleware/cache.js](file:///D:/Courses/Projects/jobboard/jobboard-api/src/middleware/cache.js)
   ```javascript
   const cachedData = await redis.get(cacheKey)
   if (cachedData) {
       return res.json(JSON.parse(cachedData)) // Instantly return cache
   }
   // If no cache, continue to the controller
   next() 
   ```
2. **Cache Invalidation:** When an employer creates or updates a job, we must destroy the old cache so users see the new data.
   [jobs.controller.js](file:///D:/Courses/Projects/jobboard/jobboard-api/src/controllers/jobs.controller.js)
   ```javascript
   const create = async (req, res) => {
       // ... job creation logic ...
       await invalidateJobCache() // Destroy the old cache!
       res.status(201).json({ job })
   }
   ```

---

## 3. Advanced Full-Text Search (PostgreSQL)

**Concept:** Allowing users to search for "React Developer" and finding jobs that contain "react" and "developer" anywhere in the title or description, ranked by relevance.
**Why we used it:** 
- *Tradeoff:* We could have used a simple SQL `LIKE '%react developer%'`. But `LIKE` is terribly slow and requires exact matches (it wouldn't match "developer for react"). 
- *Benefit:* We used PostgreSQL's built-in `ts_vector` (Text Search Vector). It breaks sentences into raw words (lexemes) and uses an index to search through millions of rows instantly, ranking them by how closely they match.

**Where it happens:**
[jobs.controller.js](file:///D:/Courses/Projects/jobboard/jobboard-api/src/controllers/jobs.controller.js)
```javascript
const matchingJobs = await prisma.$queryRaw`
  SELECT id,
    ts_rank(
      to_tsvector('english', title || ' ' || description),
      to_tsquery('english', ${tsQueryString})
    ) AS rank
  FROM "Job"
  WHERE
    to_tsvector('english', title || ' ' || description)
    @@ to_tsquery('english', ${tsQueryString})
  ORDER BY rank DESC
`
```
*Notice how we drop down to `prisma.$queryRaw` here? Prisma's default Javascript functions aren't powerful enough for advanced `ts_vector` math, so we wrote raw SQL to talk directly to the database engine!*

---

## 4. API Security: Rate Limiting

**Concept:** Restricting how many times a single IP address can hit your API within a time window.
**Why we used it:**
- *Tradeoff:* Without it, a malicious user could write a simple script to hit your `/login` endpoint 100,000 times a second. This is called a DDoS attack (Distributed Denial of Service) or Brute Forcing. Your server would crash.
- *Benefit:* We set a limit (e.g., 100 requests per 15 minutes). If a script goes crazy, our server automatically blocks their IP and returns a `429 Too Many Requests` error, keeping the server safe.

**Where it happens:**
[middleware/rateLimitter.js](file:///D:/Courses/Projects/jobboard/jobboard-api/src/middleware/rateLimitter.js)
```javascript
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: 'Too many requests, please try again later.' }
})
```

---

## 5. Containerization (Docker)

**Concept:** Packaging your entire application and its environment (Node.js version, OS, dependencies) into a single, portable box.
**Why we used it:**
- *Tradeoff:* "It works on my machine!" is a classic developer problem. If you code on Windows (like you do) but deploy to a Linux server (like Render), things can break due to OS differences.
- *Benefit:* Docker creates a mini Linux virtual machine. It guarantees that the exact environment running on your laptop is the exact environment running in the cloud. 

**Where it happens:**
[Dockerfile](file:///D:/Courses/Projects/jobboard/jobboard-api/Dockerfile)
```dockerfile
# Stage 1: Builder (Downloads everything)
FROM node:22-alpine AS builder
# ... installs dependencies ...

# Stage 2: Production (Tiny, secure final container)
FROM node:22-alpine AS production
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "start"]
```
*Notice we used a "Multi-stage build". Stage 1 downloads massive development tools to build the Prisma client. Stage 2 only copies the final required files. This keeps our cloud server highly optimized and secure by leaving dev-tools behind.*
