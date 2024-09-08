
// Reservation.js (Route File)
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getReservations, makeReservation, cancelReservation } = require('../controllers/reservationController');
const { processPayment } = require('../controllers/paymentController');
const Record = require('../controllers/adminController');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User')

router.get('/', protect, getReservations);

router.post('/', protect, makeReservation);

router.delete('/:id', protect, cancelReservation);
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        const regex = new RegExp(query, 'i'); // 'i' makes it case-insensitive

        // Search for vehicles that match the query
        const vehicles = await Vehicle.find({
            $or: [{ make: regex }, { model: regex }]
        });

        // Return the vehicles in JSON format
        res.json({ vehicles });
    } catch (err) {
        // console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/edit/:id', async (req, res) => {
  try {
    // Find the reservation by ID and populate the vehicle field
    const reservation = await Reservation.findById(req.params.id).populate('vehicle');
    
    // Check if reservation exists
    if (!reservation) {
      return res.status(404).send('Reservation not found');
    }
    
    // Extract pricePerDay from the vehicle
    const pricePerDay = reservation.vehicle.pricePerDay;
    // Render the edit-reservation view with reservation and vehicle details
    res.render('edit-reservation', { reservation, pricePerDay });
  } catch (err) {
    // console.error(err);
    res.status(500).send('Server Error');
  }
});

router.patch('/edit/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).send('Reservation not found');
    }

    const today = new Date();
    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);

    // Check if the start date is in the past
    if (start < today.setHours(0, 0, 0, 0)) {
      return res.redirect(`/reservations/edit/${req.params.id}?error=Start date cannot be in the past`);
    }

    // Check if the end date is before the start date
    if (end <= start) {
      return res.redirect(`/reservations/edit/${req.params.id}?error=End date must be after the start date`);
    }

    // Calculate the number of days between start and end dates
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Retrieve the vehicle's daily rate
    const vehicle = await Vehicle.findById(reservation.vehicle).select('pricePerDay');
    if (!vehicle) {
      return res.status(404).send('Vehicle not found');
    }

    const dailyRate = vehicle.pricePerDay;
    const totalCost = days * dailyRate;

    // Update reservation details
    reservation.startDate = start;
    reservation.endDate = end;
    reservation.totalCost = totalCost;

    const user = await User.findById(reservation.user).select('name');

    // Ensure req.user is defined
    if (req.user) {
      // Log the reservation activity (Edit)
      await Record.logActivity(
        req.user.id,
        `${user.name} edited the reservation for ${vehicle.make} ${vehicle.model}`
      );
    } else {
      // console.error('User not authenticated');
    }

    await reservation.save();

    res.redirect('/reservations/');
  } catch (err) {
    // console.error(err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;