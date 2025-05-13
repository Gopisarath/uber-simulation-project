const Driver = require('../models/DriverModel');
const jwt = require('jsonwebtoken');
const { sendResponseToGateway } = require('../kafka/producer');
const { redisClient } = require('../config/cache');
const { invalidateCache } = require('../helpers/cacheInvalidationHelper');

async function handleSignup(data, correlationId) {
  try {
    const { driverId, password, ...driverData } = data;

    // Validate SSN
    if (!validateSSN(driverId)) {
      return sendResponseToGateway(correlationId, {
        error: 'Invalid SSN format. Must be in XXX-XX-XXXX format and follow SSN rules',
      });
    }

    // Check if driver already exists
    const existing = await Driver.findOne({ driverId });
    if (existing) {
      return sendResponseToGateway(correlationId, {
        error: 'Driver with this SSN already exists',
      });
    }

    // Create new driver and save to DB
    const driver = new Driver({ driverId, ...driverData, password });
    await driver.save();
    await invalidateCache(['drivers:all']);

    // Prepare response and exclude password
    const response = driver.toObject();
    delete response.password;

    // Send success response back to the gateway
    return sendResponseToGateway(correlationId, {
      driver: response,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleLogin(data, correlationId) {
  try {
    const { email, password } = data;

    // Check if driver exists
    const driver = await Driver.findOne({ email });
    if (!driver || !(await driver.comparePassword(password))) {
      return sendResponseToGateway(correlationId, { error: 'Invalid credentials' });
    }

    driver.lastLogin = Date.now();
    await driver.save();

    const payload = { driverId: driver.driverId, email: driver.email, role: 'driver' };
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
    const cacheKey = 'drivers:all';
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log('✅ Accessed from Cache: All Drivers');
                return sendResponseToGateway(correlationId, { drivers: JSON.parse(cachedData) });
            }
        } catch (err) {
            console.error('Redis get error:', err);
        }
    }

    const drivers = await Driver.find();

    if (useCache) {
      try {
          await redisClient.set(cacheKey, JSON.stringify(drivers), { EX: 300 }); // Cache for 5 minutes
          console.log('✅ Cached: All Drivers');
      } catch (err) {
          console.error('Redis set error:', err);
      }
    }

    return sendResponseToGateway(correlationId, {
      drivers,
    });
  } catch (error) {
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleSearch(data, correlationId) {
  try {
    const { firstName, lastName, city, state, rating, carMake, carModel } = data;
    const cacheKey = `searchDrivers:${JSON.stringify(data)}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log('✅ Accessed from Cache: Search Drivers');
                return sendResponseToGateway(correlationId, { drivers: JSON.parse(cachedData) });
            }
        } catch (err) {
            console.error('Redis get error:', err);
        }
    }

    const query = {};

    if (firstName) query.firstName = new RegExp(firstName, 'i');
    if (lastName) query.lastName = new RegExp(lastName, 'i');
    if (city) query.city = new RegExp(city, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (rating) query.rating = { $gte: parseFloat(rating) };
    if (carMake) query['carDetails.make'] = new RegExp(carMake, 'i');
    if (carModel) query['carDetails.model'] = new RegExp(carModel, 'i');

    const drivers = await Driver.find(query);

    if (useCache) {
      try {
          await redisClient.set(cacheKey, JSON.stringify(drivers), { EX: 300 }); // Cache for 5 minutes
          console.log('✅ Cached: Search Drivers');
      } catch (err) {
          console.error('Redis set error:', err);
      }
    }

    return sendResponseToGateway(correlationId, {
      drivers,
    });
  } catch (error) {
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetById(data, correlationId) {
  try {
    const { driverId } = data;
    const cacheKey = `driver:${driverId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log('✅ Accessed from Cache: Driver by ID');
                return sendResponseToGateway(correlationId, { driver: JSON.parse(cachedData) });
            }
        } catch (err) {
            console.error('Redis get error:', err);
        }
    }

    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return sendResponseToGateway(correlationId, { error: 'Driver not found' });
    }

    if (useCache) {
      try {
          await redisClient.set(cacheKey, JSON.stringify(driver), { EX: 300 }); // Cache for 5 minutes
          console.log('✅ Cached: Driver by ID');
      } catch (err) {
          console.error('Redis set error:', err);
      }
    }

    return sendResponseToGateway(correlationId, {
      driver,
    });
  } catch (error) {
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleUpdate(data, correlationId) {
  try {
    const { driverId, updateData } = data;
    const driver = await Driver.findOneAndUpdate({ driverId }, updateData, { new: true });
    if (!driver) {
      return sendResponseToGateway(correlationId, { error: 'Driver not found' });
    }
    await invalidateCache([
      'drivers:all',
      `driver:${driver.driverId}`
    ]);
    return sendResponseToGateway(correlationId, {
      message: 'Driver updated successfully',
      driver,
    });
  } catch (error) {
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleDelete(data, correlationId) {
  try {
    const { driverId } = data;
    const driver = await Driver.findOneAndDelete({ driverId });
    if (!driver) {
      return sendResponseToGateway(correlationId, { error: 'Driver not found' });
    }
    await invalidateCache([
      'drivers:all',
      `driver:${driver.driverId}`
    ]);
    return sendResponseToGateway(correlationId, {
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleAddVideo(data, correlationId) {
  try {
    const { driverId, videoUrl } = data;
    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return sendResponseToGateway(correlationId, { error: 'Driver not found' });
    }
    driver.media.push({
      type: 'video',
      url: videoUrl,
      uploadDate: new Date()
    });

    await driver.save();
    await invalidateCache([
      `driverVideo:${driver.driverId}`
    ]);
    return sendResponseToGateway(correlationId, {
      driver,
    });
  } catch (error) {
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetVideos(data, correlationId) {
  try {
    const { driverId } = data;

    const cacheKey = `driverVideo:${driverId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
              console.log(`✅ Accessed from Cache: Driver Video ${driverId}`);
              return sendResponseToGateway(correlationId, { driver: JSON.parse(cachedData) });
          }
      } catch (err) {
          console.error('Redis get error:', err);
      }
  }

    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return sendResponseToGateway(correlationId, { error: 'Driver not found' });
    }

    if (useCache) {
      try {
          await redisClient.set(cacheKey, JSON.stringify(driver), { EX: 300 }); // Cache for 5 minutes
          console.log(`✅ Cached: Driver Video ${driverId}`);
      } catch (err) {
          console.error('Redis set error:', err);
      }
    }

    return sendResponseToGateway(correlationId, {
      videos: driver.media,
    });
  } catch (error) {
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleAddDriver(data, correlationId) {
  try {
    const { driverData } = data;

    // Create new driver and save to DB
    const driver = new Driver({ ...driverData });
    await driver.save();

    invalidateCache([
        'drivers:all',
        'admin:drivers:all',  // optional if you cache all drivers for admin
        'admin:rideStats:type=driver'
    ]).then(() => {
        console.log('✅ Cache invalidated after adding driver');
    }).catch((err) => {
        console.error('Cache invalidation error:', err);
    });

    // Send success response back to the gateway
    return sendResponseToGateway(correlationId, {
      driver,
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

module.exports = {
    handleSignup,
    handleLogin,
    handleGetAll,
    handleSearch,
    handleGetById,
    handleUpdate,
    handleDelete,
    handleAddVideo,
    handleGetVideos,
    handleAddDriver,
};
