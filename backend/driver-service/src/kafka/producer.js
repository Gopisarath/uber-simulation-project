const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({ clientId: 'driver-service', brokers: [process.env.KAFKA_BROKERS] });
const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log("✅ Kafka producer connected");
}

async function sendResponseToGateway(correlationId, data) {
  await producer.send({
    topic: 'api-gateway-response',
    messages: [{ value: JSON.stringify({ correlation_id: correlationId, data }) }]
  });
}

module.exports = { connectProducer, sendResponseToGateway };