const kafkaService = require('../services/kafkaService');

async function generateBill(req, res) {
    const rideId = req.params.rideId;

    // Step 1: Get the ride by ID
    kafkaService.sendRequestToService('ride-get-by-id-topic', { rideId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }

        const ride = response.ride;
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Prepare ML model input
        const predictionInput = {
            pickup_latitude: ride.pickupLocation.latitude,
            pickup_longitude: ride.pickupLocation.longitude,
            dropoff_latitude: ride.dropoffLocation.latitude,
            dropoff_longitude: ride.dropoffLocation.longitude,
            passenger_count: ride.passengerCount || 1,
            pickup_time: ride.dateTime, // ensure this is in ISO format
        };

        // Step 2: ML prediction for fare calculation
        kafkaService.sendRequestToService('generate-fare-topic', { predictionInput }, (mlResponse) => {
            if (mlResponse.error) {
                return res.status(400).json({ message: mlResponse.error });
            }
            ride.predictedPrice = mlResponse.predictedFare;
            
            // Step 3: Send ride data to billing only after ride is found and fare is predicted
            kafkaService.sendRequestToService('billing-generate-bill-topic', { ride }, (billingResponse) => {
                if (billingResponse.error) {
                    return res.status(400).json({ message: billingResponse.error });
                }

                res.status(200).json({
                    message: response.message,
                    bill: billingResponse.bill
                });
            });
        });

        
    });
}

async function getAllBills(req, res) {
    kafkaService.sendRequestToService('billing-get-all-bills-topic', {}, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ bills: response.bills });
    });
}

async function searchBills(req, res) {
    const { customerId, driverId, startDate, endDate, minAmount, maxAmount, status } = req.query;
    kafkaService.sendRequestToService('billing-search-bills-topic', {customerId, driverId, startDate, endDate, minAmount, maxAmount, status}, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: response.message, count: response.count, bills: response.bills, query: response.query, availableDateRange: response.availableDateRange });
    });
}

async function getBillById(req, res) {
    const billId = req.params.id;
    kafkaService.sendRequestToService('billing-get-bill-by-id-topic', { billId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ bill: response.bill });
    });
}

async function getBillsByCustomerId(req, res) {
    const customerId = req.params.customerId;
    kafkaService.sendRequestToService('billing-get-bills-by-customer-id-topic', { customerId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ bills: response.bills });
    });
}

async function getBillsByDriverId(req, res) {
    const driverId = req.params.driverId;
    kafkaService.sendRequestToService('billing-get-bills-by-driver-id-topic', { driverId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ bills: response.bills });
    });
}

async function updateBillStatus(req, res) {
    const billId = req.params.id;
    const { status } = req.body;

    kafkaService.sendRequestToService('billing-update-bill-status-topic', { billId, status }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: response.message, bill: response.bill });
    });
}

async function deleteBill(req, res) {
    const billId = req.params.id;
    kafkaService.sendRequestToService('billing-delete-bill-topic', { billId }, (response) => {
        if (response.error) {
            return res.status(400).json({ message: response.error });
        }
        res.status(200).json({ message: response.message });
    });
}


module.exports = {
    generateBill,
    getAllBills,
    searchBills,
    getBillsByCustomerId,
    getBillsByDriverId,
    updateBillStatus,
    deleteBill,
    getBillById,
};