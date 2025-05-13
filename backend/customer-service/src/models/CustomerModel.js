const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for credit card details
const creditCardSchema = new mongoose.Schema({
    cardNumber: { type: String, required: true },
    cardHolderName: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cvv: { type: String, required: true }
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

// Main Customer Schema
const customerSchema = new mongoose.Schema({
    customerId: {
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
    creditCard: { type: creditCardSchema, required: true },
    rideHistory: [rideHistorySchema],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [reviewSchema],
    paymentMethods: [{
        type: { type: String, enum: ['credit_card', 'debit_card', 'paypal'] },
        cardNumber: String,
        expiryDate: String,
        cvv: String,
        isDefault: { type: Boolean, default: false }
    }],
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
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
customerSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Update the updatedAt timestamp before saving
customerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 