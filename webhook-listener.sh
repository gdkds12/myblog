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

# HTTP 서버 시작
log "🚀 Starting webhook listener on port $WEBHOOK_PORT"
log "📁 Project directory: $PROJECT_DIR"

# 간단한 Python HTTP 서버
python3 -c "
import http.server
import socketserver
import subprocess
import os

PORT = int('$WEBHOOK_PORT')
PROJECT_DIR = '$PROJECT_DIR'
REVALIDATE_TOKEN = '$REVALIDATE_TOKEN'

def log(message):
    import datetime
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] {message}')

class SimpleWebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{\"status\": \"Webhook listener running\", \"port\": ' + str(PORT).encode() + b'}')
    
    def do_POST(self):
        log('📦 Webhook received - starting deployment')
        
        try:
            # 프로젝트 디렉토리로 이동
            os.chdir(PROJECT_DIR)
            log(f'📁 Changed to {PROJECT_DIR}')
            
            # Git pull 실행
            log('📥 Running git pull...')
            result = subprocess.run(['git', 'pull', 'origin', 'main'], 
                                  capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                log('✅ Git pull successful')
                
                # 캐시 무효화
                log('♻️ Invalidating cache...')
                cache_result = subprocess.run([
                    'curl', '-s', '-X', 'POST',
                    '-H', f'Authorization: Bearer {REVALIDATE_TOKEN}',
                    '-H', 'Content-Type: application/json',
                    '-d', '{\"paths\": [\"/\", \"/articles\", \"/docs\"]}',
                    'http://localhost:3000/api/revalidate'
                ], capture_output=True, text=True, timeout=10)
                
                if cache_result.returncode == 0:
                    log('✅ Cache invalidated')
                else:
                    log('⚠️ Cache invalidation failed (non-critical)')
                
                log('🎉 Deployment completed')
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{\"success\": true, \"message\": \"Deployment completed\"}')
            else:
                log(f'❌ Git pull failed: {result.stderr}')
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{\"error\": \"Git pull failed\"}')
                
        except Exception as e:
            log(f'❌ Error: {e}')
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{\"error\": \"{str(e)}\"}}'.encode())
    
    def log_message(self, format, *args):
        pass  # 기본 로그 비활성화

log(f'🚀 Simple webhook server starting on port {PORT}')

with socketserver.TCPServer(('', PORT), SimpleWebhookHandler) as httpd:
    httpd.serve_forever()
"
