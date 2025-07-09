import dotenv from 'dotenv'
dotenv.config()

import {createClient} from 'redis'

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}
export const redisClient = createClient({
  url: redisUrl,
});


const connectRedis = async() => {
 try {
   await redisClient.connect()
   console.log('Redis connected')
 } catch (error) {
   console.error('Failed to connect to redis', error)
 }
}

export default connectRedis