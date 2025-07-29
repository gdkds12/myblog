# syntax=docker/dockerfile:1

# 1. 최종 실행 환경 (Production Base)
FROM node:24-alpine
WORKDIR /app

# 보안을 위해 non-root 사용자 생성 및 자동 배포 도구 설치
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    apk add --no-cache git docker-compose

# 2. 의존성 설치
COPY package*.json ./
RUN npm ci

# 3. 소스코드 복사 및 빌드
COPY . .
RUN npm run build

# 4. 파일 소유권 변경
# public, .next, content 폴더의 소유권을 nextjs 사용자로 변경
RUN chown -R nextjs:nodejs /app/public && \
    chown -R nextjs:nodejs /app/.next && \
    chown -R nextjs:nodejs /app/content && \
    chown nextjs:nodejs /app/deploy.sh

# 5. 사용자 전환
USER nextjs

EXPOSE 3000

# Standalone 빌드의 실행 파일 경로로 CMD 수정
CMD ["node", ".next/standalone/server.js"]