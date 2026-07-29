# Job Board: Mock Technical Interview Guide

Imagine you are in a final-round technical interview for a Full-Stack or Backend Engineering role. The interviewer (a Senior Engineer or Tech Lead) is looking at your Job Board project on your resume. 

They don't just want to know *what* you built; they want to know *why* you made specific engineering decisions. Here are the exact questions they would ask, and the answers they are hoping to hear.

---

## 1. Caching & Performance (Redis)

**Interviewer:** *"I see you used Redis for caching the job feed. Can you explain why you decided to use a cache here, and what the tradeoff was?"*

**What they expect:** They want to see that you didn't just throw Redis in for fun, but that you understand the problem it solves (database overload) and the new problem it creates (cache invalidation/stale data).

**Your Answer:** 
> "I implemented Redis because the job feed (`/api/jobs`) is a read-heavy endpoint. If 1,000 users visit the homepage, querying PostgreSQL 1,000 times for the exact same job list is a massive waste of database CPU and would slow down the app. 
> 
> By putting Redis in front, the first user triggers a database query, but the next 999 users get the data instantly from Redis RAM in less than a millisecond. 
> 
> The main tradeoff with caching is 'stale data'. If an employer posts a new job, the users wouldn't see it because Redis still has the old feed. To solve this, I implemented an aggressive cache invalidation strategy: anytime a POST, PATCH, or DELETE request hits the jobs controller, I immediately delete the Redis cache key so the next visitor gets fresh data."

---

## 2. Advanced Database Queries (PostgreSQL)

**Interviewer:** *"You implemented a search bar for the job board. How did you query the database for the search terms? Did you just use a standard SQL `LIKE` clause?"*

**What they expect:** They want to see if you know the limitations of basic SQL and if you can utilize advanced database engine features.

**Your Answer:**
> "I specifically avoided using a simple `LIKE '%search%'` query for two reasons: it's notoriously slow on large tables because it requires a full table scan, and it's not smart—it wouldn't match 'developer for react' if the user searched 'react developer'.
> 
> Instead, I utilized PostgreSQL's native Full-Text Search features. I dropped down to raw SQL using Prisma and used the `ts_vector` and `ts_query` functions. This converts the job title and description into 'lexemes' (root words) and uses an index to search them instantly. I also used `ts_rank` so that jobs matching the search terms more closely are returned first, creating a much better user experience."

---

## 3. Authentication Architecture (JWT)

**Interviewer:** *"You chose JSON Web Tokens (JWT) for authentication. Why JWT over traditional Session Cookies stored in the database?"*

**What they expect:** They want you to use the word "Stateless" and explain how backend scaling works.

**Your Answer:**
> "I chose JWT because I wanted a completely stateless authentication architecture that is easy to scale. 
> 
> If I used traditional database sessions, my API server would have to do a database lookup on every single request just to see if the user is logged in. Furthermore, if the app grew and we put 5 API servers behind a load balancer, managing shared sessions becomes complex.
> 
> With JWT, the user's ID and Role are cryptographically signed into the token itself. When a request hits my Express middleware, the server can mathematically verify the token's signature using the `JWT_SECRET` without ever talking to the database. This makes the authentication extremely fast and infinitely scalable."

---

## 4. API Security

**Interviewer:** *"Job boards are common targets for scrapers and brute-force attacks. Did you implement anything to protect your API?"*

**What they expect:** Awareness of basic API security vectors (DDoS, brute forcing) and how to mitigate them at the middleware level.

**Your Answer:**
> "Yes, security was a priority. I implemented `helmet` to automatically set secure HTTP headers and prevent cross-site scripting attacks. 
> 
> More importantly, I implemented a Rate Limiter middleware using `express-rate-limit`. If a malicious bot tries to brute-force the login route or scrape the API by making hundreds of requests a second, the middleware detects the IP address and blocks them, returning a `429 Too Many Requests` status code. This protects the backend from going down during a DDoS attack."

---

## 5. DevOps & Containerization (Docker)

**Interviewer:** *"I see you Dockerized the backend. Can you walk me through your Dockerfile strategy? Is it a standard single-stage build?"*

**What they expect:** Knowledge of multi-stage builds and why we want production images to be as small and secure as possible.

**Your Answer:**
> "I used a Multi-Stage Docker build to ensure the production image is as lightweight and secure as possible. 
> 
> In Stage 1 (the Builder stage), I pull in the full Node environment, install all dependencies including `devDependencies`, and run the Prisma Client generation which requires a lot of heavy tooling. 
> 
> In Stage 2 (the Production stage), I start fresh. I only copy over the compiled code, the generated Prisma client, and the production `node_modules`. I leave all the heavy development tools behind. This reduces the container size drastically, speeds up deployment to Render, and reduces the security attack surface."
