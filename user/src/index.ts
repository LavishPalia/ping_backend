import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js";

dotenv.config()
await connectDB()

const app = express();

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));