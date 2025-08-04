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
import threading
import time
import gc

# 환경변수에서 설정값 가져오기
PORT = int(os.environ.get('WEBHOOK_PORT', '8080'))
PROJECT_DIR = os.environ.get('PROJECT_DIR', '/home/ubuntu/myblog')
REVALIDATE_TOKEN = os.environ.get('REVALIDATE_TOKEN', '')
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', '')
DEBUG_MODE = os.environ.get('DEBUG_MODE', 'False').lower() == 'true'

# 서버 시작 시간 기록
start_time = time.time()

print(f'DEBUG: PORT={PORT}')
print(f'DEBUG: PROJECT_DIR={PROJECT_DIR}')
if DEBUG_MODE:
    print(f'DEBUG: REVALIDATE_TOKEN={REVALIDATE_TOKEN[:10]}...' if REVALIDATE_TOKEN else 'DEBUG: No REVALIDATE_TOKEN')
    print(f'DEBUG: WEBHOOK_SECRET={WEBHOOK_SECRET[:10]}...' if WEBHOOK_SECRET else 'DEBUG: No WEBHOOK_SECRET')
else:
    print('DEBUG: REVALIDATE_TOKEN=***' if REVALIDATE_TOKEN else 'DEBUG: No REVALIDATE_TOKEN')
    print('DEBUG: WEBHOOK_SECRET=***' if WEBHOOK_SECRET else 'DEBUG: No WEBHOOK_SECRET')

def log(message):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] {message}', flush=True)

class ReusableTCPServer(socketserver.TCPServer):
    """소켓 재사용을 허용하는 향상된 TCP 서버"""
    allow_reuse_address = True
    request_queue_size = 10
    timeout = 30
    
    def __init__(self, server_address, RequestHandlerClass, bind_and_activate=True):
        super().__init__(server_address, RequestHandlerClass, bind_and_activate=bind_and_activate)
        # 소켓 옵션 설정
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
        
    def server_close(self):
        """서버 종료 시 소켓 정리"""
        log('Cleaning up server socket...')
        super().server_close()

class ThreadingWebhookServer(socketserver.ThreadingMixIn, ReusableTCPServer):
    """각 요청을 별도 스레드에서 처리하는 멀티스레드 서버"""
    daemon_threads = True  # 메인 스레드 종료 시 자식 스레드도 종료
    max_children = 40      # 최대 동시 스레드 수 제한

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'  # Keep-alive 지원
    timeout = 30
    
    def setup(self):
        """연결 설정 시 타임아웃 적용"""
        super().setup()
        self.connection.settimeout(self.timeout)
    
    def finish(self):
        """요청 처리 완료 후 정리"""
        try:
            # 연결이 아직 열려있는지 확인 후 정리
            if hasattr(self, 'wfile') and not self.wfile.closed:
                try:
                    self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError, ValueError):
                    pass  # 클라이언트가 이미 연결을 닫은 경우 무시
            super().finish()
        except (BrokenPipeError, ConnectionResetError, ValueError, OSError) as e:
            # 연결 관련 오류는 정상적인 상황이므로 로그 레벨을 낮춤
            pass
        except Exception as e:
            log(f'Unexpected error in connection cleanup: {e}')
        finally:
            # 가비지 컬렉션은 스레드별로 수행하지 않음 (성능상 이유)
            pass
    def verify_signature(self, payload, signature):
        """HMAC 서명 검증"""
        if not WEBHOOK_SECRET:
            log('Warning: No webhook secret configured - skipping signature verification')
            return True
        
        log(f'Received signature: {signature}')
        log(f'Payload length: {len(payload)} bytes')
        if DEBUG_MODE:
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
        
        # 실패한 경우 추가 디버깅 정보 (디버그 모드에서만)
        if not result and DEBUG_MODE:
            log('Signature verification failed - debugging info:')
            log(f'  Payload (first 100 chars): {payload[:100]}')
            log(f'  Secret (first 10 chars): {WEBHOOK_SECRET[:10]}...')
            
        return result
    
    def do_GET(self):
        log(f'GET request received from {self.client_address[0]}')
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Connection', 'close')  # 연결 즉시 종료
            self.end_headers()
            response = {
                "status": "Webhook listener running",
                "port": PORT,
                "timestamp": datetime.datetime.now().isoformat(),
                "project_dir": PROJECT_DIR,
                "uptime": time.time() - start_time
            }
            self.wfile.write(json.dumps(response, indent=2).encode())
            self.wfile.flush()  # 명시적으로 flush
            log('GET response sent')
        except (BrokenPipeError, ConnectionResetError, ValueError) as e:
            # 클라이언트가 연결을 일찍 닫은 경우 - 정상적인 상황
            pass
        except Exception as e:
            log(f'Error in GET handler: {e}')
        finally:
            # wfile 정리는 finish()에서 처리
            pass
    
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

