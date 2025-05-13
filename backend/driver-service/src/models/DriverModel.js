const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for car details
const carDetailsSchema = new mongoose.Schema({
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    licensePlate: { type: String, required: true }
});

// Schema for reviews
const reviewSchema = new mongoose.Schema({
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    reviewerName: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Schema for ride history
const rideHistorySchema = new mongoose.Schema({
    rideId: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    date: { type: Date, required: true },
    fare: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'cancelled', 'in-progress'], required: true }
});

// Schema for media (images and videos)
const mediaSchema = new mongoose.Schema({
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
});

// Schema for location
const locationSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true }
});

// Main Driver Schema
const driverSchema = new mongoose.Schema({
    driverId: {
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
    carDetails: { type: carDetailsSchema, required: true },
    currentLocation: { type: locationSchema, required: true },
    licenseNumber: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    insuranceDetails: {
        provider: { type: String, required: true },
        policyNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRides: { type: Number, default: 0 },
    lastLogin: { type: Date },
    reviews: [reviewSchema],
    media: [mediaSchema],
    rideHistory: [rideHistorySchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
driverSchema.pre('save', async function(next) {
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
driverSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Update the updatedAt timestamp before saving
driverSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create and export the Driver model
const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver; 