# 📱 GitHub Mobile을 통한 포스트 추가 가이드

## 🚀 완전 자동화된 워크플로우

### **1단계: GitHub Mobile에서 포스트 작성**
- `content/posts/new-post.md` 파일 생성
- 커밋 → main 브랜치 푸시

### **2단계: 자동 배포 (서버에서 자동 실행)**
1. **GitHub 웹훅 수신** → 서버의 `/api/webhook` 엔드포인트
2. **Git Pull** → 서버에서 최신 코드 가져오기
3. **Docker 재빌드** → 새 마크다운 파일 포함하여 컨테이너 재생성
4. **캐시 무효화** → ISR 캐시 자동 클리어
5. **완료** → 2-3분 후 사이트에서 확인 가능

## 📝 마크다운 템플릿

```markdown
---
title: "포스트 제목"
slug: "your-post-slug"
excerpt: "포스트 요약"
feature_image: "https://34.111.238.251/path/to/image.webp"
published_at: "2024-01-30T16:00:00.000Z"
tags: ["tech", "blog"]
author: "작성자명"
draft: false
---

# 포스트 내용

여기에 마크다운으로 포스트 내용을 작성하세요.
```

## ⚙️ 서버 설정 (한 번만 설정)

### **1. GitHub Repository Webhook 설정**
```
Settings → Webhooks → Add webhook
- Payload URL: https://greedient.kr/api/webhook
- Content type: application/json  
- Secret: your-github-webhook-secret
- Events: Just the push event
```

### **2. 서버 환경변수 설정**
```bash
# /home/ubuntu/myblog/.env
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
REVALIDATE_SECRET=your-revalidate-secret
NEXT_PUBLIC_SITE_URL=https://greedient.kr
```

### **3. 배포 스크립트 권한 설정**
```bash
chmod +x /home/ubuntu/myblog/deploy.sh
```

## 🔍 배포 상태 확인

### **실시간 로그 모니터링**
```bash
# 웹훅 로그 확인
docker logs -f myblog | grep webhook

# 전체 애플리케이션 로그
docker logs -f myblog

# 배포 프로세스 모니터링
tail -f /var/log/deployment.log
```

### **수동 배포 (긴급 시)**
```bash
cd /home/ubuntu/myblog
./deploy.sh
```

## 💡 문제해결

### **포스트가 안 보일 때**
1. GitHub 웹훅이 제대로 전달되었는지 확인
2. 서버 로그에서 배포 과정 확인
3. 수동으로 배포 스크립트 실행

### **이미지가 안 보일 때**
- HTTPS URL 사용했는지 확인
- CDN 서버 상태 확인

### **긴급 수동 무효화**
```bash
curl -X POST "https://greedient.kr/api/revalidate?secret=YOUR_SECRET"
```
