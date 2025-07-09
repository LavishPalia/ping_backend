import amqp from 'amqplib'

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    if (
      !process.env.RABBITMQ_HOST ||
      !process.env.RABBITMQ_USERNAME ||
      !process.env.RABBITMQ_PASSWORD
    ) {
      throw new Error('Missing required RabbitMQ environment variables');
    }

    const connection = await amqp.connect({
      protocol: 'amqp',
      hostname: process.env.RABBITMQ_HOST,
      port: 5672,
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD
    })

    channel = await connection.createChannel()

    console.log('✅ Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}
export const publishToQueue = async (queueName: string, message: any) => {
  if(!channel) {
    throw new Error('RabbitMQ channel is not initialized');
  }

  try {
    await channel.assertQueue(queueName, {durable: true})
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {persistent: true})
    console.log(`Message sent to queue: ${queueName}`);
  } catch (error) {
    console.error(`Failed to publish to queue ${queueName}:`, error);
    throw error;
  }
}