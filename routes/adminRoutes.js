// Packages
const express = require('express');
const router = express.Router();

// Controllers and Models Imported
const ActivityModel = require('../models/Activity');
const adminController = require('../controllers/adminController');
const { admin } = require('../middleware/auth');
const User = require('../models/User')

// Routes For Admin

// Admin Login Route
router.get('/login', adminController.getLoginPage);
router.post('/login', adminController.login);
router.use(adminController.protectAdmin);

// Admin Dashboard Route
router.get('/dashboard', adminController.getDashboard);

// Admin route for Users
router.get('/users', adminController.getUsers);
router.get('/edit-user/:id', adminController.editusers);
router.post('/update-user/:id', adminController.updateUser);
router.get('/delete-user/:id', adminController.deleteUser);

// Admin route for Vehicles
// Admin route for Vehicles
router.get('/vehicles', adminController.getVehicles);
router.get('/edit-vehicle/:id', adminController.editVehicle);
router.post('/update-vehicle/:id', adminController.updateVehicle);
router.post('/delete-vehicle/:id', adminController.deleteVehicle);


// Admin route for Reservations
router.get('/reservations', adminController.getAllReservations);
router.get('/edit-reservation/:id', adminController.getEditReservation);
router.post('/edit-reservation/:id', adminController.updateReservation);
router.post('/delete-reservation/:id', adminController.deleteReservation);


// Admin route for Reviews
router.get('/reviews', adminController.getAllReviews);
router.post('/delete-review/:id', adminController.deleteReview);

module.exports = router;