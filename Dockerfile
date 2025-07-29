# syntax=docker/dockerfile:1

# 1. 베이스 이미지 설정
FROM node:24-alpine
WORKDIR /app

# 2. 의존성 설치
COPY package*.json ./
RUN npm ci

# 3. 전체 소스코드 복사
COPY . .

# 4. 애플리케이션 빌드
RUN npm run build

# --- [최종 디버깅 단계] ---
# 빌드 후 .next 폴더의 전체 구조를 재귀적으로 확인합니다.
RUN echo "--- Verifying entire .next directory structure ---" && \
    ls -R /app/.next

# 5. 보안 및 배포 도구 설치
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    apk add --no-cache git docker-compose

# 6. 파일 소유권 변경
RUN chown -R nextjs:nodejs /app

# 7. non-root 사용자로 전환
USER nextjs

EXPOSE 3000

# 8. 애플리케이션을 실행하지 않고, 컨테이너를 계속 실행시켜 내부를 조사할 수 있도록 합니다.
CMD [ "tail", "-f", "/dev/null" ]