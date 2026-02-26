import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// 5 login attempts per email per 15-minute sliding window
export const loginRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'jobsite:login',
})
