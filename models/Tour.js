const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tour title is required'],
    trim: true,
    maxlength: [100, 'Tour title cannot exceed 100 characters'],
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'Tour price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: String,
    required: [true, 'Tour duration is required'],
    enum: {
      values: ['1 day', '2 days', '3 days', '1 week', '2 weeks'],
      message: 'Duration must be one of: 1 day, 2 days, 3 days, 1 week, 2 weeks'
    }
  },
  category: {
    type: String,
    required: [true, 'Tour category is required'],
    enum: {
      values: ['adventure', 'cultural', 'luxury', 'family', 'romantic'],
      message: 'Category must be one of: adventure, cultural, luxury, family, romantic'
    }
  },
  description: {
    type: String,
    required: [true, 'Tour description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Tour image is required']
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient queries
tourSchema.index({ isActive: 1, displayOrder: 1 });
tourSchema.index({ category: 1, isActive: 1 });
tourSchema.index({ title: 1 }); // For uniqueness constraint

// Virtual for formatted price
tourSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toLocaleString()}`;
});

// Static method to get active tours
tourSchema.statics.getActiveTours = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
};

// Instance method to get tour URL
tourSchema.methods.getTourUrl = function() {
  return `tour-detail.html?tour=${this.title.toLowerCase().replace(/\s+/g, '-')}`;
};

module.exports = mongoose.model('Tour', tourSchema);
