#!/bin/bash
# deploy.sh - 서버에서 실행할 자동 배포 스크립트

set -e

echo "🚀 Starting automated deployment..."

# 프로젝트 디렉토리로 이동
cd /home/ubuntu/myblog

# Git 상태 확인
echo "📋 Current git status:"
git status --short

# 최신 변경사항 가져오기 (GitHub Token 사용)
echo "📥 Pulling latest changes from GitHub..."
git fetch origin main
git reset --hard origin/main

# 변경된 파일 확인
echo "📝 Changed files:"
git diff --name-only HEAD~1 HEAD

# Docker 컨테이너 중지
echo "🛑 Stopping existing containers..."
docker-compose down


# Docker 이미지 재빌드
echo "🔨 Building new Docker images..."
docker-compose build --no-cache

# 컨테이너 시작
echo "▶️ Starting containers..."
docker-compose up -d

# 컨테이너 상태 확인
echo "🔍 Checking container status..."
sleep 10
docker-compose ps

# 헬스체크
echo "🏥 Health check..."
for i in {1..12}; do
  if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
    break
  elif [ $i -eq 12 ]; then
    echo "❌ Health check failed after 60 seconds"
    docker-compose logs myblog
    exit 1
  else
    echo "⏳ Waiting for application to start... ($i/12)"
    sleep 5
  fi
done

# 캐시 무효화
echo "🗑️ Invalidating cache..."
curl -X POST "http://localhost:3000/api/revalidate?secret=${REVALIDATE_SECRET}" \
  -H "Content-Type: application/json" \
  --max-time 30 || echo "Cache invalidation failed"

echo "🎉 Deployment completed successfully!"
echo "📍 Site URL: https://greedient.kr"
echo "📅 Deployed at: $(date)"
