require('dotenv').config();
const connectDB = require("./config/db");
const { startConsumer } = require('./kafka/consumer');
const { connectProducer } = require('./kafka/producer');
const { connectRedis } = require('./config/cache'); 

(async () => {
    try {
      await connectDB();
      await connectRedis();
      await connectProducer();
      await startConsumer();
  
      console.log('✅ Admin microservice started');
    } catch (err) {
      console.error('❌ Error starting microservice:', err);
      process.exit(1);
    }
  })();