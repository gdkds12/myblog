#!/bin/bash

# webhook-listener.sh - 호스트에서 실행되는 GitHub 웹훅 리스너
# 이 스크립트는 systemd 서비스로 실행되어 GitHub 웹훅을 수신하고 자동 배포를 처리합니다.

set -e

WEBHOOK_PORT=${WEBHOOK_PORT}
WEBHOOK_SECRET=${WEBHOOK_SECRET}
PROJECT_DIR=${PROJECT_DIR}
REVALIDATE_TOKEN=${REVALIDATE_TOKEN}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# GitHub 웹훅 서명 검증 함수
verify_signature() {
    local payload="$1"
    local signature="$2"
    
    if [ -z "$WEBHOOK_SECRET" ]; then
        log "⚠️ WEBHOOK_SECRET not set, skipping signature verification"
        return 0
    fi
    
    local expected_signature=$(echo -n "$payload" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
    local received_signature=$(echo "$signature" | sed 's/^sha256=//')
    
    if [ "$expected_signature" = "$received_signature" ]; then
        log "✅ Signature verified"
        return 0
    else
        log "❌ Signature verification failed"
        return 1
    fi
}

# 웹훅 핸들러 함수
handle_webhook() {
    local request_body="$1"
    local signature="$2"
    
    log "📦 Webhook received"
    
    # 서명 검증
    if ! verify_signature "$request_body" "$signature"; then
        echo "HTTP/1.1 401 Unauthorized"
        echo "Content-Type: application/json"
        echo ""
        echo '{"error": "Invalid signature"}'
        return
    fi
    
    # JSON 파싱으로 ref 확인
    local ref=$(echo "$request_body" | jq -r '.ref // empty')
    
    if [ "$ref" != "refs/heads/main" ]; then
        log "ℹ️ Not main branch push, ignoring"
        echo "HTTP/1.1 200 OK"
        echo "Content-Type: application/json"
        echo ""
        echo '{"message": "Not main branch, ignored"}'
        return
    fi
    
    log "🔄 Main branch push detected, starting deployment..."
    
    # 프로젝트 디렉토리로 이동
    cd "$PROJECT_DIR" || {
        log "❌ Failed to change to project directory: $PROJECT_DIR"
        echo "HTTP/1.1 500 Internal Server Error"
        echo "Content-Type: application/json"
        echo ""
        echo '{"error": "Project directory not found"}'
        return
    }
    
    # Git pull 실행
    log "📥 Pulling latest changes..."
    if git pull origin main; then
        log "✅ Git pull successful"
    else
        log "❌ Git pull failed"
        echo "HTTP/1.1 500 Internal Server Error"
        echo "Content-Type: application/json"
        echo ""
        echo '{"error": "Git pull failed"}'
        return
    fi
    
    # Next.js 캐시 무효화 요청
    log "♻️ Triggering cache revalidation..."
    if curl -s -X POST \
        -H "Authorization: Bearer $REVALIDATE_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"paths": ["/", "/articles", "/docs"]}' \
        http://localhost:3000/api/revalidate > /dev/null; then
        log "✅ Cache revalidation triggered"
    else
        log "⚠️ Cache revalidation failed (non-critical)"
    fi
    
    log "🎉 Deployment completed successfully"
    
    # 성공 응답
    echo "HTTP/1.1 200 OK"
    echo "Content-Type: application/json"
    echo ""
    echo '{"success": true, "message": "Deployment completed"}'
}

# HTTP 서버 시작
log "🚀 Starting webhook listener on port $WEBHOOK_PORT"
log "📁 Project directory: $PROJECT_DIR"

# socat을 사용한 더 안정적인 HTTP 서버
if command -v socat &> /dev/null; then
    log "✅ Using socat for HTTP server"
    while true; do
        echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 56\r\nConnection: close\r\n\r\n{\"status\": \"Webhook listener is running\", \"port\": $WEBHOOK_PORT}" | socat TCP-LISTEN:$WEBHOOK_PORT,fork,reuseaddr STDIO
        sleep 0.1
    done
else
    log "⚠️ socat not found, installing..."
    # socat 설치 시도
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y socat
    elif command -v yum &> /dev/null; then
        sudo yum install -y socat
    fi
    
    # 설치 후 다시 시도
    if command -v socat &> /dev/null; then
        log "✅ socat installed successfully"
        while true; do
            echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 56\r\nConnection: close\r\n\r\n{\"status\": \"Webhook listener is running\", \"port\": $WEBHOOK_PORT}" | socat TCP-LISTEN:$WEBHOOK_PORT,fork,reuseaddr STDIO
            sleep 0.1
        done
    else
        log "❌ Failed to install socat, falling back to netcat"
        # 단순한 netcat 버전
        while true; do
            echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 56\r\nConnection: close\r\n\r\n{\"status\": \"Webhook listener is running\", \"port\": $WEBHOOK_PORT}" | nc -l -p "$WEBHOOK_PORT" -q 1
            sleep 0.1
        done
    fi
fi
