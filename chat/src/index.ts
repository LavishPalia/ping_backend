import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();

const port = process.env.PORT;

connectDB();

app.use(express.json());

app.use("/api/v1/chats", chatRoutes);

app.listen(port, () => console.log(`Chat Server is running on port ${port}`));
