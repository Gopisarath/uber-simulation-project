const kafkaService = require('../services/kafkaService');

async function signup(req, res) {
  const driverData = req.body;

  // Example: Send the signup data to the driver microservice
  kafkaService.sendRequestToService('driver-signup-topic', driverData, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(201).json({ message: 'Driver registered successfully', driver: response.driver });
  });
}

async function login(req, res) {
  const loginData = req.body;

  // Example: Send the login data to the driver microservice
  kafkaService.sendRequestToService('driver-login-topic', loginData, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ message: 'Login successful', token: response.token });
  });
}

async function logout(req, res) {
  res.status(200).json({ message: 'Logout successful' });
}

async function getAllDrivers(req, res) {
  // Example: Send the request to the driver microservice
  kafkaService.sendRequestToService('driver-get-all-topic', {}, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ drivers: response.drivers });
  });
}

async function searchDrivers(req, res) {
  const { firstName, lastName, city, state, rating, carMake, carModel } = req.query;

  kafkaService.sendRequestToService('driver-search-topic', { firstName, lastName, city, state, rating, carMake, carModel }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ drivers: response.drivers });
  });
}

async function getDriverById(req, res) {
  const driverId = req.params.id;

  // Example: Send the request to the driver microservice
  kafkaService.sendRequestToService('driver-get-by-id-topic', { driverId }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ driver: response.driver });
  });
}

async function updateDriver(req, res) {
  const driverId = req.params.id;
  const updateData = req.body;

  // Example: Send the update data to the driver microservice
  kafkaService.sendRequestToService('driver-update-topic', { driverId, updateData }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ message: response.message, driver: response.driver });
  });
}

async function deleteDriver(req, res) {
  const driverId = req.params.id;

  // Example: Send the delete request to the driver microservice
  kafkaService.sendRequestToService('driver-delete-topic', { driverId }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ message: response.message });
  });
}

async function addDriverVideo(req, res) {
  const driverId = req.params.id;
  const videoUrl = req.body.videoUrl;

  // Example: Send the video data to the driver microservice
  kafkaService.sendRequestToService('driver-add-video-topic', { driverId, videoUrl }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ message: 'Video added successfully', driver: response.driver });
  });
}

async function getDriverVideos(req, res) {
  const driverId = req.params.id;

  // Example: Send the request to the driver microservice
  kafkaService.sendRequestToService('driver-get-videos-topic', { driverId }, (response) => {
    if (response.error) {
      return res.status(400).json({ message: response.error });
    }
    res.status(200).json({ videos: response.videos });
  });
}

module.exports = {
    signup,
    login,
    logout,
    getAllDrivers,
    searchDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
    addDriverVideo,
    getDriverVideos,
    
};