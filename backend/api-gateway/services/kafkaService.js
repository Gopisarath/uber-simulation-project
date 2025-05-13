const { Kafka } = require("kafkajs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const kafka = new Kafka({ clientId: "api-gateway", brokers: [process.env.KAFKA_BROKERS] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "api-gateway-response-group" });

const pendingRequests = {};

async function initKafka() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: "api-gateway-response", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const res = JSON.parse(message.value.toString());
      const correlationId = res.correlation_id;

      const callback = pendingRequests[correlationId];
      if (callback) {
        callback(res.data);
        delete pendingRequests[correlationId];
      } else {
        console.warn(`No pending request for correlation_id: ${correlationId}`);
      }
    },
  });
}

const TIMEOUT_MS = 10000;

async function sendRequestToService(topic, data, callback) {
  const correlationId = uuidv4();

  const timeout = setTimeout(() => {
    if (pendingRequests[correlationId]) {
      delete pendingRequests[correlationId];
      callback({ error: `❌ No response from topic: '${topic}'` });
    }
  }, TIMEOUT_MS);

  // Store the callback along with the timeout reference
  pendingRequests[correlationId] = (response) => {
    clearTimeout(timeout); // Clear timeout if response arrives in time
    callback(response);
  };

  await producer.send({
    topic,
    messages: [{ value: JSON.stringify({ correlation_id: correlationId, data }) }],
  });
}

module.exports = { initKafka, sendRequestToService };