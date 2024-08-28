const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash'], 
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending'
  },
  currency: {
    type: String,
    default: 'usd' 
  },
  payerEmail: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
