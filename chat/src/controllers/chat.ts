import { Response } from "express";
import TryCatch from "../config/TryCatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const { targetUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required" });
    }

    if (userId === targetUserId) {
      return res
        .status(400)
        .json({ message: "Cannot create chat with yourself" });
    }

    const existingChat = await Chat.findOne({
      users: {
        $all: [userId, targetUserId],
        $size: 2,
      },
    });

    if (existingChat) {
      return res
        .status(200)
        .json({ message: "Chat already exists", chatId: existingChat._id });
    }

    const newChat = await Chat.create({
      users: [userId, targetUserId],
    });

    return res
      .status(200)
      .json({ message: "Chat created successfully", chatId: newChat._id });
  }
);
