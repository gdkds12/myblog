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

# Python HTTP 서버 사용 (가장 안정적)
python3 -c "
import http.server
import socketserver
import json
import subprocess
import os
import sys
from urllib.parse import urlparse

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {'status': 'Webhook listener is running', 'port': $WEBHOOK_PORT}
        self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            signature = self.headers.get('X-Hub-Signature-256', '')
            
            print(f'[{__import__(\"datetime\").datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")}] 📦 Webhook received')
            
            # bash 함수들을 환경에 로드하고 handle_webhook 호출
            env = os.environ.copy()
            env['WEBHOOK_PORT'] = '$WEBHOOK_PORT'
            env['WEBHOOK_SECRET'] = '$WEBHOOK_SECRET'
            env['PROJECT_DIR'] = '$PROJECT_DIR'
            env['REVALIDATE_TOKEN'] = '$REVALIDATE_TOKEN'
            
            # 임시 스크립트 생성
            script_content = '''#!/bin/bash
source /home/ubuntu/myblog/webhook-listener.sh
handle_webhook \"''' + post_data.replace('\"', '\\\"') + '''\" \"''' + signature + '''\"
'''
            
            with open('/tmp/webhook_handler.sh', 'w') as f:
                f.write(script_content)
            
            os.chmod('/tmp/webhook_handler.sh', 0o755)
            
            # 스크립트 실행
            result = subprocess.run(['/bin/bash', '/tmp/webhook_handler.sh'], 
                                  capture_output=True, text=True, env=env, cwd='$PROJECT_DIR')
            
            # 결과에 따라 HTTP 응답 코드 설정
            if result.returncode == 0:
                self.send_response(200)
            else:
                self.send_response(500)
            
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            if result.stdout:
                self.wfile.write(result.stdout.encode())
            else:
                self.wfile.write(b'{\"success\": true, \"message\": \"Webhook processed\"}')
                
        except Exception as e:
            print(f'Error processing webhook: {e}')
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def log_message(self, format, *args):
        print(f'[{self.log_date_time_string()}] {format % args}')

PORT = $WEBHOOK_PORT
print(f'[{__import__(\"datetime\").datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")}] 🚀 Python HTTP server starting on port {PORT}')

with socketserver.TCPServer(('', PORT), WebhookHandler) as httpd:
    httpd.serve_forever()
"
