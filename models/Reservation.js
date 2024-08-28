
// Reservation.js
const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
},
vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',  // Ensure this matches the model name in Vehicle.js
    required: true,
},
  startDate: Date,
  endDate: Date,
  totalCost: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
}
});

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
