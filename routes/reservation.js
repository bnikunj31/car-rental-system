
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
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/edit/:id', async (req, res) => {
  try {
      const reservation = await Reservation.findById(req.params.id);
      
      if (!reservation) {
          return res.status(404).send('Reservation not found');
      }

      res.render('edit-reservation', { reservation });
  } catch (err) {
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

    // Check if the start date is in the past
    if (start < today.setHours(0, 0, 0, 0)) {
      return res.redirect(`/reservations/edit/${req.params.id}?error=Start date cannot be in the past`);
    }

    reservation.startDate = start;
    reservation.endDate = new Date(req.body.endDate);

    const vehicle = await Vehicle.findById(reservation.vehicle).select('make model');
    const user = await User.findById(reservation.user).select('name');

    // Ensure req.user is defined
    if (req.user) {
      // Log the reservation activity (Edit)
      await Record.logActivity(
        req.user.id,
        `${user.name} edited the reservation for ${vehicle.make} ${vehicle.model}`
      );
    } else {
      console.error('User not authenticated');
    }

    await reservation.save();

    res.redirect('/reservations/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;