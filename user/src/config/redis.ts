import dotenv from 'dotenv'
dotenv.config()

import {createClient} from 'redis'

export const redisClient = createClient({
  url: process.env.REDIS_URL
})