const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  adults: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  children: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 0
  },
  travelDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'Travel date cannot be in the past'
    }
  },
  confirmTrip: {
    type: String,
    required: true,
    trim: true
  },
  tourId: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create index for efficient queries
bookingSchema.index({ email: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
