import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    if (
      !process.env.RABBITMQ_HOST ||
      !process.env.RABBITMQ_USERNAME ||
      !process.env.RABBITMQ_PASSWORD ||
      !process.env.GMAIL_USER ||
      !process.env.GMAIL_APP_PASSWORD
    ) {
      throw new Error(
        "Missing required RabbitMQ or Gmail environment variables"
      );
    }

    const connection = await amqp.connect({
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

    const channel = await connection.createChannel();

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
            channel.nack(message, false, false); // Reject and don't requeue
            return;
          }

          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD,
            },
          });

          const mailOptions = {
            from: "Ping",
            to,
            subject,
            text: body,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Failed to send otp email", error);
              channel.nack(message, false, true);
            } else {
              console.log(`Otp email sent successfully to ${to}`);
              console.log("info", info);
              channel.ack(message);
            }
          });
        } catch (error) {
          console.error("Failed to parse message", error);
          channel.nack(message, false, false);
        }
      }
    });
  } catch (error) {
    console.error("Failed to start send otp consumer", error);
    throw error;
  }
};
