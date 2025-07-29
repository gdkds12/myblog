# syntax=docker/dockerfile:1

# 1. 베이스 이미지 설정
FROM node:24-alpine
WORKDIR /app

# 2. 의존성 설치
# package-lock.json을 먼저 복사하여 캐시 효율을 높입니다.
COPY package*.json ./
RUN npm ci

# 3. 전체 소스코드 복사
COPY . .

# 4. 애플리케이션 빌드
RUN npm run build

# 5. 보안 및 배포 도구 설치
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    apk add --no-cache git docker-compose

# 6. 파일 소유권 변경
# non-root 사용자가 접근해야 하는 모든 파일/폴더의 소유권을 변경합니다.
RUN chown -R nextjs:nodejs /app

# 7. non-root 사용자로 전환
USER nextjs

EXPOSE 3000

# 8. 애플리케이션 실행
# 빌드 후 생성되는 정확한 경로를 명시합니다.
CMD ["node", ".next/standalone/server.js"]