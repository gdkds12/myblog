# 🔧 서버 설정 가이드

## 📋 필수 설정 체크리스트

### **1. GitHub Personal Access Token 생성**

#### GitHub에서 토큰 생성:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. **Scopes 설정**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. 생성된 토큰 복사: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxx`

### **2. 서버 환경변수 설정**

```bash
# /home/ubuntu/myblog/.env 파일 생성/수정
cat > /home/ubuntu/myblog/.env << 'EOF'
# Redis 설정
REDIS_HOST=redis
REDIS_PORT=6379

# GitHub 인증 정보
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=gdkds12
GITHUB_REPO=myblog

# 보안 키들
WEBHOOK_SECRET=your-github-webhook-secret-here
REVALIDATE_SECRET=your-revalidate-secret-here

# 사이트 정보
NEXT_PUBLIC_SITE_URL=https://greedient.kr
NODE_ENV=production
EOF
```

### **3. Git Remote URL 설정 (서버에서)**

```bash
cd /home/ubuntu/myblog

# 현재 remote 확인
git remote -v

# HTTPS 방식으로 변경 (Token 인증 사용)
git remote set-url origin https://github.com/gdkds12/myblog.git

# 인증 정보 캐시 설정 (옵션)
git config credential.helper store
```

### **4. GitHub Repository Webhook 설정**

```
Repository Settings → Webhooks → Add webhook
- Payload URL: https://greedient.kr/api/webhook
- Content type: application/json
- Secret: [WEBHOOK_SECRET와 동일한 값]
- Events: Just the push event
- Active: ✅
```

### **5. 권한 설정**

```bash
# 배포 스크립트 실행 권한
chmod +x /home/ubuntu/myblog/deploy.sh

# Docker 그룹에 사용자 추가 (필요시)
sudo usermod -aG docker $USER
```

## 🚀 배포 테스트

### **수동 배포 테스트**
```bash
cd /home/ubuntu/myblog
./deploy.sh
```

### **웹훅 테스트**
```bash
# GitHub Mobile에서 테스트 파일 생성
# content/posts/test-post.md

# 또는 수동으로 웹훅 호출
curl -X POST https://greedient.kr/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"test": true}' | openssl dgst -sha256 -hmac 'your-webhook-secret' | cut -d' ' -f2)" \
  -d '{"test": true}'
```

## 🔍 모니터링 & 디버깅

### **로그 확인**
```bash
# 애플리케이션 로그
docker logs -f myblog

# 웹훅 전용 로그
docker logs -f myblog | grep -E "(webhook|deployment)"

# Docker Compose 상태
docker-compose ps
```

### **Git 상태 확인**
```bash
cd /home/ubuntu/myblog
git status
git log --oneline -5
```

### **환경변수 확인**
```bash
cd /home/ubuntu/myblog
docker-compose config | grep -E "(GITHUB|REVALIDATE)"
```

## ⚠️ 보안 주의사항

### **Token 보안**
- ✅ Personal Access Token을 안전하게 보관
- ✅ 최소한의 권한만 부여 (`repo`, `workflow`)
- ✅ 정기적으로 토큰 갱신 (1년 주기 권장)
- ❌ 토큰을 코드에 하드코딩하지 않기

### **웹훅 보안**
- ✅ 강력한 Webhook Secret 사용
- ✅ HTTPS만 허용
- ✅ IP 제한 설정 (선택사항)

## 🆘 문제해결

### **Git Pull 실패 시**
```bash
# 토큰 확인
echo $GITHUB_TOKEN

# 수동으로 pull 테스트
cd /home/ubuntu/myblog
git pull origin main
```

### **Docker 빌드 실패 시**
```bash
# Docker 로그 확인
docker-compose logs myblog

# 수동 빌드 테스트
docker-compose build --no-cache
```

### **웹훅 응답 없음**
```bash
# 웹훅 엔드포인트 테스트
curl -I https://greedient.kr/api/webhook

# GitHub Webhook 설정 재확인
# Recent Deliveries에서 응답 코드 확인
```
