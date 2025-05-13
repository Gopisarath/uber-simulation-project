const { Kafka } = require('kafkajs');
const { 
    handleGenerateBill,
    getAllBills,
    searchBills,
    getBillsByCustomerId,
    getBillsByDriverId,
    updateBillStatus,
    deleteBill,
    handleAdminSearchBills,
    getBillById,
} = require('../controllers/billingController');

const kafka = new Kafka({ clientId: 'billing-service', brokers: [process.env.KAFKA_BROKERS] });
const consumer = kafka.consumer({ groupId: 'billing-service-group' });

async function startConsumer() {
    await consumer.connect();
    
    const topics = [
        { topic: 'billing-generate-bill-topic', handler: handleGenerateBill },
        { topic: 'billing-get-all-bills-topic', handler: getAllBills },
        { topic: 'billing-search-bills-topic', handler: searchBills },
        { topic: 'billing-get-bills-by-customer-id-topic', handler: getBillsByCustomerId },
        { topic: 'billing-get-bills-by-driver-id-topic', handler: getBillsByDriverId },
        { topic: 'billing-update-bill-status-topic', handler: updateBillStatus },
        { topic: 'billing-delete-bill-topic', handler: deleteBill },
        { topic: 'billing-admin-search-bills-topic', handler: handleAdminSearchBills },
        { topic: 'billing-get-bill-by-id-topic', handler: getBillById },
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