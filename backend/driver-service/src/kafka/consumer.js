const { Kafka } = require('kafkajs');
const { 
    handleSignup, 
    handleLogin, 
    handleGetAll,
    handleSearch,
    handleGetById,
    handleUpdate,
    handleDelete,
    handleAddVideo,
    handleGetVideos,
    handleAddDriver,
} = require('../controllers/driverController');

const kafka = new Kafka({ clientId: 'driver-service', brokers: [process.env.KAFKA_BROKERS] });
const consumer = kafka.consumer({ groupId: 'driver-service-group' });

async function startConsumer() {
    await consumer.connect();
    
    const topics = [
        { topic: 'driver-signup-topic', handler: handleSignup },
        { topic: 'driver-login-topic', handler: handleLogin },
        { topic: 'driver-get-all-topic', handler: handleGetAll },
        { topic: 'driver-search-topic', handler: handleSearch },
        { topic: 'driver-get-by-id-topic', handler: handleGetById },
        { topic: 'driver-update-topic', handler: handleUpdate },
        { topic: 'driver-delete-topic', handler: handleDelete },
        { topic: 'driver-add-video-topic', handler: handleAddVideo },
        { topic: 'driver-get-videos-topic', handler: handleGetVideos },
        { topic: 'driver-admin-add-driver-topic', handler: handleAddDriver },
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