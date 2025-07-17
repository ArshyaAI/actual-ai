# Multi-stage build for Swiss Bookkeeping Agent
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install backend dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Build backend
RUN npm run build

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/out ./frontend/out
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p temp exports
RUN chown -R nodejs:nodejs temp exports

USER nodejs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "dist/server.js"]
