const Administrator = require("../models/AdminModel");
const jwt = require("jsonwebtoken");
const { sendResponseToGateway } = require("../kafka/producer");
const { redisClient } = require('../config/cache');
const { invalidateCache } = require('../helpers/cacheInvalidationHelper');

async function handleSignup(data, correlationId) {
    try {
        const { adminId, password, ...adminData } = data;

        // Validate SSN
        if (!validateSSN(adminId)) {
            return sendResponseToGateway(correlationId, {
                error: "Invalid SSN format. Must be in XXX-XX-XXXX format and follow SSN rules",
            });
        }

        // Check if admin already exists
        const existing = await Administrator.findOne({ adminId });
        if (existing) {
            return sendResponseToGateway(correlationId, {
                error: "Admin with this SSN already exists",
            });
        }

        // Create new admin and save to DB
        const admin = new Administrator({ adminId, ...adminData, password });
        await admin.save();

        // Prepare response and exclude password
        const response = admin.toObject();
        delete response.password;

        invalidateCache([
            'admins:all',               // if you cache all admins somewhere
            'admin:stats:allAdmins',    // if you cache admin stats
        ]).then(() => {
            console.log('✅ Cache invalidated after admin signup');
        }).catch((err) => {
            console.error('Cache invalidation error:', err);
        });

        // Send success response back to the gateway
        return sendResponseToGateway(correlationId, {
            admin: response,
        });

    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

async function handleLogin(data, correlationId) {
    try {
        const { email, password } = data;

        // Check if admin exists
        const admin = await Administrator.findOne({ email });
        if (!admin || !(await admin.comparePassword(password))) {
            return sendResponseToGateway(correlationId, { error: "Invalid credentials" });
        }

        admin.lastLogin = Date.now();
        await admin.save();

        const payload = { adminId: admin.adminId, email: admin.email, role: "admin" };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        return sendResponseToGateway(correlationId, {
            token,
        });
    } catch (error) {
        return sendResponseToGateway(correlationId, { error: error.message });
    }
}

// Validate SSN
const validateSSN = (ssn) => {
    const ssnRegex = /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/;
    return ssnRegex.test(ssn);
};

module.exports = { 
    handleSignup,
    handleLogin,
};