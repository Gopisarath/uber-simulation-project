const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Main Administrator Schema
const administratorSchema = new mongoose.Schema({
    adminId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                // SSN format validation (XXX-XX-XXXX)
                return /^\d{3}-\d{2}-\d{4}$/.test(v);
            },
            message: props => `${props.value} is not a valid SSN format!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // US ZIP code format validation
                return /^\d{5}(-\d{4})?$/.test(v);
            },
            message: props => `${props.value} is not a valid ZIP code!`
        }
    },
    phoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Phone number format validation
                return /^\+?1?\d{10}$/.test(v.replace(/[^0-9]/g, ''));
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'support'],
        default: 'admin'
    },
    permissions: [{
        type: String,
        enum: ['manage_users', 'manage_drivers', 'manage_rides', 'manage_billing', 'view_reports']
    }],
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
administratorSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
administratorSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Update the updatedAt timestamp before saving
administratorSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Administrator = mongoose.model('Administrator', administratorSchema);

module.exports = Administrator; 