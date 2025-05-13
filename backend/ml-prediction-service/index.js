const { Kafka } = require('kafkajs');
const axios = require('axios');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'fare-prediction-service',
  brokers: [process.env.KAFKA_BROKERS],
});

const consumer = kafka.consumer({ groupId: 'fare-prediction-group' });
const producer = kafka.producer();

async function start() {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: 'generate-fare-topic', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const { correlation_id, data } = JSON.parse(message.value.toString());
        console.log("🔍 Data being sent to FastAPI:", data);
        // Call FastAPI ML model
        const response = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, data.predictionInput);
        const predictedFare = response.data.fare_amount;

        // Send prediction back via Kafka
        await producer.send({
          topic: 'api-gateway-response',
          messages: [{value: JSON.stringify({correlation_id: correlation_id, data: {predictedFare} }) }]
        });

        console.log(`Sent predicted fare: ${predictedFare}`);
      } catch (err) {
        console.error('Error handling fare prediction:', err.message);
      }
    }
  });
}

start();
