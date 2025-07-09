import amqp from 'amqplib'

let channel: amqp.Channel;
let connection: amqp.ChannelModel

export const connectRabbitMQ = async () => {
  try {
    if (
      !process.env.RABBITMQ_HOST ||
      !process.env.RABBITMQ_USERNAME ||
      !process.env.RABBITMQ_PASSWORD
    ) {
      throw new Error('Missing required RabbitMQ environment variables');
    }

     connection = await amqp.connect({
      protocol: 'amqp',
      hostname: process.env.RABBITMQ_HOST,
      port: parseInt(process.env.RABBITMQ_PORT || '5672'),
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD
    })

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
    });

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
    const success = channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {persistent: true})
    if (!success) {
      throw new Error('Failed to send message to queue (buffer full)');
    }
    console.log(`Message sent to queue: ${queueName}`);
  } catch (error) {
    console.error(`Failed to publish to queue ${queueName}:`, error);
    throw error;
  }
}

export const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
}