import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js";
import { redisClient } from "./config/redis.js";

dotenv.config()
await connectDB()
try {
  await redisClient.connect()
  console.log('Redis connected')
} catch (error) {
  console.error('Failed to connect to redis', error)
}
const app = express();

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));