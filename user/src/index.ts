import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import connectRedis from "./config/redis.js";
import { closeRabbitMQ, connectRabbitMQ } from "./config/rabbitmq.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

await connectDB();
await connectRedis();
await connectRabbitMQ();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", userRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  closeRabbitMQ();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  closeRabbitMQ();
  process.exit(0);
});
