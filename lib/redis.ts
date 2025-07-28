import Redis from 'ioredis';

// 빌드 환경에서는 Redis 비활성화
const isBuilding = process.env.NODE_ENV === 'production' && process.env.BUILD_MODE === 'true';

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || isBuilding) {
  console.warn('Redis is disabled (build mode or missing environment variables). Caching will be disabled.');
}

const redis = !isBuilding && process.env.REDIS_HOST && process.env.REDIS_PORT
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