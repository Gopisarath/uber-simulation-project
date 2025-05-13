const kafkaService = require('../services/kafkaService');

async function createRide(req, res) {
    const rideData = req.body;

    kafkaService.sendRequestToService('ride-create-topic', rideData, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(201).json({ message: 'Ride created successfully', ride: response.ride });
    });
}

async function getRideById(req, res) {
    const rideId = req.params.id;

    kafkaService.sendRequestToService('ride-get-by-id-topic', { rideId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ ride: response.ride });
    });
}

async function getAllRides(req, res) {
    kafkaService.sendRequestToService('ride-get-all-topic', {}, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ rides: response.rides });
    });
}

async function updateRide(req, res) {
    const rideId = req.params.id;
    const rideData = req.body;

    kafkaService.sendRequestToService('ride-update-topic', { rideId, rideData }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: 'Ride updated successfully', ride: response.ride });
    });
}

async function deleteRide(req, res) {
    const rideId = req.params.id;

    kafkaService.sendRequestToService('ride-delete-topic', { rideId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: response.message });
    });
}

async function updateRideStatus(req, res) {
    const rideId = req.params.id;
    const { status } = req.body;

    kafkaService.sendRequestToService('ride-update-status-topic', { rideId, status }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: 'Ride status updated successfully', ride: response.ride });
    });
}

async function getRidesByCustomerId(req, res) {
    const customerId = req.params.customerId;

    kafkaService.sendRequestToService('ride-get-by-customer-id-topic', { customerId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ rides: response.rides });
    });
}

async function getRidesByDriverId(req, res) {
    const driverId = req.params.driverId;

    kafkaService.sendRequestToService('ride-get-by-driver-id-topic', { driverId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ rides: response.rides });
    });
}

async function getRideStatistics(req, res) {
    const { city, state } = req.query;

    kafkaService.sendRequestToService('ride-get-statistics-topic', { city, state }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ statistics: response.statistics });
    });
}

async function uploadRideImages(req, res) {
    const rideId = req.params.id;
    const { images } = req.body; 

    kafkaService.sendRequestToService('ride-upload-images-topic', { rideId, images }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: response.message, rideId: response.rideId, media: response.media });
    });
}

module.exports = {
    createRide,
    getRideById,
    getAllRides,
    updateRide,
    deleteRide,
    updateRideStatus,
    getRidesByCustomerId,
    getRidesByDriverId,
    getRideStatistics,
    uploadRideImages,
};