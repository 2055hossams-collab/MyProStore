// models/coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    expiresAt: Date,
    isActive: { type: Boolean, default: true }
});

mongoose.model('Coupon', couponSchema);
