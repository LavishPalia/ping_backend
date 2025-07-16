import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer, stopSendOtpConsumer } from "./consumer.js";

dotenv.config();

await startSendOtpConsumer();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "mail" });
});

const port = process.env.PORT || 5001;

app.listen(port, () => console.log(`Server running on port ${port}`));

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await stopSendOtpConsumer();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await stopSendOtpConsumer();
  process.exit(0);
});
