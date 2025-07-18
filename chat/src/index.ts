import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();

const port = process.env.PORT || 5002;

await connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/chats", chatRoutes);

app.listen(port, () => console.log(`Chat Server is running on port ${port}`));
