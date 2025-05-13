const Ride = require('../models/rideModel');
const { sendResponseToGateway } = require('../kafka/producer');
const { redisClient } = require('../config/cache');
const { invalidateCache } = require('../helpers/cacheInvalidationHelper');

async function handleCreateRide(data, correlationId) {
  try {
    const { rideId, customerId, driverId, ...rideData } = data;

    // Check if ride already exists
    const existingRide = await Ride.findOne({ rideId });
    if (existingRide) {
      return sendResponseToGateway(correlationId, {
        error: 'Ride with this ID already exists',
      });
    }

    // Create new ride and save to DB
    const ride = new Ride({ rideId, customerId, driverId, ...rideData });
    await ride.save();

    await invalidateCache([
      'rides:all',
      `rides:driver:${ride.driverId}`,
      `rides:customer:${ride.customerId}`,
      `ride:${ride.rideId}`,
      'rides:statistics:city=all'  // If you cache stats
    ])

    // Send success response back to the gateway
    return sendResponseToGateway(correlationId, {
      ride,
    });

  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetRideById(data, correlationId) {
  try {
    const { rideId } = data;

    const cacheKey = `ride:${rideId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache hit: Ride ${rideId}`);
          return sendResponseToGateway(correlationId, {ride: JSON.parse(cachedData)});
        }
      } catch (err) {
        console.error('Redis get error:', err);
      }
    }

    // Fetch ride by ID
    const ride = await Ride.findOne({ rideId });
    if (!ride) {
      return sendResponseToGateway(correlationId, {
        error: 'Ride not found',
      });
    }

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify(ride), { EX: 300 });
      console.log(`✅ Cached: Ride ${rideId}`);
    }

    return sendResponseToGateway(correlationId, {
      ride,
    });

  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetAllRides(data, correlationId) {
  try {
    const cacheKey = `rides:all`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache hit: All rides`);
          return sendResponseToGateway(correlationId, { rides: JSON.parse(cachedData) });
        }
      } catch (err) {
        console.error('Redis get error:', err);
      }
    }

    const rides = await Ride.find();

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify(rides), { EX: 300 });
      console.log(`✅ Cached: All rides`);
    }

    return sendResponseToGateway(correlationId, {
      rides,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleUpdateRide(data, correlationId) {
  try {
    const ride = await Ride.findOneAndUpdate(
      { rideId: data.rideId },
      data.rideData,
      { new: true, runValidators: true }
    );
    if (!ride) {
      return sendResponseToGateway(correlationId, {
        error: 'Ride not found',
      });
    }
    await invalidateCache([
      'rides:all',
      `rides:driver:${ride.driverId}`,
      `rides:customer:${ride.customerId}`,
      `ride:${ride.rideId}`,
      'rides:statistics:city=all'
  ]);

    return sendResponseToGateway(correlationId, {
      ride,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleDeleteRide(data, correlationId) {
  try {
    const { rideId } = data;

    // Check if ride exists
    const ride = await Ride.findOneAndDelete({ rideId });
    if (!ride) {
      return sendResponseToGateway(correlationId, {
        error: 'Ride not found',
      });
    }

    await invalidateCache([
      'rides:all',
      `rides:driver:${ride.driverId}`,
      `rides:customer:${ride.customerId}`,
      `ride:${ride.rideId}`,
      'rides:statistics:city=all'
    ]);

    return sendResponseToGateway(correlationId, {
      message: 'Ride deleted successfully',
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleUpdateRideStatus(data, correlationId) {
  try {
    const { rideId, status } = data;

    // Check if ride exists
    const ride = await Ride.findOneAndUpdate(
      { rideId },
      { status },
      { new: true, runValidators: true }
    );
    if (!ride) {
      return sendResponseToGateway(correlationId, {
        error: 'Ride not found',
      });
    }

    await invalidateCache([
      'rides:all',
      `rides:driver:${ride.driverId}`,
      `rides:customer:${ride.customerId}`,
      `ride:${ride.rideId}`,
      'rides:statistics:city=all'
    ]);

    return sendResponseToGateway(correlationId, {
      ride,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetRidesByCustomerId(data, correlationId) {
  try {
    const { customerId } = data;
    const cacheKey = `rides:customer:${customerId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache hit: Rides by customer ${customerId}`);
          return sendResponseToGateway(correlationId, { rides: JSON.parse(cachedData) });
        }
      } catch (err) {
        console.error('Redis get error:', err);
      }
    }

    // Fetch rides by customer ID
    const rides = await Ride.find({ customerId });

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify(rides), { EX: 300 });
      console.log(`✅ Cached: Rides by customer ${customerId}`);
    }

    return sendResponseToGateway(correlationId, {
      rides,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetRidesByDriverId(data, correlationId) {
  try {
    const { driverId } = data;

    const cacheKey = `rides:driver:${driverId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache hit: Rides by driver ${driverId}`);
          return sendResponseToGateway(correlationId, { rides: JSON.parse(cachedData) });
        }
      } catch (err) {
        console.error('Redis get error:', err);
      }
    }

    // Fetch rides by driver ID
    const rides = await Ride.find({ driverId });
    
    if(useCache) {
      await redisClient.set(cacheKey, JSON.stringify(rides), { EX: 300 });
      console.log(`✅ Cached: Rides by driver ${driverId}`);
    } 

    return sendResponseToGateway(correlationId, {
      rides,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleGetRideStatistics(data, correlationId) {
  try {
    const { city, state } = data;
    const cacheKey = `ride:statistics:city=${city || 'any'}:state=${state || 'any'}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache hit: Ride statistics city=${city} state=${state}`);
          return sendResponseToGateway(correlationId, { statistics: JSON.parse(cachedData) });
        }
      } catch (err) {
        console.error('Redis get error:', err);
      }
    }

    const query = {};
    
    if (city) query['pickupLocation.address'] = new RegExp(city, 'i');
    if (state) query['pickupLocation.address'] = new RegExp(state, 'i');

    const rides = await Ride.find(query);

    const statistics = {
      totalRides: rides.length,
      totalDistance: rides.reduce((sum, ride) => sum + (ride.actualDistance || 0), 0),
      totalRevenue: rides.reduce((sum, ride) => sum + (ride.actualPrice || 0), 0),
      averageRating: rides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / rides.length || 0,
      statusBreakdown: rides.reduce((acc, ride) => {
          acc[ride.status] = (acc[ride.status] || 0) + 1;
          return acc;
      }, {}),
      timeDistribution: rides.reduce((acc, ride) => {
          const hour = new Date(ride.dateTime).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
      }, {})
    };

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify(statistics), { EX: 300 });
      console.log(`✅ Cached: Ride statistics city=${city} state=${state}`);
    }

    return sendResponseToGateway(correlationId, {
      statistics,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleUploadRideImages(data, correlationId) {
  try {
    const { rideId, images } = data;  

    console.log('Uploading images for ride:', rideId);
    console.log('Images data:', images);

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ 
          message: 'Images array is required' 
      });
    }
    // Check if ride exists
    const ride = await Ride.findOne({ rideId });
    console.log('Ride found:', ride);

    if (!ride) {
      return sendResponseToGateway(correlationId, {
        error: 'Ride not found',
        rideId
      });
    }

    // Add images to ride's media array
    ride.media = ride.media || [];
    const newImages = images.map(image => ({
        type: 'image',
        url: image.url,
        uploadDate: new Date()
    }));
    
    ride.media.push(...newImages);
    console.log('Updated media array:', ride.media);

    await ride.save();
    console.log('Ride updated successfully:', ride);

    await invalidateCache([`ride:${ride.rideId}`]);

    return sendResponseToGateway(correlationId, {
      message: 'Images uploaded successfully',
      rideId,
      media: ride.media,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleReviewDriver(data, correlationId) {
  try {
    const { driver, driverId } = data;
    const cacheKey = `admin:reviewDriver:${driverId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
      try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
              console.log(`✅ Cache hit: Review Driver ${driverId}`);
              return sendResponseToGateway(correlationId, {
                  driver: JSON.parse(cachedData).driver,
                  statistics: JSON.parse(cachedData).statistics
              });
          }
      } catch (err) {
          console.error('Redis get error:', err);
      }
    }

    const rides = await Ride.find({ driverId });
    const statistics = {
      totalRides: rides.length,
      completedRides: rides.filter(r => r.status === 'completed').length,
      totalEarnings: rides.reduce((sum, r) => sum + (r.actualPrice || 0), 0),
      averageRating: driver.rating || 0,
      rideHistory: rides.map(r => ({
          rideId: r.rideId,
          date: r.dateTime,
          status: r.status,
          amount: r.actualPrice
      }))
    };

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify({driver, statistics}), { EX: 300 });
      console.log(`✅ Cached: Review Driver ${driverId}`);
    }

    return sendResponseToGateway(correlationId, {
      driver, statistics
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleReviewCustomer(data, correlationId) {
  try {
    const { customer, customerId } = data;
    const cacheKey = `admin:reviewCustomer:${customerId}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`✅ Cache hit: Review Customer ${customerId}`);
                return sendResponseToGateway(correlationId, {
                    customer: JSON.parse(cachedData).customer,
                    statistics: JSON.parse(cachedData).statistics
                });
            }
        } catch (err) {
            console.error('Redis get error:', err);
        }
    }

    const rides = await Ride.find({ customerId });
    const statistics = {
      totalRides: rides.length,
      totalSpent: rides.reduce((sum, r) => sum + (r.actualPrice || 0), 0),
      averageRating: rides.reduce((sum, r) => sum + (r.rating || 0), 0) / rides.length || 0,
      rideHistory: rides.map(r => ({
          rideId: r.rideId,
          date: r.dateTime,
          status: r.status,
          amount: r.actualPrice
      }))
    };

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify({customer, statistics}), { EX: 300 });
      console.log(`✅ Cached: Review Customer ${customerId}`);
    }

    return sendResponseToGateway(correlationId, {
      customer, statistics
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

async function handleAdminGetRevenueStatistics(data, correlationId) {
  try {
    const { startDate, endDate, area } = data;
    const cacheKey = `admin:revenueStats:start=${startDate || 'any'}:end=${endDate || 'any'}:area=${area || 'any'}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`✅ Cache hit: Revenue Statistics`);
                return sendResponseToGateway(correlationId, JSON.parse(cachedData));
            }
        } catch (err) {
            console.error('Redis get error:', err);
        }
    }

    const query = {};

    if (startDate || endDate) {
        query.dateTime = {};
        if (startDate) query.dateTime.$gte = new Date(startDate);
        if (endDate) query.dateTime.$lte = new Date(endDate);
    }

    if (area) query['pickupLocation.address'] = new RegExp(area, 'i');

    const rides = await Ride.find(query);

    const dailyRevenue = rides.reduce((acc, ride) => {
        const date = ride.dateTime.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (ride.actualPrice || 0);
        return acc;
    }, {});

    const areaStats = rides.reduce((acc, ride) => {
        const area = ride.pickupLocation.address.split(',')[1]?.trim() || 'Unknown';
        if (!acc[area]) acc[area] = { totalRides: 0, totalRevenue: 0 };
        acc[area].totalRides++;
        acc[area].totalRevenue += (ride.actualPrice || 0);
        return acc;
    }, {});

    const totalRides = rides.length;

    const totalRevenue = rides.reduce((sum, ride) => sum + (ride.actualPrice || 0), 0);

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify({dailyRevenue, areaStats, totalRides, totalRevenue}), { EX: 300 });
      console.log(`✅ Cached: Revenue Statistics`);
    }

    return sendResponseToGateway(correlationId, {
        dailyRevenue,
        areaStats,
        totalRides,
        totalRevenue,
    });
  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
} 

