# ─── Stage 1: Builder ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Configure npm for network resilience
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set maxsockets 5

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for Prisma)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Prune devDependencies to keep only production packages
RUN npm prune --omit=dev

# ─── Stage 2: Production ──────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Set node environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Copy node_modules directly from builder (avoids secondary download)
COPY --from=builder /app/node_modules ./node_modules

# Copy generated Prisma client from builder
COPY --from=builder /app/generated ./generated

# Copy source code
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./

# Expose API port
EXPOSE 3000

# Start command
CMD ["npm", "start"]