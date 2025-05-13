const { Kafka } = require('kafkajs');
const { 
  handleSignup, 
  handleLogin, 
  handleGetAll, 
  handleDelete, 
  handleGetById, 
  handleGetNearbyDrivers,
  handleAddCustomer,
 } = require('../controllers/customerController');

const kafka = new Kafka({ clientId: 'customer-service', brokers: [process.env.KAFKA_BROKERS] });
const consumer = kafka.consumer({ groupId: 'customer-service-group' });

async function startConsumer() {
  await consumer.connect();

  const topics = [
    { topic: 'customer-signup-topic', handler: handleSignup },
    { topic: 'customer-login-topic', handler: handleLogin },
    { topic: 'customer-get-all-topic', handler: handleGetAll },
    { topic: 'customer-delete-topic', handler: handleDelete },
    { topic: 'customer-get-by-id-topic', handler: handleGetById },
    { topic: 'customer-get-nearby-drivers-topic', handler: handleGetNearbyDrivers },
    { topic: 'customer-admin-add-customer-topic', handler: handleAddCustomer },
  ]

  for (const { topic } of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const { correlation_id, data } = JSON.parse(message.value.toString());
      const topicHandler = topics.find(t => t.topic === topic)?.handler;
      if (topicHandler) await topicHandler(data, correlation_id);
    }
  });

  console.log("✅ Kafka consumer connected");
}

module.exports = { startConsumer };
