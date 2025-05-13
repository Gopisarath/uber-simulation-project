const Billing = require('../models/BillingModel');
const { sendResponseToGateway } = require('../kafka/producer');
require('dotenv').config();
const { redisClient } = require('../config/cache');
const { invalidateCache } = require('../helpers/cacheInvalidationHelper');

async function handleGenerateBill(data, correlationId) {
    try {
        const { ride } = data;

        const existingBill = await Billing.findOne({ rideId: ride.rideId });
        if (existingBill) {
            return sendResponseToGateway(correlationId, {
                error: 'Bill for this ride already exists',
            });
        }

        // Create new bill and save to DB
        const bill = new Billing({ 
            billingId: `BILL-${Date.now()}`,
            date: new Date(),
            pickupTime: ride.dateTime,
            dropoffTime: new Date(),
            distanceCovered: ride.actualDistance,
            totalAmount: ride.actualPrice,
            sourceLocation: ride.pickupLocation,
            destinationLocation: ride.dropoffLocation,
            rideId: ride.rideId,
            driverId: ride.driverId,
            customerId: ride.customerId,
            predictedPrice: ride.predictedPrice,
            actualPrice: ride.actualPrice,
            status: "completed",
            paymentMethod: "credit_card",
        });

        await bill.save();

        invalidateCache([
            'bills:all',
            `bill:${bill.billingId}`,
            `bills:customer:${bill.customerId}`,
            `bills:driver:${bill.driverId}`,
            `admin:bill:${bill.billingId}`
        ]).then(() => {
            console.log('✅ Cache invalidated for billing');
        }).catch((err) => {
            console.error('Cache invalidation error:', err);
        });

        return sendResponseToGateway(correlationId, {
            message: 'Bill generated successfully',
            bill: bill.toObject(),
        });
        
    } catch (error) {
        // Send error response back to the gateway
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function getAllBills(data, correlationId) {
    try {
        const cacheKey = `bills:all`;
        const useCache = process.env.USE_REDIS_CACHE === 'true';

        if (useCache) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('✅ Cache hit: All Bills');
                    return sendResponseToGateway(correlationId, { bills: JSON.parse(cachedData) });
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
        }

        const bills = await Billing.find({});

        if (useCache) {
            await redisClient.set(cacheKey, JSON.stringify(bills), { EX: 300 });  // 5 min cache
            console.log('✅ Cached: All Bills');
        }

        return sendResponseToGateway(correlationId, { bills });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function searchBills(data, correlationId) {
    try {
        const { customerId, driverId, startDate, endDate, minAmount, maxAmount, status } = data;
        const query = {};

        if (customerId) query.customerId = customerId;
        if (driverId) query.driverId = driverId;
        if (status) query.status = status;

        // Date range
        if (startDate || endDate) {
            query.date = {};

            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    return sendResponseToGateway(correlationId, {
                        error: "Invalid start date format. Use YYYY-MM-DD",
                    });
                }
            
                // Set start date to beginning of day
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
                console.log("Start date:", start);
            }

            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        message: "Invalid end date format. Use YYYY-MM-DD",
                    });
                }
                // Set end date to end of day
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
                console.log("End date:", end);
            }
        }

        // Amount range
        if (minAmount || maxAmount) {
            query.totalAmount = {};
            if (minAmount) {
                const min = parseFloat(minAmount);
                if (isNaN(min)) {
                    return sendResponseToGateway(correlationId, {
                        error: "Invalid minimum amount",  
                    });
                }
                query.totalAmount.$gte = min;
            }
            if (maxAmount) {
                const max = parseFloat(maxAmount);
                if (isNaN(max)) {
                    return sendResponseToGateway(correlationId, {
                       error: "Invalid maximum amount",
                    });
                }
                query.totalAmount.$lte = max;
            }
        }

        console.log("Final search query:", JSON.stringify(query, null, 2));

        // CACHE: build a stable key (important: avoid JSON.stringify randomness)
        const cacheKey = `bills:search:customerId=${customerId || 'any'}:driverId=${driverId || 'any'}:status=${status || 'any'}:start=${startDate || 'any'}:end=${endDate || 'any'}:min=${minAmount || 'any'}:max=${maxAmount || 'any'}`;

        const useCache = process.env.USE_REDIS_CACHE === 'true';

        if (useCache) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('✅ Cache hit: Search Bills');
                    return sendResponseToGateway(correlationId, JSON.parse(cachedData));
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
        }

        // First, get all bills for the customer to check date range
        const allBills = await Billing.find({ customerId });
        console.log("All bills for customer:", allBills.length);

        if (allBills.length > 0) {
            const firstBill = allBills[0];
            const lastBill = allBills[allBills.length - 1];
            console.log("First bill date:", firstBill.date);
            console.log("Last bill date:", lastBill.date);
        }

        const bills = await Billing.find(query);
        console.log("Found bills:", bills.length);

        // Get date range of available bills
        const availableDateRange =
            allBills.length > 0
                ? {
                    earliest: allBills[0].date,
                    latest: allBills[allBills.length - 1].date,
                  }
                : null;

        const response = {
            message:
                bills.length > 0
                    ? "Bills found successfully"
                    : "No bills found for the specified criteria",
            count: bills.length,
            bills: bills,
            query: {
                dateRange: {
                    start: startDate ? new Date(startDate) : null,
                    end: endDate ? new Date(endDate) : null,
                },
                filters: {
                    customerId,
                    driverId,
                    status,
                    amountRange: {
                        min: minAmount ? parseFloat(minAmount) : null,
                        max: maxAmount ? parseFloat(maxAmount) : null,
                    },
                },
            },
            availableDateRange: availableDateRange,
        };
          
        // Cache result
        if (useCache) {
            try {
                await redisClient.set(cacheKey, JSON.stringify({
                    message: response.message,
                    count: response.count,
                    bills: response.bills,
                    query: response.query,
                    availableDateRange: response.availableDateRange,
                }), {
                    EX: 300, // 5 min expiry
                });
                console.log('✅ Cached: Search Bills');
            } catch (err) {
                console.error('Redis set error:', err);
            }
        }

        return sendResponseToGateway(correlationId, {
            message: response.message,
            count: response.count,
            bills: response.bills,
            query: response.query,
            availableDateRange: response.availableDateRange,
        });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function getBillsByCustomerId(data, correlationId) {
    try {
        const { customerId } = data;
        const cacheKey = `bills:customer:${customerId}`;
        const useCache = process.env.USE_REDIS_CACHE === 'true';

        // Try cache first
        if (useCache) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('✅ Cache hit: Bills by Customer ID');
                    return sendResponseToGateway(correlationId, { bills: JSON.parse(cachedData) });
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
        }

        const bills = await Billing.find({ customerId });

        if (useCache) {
            await redisClient.set(cacheKey, JSON.stringify(bills), { EX: 300 });
            console.log(`✅ Cached: Bills for Customer ${customerId}`);
        }

        return sendResponseToGateway(correlationId, { bills });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function getBillsByDriverId(data, correlationId) {
    try {
        const { driverId } = data;
        const cacheKey = `bills:driver:${driverId}`;
        const useCache = process.env.USE_REDIS_CACHE === 'true';

        // Try cache first
        if (useCache) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('✅ Cache hit: Bills by Driver ID');
                    return sendResponseToGateway(correlationId, { bills: JSON.parse(cachedData) });
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
        }

        const bills = await Billing.find({ driverId });

        if (useCache) {
            await redisClient.set(cacheKey, JSON.stringify(bills), { EX: 300 });
            console.log(`✅ Cached: Bills for Driver ${driverId}`);
        }

        return sendResponseToGateway(correlationId, { bills });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function updateBillStatus(data, correlationId) {
    try {
        const { billId, status } = data;
        console.log("Updating bill status:", billId, status);
        const bill = await Billing.findOneAndUpdate(
            { billingId: billId },
            { status },
            { new: true, runValidators: true }
        );
        if (!bill) {
            return sendResponseToGateway(correlationId, { error: 'Bill not found' });
        }
        await invalidateCache([
            'bills:all',
            `bill:${bill.billingId}`,
            `bills:customer:${bill.customerId}`,
            `bills:driver:${bill.driverId}`,
            `admin:bill:${bill.billingId}`
        ]);
        return sendResponseToGateway(correlationId, {
            message: 'Bill status updated successfully',
            bill,
        });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function deleteBill(data, correlationId) {
    try {
        const { billId } = data;
        const bill = await Billing.findOneAndDelete({ billingId: billId });
        if (!bill) {
            return sendResponseToGateway(correlationId, { error: 'Bill not found' });
        }
        await invalidateCache([
            'bills:all',
            `bill:${bill.billingId}`,
            `bills:customer:${bill.customerId}`,
            `bills:driver:${bill.driverId}`,
            `admin:bill:${bill.billingId}`
        ]);
        return sendResponseToGateway(correlationId, {
            message: 'Bill deleted successfully',
        });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function handleAdminSearchBills(data, correlationId) {
    try {
        const { customerId, driverId, startDate, endDate, minAmount, maxAmount, status } = data;

        const cacheKey = `admin:billsSearch:customerId=${customerId || 'any'}:driverId=${driverId || 'any'}:status=${status || 'any'}:start=${startDate || 'any'}:end=${endDate || 'any'}:min=${minAmount || 'any'}:max=${maxAmount || 'any'}`;
        const useCache = process.env.USE_REDIS_CACHE === 'true';
    
        // Try cache first
        if (useCache) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('✅ Cache hit: Admin Search Bills');
                    return sendResponseToGateway(correlationId, JSON.parse(cachedData));
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
        }

        const query = {};

        if (customerId) query.customerId = customerId;
        if (driverId) query.driverId = driverId;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (minAmount || maxAmount) {
            query.totalAmount = {};
            if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
            if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
        }

        const bills = await Billing.find(query);

        const response = {
            message: bills.length ? "Bills found successfully" : "No bills found",
            count: bills.length,
            bills
        };

        // Cache the response
        if (useCache) {
            await redisClient.set(cacheKey, JSON.stringify({
                message: response.message,
                count: response.count,
                bills: response.bills,
            }), { EX: 300 }); // 5 min
            console.log('✅ Cached: Admin Search Bills');
        }

        return sendResponseToGateway(correlationId, { 
            message: response.message,
            count: response.count,
            bills: response.bills,
        });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function getBillById(data, correlationId) {
    try {
        const { billId } = data;
        const cacheKey = `admin:bill:${billId}`;
        const useCache = process.env.USE_REDIS_CACHE === 'true';

        // Try cache first
        if (useCache) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('✅ Cache hit: Get Bill By ID');
                    return sendResponseToGateway(correlationId, { bill: JSON.parse(cachedData) });
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
        }

        const bill = await Billing.findOne({ billingId: billId });
        if (!bill) {
            return sendResponseToGateway(correlationId, { error: 'Bill not found' });
        }

        // Cache the response
        if (useCache) {
            await redisClient.set(cacheKey, JSON.stringify(bill), { EX: 300 }); // 5 min
            console.log('✅ Cached: Get Bill By ID');
        }

        return sendResponseToGateway(correlationId, {
            bill,
        });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

module.exports = {
    handleGenerateBill,
    getAllBills,
    searchBills,
    getBillsByCustomerId,
    getBillsByDriverId,
    updateBillStatus,
    deleteBill,
    handleAdminSearchBills,
    getBillById,
};