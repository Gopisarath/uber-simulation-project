const mongoose = require('mongoose');

// Schema for location
const locationSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true }
});

// Main Ride Schema
const rideSchema = new mongoose.Schema({
    rideId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                // Custom format validation (RIDE-XXX-XXXX)
                return /^RIDE-\d{3}-\d{4}$/.test(v);
            },
            message: props => `${props.value} is not a valid ride ID format! Expected format: RIDE-XXX-XXXX`
        }
    },
    pickupLocation: { type: locationSchema, required: true },
    dropoffLocation: { type: locationSchema, required: true },
    dateTime: { type: Date, required: true },
    customerId: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{3}-\d{2}-\d{4}$/.test(v);
            },
            message: props => `${props.value} is not a valid SSN format!`
        }
    },
    driverId: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{3}-\d{2}-\d{4}$/.test(v);
            },
            message: props => `${props.value} is not a valid SSN format!`
        }
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'in-progress', 'completed', 'cancelled'],
        default: 'requested'
    },
    estimatedDuration: { type: Number }, // in minutes
    actualDuration: { type: Number }, // in minutes
    estimatedDistance: { type: Number }, // in kilometers
    actualDistance: { type: Number }, // in kilometers
    estimatedPrice: { type: Number },
    actualPrice: { type: Number },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: { type: String },
    media: [{
        type: { type: String, enum: ['image', 'video'], required: true },
        url: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
rideSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride; 