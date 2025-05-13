const mongoose = require('mongoose');

// Schema for location
const locationSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true }
});

// Main Billing Schema
const billingSchema = new mongoose.Schema({
    billingId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                // Custom format validation (BILL-timestamp)
                return /^BILL-\d{13}$/.test(v);
            },
            message: props => `${props.value} is not a valid billing ID format! Expected format: BILL-timestamp`
        }
    },
    date: { type: Date, required: true },
    pickupTime: { type: Date, required: true },
    dropoffTime: { type: Date, required: true },
    distanceCovered: { type: Number, required: true }, // in kilometers
    totalAmount: { type: Number, required: true },
    sourceLocation: { type: locationSchema, required: true },
    destinationLocation: { type: locationSchema, required: true },
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
    predictedPrice: { type: Number, required: true },
    actualPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'cash', 'other'],
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
billingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Billing = mongoose.model('Billing', billingSchema);

module.exports = Billing; 