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
# Build the Next.js application (standalone output)
RUN npm run build

# ---- Production ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install git and docker-compose
RUN apk add --no-cache git docker-compose

# Copy only the necessary files from the builder stage for standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy and set permissions for the deployment script
COPY deploy.sh .
RUN chmod +x ./deploy.sh

EXPOSE 3000
CMD ["node", "server.js"]
