import amqp from "amqplib";
import dotenv from "dotenv";
import transporter from "./config/nodemailer.js";

dotenv.config();

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export const startSendOtpConsumer = async () => {
  try {
    if (
      !process.env.RABBITMQ_HOST ||
      !process.env.RABBITMQ_USERNAME ||
      !process.env.RABBITMQ_PASSWORD
    ) {
      throw new Error("Missing required RabbitMQ environment variables");
    }

    connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.RABBITMQ_HOST,
      port: parseInt(process.env.RABBITMQ_PORT || "5672"),
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
    });

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
    });

    channel = await connection.createChannel();

    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });

    console.log(
      "✅ Mail service Send OTP consumer started listening for otp emails"
    );

    channel.consume(queueName, (message) => {
      if (message) {
        try {
          const { to, subject, body } = JSON.parse(message.content.toString());

          // Validate message structure
          if (!to || !subject || !body) {
            console.error("Invalid message structure:", { to, subject, body });
            channel?.nack(message, false, false); // Reject and don't requeue
            return;
          }

          const mailOptions = {
            from: "Ping",
            to,
            subject,
            text: body,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Failed to send otp email", error);
              channel?.nack(message, false, true);
            } else {
              console.log(`Otp email sent successfully to ${to}`);
              console.log("info", info);
              channel?.ack(message);
            }
          });
        } catch (error) {
          console.error("Failed to parse message", error);
          channel?.nack(message, false, false);
        }
      }
    });
  } catch (error) {
    console.error("Failed to start send otp consumer", error);
    throw error;
  }
};

export const stopSendOtpConsumer = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log("Send OTP consumer stopped gracefully");
  } catch (error) {
    console.error("Error stopping consumer:", error);
  }
};