const handleAdminGetRideStatistics = async (data, correlationId) => {
  try {
    const { type } = data;

    const cacheKey = `admin:rideStats:type=${type || 'all'}`;
    const useCache = process.env.USE_REDIS_CACHE === 'true';

    if (useCache) {
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`✅ Cache hit: Ride Statistics type=${type}`);
                return sendResponseToGateway(correlationId, JSON.parse(cachedData));
            }
        } catch (err) {
            console.error('Redis get error:', err);
        }
    }

    const rides = await Ride.find();
    let stats = {};

    if (type === 'area') {
        stats = rides.reduce((acc, ride) => {
            const area = ride.pickupLocation?.address?.split(',')[1]?.trim() || 'Unknown';
            if (!acc[area]) acc[area] = { totalRides: 0, totalRevenue: 0 };
            acc[area].totalRides++;
            acc[area].totalRevenue += ride.actualPrice || 0;
            return acc;
        }, {});
    } else if (type === 'driver') {
        stats = rides.reduce((acc, ride) => {
            const driver = ride.driverId || 'Unknown';
            if (!acc[driver]) acc[driver] = { totalRides: 0, totalRevenue: 0 };
            acc[driver].totalRides++;
            acc[driver].totalRevenue += ride.actualPrice || 0;
            return acc;
        }, {});
    } else if (type === 'customer') {
        stats = rides.reduce((acc, ride) => {
            const customer = ride.customerId || 'Unknown';
            if (!acc[customer]) acc[customer] = { totalRides: 0, totalSpent: 0 };
            acc[customer].totalRides++;
            acc[customer].totalSpent += ride.actualPrice || 0;
            return acc;
        }, {});
    } else {
        return res.status(400).json({ message: 'Invalid type parameter' });
    }

    if (useCache) {
      await redisClient.set(cacheKey, JSON.stringify({type, stats}), { EX: 300 });
      console.log(`✅ Cached: Ride Statistics type=${type}`);
    }
    
    return sendResponseToGateway(correlationId, {
      type, stats,
    });

  } catch (error) {
    // Send error response back to the gateway
    return sendResponseToGateway(correlationId, { error: error.message });
  }
}

module.exports = {
  handleCreateRide,
  handleGetRideById,
  handleGetAllRides,
  handleUpdateRide,
  handleDeleteRide,
  handleUpdateRideStatus,
  handleGetRidesByCustomerId,
  handleGetRidesByDriverId,
  handleGetRideStatistics,
  handleUploadRideImages,
  handleReviewDriver,
  handleReviewCustomer,
  handleAdminGetRevenueStatistics,
  handleAdminGetRideStatistics,
};