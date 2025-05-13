const Customer = require('../models/CustomerModel');
const jwt = require('jsonwebtoken');
const { sendResponseToGateway } = require('../kafka/producer');
const { redisClient } = require('../config/cache');
const { invalidateCache } = require('../helpers/cacheInvalidationHelper');

async function handleSignup(data, correlationId) {
  try {
    const { customerId, password, ...customerData } = data;

    // Validate SSN
    if (!validateSSN(customerId)) {
      return sendResponseToGateway(correlationId, {
        error: 'Invalid SSN format. Must be in XXX-XX-XXXX format and follow SSN rules',
      });
    }

    // Check if customer already exists
    const existing = await Customer.findOne({ customerId });
    if (existing) {
      return sendResponseToGateway(correlationId, {
        error: 'Customer with this SSN already exists',
      });
    }

    // Create new customer and save to DB
    const customer = new Customer({ customerId, ...customerData, password });
    await customer.save();
    await invalidateCache(['customers:all']);

    // Prepare response and exclude password
    const response = customer.toObject();
    delete response.password;

    // Send success response back to the gateway
    return sendResponseToGateway(correlationId, {
      customer: response,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleLogin(data, correlationId) {
  try {
    const { email, password } = data;

    // Check if customer exists
    const customer = await Customer.findOne({ email });
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    customer.lastLogin = Date.now();
    await customer.save();

    const payload = { customerId: customer.customerId, email: customer.email, role: 'customer' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send success response back to the gateway
    return sendResponseToGateway(correlationId, {
      token,
    });

  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetAll(data, correlationId) {
  try {
    const cacheKey = 'customers:all';
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
              console.log('✅ Accessed from Cache: All Customers');
              return sendResponseToGateway(correlationId, { customers: JSON.parse(cachedData) });
          }
      } catch (err) {
          console.error('Redis get error:', err);
      }
  }

    const customers = await Customer.find();
    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify(customers), { EX: 300 });  // 5 min cache
      console.log('✅ Cached: All Customers');
    }

    // Send success response back to the gateway
    return sendResponseToGateway(correlationId, {
      customers,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleDelete(data, correlationId) {
  try {
    const { customerId } = data;

    // Check if customer exists
    const customer = await Customer.findOneAndDelete({ customerId });
    if (!customer) {
      return sendResponseToGateway(correlationId, {
        error: 'Customer not found',
      });
    }

    await invalidateCache([
      'customers:all',
      `customer:${customer.customerId}`
    ]);

    return sendResponseToGateway(correlationId, {
      message: 'Customer deleted successfully',
    });

  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetById(data, correlationId) {
  try {
    const { customerId } = data;

    const cacheKey = `customer:${customerId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
              console.log('✅ Accessed from Cache: Customer by ID');
              return sendResponseToGateway(correlationId, { customer: JSON.parse(cachedData) });
          }
      } catch (err) {
          console.error('Redis get error:', err);
      }
    }

    // Check if customer exists
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return sendResponseToGateway(correlationId, {
        error: 'Customer not found',
      });
    }

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify(customer), { EX: 300 });  // 5 min cache
      console.log('✅ Cached: Customer by ID');
    }

    return sendResponseToGateway(correlationId, {
      customer,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetNearbyDrivers(data, correlationId) {
  try {
    const { latitude, longitude, drivers } = data;

    const cacheKey = `nearbyDrivers:${latitude}:${longitude}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (!latitude || !longitude) {
      return sendResponseToGateway(correlationId, { error: 'Latitude and longitude are required' });
    }

    if (useCache) {
      try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
              console.log('✅ Accessed from Cache: Nearby Drivers');
              return sendResponseToGateway(correlationId, JSON.parse(cachedData));
          }
      } catch (err) {
          console.error('Redis get error:', err);
      }
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return sendResponseToGateway(correlationId, { error: 'Invalid latitude or longitude values' });
    }

    if (!drivers.length) {
      return sendResponseToGateway(correlationId, { error: 'No drivers available in the system' });
    }

    const nearbyDrivers = drivers.filter((driver) => {
      try {
        return calculateDistance(lat, lng, driver.currentLocation.latitude, driver.currentLocation.longitude) <= 10;
      } catch {
        return false;
      }
    });

    if (!nearbyDrivers.length) {
      return sendResponseToGateway(correlationId, { error: 'No drivers found within 10 miles of your location' });
    }

    console.log("✅ Nearby Drivers before calculation:", nearbyDrivers);

    const driversWithDistance = nearbyDrivers.map((driver) => {
      const distance = calculateDistance(lat, lng, driver.currentLocation.latitude, driver.currentLocation.longitude);
      return { ...driver, distance: parseFloat(distance.toFixed(2)) };
    });

    driversWithDistance.sort((a, b) => a.distance - b.distance);

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify({
          count: driversWithDistance.length,
          drivers: driversWithDistance
      }), { EX: 300 });
      console.log('✅ Cached: Nearby Drivers');
  }

    return sendResponseToGateway(correlationId, {
      count: driversWithDistance.length,
      drivers: driversWithDistance,
    });

  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }

}

async function handleAddCustomer(data, correlationId) {
  try {
    const { customerData } = data;

    // Create new customer and save to DB
    const customer = new Customer({ ...customerData });
    await customer.save();

    invalidateCache([
        'customers:all',
        'admin:customers:all',  // optional if you cache all customers for admin
        'admin:rideStats:type=customer'
    ]).then(() => {
        console.log('✅ Cache invalidated after adding customer');
    }).catch((err) => {
        console.error('Cache invalidation error:', err);
    });

    // Send success response back to the gateway
    return sendResponseToGateway(correlationId, {
      customer,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

// SSN Validator
const validateSSN = (ssn) => {
  const ssnRegex = /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/;
  return ssnRegex.test(ssn);
};

//Distance Calculator
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  handleSignup,
  handleLogin,
  handleGetAll,
  handleDelete,
  handleGetById,
  handleGetNearbyDrivers,
  handleAddCustomer,
};