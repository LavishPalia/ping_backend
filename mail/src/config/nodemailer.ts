import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error(
    "Missing required Gmail environment variables: GMAIL_USER and GMAIL_APP_PASSWORD"
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default transporter;
