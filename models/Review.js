const mongoose = require('mongoose');

// Create a schema for the Review model
const reviewSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    validate: {
      validator: function(value) {
        return mongoose.Types.ObjectId.isValid(value);
      },
      message: 'Invalid Vehicle ID'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    validate: {
      validator: function(value) {
        return mongoose.Types.ObjectId.isValid(value);
      },
      message: 'Invalid User ID'
    }
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: [true, 'Reservation ID is required'],
    validate: {
      validator: function(value) {
        return mongoose.Types.ObjectId.isValid(value);
      },
      message: 'Invalid Reservation ID'
    }
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
    required: [true, 'Rating is required']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the Review model
module.exports = mongoose.model('Review', reviewSchema);
