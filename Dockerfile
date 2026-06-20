# ─── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for Prisma)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src
COPY prisma.config.ts ./

# ─── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Set node environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy generated Prisma client from builder
COPY --from=builder /app/generated ./generated

# Copy source code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma.config.ts ./

# Expose API port
EXPOSE 3000

# Start command
CMD ["npm", "start"]