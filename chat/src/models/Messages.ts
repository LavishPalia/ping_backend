import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema: Schema<IMessage> = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    text: String,
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      url: String,
      publicId: String,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Messages = mongoose.model<IMessage>("Messages", messageSchema);
