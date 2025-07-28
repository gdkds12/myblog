# 🔐 GitHub Secrets 설정 가이드

## 📝 GitHub Repository Secrets 설정

**GitHub Repository → Settings → Secrets and variables → Actions**에서 다음 Secrets를 추가하세요:

### **필수 Secrets**

#### 1. `WEBHOOK_SECRET`
```
값: b743c477e4e442ed575438db971719c83f92156aa5c777b707ed82366817e421
설명: GitHub Actions에서 서버로 웹훅을 보낼 때 사용하는 HMAC 서명용 비밀키
```

#### 2. `SERVER_WEBHOOK_URL`
```
값: https://greedient.kr/api/webhook
설명: 서버의 웹훅 엔드포인트 URL
```

## 🔧 GitHub Repository Webhook 설정

**GitHub Repository → Settings → Webhooks → Add webhook**

```
Payload URL: https://greedient.kr/api/webhook
Content type: application/json
Secret: b743c477e4e442ed575438db971719c83f92156aa5c777b707ed82366817e421
SSL verification: Enable SSL verification
Events: Just the push event
Active: ✅ (체크됨)
```

## 🚀 워크플로우 동작 방식

### **자동 배포 플로우**
```
1. GitHub Mobile에서 content/posts/*.md 파일 추가/수정
   ↓
2. GitHub Actions 워크플로우 자동 실행
   ↓  
3. 변경된 파일 감지 및 웹훅 페이로드 생성
   ↓
4. HMAC 서명으로 보안 검증
   ↓
5. 서버로 웹훅 전송 (https://greedient.kr/api/webhook)
   ↓
6. 서버에서 Git Pull → Docker 재빌드 → 캐시 무효화
   ↓
7. 사이트 자동 업데이트 완료 ✅
```

### **수동 실행**
```bash
# GitHub Actions에서 "Run workflow" 버튼으로도 실행 가능
# Repository → Actions → Content Revalidation and Deployment → Run workflow
```

## 🔍 디버깅 & 모니터링

### **GitHub Actions 로그 확인**
1. Repository → Actions
2. 최근 워크플로우 실행 확인
3. 각 단계별 로그 검토

### **서버 웹훅 로그 확인**
```bash
# 서버에서 웹훅 수신 로그 확인
docker logs -f myblog | grep webhook

# 배포 진행 상황 확인
docker logs -f myblog | grep "deployment\|Docker\|git"
```

### **웹훅 테스트**
```bash
# 수동으로 웹훅 테스트 (서버에서)
curl -X POST https://greedient.kr/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"test": true}' | openssl dgst -sha256 -hmac 'b743c477e4e442ed575438db971719c83f92156aa5c777b707ed82366817e421' | cut -d' ' -f2)" \
  -d '{"ref": "refs/heads/main", "commits": [{"modified": ["content/posts/test.md"]}]}'
```

## ⚠️ 보안 고려사항

- ✅ `WEBHOOK_SECRET`은 충분히 복잡한 랜덤 문자열 사용
- ✅ HTTPS만 사용하여 통신 암호화
- ✅ 서명 검증으로 위조 요청 차단
- ✅ GitHub Secrets는 Repository 관리자만 접근 가능
- ❌ Secret 값을 코드나 로그에 노출하지 않기

## 🎯 완료 체크리스트

- [ ] GitHub Secrets 설정 완료 (`WEBHOOK_SECRET`, `SERVER_WEBHOOK_URL`)
- [ ] GitHub Repository Webhook 설정 완료
- [ ] 서버 `.env` 파일에 `WEBHOOK_SECRET` 설정 완료
- [ ] 테스트 파일로 자동 배포 동작 확인
- [ ] GitHub Actions 워크플로우 정상 실행 확인
- [ ] 서버 로그에서 웹훅 수신 및 배포 성공 확인
