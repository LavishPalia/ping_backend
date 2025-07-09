import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js";
import connectRedis from "./config/redis.js";
import { closeRabbitMQ, connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config()

await connectDB()
await connectRedis()
await connectRabbitMQ()

const app = express();

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  closeRabbitMQ()
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  closeRabbitMQ()
  process.exit(0);
});