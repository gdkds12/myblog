# syntax=docker/dockerfile:1

# 1. 의존성 설치 단계 (Dependencies)
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2. 빌드 단계 (Builder)
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. 최종 실행 단계 (Runner)
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 보안을 위해 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 자동 배포를 위한 도구 설치
RUN apk add --no-cache git docker-compose

# Standalone 빌드 결과물 복사
# --chown 플래그로 파일 소유자를 nextjs 사용자로 지정
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

# 배포 스크립트 복사 및 실행 권한 부여
COPY --from=builder --chown=nextjs:nodejs /app/deploy.sh ./deploy.sh
RUN chmod +x ./deploy.sh

# 사용자 전환
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]