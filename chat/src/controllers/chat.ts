import { Types } from "mongoose";
import TryCatch from "../config/TryCatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { IMessage, Messages } from "../models/Messages.js";
import axios from "axios";
import { getReceiverSocketId, io } from "../config/socket.js";

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
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

export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const chats = await Chat.find({
    users: userId,
  }).sort({ updatedAt: -1 });

  const chatWithUserData = await Promise.all(
    chats?.map(async (chat) => {
      const otherUserId = chat.users.find((id) => !id.equals(userId));

      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: otherUserId,
        seen: false,
      });

      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/users/user/${otherUserId}`
        );

        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage,
            unseenCount,
          },
        };
      } catch (error) {
        console.error(`Failed to fetch user data for ${otherUserId}:`, error);
        return {
          user: {
            _id: otherUserId,
            name: "Unknown User",
          },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage,
            unseenCount,
          },
        };
      }
    })
  );

  return res
    .status(200)
    .json({ message: "Chats fetched successfully", chats: chatWithUserData });
});

export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;

  if (!senderId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { chatId, text } = req.body;

  const imageFile = req.file;

  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }

  if (!text && !imageFile) {
    return res.status(400).json({ message: "Text or image is required" });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const isUserInChat = chat.users.some((userId) => userId.equals(senderId));

  if (!isUserInChat) {
    return res
      .status(403)
      .json({ message: "User not a participant of this chat" });
  }

  const otherUserId = chat.users.find((id) => !id.equals(senderId));

  if (!otherUserId) {
    return res.status(404).json({ message: "Other user not found" });
  }

  //TODO: socket setup
  const receiverSocketId = getReceiverSocketId(otherUserId.toString());

  let isReceiverOnline = false;

  if (receiverSocketId) {
    const receiverSocket = io.sockets.sockets.get(receiverSocketId);

    if (receiverSocket && receiverSocket.rooms.has(chatId)) {
      isReceiverOnline = true;
    }
  }

  let messageData: Partial<IMessage> = {
    chatId,
    sender: new Types.ObjectId(senderId),
    seen: isReceiverOnline,
    seenAt: isReceiverOnline ? new Date() : undefined,
  };

  if (imageFile) {
    messageData.image = { url: imageFile.path, publicId: imageFile.filename };
    messageData.messageType = "image";
    messageData.text = text || "";
  } else {
    messageData.text = text;
    messageData.messageType = "text";
  }

  const savedMessage = await Messages.create(messageData);

  const latestMessageText = imageFile ? `📷 ${imageFile.originalname}` : text;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true }
  );

  // TODO: emit to sockets
  io.to(chatId).emit("newMessage", savedMessage);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", savedMessage);
  }

  const senderSocketId = getReceiverSocketId(senderId.toString());

  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", savedMessage);
  }

  if (isReceiverOnline && senderSocketId) {
    io.to(senderSocketId).emit("messageSeen", {
      chatId,
      seenBy: otherUserId,
      messageIds: [savedMessage._id],
    });
  }

  return res.status(201).json({
    message: "Message sent successfully",
    savedMessage,
    sender: senderId,
  });
});

export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isUserInChat = chat.users.some((id) => id.equals(userId));

    if (!isUserInChat) {
      return res
        .status(403)
        .json({ message: "User not a participant of this chat" });
    }

    const messagesToMarkAsSeen = await Messages.find({
      chatId,
      sender: { $ne: userId },
      seen: false,
    });

    await Messages.updateMany(
      {
        chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );

    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

    const otherUserId = chat.users.find((id) => !id.equals(userId));

    if (!otherUserId) {
      return res.status(404).json({ message: "Other user not found" });
    }

    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/users/user/${otherUserId}`
      );

      // TODO: socket related work

      if (messagesToMarkAsSeen.length > 0) {
        const OtherUserSocketId = getReceiverSocketId(otherUserId.toString());

        if (OtherUserSocketId) {
          io.to(OtherUserSocketId).emit("messageSeen", {
            chatId,
            seenBy: userId,
            messageIds: messagesToMarkAsSeen.map((message) => message._id),
          });
        }
      }

      return res.status(200).json({
        message: "Messages fetched successfully",
        messages,
        user: data,
      });
    } catch (error) {
      console.error(`Failed to fetch user data for ${otherUserId}:`, error);

      return res.status(200).json({
        message: "Messages fetched successfully",
        messages,
        user: { _id: otherUserId, name: "Unknown User" },
      });
    }
  }
);
