import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js";
import cors from "cors";
import { app, server } from "./config/socket.js";

dotenv.config();

const port = process.env.PORT || 5002;

await connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use("/api/v1/chats", chatRoutes);

server.listen(port, () =>
  console.log(`Chat Server is running on port ${port}`)
);
