# REDIS SETUP FOR ENTERPRISE RATE LIMITING

## Option 1: Upstash Redis (Recommended for production)

### 1. Create Upstash Redis instance
1. Go to https://upstash.com/
2. Create a new Redis database
3. Copy the REST URL and token

### 2. Add to environment variables
```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 3. Install Redis client
```bash
npm install redis
npm install @upstash/redis
```

## Option 2: Local Redis (Development)

### 1. Install Redis locally
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 2. Add to environment variables
```env
REDIS_URL=redis://localhost:6379
```

## Option 3: Redis Cloud (Enterprise)

### 1. Create Redis Cloud instance
1. Go to https://redis.com/
2. Create a new database
3. Get connection details

### 2. Add to environment variables
```env
REDIS_URL=redis://username:password@your-redis-cloud-url:port
```

## Testing Redis Connection

```bash
# Test Redis connectivity
node -e "
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL });
client.connect().then(() => {
  console.log('✅ Redis connected successfully');
  client.disconnect();
}).catch(err => {
  console.error('❌ Redis connection failed:', err);
});
"
```

## Performance Monitoring

Monitor these Redis metrics:
- Memory usage
- Connection count
- Command latency
- Hit/miss ratio

## Scaling Considerations

- Use Redis Cluster for high availability
- Consider Redis Sentinel for automatic failover
- Monitor memory usage and implement eviction policies
- Use connection pooling for high-traffic applications
