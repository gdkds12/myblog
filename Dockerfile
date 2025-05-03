# Next.js 앱을 위한 Dockerfile

# 빌드 단계
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package.json package-lock.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# Next.js 애플리케이션 빌드
RUN npm run build

# 런타임 단계
FROM node:20-alpine AS runner

WORKDIR /app

# 환경 변수 설정
ENV NODE_ENV=production

# 비루트 사용자로 실행하기 위한 설정
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 빌드 결과물만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 권한 변경
RUN chown -R nextjs:nodejs /app

# 사용자 전환
USER nextjs

# 포트 노출
EXPOSE 3001

# 애플리케이션 실행
CMD ["node", "server.js"] 