const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
// const { get } = require('../routes/reservation');
const Record = require('./adminController')


// Get user reservations
const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id }).populate('vehicle');
    const vehicles = await Vehicle.find();
    res.render('reservations', { 
      reservations, 
      vehicles,
      error: req.query.error, 
      success: req.query.success, 
      payment_status: req.query.success
    });
  } catch (err) {
    // console.error(err);
    res.redirect('/reservations?error=Server Error');
  }
};

// Make a reservation
const makeReservation = async (req, res) => {
  const { vehicleId, startDate, endDate } = req.body;

  try {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if the start date is in the past
    if (start < today.setHours(0, 0, 0, 0)) {
      return res.redirect('/reservations?error=Start date cannot be in the past');
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.redirect('/reservations?error=Vehicle not found');
    }

    if (!vehicle.availability) {
      return res.redirect('/reservations?error=Vehicle is already reserved');
    }

    // Calculate the number of days reserved
    const daysReserved = (end - start) / (1000 * 60 * 60 * 24);

    // Calculate the total cost
    let totalCost = vehicle.pricePerDay * daysReserved;

    // If the start and end dates are the same, apply half price
    if (daysReserved === 0) {
      totalCost = vehicle.pricePerDay / 2;
    }
      const reservation = new Reservation({
      user: req.user.id,
      vehicle: vehicleId,
      startDate,
      endDate,
      totalCost,
    });

    const user = await User.findById(req.user.id).select('name');
    const vehiclename = await Vehicle.findById(vehicleId).select('make model');

    // Log the reservation activity
    await Record.logActivity(
      req.user.id,
      `${user.name} reserved ${vehiclename.make} ${vehiclename.model}`
    );

    await reservation.save();

    // Update the vehicle's availability
    vehicle.availability = false;
    await vehicle.save();

    res.redirect('/reservations?success=Reservation made successfully');
  } catch (error) {
    // console.error(error);
    res.redirect('/reservations?error=Error making reservation');
  }
};




// Cancel a reservation
const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.redirect('/reservations?error=Reservation not found');
    }

    // Find the vehicle and update its availability
    const vehicle = await Vehicle.findById(reservation.vehicle);
    
    if (!vehicle) {
      return res.redirect('/reservations?error=Vehicle not found');
    }

    const user = await User.findById(req.user.id).select('name');

    // Log the reservation activity
    await Record.logActivity(
      req.user.id,
      `${user.name} Cancel the reservation for ${vehicle.make} ${vehicle.model}`
    );

    // Remove the reservation
    await Reservation.findByIdAndDelete(req.params.id);

    // Update the vehicle's availability
    vehicle.availability = true;
    await vehicle.save();

    res.redirect('/reservations?success=Reservation canceled successfully');
  } catch (error) {
    // console.error(error);
    res.redirect('/reservations?error=Server Error');
  }
};

module.exports = { getReservations, makeReservation, cancelReservation };
