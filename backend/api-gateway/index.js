const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { initKafka } = require('./services/kafkaService');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const rideRoutes = require('./routes/rideRoutes');
const billingRoutes = require('./routes/billingRoutes');

const app = express();
const port = process.env.PORT || 3000;

corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/billing', billingRoutes);


// Initialize Kafka
initKafka();

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});