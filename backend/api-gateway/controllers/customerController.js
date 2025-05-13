const kafkaService = require('../services/kafkaService');

async function signup(req, res) {
  const customerData = req.body;

  // Example: Send the signup data to the customer microservice
  kafkaService.sendRequestToService('customer-signup-topic', customerData, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(201).json({ message: 'Customer registered successfully', customer: response.customer });
  });
}

async function login(req, res) {
  const loginData = req.body;

  // Example: Send the login data to the customer microservice
  kafkaService.sendRequestToService('customer-login-topic', loginData, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ message: 'Login successful', token: response.token });
  });
}

async function logout(req, res) {
    res.status(200).json({ message: 'Logout successful' });
}

async function getAllCustomers(req, res) {
    // Example: Send the request to the customer microservice
    kafkaService.sendRequestToService('customer-get-all-topic', {}, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ customers: response.customers });
    });
}

async function deleteCustomer(req, res) {
    const customerId = req.params.id;

    // Example: Send the delete request to the customer microservice
    kafkaService.sendRequestToService('customer-delete-topic', { customerId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: response.message });
    });
}

async function getCustomerById(req, res) {
    const customerId = req.params.id;

    // Example: Send the request to the customer microservice
    kafkaService.sendRequestToService('customer-get-by-id-topic', { customerId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ customer: response.customer });
    });
}

async function getNearbyDrivers(req, res) {
    kafkaService.sendRequestToService('driver-get-all-topic', {}, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        const drivers = response.drivers;

        const { latitude, longitude } = req.query;

        console.log('Latitude:', latitude);
        console.log('Longitude:', longitude);
        
        kafkaService.sendRequestToService('customer-get-nearby-drivers-topic', { latitude, longitude, drivers }, (driverResponse) => {
            if (response.error) {
                return res.status(400).json({ message: driverResponse.error });
            }
            res.status(200).json({ drivers: driverResponse.drivers, count: driverResponse.count });
        });
    }); 
}

module.exports = { 
    signup, 
    login, 
    logout, 
    getAllCustomers,
    deleteCustomer,
    getCustomerById,
    getNearbyDrivers
};