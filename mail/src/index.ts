import express from "express"
import dotenv from "dotenv"

dotenv.config()

const app = express();

const port = process.env.PORT || 5001;

app.listen(port, () => console.log(`Server running on port ${port}`));

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});