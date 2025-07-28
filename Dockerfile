# syntax=docker/dockerfile:1
# ---- Dependencies ----
FROM node:24-alpine AS deps
WORKDIR /app
# Install dependencies based on the preferred lock-file
COPY package*.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --ignore-scripts

# ---- Builder ----
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build the Next.js application
RUN npm run build && npm prune --production

# ---- Production ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/content ./content

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
