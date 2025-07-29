# syntax=docker/dockerfile:1

# Base Stage: 기본 환경 설정
FROM node:24-alpine AS base
WORKDIR /app

# Dependencies Stage: 의존성만 설치
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Builder Stage: 소스코드 복사 및 빌드
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production Stage: 최종 실행 이미지 생성
FROM base AS runner
ENV NODE_ENV=production

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Standalone 빌드 결과물만 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# content 폴더는 호스트에서 마운트되므로 복사하지 않음

# non-root 사용자로 전환
USER nextjs

EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "/app/server.js"]
