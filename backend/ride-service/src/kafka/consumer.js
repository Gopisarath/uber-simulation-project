const { Kafka } = require('kafkajs');
const { 
    handleCreateRide, 
    handleGetRideById, 
    handleGetAllRides, 
    handleUpdateRide, 
    handleDeleteRide,
    handleUpdateRideStatus,
    handleGetRidesByCustomerId,
    handleGetRidesByDriverId,
    handleGetRideStatistics,
    handleUploadRideImages,
    handleReviewDriver,
    handleReviewCustomer,
    handleAdminGetRevenueStatistics,
    handleAdminGetRideStatistics,
 } = require('../controllers/rideController');

const kafka = new Kafka({ clientId: 'ride-service', brokers: [process.env.KAFKA_BROKERS] });
const consumer = kafka.consumer({ groupId: 'ride-service-group' });

async function startConsumer() {
    await consumer.connect();
    
    const topics = [
        { topic: 'ride-create-topic', handler: handleCreateRide },
        { topic: 'ride-get-by-id-topic', handler: handleGetRideById },
        { topic: 'ride-get-all-topic', handler: handleGetAllRides},
        { topic: 'ride-update-topic', handler: handleUpdateRide },
        { topic: 'ride-delete-topic', handler: handleDeleteRide },
        { topic: 'ride-update-status-topic', handler: handleUpdateRideStatus },
        { topic: 'ride-get-by-customer-id-topic', handler: handleGetRidesByCustomerId },
        { topic: 'ride-get-by-driver-id-topic', handler: handleGetRidesByDriverId },
        { topic: 'ride-get-statistics-topic', handler: handleGetRideStatistics },
        { topic: 'ride-upload-images-topic', handler: handleUploadRideImages },
        { topic: 'ride-review-driver-topic', handler: handleReviewDriver },
        { topic: 'ride-review-customer-topic', handler: handleReviewCustomer },
        { topic: 'ride-admin-get-revenue-statistics-topic', handler: handleAdminGetRevenueStatistics },
        { topic: 'ride-admin-get-ride-statistics-topic', handler: handleAdminGetRideStatistics },
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