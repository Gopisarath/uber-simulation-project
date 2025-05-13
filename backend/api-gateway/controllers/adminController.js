const kafkaService = require('../services/kafkaService');

async function signup(req, res) {
  const adminData = req.body;

  // Example: Send the signup data to the admin microservice
  kafkaService.sendRequestToService('admin-signup-topic', adminData, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(201).json({ message: 'Admin registered successfully', admin: response.admin });
  });
}

async function login(req, res) {
  const loginData = req.body;

  // Example: Send the login data to the admin microservice
  kafkaService.sendRequestToService('admin-login-topic', loginData, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ message: 'Login successful', token: response.token });
  });
}

async function logout(req, res) {
  res.status(200).json({ message: 'Logout successful' });
}

async function reviewDriver(req, res) {
  const driverId = req.params.driverId;

  kafkaService.sendRequestToService('driver-get-by-id-topic', { driverId }, (response) => {
      if (response.error) {
          return res.status(400).json({ message: response.error });
      }
      const driver = response.driver;

      kafkaService.sendRequestToService('ride-review-driver-topic', { driver, driverId }, (rideResponse) => {
          if (rideResponse.error) {
              return res.status(400).json({ message: rideResponse.error });
          }
          res.status(200).json({ message: 'Driver statistics retrieved', driver: rideResponse.driver, statistics: rideResponse.statistics });
      });
  });
}

async function reviewCustomer(req, res) {
  const customerId = req.params.customerId;

  kafkaService.sendRequestToService('customer-get-by-id-topic', { customerId }, (response) => {
      if (response.error) {
          return res.status(400).json({ message: response.error });
      }
      const customer = response.customer;

      kafkaService.sendRequestToService('ride-review-customer-topic', { customer, customerId }, (rideResponse) => {
          if (rideResponse.error) {
              return res.status(400).json({ message: rideResponse.error });
          }
          res.status(200).json({ message: 'Customer statistics retrieved', customer: rideResponse.customer, statistics: rideResponse.statistics });
      });
  });
}

async function addDriver(req, res) {
  const driverData = req.body;

  kafkaService.sendRequestToService('driver-admin-add-driver-topic', { driverData }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(201).json({ message: 'Driver added successfully', driver: response.driver });
  });
}

async function addCustomer(req, res) {
  const customerData = req.body;

  kafkaService.sendRequestToService('customer-admin-add-customer-topic', { customerData }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(201).json({ message: 'Customer added successfully', customer: response.customer });
  });
}

async function getRevenueStatistics(req, res) {
  const { startDate, endDate, area } = req.query;

  kafkaService.sendRequestToService('ride-admin-get-revenue-statistics-topic', { startDate, endDate, area }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ 
      message: 'Revenue statistics retrieved', 
      dailyRevenue: response.dailyRevenue,
      areaStats: response.areaStats,
      totalRides: response.totalRides,
      totalRevenue: response.totalRevenue,
    });
  });
}

async function getRideStatistics(req, res) {
  const { type } = req.query;

  kafkaService.sendRequestToService('ride-admin-get-ride-statistics-topic', { type }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ 
      message: 'Ride statistics retrieved',
      type: response.type,
      stats: response.stats,
    });
  });
}

async function searchBills(req, res) {
  const { customerId, driverId, startDate, endDate, minAmount, maxAmount, status } = req.query;

  kafkaService.sendRequestToService('billing-admin-search-bills-topic', { customerId, driverId, startDate, endDate, minAmount, maxAmount, status }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ 
      message: response.message, 
      count: response.count,
      bills: response.bills,
    });
  });
}

async function getBillDetails(req, res) {
  const billId = req.params.billId;

  kafkaService.sendRequestToService('billing-get-bill-by-id-topic', { billId }, (billResponse) => {
    if (billResponse.error) {
      return res.status(400).json({ message: billResponse.error });
    }
    const bill = billResponse.bill;
    
    kafkaService.sendRequestToService('ride-get-by-id-topic', { rideId: bill.rideId }, (rideResponse) => {
      if (rideResponse.error) {
        return res.status(400).json({ message: rideResponse.error });
      }
      res.status(200).json({ 
        message: 'Bill details retrieved', 
        bill,
        ride: rideResponse.ride,
      });

    });
  });
}

module.exports = { 
  signup, 
  login,
  logout,
  reviewDriver,
  reviewCustomer,
  addDriver,
  addCustomer,
  getRevenueStatistics,
  getRideStatistics,
  searchBills,
  getBillDetails,
 };