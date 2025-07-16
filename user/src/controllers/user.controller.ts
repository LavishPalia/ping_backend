import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { redisClient } from "../config/redis.js";
import TryCatch from "../config/TryCatch.js";
import { User } from "../models/User.model.js";

export const login = TryCatch(async (req, res) => {
  const { email } = req.body;

  const rateLimitKey = `otp:rateLimit:${email}`;

  const rateLimit = await redisClient.get(rateLimitKey);

  if (rateLimit) {
    res.status(429).json({
      message:
        "Too many requests. Please wait for 60 seconds before requesting new OTP",
    });

    return;
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpKey = `otp:${email}`;

  await redisClient.set(otpKey, otp, { EX: 300 });
  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  const message = {
    to: email,
    subject: "OTP for login to PING",
    body: `Your otp is ${otp}. This otp is valid for 5 minutes`,
  };

  await publishToQueue("send-otp", message);

  res.status(200).json({ message: "OTP sent to your mail" });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp: enteredOtp } = req.body;

  if (!email || !enteredOtp) {
    res.status(400).json({ message: "Email and otp are required" });
    return;
  }

  const otpKey = `otp:${email}`;

  const storedOtp = await redisClient.get(otpKey);

  if (!storedOtp || storedOtp !== enteredOtp) {
    res.status(400).json({ message: "Invalid otp" });
    return;
  }

  await redisClient.del(otpKey);

  let user = await User.findOne({ email });

  if (!user) {
    const name = email.slice(0, email.indexOf("@"));
    user = await User.create({ name, email });
  }

  const token = generateToken(user);

  res.status(200).json({ message: "User verified", user, token });
});
