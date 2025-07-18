import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
  users: mongoose.Types.ObjectId[];
  latestMessage: {
    sender: mongoose.Types.ObjectId;
    text: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema: Schema<IChat> = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    latestMessage: {
      text: String,
      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: function (sender: mongoose.Types.ObjectId) {
            return this.users.some((userId) => userId.equals(sender));
          },
          message: "Sender must be one of the chat participants",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
