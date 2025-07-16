import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

export const generateToken = (user: any) => {
  return jwt.sign({ user }, ACCESS_TOKEN_SECRET, {
    expiresIn: "15d",
  });
};
