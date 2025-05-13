const { Kafka } = require('kafkajs');
const{ handleSignup, handleLogin } = require('../controllers/adminController');

const kafka = new Kafka({ clientId: 'admin-service', brokers: [process.env.KAFKA_BROKERS] });
const consumer = kafka.consumer({ groupId: 'admin-service-group' });

async function startConsumer() {
    await consumer.connect();
    
    const topics = [
        { topic: 'admin-signup-topic', handler: handleSignup },
        { topic: 'admin-login-topic', handler: handleLogin },
    ];
    
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