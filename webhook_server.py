#!/usr/bin/env python3

import http.server
import socketserver
import subprocess
import os
import sys
import datetime
import socket
import signal
import json
import hmac
import hashlib

# 환경변수에서 설정값 가져오기
PORT = int(os.environ.get('WEBHOOK_PORT', '8080'))
PROJECT_DIR = os.environ.get('PROJECT_DIR', '/home/ubuntu/myblog')
REVALIDATE_TOKEN = os.environ.get('REVALIDATE_TOKEN', '')
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', '')

print(f'DEBUG: PORT={PORT}')
print(f'DEBUG: PROJECT_DIR={PROJECT_DIR}')
print(f'DEBUG: REVALIDATE_TOKEN={REVALIDATE_TOKEN[:10]}...' if REVALIDATE_TOKEN else 'DEBUG: No REVALIDATE_TOKEN')
print(f'DEBUG: WEBHOOK_SECRET={WEBHOOK_SECRET[:10]}...' if WEBHOOK_SECRET else 'DEBUG: No WEBHOOK_SECRET')

def log(message):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] {message}', flush=True)

class ReusableTCPServer(socketserver.TCPServer):
    """소켓 재사용을 허용하는 TCP 서버"""
    allow_reuse_address = True
    
    def __init__(self, server_address, RequestHandlerClass, bind_and_activate=True):
        super().__init__(server_address, RequestHandlerClass, bind_and_activate=bind_and_activate)

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def verify_signature(self, payload, signature):
        """HMAC 서명 검증"""
        if not WEBHOOK_SECRET:
            log('Warning: No webhook secret configured - skipping signature verification')
            return True
        
        log(f'Received signature: {signature}')
        log(f'Payload length: {len(payload)} bytes')
        log(f'Webhook secret length: {len(WEBHOOK_SECRET)} chars')
        
        # 페이로드가 문자열인 경우 바이트로 변환
        if isinstance(payload, str):
            payload = payload.encode('utf-8')
            
        expected_signature = hmac.new(
            WEBHOOK_SECRET.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        log(f'Expected signature: sha256={expected_signature}')
        
        # 서명 형식 정규화: "sha256=<hash>"
        received_signature = signature
        if signature.startswith('sha256='):
            received_signature = signature[7:]
        
        log(f'Comparing signatures:')
        log(f'  Received:  {received_signature}')
        log(f'  Expected:  {expected_signature}')
        
        result = hmac.compare_digest(expected_signature, received_signature)
        log(f'Signature verification: {"PASSED" if result else "FAILED"}')
        
        # 실패한 경우 추가 디버깅 정보
        if not result:
            log('Signature verification failed - debugging info:')
            log(f'  Payload (first 100 chars): {payload[:100]}')
            log(f'  Secret (first 10 chars): {WEBHOOK_SECRET[:10]}...')
            
        return result
    
    def do_GET(self):
        log(f'GET request received from {self.client_address[0]}')
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {
            "status": "Webhook listener running",
            "port": PORT,
            "timestamp": datetime.datetime.now().isoformat(),
            "project_dir": PROJECT_DIR
        }
        self.wfile.write(json.dumps(response, indent=2).encode())
        log('GET response sent')
    
    def do_POST(self):
        log(f'POST request received from {self.client_address[0]} - starting deployment')
        
        try:
            # 요청 본문 읽기
            content_length = int(self.headers.get('Content-Length', 0))
            payload = self.rfile.read(content_length)
            
            # 서명 검증 (디버깅 모드)
            signature = self.headers.get('X-Hub-Signature-256', '')
            log(f'Received headers: {dict(self.headers)}')
            
            # 서명 검증 수행하되 실패해도 계속 진행 (디버깅 목적)
            signature_valid = self.verify_signature(payload, signature)
            if not signature_valid:
                log('⚠️ Signature verification failed, but continuing for debugging...')
                # 임시로 검증 실패해도 계속 진행
                # self.send_response(401)
                # self.send_header('Content-type', 'application/json')
                # self.end_headers()
                # self.wfile.write(b'{"error": "Invalid signature"}')
                # return
            
            log(f'Current working directory: {os.getcwd()}')
            
            # 프로젝트 디렉토리로 이동
            os.chdir(PROJECT_DIR)
            log(f'Changed to {PROJECT_DIR}')
            
            # Git pull 실행
            log('Running git pull...')
            result = subprocess.run(['git', 'pull', 'origin', 'main'], 
                                  capture_output=True, text=True, timeout=60)
            
            log(f'Git pull return code: {result.returncode}')
            log(f'Git pull stdout: {result.stdout}')
            if result.stderr:
                log(f'Git pull stderr: {result.stderr}')
            
            if result.returncode == 0:
                log('Git pull successful')
                
                # 캐시 무효화 (파일 삭제 시 더 광범위하게)
                log('Invalidating cache...')
                try:
                    # 기본 캐시 무효화
                    cache_result = subprocess.run([
                        'curl', '-s', '-X', 'POST',
                        f'http://localhost:3000/api/revalidate?secret={REVALIDATE_TOKEN}&path=/'
                    ], capture_output=True, text=True, timeout=10)
                    
                    log(f'Cache result: {cache_result.returncode}')
                    if cache_result.stdout:
                        log(f'Cache stdout: {cache_result.stdout}')
                    if cache_result.stderr:
                        log(f'Cache stderr: {cache_result.stderr}')
                    
                    # 추가적으로 전체 사이트 캐시 강제 무효화
                    log('Performing additional cache invalidation...')
                    additional_cache = subprocess.run([
                        'curl', '-s', '-X', 'POST',
                        f'http://localhost:3000/api/revalidate?secret={REVALIDATE_TOKEN}&path=/articles'
                    ], capture_output=True, text=True, timeout=10)
                    
                    log(f'Additional cache result: {additional_cache.returncode}')
                    if additional_cache.stdout:
                        log(f'Additional cache stdout: {additional_cache.stdout}')
                    
                    if cache_result.returncode == 0:
                        log('Cache invalidated successfully')
                    else:
                        log('Cache invalidation failed (but continuing...)')
                        
                except Exception as cache_error:
                    log(f'Cache invalidation error: {cache_error}')
                
                log('Deployment completed successfully')
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {
                    "success": True,
                    "message": "Deployment completed",
                    "timestamp": datetime.datetime.now().isoformat()
                }
                self.wfile.write(json.dumps(response).encode())
            else:
                log('Git pull failed')
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {
                    "error": "Git pull failed",
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
                self.wfile.write(json.dumps(error_response).encode())
                
        except Exception as e:
            log(f'Exception occurred: {str(e)}')
            import traceback
            log(f'Traceback: {traceback.format_exc()}')
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {
                "error": str(e),
                "timestamp": datetime.datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def log_message(self, format, *args):
        log(f'HTTP: {format % args}')

def signal_handler(signum, frame):
    """우아한 종료를 위한 시그널 핸들러"""
    log(f'Received signal {signum}, shutting down gracefully...')
    sys.exit(0)

def main():
    log(f'Enhanced webhook server starting on port {PORT}')
    log(f'Project directory: {PROJECT_DIR}')
    log(f'PID: {os.getpid()}')
    
    # 시그널 핸들러 등록
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # 소켓 재사용을 허용하는 서버 사용
        with ReusableTCPServer(('', PORT), WebhookHandler) as httpd:
            log('Server created successfully with socket reuse enabled')
            log(f'Server listening on all interfaces, port {PORT}')
            log('Ready to receive webhooks...')
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98:  # Address already in use
            log(f'Port {PORT} is already in use')
            log('Attempting to find and kill existing process...')
            try:
                # 포트를 사용하는 프로세스 찾기
                lsof_result = subprocess.run(['lsof', '-ti', f':{PORT}'], 
                                           capture_output=True, text=True)
                if lsof_result.stdout:
                    pids = lsof_result.stdout.strip().split('\n')
                    for pid in pids:
                        if pid and pid.isdigit():
                            log(f'Killing process {pid} using port {PORT}')
                            os.kill(int(pid), signal.SIGTERM)
                    
                    import time
                    time.sleep(2)  # 프로세스 종료 대기
                    
                    # 다시 시도
                    with ReusableTCPServer(('', PORT), WebhookHandler) as httpd:
                        log('Server restarted successfully after cleanup')
                        httpd.serve_forever()
                else:
                    log(f'No process found using port {PORT}, but still getting bind error')
                    raise e
            except Exception as cleanup_error:
                log(f'Failed to cleanup and restart: {cleanup_error}')
                raise e
        else:
            raise e
    except Exception as e:
        log(f'Server failed to start: {e}')
        import traceback
        log(f'Traceback: {traceback.format_exc()}')
        sys.exit(1)

if __name__ == '__main__':
    main()
