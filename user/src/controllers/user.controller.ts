import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { redisClient } from "../config/redis.js";
import TryCatch from "../config/TryCatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
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

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  res.status(200).json(user);
});

export const updateName = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ message: "Name is required" });
    return;
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    console.log("User not found");

    res.status(404).json({ message: "User not found" });
    return;
  }

  user.name = name;

  await user.save();

  const token = generateToken(user);

  res.status(200).json({ message: "User updated", user, token });
});

export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find({}, { __v: 0 }) // Exclude sensitive fields
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.status(200).json({
    message: "Users fetched successfully",
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getUser = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json(user);
});
