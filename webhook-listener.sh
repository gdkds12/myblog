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

# Python HTTP 서버 (완전 독립형)
python3 -c "
import http.server
import socketserver
import json
import subprocess
import os
import sys
import hashlib
import hmac
from urllib.parse import urlparse

# 환경변수 가져오기
WEBHOOK_PORT = int('$WEBHOOK_PORT')
WEBHOOK_SECRET = '$WEBHOOK_SECRET'
PROJECT_DIR = '$PROJECT_DIR'
REVALIDATE_TOKEN = '$REVALIDATE_TOKEN'

def log(message):
    import datetime
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] {message}')

def verify_signature(payload, signature):
    if not WEBHOOK_SECRET:
        log('⚠️ WEBHOOK_SECRET not set, skipping signature verification')
        return True
    
    if not signature.startswith('sha256='):
        log('❌ Invalid signature format')
        return False
    
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    received_signature = signature[7:]  # Remove 'sha256=' prefix
    
    if hmac.compare_digest(expected_signature, received_signature):
        log('✅ Signature verified')
        return True
    else:
        log('❌ Signature verification failed')
        return False

def handle_webhook(request_body, signature):
    log('📦 Webhook received')
    log(f'📋 Payload length: {len(request_body)} bytes')
    log(f'🔑 Signature: {signature[:20]}...' if signature else '🔑 No signature')
    
    # 서명 검증
    if not verify_signature(request_body, signature):
        return 401, {'error': 'Invalid signature'}
    
    try:
        payload = json.loads(request_body)
        log(f'✅ JSON payload parsed successfully')
    except json.JSONDecodeError as e:
        log(f'❌ Invalid JSON payload: {e}')
        return 400, {'error': 'Invalid JSON'}
    
    # ref 확인
    ref = payload.get('ref', '')
    log(f'🔀 Branch ref: {ref}')
    if ref != 'refs/heads/main':
        log('ℹ️ Not main branch push, ignoring')
        return 200, {'message': 'Not main branch, ignored'}
    
    log('🔄 Main branch push detected, starting deployment...')
    
    # 프로젝트 디렉토리로 이동
    try:
        log(f'📁 Current directory: {os.getcwd()}')
        log(f'📁 Target directory: {PROJECT_DIR}')
        os.chdir(PROJECT_DIR)
        log(f'📁 Changed to directory: {PROJECT_DIR}')
    except Exception as e:
        log(f'❌ Failed to change directory: {e}')
        return 500, {'error': f'Project directory error: {str(e)}'}
    
    # Git 설정 확인 및 수정
    log('🔧 Checking git configuration...')
    try:
        # Git safe directory 설정
        subprocess.run(['git', 'config', '--global', '--add', 'safe.directory', PROJECT_DIR], 
                      capture_output=True, text=True, timeout=10)
        log('✅ Git safe directory configured')
    except Exception as e:
        log(f'⚠️ Git config warning: {e}')
    
    # Git pull 실행
    log('📥 Pulling latest changes...')
    try:
        result = subprocess.run(['git', 'pull', 'origin', 'main'], 
                              capture_output=True, text=True, timeout=60)
        log(f'📝 Git pull stdout: {result.stdout}')
        if result.stderr:
            log(f'📝 Git pull stderr: {result.stderr}')
            
        if result.returncode == 0:
            log('✅ Git pull successful')
        else:
            log(f'❌ Git pull failed with code {result.returncode}')
            return 500, {'error': f'Git pull failed: {result.stderr}'}
    except subprocess.TimeoutExpired:
        log('❌ Git pull timeout')
        return 500, {'error': 'Git pull timeout'}
    except Exception as e:
        log(f'❌ Git pull error: {e}')
        return 500, {'error': f'Git pull error: {str(e)}'}
    
    # Next.js 캐시 무효화 요청
    log('♻️ Triggering cache revalidation...')
    try:
        import urllib.request
        import urllib.parse
        
        revalidate_data = json.dumps({
            'paths': ['/', '/articles', '/docs']
        }).encode()
        
        req = urllib.request.Request(
            'http://localhost:3000/api/revalidate',
            data=revalidate_data,
            headers={
                'Authorization': f'Bearer {REVALIDATE_TOKEN}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            log(f'📊 Revalidate response: {response.status}')
            if response.status == 200:
                log('✅ Cache revalidation triggered')
            else:
                log('⚠️ Cache revalidation failed (non-critical)')
    except Exception as e:
        log(f'⚠️ Cache revalidation failed: {e} (non-critical)')
    
    log('🎉 Deployment completed successfully')
    return 200, {'success': True, 'message': 'Deployment completed'}

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {'status': 'Webhook listener is running', 'port': WEBHOOK_PORT}
        self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            signature = self.headers.get('X-Hub-Signature-256', '')
            
            status_code, response_data = handle_webhook(post_data, signature)
            
            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
                
        except Exception as e:
            log(f'❌ Error processing webhook: {e}')
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def log_message(self, format, *args):
        pass  # 기본 로그 비활성화 (우리가 직접 로그 관리)

log(f'🚀 Python HTTP server starting on port {WEBHOOK_PORT}')

with socketserver.TCPServer(('', WEBHOOK_PORT), WebhookHandler) as httpd:
    httpd.serve_forever()
"