def health_check_thread():
    """서버 상태를 주기적으로 체크하는 스레드"""
    while True:
        try:
            time.sleep(300)  # 5분마다 체크
            
            # 메모리 사용량 체크
            try:
                import psutil
                process = psutil.Process()
                memory_mb = process.memory_info().rss / 1024 / 1024
                
                log(f'Health check - Memory: {memory_mb:.1f}MB, Uptime: {time.time() - start_time:.0f}s')
                
                # 메모리가 100MB 이상이면 경고
                if memory_mb > 100:
                    log(f'Warning: High memory usage detected: {memory_mb:.1f}MB')
                    gc.collect()  # 강제 가비지 컬렉션
            except ImportError:
                # psutil이 없으면 간단한 체크만
                log(f'Health check - Uptime: {time.time() - start_time:.0f}s')
                
            # 24시간마다 자동 재시작 (선택사항)
            uptime_hours = (time.time() - start_time) / 3600
            if uptime_hours > 24:
                log('Automatic restart after 24 hours uptime')
                os.kill(os.getpid(), signal.SIGTERM)
                
        except Exception as e:
            log(f'Health check error: {e}')
            time.sleep(60)

def main():
    log(f'Enhanced webhook server starting on port {PORT}')
    log(f'Project directory: {PROJECT_DIR}')
    log(f'PID: {os.getpid()}')
    
    # 시그널 핸들러 등록
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # 헬스 체크 스레드 시작
    health_thread = threading.Thread(target=health_check_thread, daemon=True)
    health_thread.start()
    log('Health check thread started')
    
    # systemd 알림 기능 (watchdog 처리)
    systemd_available = False
    systemd_daemon = None
    try:
        import systemd.daemon as systemd_daemon
        systemd_available = True
        log('systemd integration available')
    except ImportError:
        log('systemd integration not available (install python3-systemd if needed)')
        systemd_daemon = None
    
    try:
        # 멀티스레드 소켓 재사용 서버 사용
        with ThreadingWebhookServer(('', PORT), WebhookHandler) as httpd:
            log('Multithreaded server created successfully with socket reuse enabled')
            log(f'Server listening on all interfaces, port {PORT}')
            log('Ready to receive webhooks with concurrent request handling...')
            
            # systemd에 준비 완료 알림
            if systemd_available and systemd_daemon:
                systemd_daemon.notify('READY=1')
                log('Notified systemd that service is ready')
                
                # watchdog 스레드 시작
                def watchdog_thread():
                    while True:
                        try:
                            time.sleep(30)  # 30초마다 알림
                            systemd_daemon.notify('WATCHDOG=1')
                            log('Sent watchdog keepalive to systemd')
                        except Exception as e:
                            log(f'Watchdog error: {e}')
                            time.sleep(30)  # 에러 시에만 추가 대기
                
                watchdog = threading.Thread(target=watchdog_thread, daemon=True)
                watchdog.start()
                log('Watchdog thread started')
            
            # 서버 실행
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 98:  # Address already in use
            log(f'Port {PORT} is already in use')
            log('This usually indicates another instance is running')
            log('systemd will handle cleanup and restart - exiting gracefully')
            sys.exit(1)
        else:
            log(f'Socket error occurred: {e}')
            sys.exit(1)
    except Exception as e:
        log(f'Server failed to start: {e}')
        import traceback
        log(f'Traceback: {traceback.format_exc()}')
        sys.exit(1)
    finally:
        log('Server shutting down, cleaning up...')
        
        # systemd에 종료 알림
        if systemd_available and systemd_daemon:
            try:
                systemd_daemon.notify('STOPPING=1')
                log('Notified systemd that service is stopping')
            except:
                pass
        
        gc.collect()

if __name__ == '__main__':
    main()
