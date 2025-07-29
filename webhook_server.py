#!/usr/bin/env python3

import http.server
import socketserver
import subprocess
import os
import sys
import datetime

# 환경변수에서 설정값 가져오기
PORT = int(os.environ.get('WEBHOOK_PORT', '8080'))
PROJECT_DIR = os.environ.get('PROJECT_DIR', '/home/ubuntu/myblog')
REVALIDATE_TOKEN = os.environ.get('REVALIDATE_TOKEN', '')

print(f'DEBUG: PORT={PORT}')
print(f'DEBUG: PROJECT_DIR={PROJECT_DIR}')
print(f'DEBUG: REVALIDATE_TOKEN={REVALIDATE_TOKEN[:10]}...' if REVALIDATE_TOKEN else 'DEBUG: No REVALIDATE_TOKEN')

def log(message):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] {message}', flush=True)

class SimpleWebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        log('GET request received')
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = '{"status": "Webhook listener running", "port": ' + str(PORT) + '}'
        self.wfile.write(response.encode())
        log('GET response sent')
    
    def do_POST(self):
        log('POST request received - starting deployment')
        
        try:
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
            log(f'Git pull stderr: {result.stderr}')
            
            if result.returncode == 0:
                log('Git pull successful')
                
                # 캐시 무효화
                log('Invalidating cache...')
                try:
                    # 호스트에서 직접 API 호출 (3000번 포트로 노출됨)
                    cache_result = subprocess.run([
                        'curl', '-s', '-X', 'POST',
                        '-H', f'Authorization: Bearer {REVALIDATE_TOKEN}',
                        '-H', 'Content-Type: application/json',
                        '-d', '{"paths": ["/", "/articles", "/docs"]}',
                        'http://localhost:3000/api/revalidate'
                    ], capture_output=True, text=True, timeout=10)
                    
                    log(f'Cache result: {cache_result.returncode}')
                    if cache_result.stdout:
                        log(f'Cache stdout: {cache_result.stdout}')
                    if cache_result.stderr:
                        log(f'Cache stderr: {cache_result.stderr}')
                    
                    if cache_result.returncode == 0:
                        log('Cache invalidated successfully')
                    else:
                        log('Cache invalidation failed (but continuing...)')
                        
                except Exception as cache_error:
                    log(f'Cache invalidation error: {cache_error}')
                
                log('Deployment completed')
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"success": true, "message": "Deployment completed"}')
            else:
                log('Git pull failed')
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "Git pull failed"}')
                
        except Exception as e:
            log(f'Exception occurred: {str(e)}')
            import traceback
            log(f'Traceback: {traceback.format_exc()}')
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_msg = '{"error": "' + str(e).replace('"', '\\"') + '"}'
            self.wfile.write(error_msg.encode())
    
    def log_message(self, format, *args):
        log(f'HTTP: {format % args}')

def main():
    log(f'Simple webhook server starting on port {PORT}')
    
    try:
        with socketserver.TCPServer(('', PORT), SimpleWebhookHandler) as httpd:
            log('Server created successfully')
            httpd.serve_forever()
    except Exception as e:
        log(f'Server failed to start: {e}')
        import traceback
        log(f'Traceback: {traceback.format_exc()}')

if __name__ == '__main__':
    main()
