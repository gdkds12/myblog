import Redis from 'ioredis';

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
  console.warn('Redis environment variables (REDIS_HOST, REDIS_PORT) are not set. Caching will be disabled.');
}

const redis = process.env.REDIS_HOST && process.env.REDIS_PORT
  ? new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      // 필요한 경우 다른 옵션 추가 (예: password)
      // password: process.env.REDIS_PASSWORD,
      // 연결 재시도 로직 추가 (선택 사항)
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // 연결 실패 시 에러 로깅 (선택 사항)
      reconnectOnError(err) {
        console.error('Redis reconnection error:', err);
        return true; // true 반환 시 재연결 시도
      },
      showFriendlyErrorStack: true // 개발 환경에서 상세 에러 로그
    })
  : null; // 환경 변수 없으면 null

// Redis 연결 상태 로깅 (선택 사항)
if (redis) {
    redis.on('connect', () => console.log('Redis connected'));
    redis.on('error', (err) => console.error('Redis connection error:', err));
}

export default redis; 